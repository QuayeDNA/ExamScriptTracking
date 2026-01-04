/**
 * PUBLIC ATTENDANCE CONTROLLER
 * Handles public (non-authenticated) attendance operations for student self-service portal
 * All endpoints validate using attendance link tokens instead of user authentication
 */

import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient, RecordingStatus, AttendanceMethod } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const lookupStudentSchema = z.object({
  token: z.string().min(10, "Invalid token"),
  indexNumber: z.string().min(1, "Index number is required"),
});

const recordAttendanceBaseSchema = z.object({
  token: z.string().min(10, "Invalid token"),
  indexNumber: z.string().min(1, "Index number is required"),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

const recordBiometricSchema = recordAttendanceBaseSchema.extend({
  biometricHash: z.string().min(10, "Biometric data required (legacy)"),
  biometricConfidence: z.number().min(0).max(100).optional(), // Now optional, calculated from verification
  deviceId: z.string().min(1, "Device ID required"),
  // NEW: WebAuthn fields for real biometric verification
  credentialId: z.string().optional(),      // Base64 WebAuthn credential ID
  signature: z.string().optional(),         // Base64 authenticator signature
  authenticatorData: z.string().optional(), // Base64 authenticator data
  clientDataJSON: z.string().optional(),    // Base64 client data JSON
});

const recordQRSchema = recordAttendanceBaseSchema.extend({
  qrData: z.string().min(1, "QR data required"),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate attendance link token and return associated record
 * This is used by all public endpoints to authenticate requests
 */
async function validateTokenAndGetRecord(token: string) {
  const link = await prisma.attendanceLink.findUnique({
    where: { linkToken: token },
  });

  if (!link) {
    throw new Error("Invalid or expired attendance link");
  }

  // Check if link is expired
  if (new Date() > link.expiresAt) {
    throw new Error("This attendance link has expired");
  }

  // Check if link has reached max uses
  if (link.maxUses && link.usesCount >= link.maxUses) {
    throw new Error("This attendance link has reached its maximum usage limit");
  }

  // Get the associated record
  if (!link.recordId) {
    throw new Error("This link is not associated with an attendance session");
  }

  const record = await prisma.classAttendanceRecord.findUnique({
    where: { id: link.recordId },
    include: {
      session: true,
    },
  });

  if (!record) {
    throw new Error("Attendance session not found");
  }

  // Check if session is still active
  if (record.status !== RecordingStatus.IN_PROGRESS) {
    throw new Error("This attendance session has ended");
  }

  return { link, record };
}

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

/**
 * Lookup student by index number (public - validates token)
 * POST /api/public/attendance/lookup-student
 * Body: { token, indexNumber }
 */
export const lookupStudent = async (req: Request, res: Response) => {
  try {
    const { token, indexNumber } = lookupStudentSchema.parse(req.body);

    // Validate token first
    await validateTokenAndGetRecord(token);

    // Lookup student
    const student = await prisma.student.findFirst({
      where: {
        indexNumber: {
          equals: indexNumber,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        indexNumber: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        program: true,
        level: true,
      },
    });

    if (!student) {
      res.status(404).json({ 
        error: "Student not found. Please check your index number." 
      });
      return;
    }

    res.json(student);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    
    const err = error as Error;
    console.error("[Public Attendance] Lookup error:", err.message);
    res.status(400).json({ error: err.message || "Failed to lookup student" });
  }
};

/**
 * Record attendance via manual index number entry (public)
 * POST /api/public/attendance/record-manual
 * Body: { token, indexNumber, location? }
 */
export const recordManual = async (req: Request, res: Response) => {
  try {
    const { token, indexNumber, location } = recordAttendanceBaseSchema.parse(req.body);

    // Validate token and get record
    const { link, record } = await validateTokenAndGetRecord(token);

    // Lookup student
    const student = await prisma.student.findFirst({
      where: {
        indexNumber: {
          equals: indexNumber,
          mode: "insensitive",
        },
      },
    });

    if (!student) {
      res.status(404).json({ 
        error: "Student not found. Please check your index number." 
      });
      return;
    }

    // Check for duplicate attendance
    const existingAttendance = await prisma.classAttendance.findFirst({
      where: {
        recordId: link.recordId!,
        studentId: student.id,
      },
    });

    if (existingAttendance) {
      res.status(400).json({ 
        error: "Attendance already recorded for this session",
        attendance: {
          scanTime: existingAttendance.scanTime,
          verificationMethod: existingAttendance.verificationMethod,
        },
      });
      return;
    }

    // Record attendance
    const attendance = await prisma.classAttendance.create({
      data: {
        recordId: link.recordId!,
        studentId: student.id,
        verificationMethod: AttendanceMethod.MANUAL_INDEX,
        status: "PRESENT",
        scanTime: new Date(),
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Increment link usage count
    await prisma.attendanceLink.update({
      where: { id: link.id },
      data: { usesCount: { increment: 1 } },
    });

    res.json({
      success: true,
      message: "Attendance recorded successfully",
      attendance: {
        id: attendance.id,
        studentId: attendance.studentId,
        studentName: `${attendance.student.firstName} ${attendance.student.lastName}`,
        verificationMethod: attendance.verificationMethod,
        scanTime: attendance.scanTime,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    
    const err = error as Error;
    console.error("[Public Attendance] Manual record error:", err.message);
    res.status(400).json({ error: err.message || "Failed to record attendance" });
  }
};

/**
 * Record attendance via QR code (public)
 * POST /api/public/attendance/record-qr
 * Body: { token, indexNumber, qrData, location? }
 */
export const recordQR = async (req: Request, res: Response) => {
  try {
    const { token, indexNumber, qrData, location } = recordQRSchema.parse(req.body);

    // Validate token and get record
    const { link, record } = await validateTokenAndGetRecord(token);

    // Parse QR data (should be JSON with student info)
    let qrStudent: { indexNumber: string; id?: string };
    try {
      qrStudent = JSON.parse(qrData);
    } catch {
      res.status(400).json({ error: "Invalid QR code format" });
      return;
    }

    // Verify index number matches
    if (qrStudent.indexNumber !== indexNumber) {
      res.status(400).json({ 
        error: "QR code does not match your index number" 
      });
      return;
    }

    // Lookup student
    const student = await prisma.student.findFirst({
      where: {
        indexNumber: {
          equals: indexNumber,
          mode: "insensitive",
        },
      },
    });

    if (!student) {
      res.status(404).json({ 
        error: "Student not found" 
      });
      return;
    }

    // Check for duplicate attendance
    const existingAttendance = await prisma.classAttendance.findFirst({
      where: {
        recordId: link.recordId!,
        studentId: student.id,
      },
    });

    if (existingAttendance) {
      res.status(400).json({ 
        error: "Attendance already recorded for this session",
        attendance: {
          scanTime: existingAttendance.scanTime,
          verificationMethod: existingAttendance.verificationMethod,
        },
      });
      return;
    }

    // Record attendance
    const attendance = await prisma.classAttendance.create({
      data: {
        recordId: link.recordId!,
        studentId: student.id,
        verificationMethod: AttendanceMethod.QR_CODE,
        status: "PRESENT",
        scanTime: new Date(),
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Increment link usage count
    await prisma.attendanceLink.update({
      where: { id: link.id },
      data: { usesCount: { increment: 1 } },
    });

    res.json({
      success: true,
      message: "Attendance recorded successfully",
      attendance: {
        id: attendance.id,
        studentId: attendance.studentId,
        studentName: `${attendance.student.firstName} ${attendance.student.lastName}`,
        verificationMethod: attendance.verificationMethod,
        scanTime: attendance.scanTime,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    
    const err = error as Error;
    console.error("[Public Attendance] QR record error:", err.message);
    res.status(400).json({ error: err.message || "Failed to record attendance" });
  }
};

/**
 * Record attendance via biometric (public)
 * POST /api/public/attendance/record-biometric
 * Body: { token, indexNumber, biometricHash, biometricConfidence?, deviceId, location?, credentialId?, signature?, authenticatorData?, clientDataJSON? }
 * NOW SUPPORTS REAL WEBAUTHN VERIFICATION!
 */
export const recordBiometric = async (req: Request, res: Response) => {
  try {
    const { 
      token, 
      indexNumber, 
      biometricHash, 
      biometricConfidence, 
      deviceId,
      location,
      credentialId,
      signature,
      authenticatorData,
      clientDataJSON
    } = recordBiometricSchema.parse(req.body);

    // Validate token and get record
    const { link, record } = await validateTokenAndGetRecord(token);

    // Lookup student
    const student = await prisma.student.findFirst({
      where: {
        indexNumber: {
          equals: indexNumber,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        indexNumber: true,
        firstName: true,
        lastName: true,
        biometricTemplateHash: true,
        biometricCredentialId: true,
        biometricPublicKey: true,
        biometricCounter: true,
      },
    });

    if (!student) {
      res.status(404).json({ 
        error: "Student not found" 
      });
      return;
    }

    // Verify biometric enrollment (check if student has biometric data)
    if (!student.biometricTemplateHash && !student.biometricCredentialId) {
      res.status(400).json({ 
        error: "Biometric not enrolled. Please enroll first or use another method." 
      });
      return;
    }

    let finalConfidence = biometricConfidence || 0;
    let isWebAuthnVerified = false;

    // REAL WEBAUTHN VERIFICATION if data provided
    if (credentialId && signature && authenticatorData && clientDataJSON && student.biometricCredentialId && student.biometricPublicKey) {
      try {
        // Import WebAuthn utilities
        const { verifyWebAuthnSignature, validateCounter } = await import('../utils/webauthn');

        // Verify that the credential ID matches
        if (credentialId !== student.biometricCredentialId) {
          res.status(400).json({ 
            error: "Credential ID mismatch. Please re-enroll your biometric." 
          });
          return;
        }

        // Perform signature verification
        const verificationResult = await verifyWebAuthnSignature({
          publicKey: student.biometricPublicKey,
          signature: signature,
          authenticatorData: authenticatorData,
          clientDataJSON: clientDataJSON,
        });

        if (!verificationResult.verified) {
          res.status(401).json({ 
            error: "Biometric verification failed. Please try again.",
            details: verificationResult.errorMessage 
          });
          return;
        }

        // Validate counter (prevent replay attacks)
        const storedCounter = student.biometricCounter || 0;
        if (!validateCounter(verificationResult.counter, storedCounter)) {
          res.status(401).json({ 
            error: "Replay attack detected. Please re-enroll your biometric." 
          });
          return;
        }

        // Update counter in database
        await prisma.student.update({
          where: { id: student.id },
          data: { biometricCounter: verificationResult.counter },
        });

        // Use calculated confidence from verification
        finalConfidence = verificationResult.confidence;
        isWebAuthnVerified = true;

        console.log(`[WebAuthn] Verified ${student.indexNumber} with confidence ${finalConfidence}%`);
      } catch (error) {
        console.error("[WebAuthn] Verification error:", error);
        res.status(500).json({ 
          error: "Biometric verification failed due to server error" 
        });
        return;
      }
    } else if (!student.biometricCredentialId) {
      // Legacy mode - student has only legacy enrollment
      console.log(`[Legacy Biometric] Student ${student.indexNumber} using legacy enrollment`);
      // Accept provided confidence or default to lower value for legacy
      finalConfidence = biometricConfidence || 70;
    } else {
      // Student has WebAuthn enrollment but didn't provide verification data
      res.status(400).json({ 
        error: "WebAuthn verification data required. Please use a compatible device." 
      });
      return;
    }

    // Check for duplicate attendance
    const existingAttendance = await prisma.classAttendance.findFirst({
      where: {
        recordId: link.recordId!,
        studentId: student.id,
      },
    });

    if (existingAttendance) {
      res.status(400).json({ 
        error: "Attendance already recorded for this session",
        attendance: {
          scanTime: existingAttendance.scanTime,
          verificationMethod: existingAttendance.verificationMethod,
        },
      });
      return;
    }

    // Record attendance
    const attendance = await prisma.classAttendance.create({
      data: {
        recordId: link.recordId!,
        studentId: student.id,
        verificationMethod: AttendanceMethod.BIOMETRIC_FINGERPRINT,
        biometricConfidence: finalConfidence,
        status: "PRESENT",
        scanTime: new Date(),
        deviceId: deviceId,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Increment link usage count
    await prisma.attendanceLink.update({
      where: { id: link.id },
      data: { usesCount: { increment: 1 } },
    });

    res.json({
      success: true,
      message: "Attendance recorded successfully",
      webauthn: isWebAuthnVerified, // Indicate if real WebAuthn was used
      attendance: {
        id: attendance.id,
        studentId: attendance.studentId,
        studentName: `${attendance.student.firstName} ${attendance.student.lastName}`,
        verificationMethod: attendance.verificationMethod,
        scanTime: attendance.scanTime,
        confidence: finalConfidence,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    
    const err = error as Error;
    console.error("[Public Attendance] Biometric record error:", err.message);
    res.status(400).json({ error: err.message || "Failed to record attendance" });
  }
};
