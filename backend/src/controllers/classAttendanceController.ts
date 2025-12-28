import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { io } from "../server";
import {
  emitClassAttendanceScanned,
  emitClassAttendanceStarted,
  emitClassAttendanceEnded,
} from "../socket/handlers/classAttendanceEvents";
import {
  hashBiometricTemplate,
  verifyBiometricTemplate
} from "../utils/biometricHash";

const prisma = new PrismaClient();

// Validation schemas
const createAttendanceSessionSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  deviceName: z.string().optional(),
});

const updateSessionSchema = z.object({
  deviceName: z.string().optional(),
  isActive: z.boolean().optional(),
});

const createAttendanceRecordSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  lecturerName: z.string().optional(),
  courseName: z.string().optional(),
  courseCode: z.string().optional(),
  notes: z.string().optional(),
});

const recordStudentAttendanceSchema = z.object({
  recordId: z.string().uuid("Invalid record ID"),
  studentId: z.string().min(1, "Student ID is required"), // Index number or QR data
});

const recordBiometricAttendanceSchema = z.object({
  recordId: z.string().uuid("Invalid record ID"),
  biometricTemplate: z.string().min(1, "Biometric template is required"),
  biometricProvider: z.enum(['TOUCHID', 'FACEID', 'FINGERPRINT'], {
    errorMap: () => ({ message: "Invalid biometric provider" })
  }),
  deviceId: z.string().min(1, "Device ID is required"),
  linkToken: z.string().optional(), // For self-service mode
});

const confirmAttendanceSchema = z.object({
  attendanceId: z.string().uuid("Invalid attendance ID"),
});

const endAttendanceRecordSchema = z.object({
  recordId: z.string().uuid("Invalid record ID"),
});

const deleteAttendanceRecordSchema = z.object({
  recordId: z.string().uuid("Invalid record ID"),
});

/**
 * Create or get existing attendance session for a device
 */
export const createOrGetAttendanceSession = async (
  req: Request,
  res: Response
) => {
  try {
    const validatedData = createAttendanceSessionSchema.parse(req.body);

    // Check if session already exists for this device
    let session = await prisma.attendanceSession.findUnique({
      where: { deviceId: validatedData.deviceId },
    });

    if (session) {
      // Update last activity
      session = await prisma.attendanceSession.update({
        where: { id: session.id },
        data: {
          deviceName: validatedData.deviceName || session.deviceName,
        },
      });
    } else {
      // Create new session
      session = await prisma.attendanceSession.create({
        data: {
          deviceId: validatedData.deviceId,
          deviceName: validatedData.deviceName,
          sessionToken: `session_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        },
      });
    }

    res.json({
      session: {
        id: session.id,
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        sessionToken: session.sessionToken,
        isActive: session.isActive,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
      },
    });
  } catch (error) {
    console.error("Create attendance session error:", error);
    res.status(500).json({ error: "Failed to create attendance session" });
  }
};

/**
 * Get attendance session by token (for mobile app authentication)
 */
export const getAttendanceSessionByToken = async (
  req: Request,
  res: Response
) => {
  try {
    const { token } = req.params;

    const session = await prisma.attendanceSession.findUnique({
      where: { sessionToken: token },
      include: {
        attendanceRecords: {
          include: {
            students: {
              include: {
                student: {
                  select: {
                    id: true,
                    indexNumber: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: {
                scanTime: "desc",
              },
            },
          },
          orderBy: {
            startTime: "desc",
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!session.isActive) {
      return res.status(401).json({ error: "Session has been revoked" });
    }

    res.json({ session });
  } catch (error) {
    console.error("Get attendance session error:", error);
    res.status(500).json({ error: "Failed to get attendance session" });
  }
};

/**
 * Get all attendance sessions (Admin only)
 */
export const getAttendanceSessions = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { deviceName: { contains: search as string, mode: "insensitive" } },
        { deviceId: { contains: search as string } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [sessions, total] = await Promise.all([
      prisma.attendanceSession.findMany({
        where,
        include: {
          _count: {
            select: {
              attendanceRecords: true,
            },
          },
        },
        orderBy: {
          lastActivity: "desc",
        },
        skip,
        take: limitNum,
      }),
      prisma.attendanceSession.count({ where }),
    ]);

    res.json({
      sessions: sessions.map((session) => ({
        id: session.id,
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        isActive: session.isActive,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        totalRecordings: session._count.attendanceRecords,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get attendance sessions error:", error);
    res.status(500).json({ error: "Failed to get attendance sessions" });
  }
};

/**
 * Update attendance session (Admin only)
 */
export const updateAttendanceSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateSessionSchema.parse(req.body);

    const session = await prisma.attendanceSession.update({
      where: { id },
      data: validatedData,
    });

    // Log audit trail if session was deactivated
    if (validatedData.isActive === false) {
      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: "REVOKE_ATTENDANCE_SESSION",
          entity: "AttendanceSession",
          entityId: session.id,
          details: {
            deviceId: session.deviceId,
            deviceName: session.deviceName,
          },
          ipAddress: req.ip || "unknown",
        },
      });
    }

    res.json({ session });
  } catch (error) {
    console.error("Update attendance session error:", error);
    res.status(500).json({ error: "Failed to update attendance session" });
  }
};

/**
 * Create new attendance record
 */
export const createAttendanceRecord = async (req: Request, res: Response) => {
  try {
    const validatedData = createAttendanceRecordSchema.parse(req.body);

    // Verify session exists and is active
    const session = await prisma.attendanceSession.findUnique({
      where: { id: validatedData.sessionId },
    });

    if (!session || !session.isActive) {
      return res.status(400).json({ error: "Invalid or inactive session" });
    }

    const record = await prisma.classAttendanceRecord.create({
      data: {
        sessionId: validatedData.sessionId,
        userId: req.user!.userId,
        lecturerName: validatedData.lecturerName,
        courseName: validatedData.courseName,
        courseCode: validatedData.courseCode,
        notes: validatedData.notes,
      },
    });

    // Emit socket event for recording started
    emitClassAttendanceStarted(io, {
      recordId: record.id,
      sessionId: record.sessionId,
      courseName: record.courseName ?? undefined,
      courseCode: record.courseCode ?? undefined,
      lecturerName: record.lecturerName ?? undefined,
      startTime: record.startTime.toISOString(),
    });

    res.json({ record });
  } catch (error) {
    console.error("Create attendance record error:", error);
    res.status(500).json({ error: "Failed to create attendance record" });
  }
};

/**
 * Record student attendance
 */
export const recordStudentAttendance = async (req: Request, res: Response) => {
  try {
    const validatedData = recordStudentAttendanceSchema.parse(req.body);

    // Verify record exists and is in progress
    const record = await prisma.classAttendanceRecord.findUnique({
      where: { id: validatedData.recordId },
    });

    if (!record || record.status !== "IN_PROGRESS") {
      return res
        .status(400)
        .json({ error: "Invalid or completed attendance record" });
    }

    // Determine if this is a QR scan or manual entry
    let indexNumber = validatedData.studentId;
    let isQrScan = false;

    try {
      const qrData = JSON.parse(validatedData.studentId);
      indexNumber = qrData.indexNumber || validatedData.studentId;
      isQrScan = true;
    } catch {
      // Not JSON, treat as manual entry with index number
      isQrScan = false;
    }

    // Find student by index number only
    const student = await prisma.student.findUnique({
      where: { indexNumber },
    });

    if (!student) {
      return res.status(404).json({
        error: "Student not found. Please register the student first.",
      });
    }

    // Check if student already recorded
    const existingAttendance = await prisma.classAttendance.findUnique({
      where: {
        recordId_studentId: {
          recordId: validatedData.recordId,
          studentId: student.id,
        },
      },
    });

    if (existingAttendance) {
      return res
        .status(400)
        .json({ error: "Student already recorded for this session" });
    }

    const attendance = await prisma.classAttendance.create({
      data: {
        recordId: validatedData.recordId,
        studentId: student.id,
        lecturerConfirmed: isQrScan, // Auto-confirm QR scans, manual entries need confirmation
        verificationMethod: isQrScan ? 'QR_CODE' : 'MANUAL_INDEX',
      },
      include: {
        student: {
          select: {
            id: true,
            indexNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update total students count
    const updatedRecord = await prisma.classAttendanceRecord.update({
      where: { id: validatedData.recordId },
      data: {
        totalStudents: {
          increment: 1,
        },
      },
    });

    // Emit socket event for student scanned
    emitClassAttendanceScanned(io, {
      recordId: validatedData.recordId,
      sessionId: record.sessionId,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      indexNumber: student.indexNumber,
      scanTime: attendance.scanTime.toISOString(),
      totalStudents: updatedRecord.totalStudents,
      courseCode: record.courseCode ?? undefined,
      courseName: record.courseName ?? undefined,
      verificationMethod: isQrScan ? 'QR_CODE' : 'MANUAL_INDEX',
    });

    res.json({
      attendance,
      message: "Student attendance recorded successfully",
    });
  } catch (error) {
    console.error("Record student attendance error:", error);
    res.status(500).json({ error: "Failed to record student attendance" });
  }
};

/**
 * Record biometric attendance
 */
export const recordBiometricAttendance = async (req: Request, res: Response) => {
  try {
    const validatedData = recordBiometricAttendanceSchema.parse(req.body);

    console.log("[BIOMETRIC_ATTENDANCE] Attempting biometric verification");

    // Verify record exists and is in progress
    const record = await prisma.classAttendanceRecord.findUnique({
      where: { id: validatedData.recordId },
    });

    if (!record || record.status !== "IN_PROGRESS") {
      return res
        .status(400)
        .json({ error: "Invalid or completed attendance record" });
    }

    // Validate link token if provided (self-service mode)
    if (validatedData.linkToken) {
      const link = await prisma.attendanceLink.findUnique({
        where: { linkToken: validatedData.linkToken },
      });

      if (!link || !link.isActive || link.expiresAt < new Date()) {
        return res.status(400).json({ error: "Invalid or expired link token" });
      }

      // Check if link has remaining uses
      if (link.maxUses && link.usesCount >= link.maxUses) {
        return res.status(400).json({ error: "Link usage limit exceeded" });
      }
    }

    // Find student by biometric template match
    // Generate hash of the provided template to match against stored hashes
    const biometricSalt = "system_salt"; // In production, this should be configurable
    const templateHash = hashBiometricTemplate(validatedData.biometricTemplate, biometricSalt);

    const student = await prisma.student.findFirst({
      where: {
        biometricTemplateHash: templateHash,
        biometricProvider: validatedData.biometricProvider,
      },
    });

    if (!student) {
      return res.status(404).json({
        error: "Biometric verification failed. Student not found or not enrolled.",
      });
    }

    // Check if student already recorded
    const existingAttendance = await prisma.classAttendance.findUnique({
      where: {
        recordId_studentId: {
          recordId: validatedData.recordId,
          studentId: student.id,
        },
      },
    });

    if (existingAttendance) {
      return res
        .status(400)
        .json({ error: "Student already recorded for this session" });
    }

    // Determine verification method based on link token
    const verificationMethod = validatedData.linkToken ? 'BIOMETRIC_FINGERPRINT' : 'BIOMETRIC_FINGERPRINT';

    const attendance = await prisma.classAttendance.create({
      data: {
        recordId: validatedData.recordId,
        studentId: student.id,
        lecturerConfirmed: true, // Biometric verification is auto-confirmed
        verificationMethod,
        deviceId: validatedData.deviceId,
        linkTokenUsed: validatedData.linkToken,
        biometricConfidence: 1.0, // Full confidence for successful match
      },
      include: {
        student: {
          select: {
            id: true,
            indexNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update total students count
    const updatedRecord = await prisma.classAttendanceRecord.update({
      where: { id: validatedData.recordId },
      data: {
        totalStudents: {
          increment: 1,
        },
      },
    });

    // Update link usage count if link token was used
    if (validatedData.linkToken) {
      await prisma.attendanceLink.update({
        where: { linkToken: validatedData.linkToken },
        data: { usesCount: { increment: 1 } },
      });
    }

    // Emit socket event for student scanned
    emitClassAttendanceScanned(io, {
      recordId: validatedData.recordId,
      sessionId: record.sessionId,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      indexNumber: student.indexNumber,
      scanTime: attendance.scanTime.toISOString(),
      totalStudents: updatedRecord.totalStudents,
      courseCode: record.courseCode ?? undefined,
      courseName: record.courseName ?? undefined,
      verificationMethod,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: "BIOMETRIC_ATTENDANCE_RECORDED",
        entity: "ClassAttendance",
        entityId: attendance.id,
        details: {
          recordId: validatedData.recordId,
          studentId: student.id,
          indexNumber: student.indexNumber,
          verificationMethod,
          deviceId: validatedData.deviceId,
          linkTokenUsed: validatedData.linkToken ? true : false,
        },
        ipAddress: req.ip,
      },
    });

    console.log("[BIOMETRIC_ATTENDANCE] Successfully recorded for:", student.indexNumber);

    res.json({
      attendance,
      message: "Biometric attendance recorded successfully",
    });
  } catch (error) {
    console.error("Record biometric attendance error:", error);
    res.status(500).json({ error: "Failed to record biometric attendance" });
  }
};

/**
 * End attendance record
 */
export const endAttendanceRecord = async (req: Request, res: Response) => {
  try {
    const validatedData = endAttendanceRecordSchema.parse({
      recordId: req.params.recordId,
    });

    const record = await prisma.classAttendanceRecord.update({
      where: { id: validatedData.recordId },
      data: {
        status: "COMPLETED",
        endTime: new Date(),
      },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                indexNumber: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Emit socket event for recording ended
    emitClassAttendanceEnded(io, {
      recordId: record.id,
      sessionId: record.sessionId,
      totalStudents: record.totalStudents,
      endTime: record.endTime!.toISOString(),
      courseName: record.courseName ?? undefined,
      courseCode: record.courseCode ?? undefined,
    });

    res.json({
      record,
      message: "Attendance record completed successfully",
    });
  } catch (error) {
    console.error("End attendance record error:", error);
    res.status(500).json({ error: "Failed to end attendance record" });
  }
};

/**
 * Get attendance records for a session
 */
export const getAttendanceRecords = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      prisma.classAttendanceRecord.findMany({
        where: { sessionId },
        include: {
          students: {
            include: {
              student: {
                select: {
                  id: true,
                  indexNumber: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              scanTime: "desc",
            },
          },
        },
        orderBy: {
          startTime: "desc",
        },
        skip,
        take: limitNum,
      }),
      prisma.classAttendanceRecord.count({ where: { sessionId } }),
    ]);

    res.json({
      records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get attendance records error:", error);
    res.status(500).json({ error: "Failed to get attendance records" });
  }
};

/**
 * Get single attendance record by ID with student details
 */
export const getAttendanceRecordById = async (req: Request, res: Response) => {
  try {
    const { recordId } = req.params;

    const record = await prisma.classAttendanceRecord.findUnique({
      where: { id: recordId },
      include: {
        session: {
          select: {
            id: true,
            deviceId: true,
            deviceName: true,
          },
        },
        students: {
          select: {
            id: true,
            studentId: true,
            scanTime: true,
            lecturerConfirmed: true,
            confirmedAt: true,
          },
          include: {
            student: {
              select: {
                id: true,
                indexNumber: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            scanTime: "asc",
          },
        },
      },
    });

    if (!record) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    res.json({ record });
  } catch (error) {
    console.error("Get attendance record by ID error:", error);
    res.status(500).json({ error: "Failed to get attendance record" });
  }
};

/**
 * Get attendance record details
 */
export const getAttendanceRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const record = await prisma.classAttendanceRecord.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            deviceId: true,
            deviceName: true,
          },
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                indexNumber: true,
                firstName: true,
                lastName: true,
                program: true,
                level: true,
              },
            },
          },
          orderBy: {
            scanTime: "desc",
          },
        },
      },
    });

    if (!record) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    res.json({ record });
  } catch (error) {
    console.error("Get attendance record error:", error);
    res.status(500).json({ error: "Failed to get attendance record" });
  }
};

/**
 * Get distinct values for autocomplete (lecturer names, course names, course codes)
 */
export const getAutocompleteValues = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get distinct lecturer names
    const lecturerNames = await prisma.classAttendanceRecord.findMany({
      where: {
        userId: userId, // Only get records created by this user
        lecturerName: {
          not: null,
        },
      },
      select: {
        lecturerName: true,
      },
      distinct: ["lecturerName"],
      orderBy: {
        lecturerName: "asc",
      },
    });

    // Get distinct course names
    const courseNames = await prisma.classAttendanceRecord.findMany({
      where: {
        userId: userId,
        courseName: {
          not: null,
        },
      },
      select: {
        courseName: true,
      },
      distinct: ["courseName"],
      orderBy: {
        courseName: "asc",
      },
    });

    // Get distinct course codes
    const courseCodes = await prisma.classAttendanceRecord.findMany({
      where: {
        userId: userId,
        courseCode: {
          not: null,
        },
      },
      select: {
        courseCode: true,
      },
      distinct: ["courseCode"],
      orderBy: {
        courseCode: "asc",
      },
    });

    res.json({
      lecturerNames: lecturerNames
        .map((item) => item.lecturerName)
        .filter(Boolean),
      courseNames: courseNames.map((item) => item.courseName).filter(Boolean),
      courseCodes: courseCodes.map((item) => item.courseCode).filter(Boolean),
    });
  } catch (error) {
    console.error("Get autocomplete values error:", error);
    res.status(500).json({ error: "Failed to get autocomplete values" });
  }
};

/**
 * Delete an attendance record (only if no students have been recorded)
 */
export const deleteAttendanceRecord = async (req: Request, res: Response) => {
  try {
    const { recordId } = deleteAttendanceRecordSchema.parse(req.params);

    // Check if the record exists and get attendance count
    const record = await prisma.classAttendanceRecord.findUnique({
      where: { id: recordId },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    if (!record) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    // Prevent deletion if students have been recorded
    if (record._count.students > 0) {
      return res.status(400).json({
        error: `Cannot delete record with ${record._count.students} student attendance(s)`,
      });
    }

    // Only allow deletion of records that are still in progress
    if (record.status !== "IN_PROGRESS") {
      return res.status(400).json({
        error: "Can only delete records that are still in progress",
      });
    }

    // Delete the record
    await prisma.classAttendanceRecord.delete({
      where: { id: recordId },
    });

    res.json({ message: "Attendance record deleted successfully" });
  } catch (error) {
    console.error("Delete attendance record error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(500).json({ error: "Failed to delete attendance record" });
  }
};

export const confirmAttendance = async (req: Request, res: Response) => {
  try {
    const validatedData = confirmAttendanceSchema.parse(req.body);

    // Find the attendance record
    const attendance = await prisma.classAttendance.findUnique({
      where: { id: validatedData.attendanceId },
      include: {
        record: true,
        student: {
          select: {
            id: true,
            indexNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!attendance) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    // Check if record is still in progress
    if (attendance.record.status !== "IN_PROGRESS") {
      return res
        .status(400)
        .json({ error: "Cannot confirm attendance for completed session" });
    }

    // Update the attendance as confirmed
    const updatedAttendance = await prisma.classAttendance.update({
      where: { id: validatedData.attendanceId },
      data: {
        lecturerConfirmed: true,
        confirmedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            indexNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Emit socket event for confirmation
    emitClassAttendanceScanned(io, {
      recordId: attendance.recordId,
      sessionId: attendance.record.sessionId,
      studentId: updatedAttendance.student.id,
      studentName: `${updatedAttendance.student.firstName} ${updatedAttendance.student.lastName}`,
      indexNumber: updatedAttendance.student.indexNumber,
      scanTime: updatedAttendance.scanTime.toISOString(),
      totalStudents: attendance.record.totalStudents,
      courseCode: attendance.record.courseCode || undefined,
      courseName: attendance.record.courseName || undefined,
    });

    res.json({
      message: "Attendance confirmed successfully",
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error("Confirm attendance error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(500).json({ error: "Failed to confirm attendance" });
  }
};
