import { Request, Response } from "express";
import { PrismaClient, AttendanceMethod, ClassAttendanceStatus, RecordingStatus } from "@prisma/client";
import { z } from "zod";
import { 
  emitAttendanceRecorded, 
  emitSessionStarted, 
  emitSessionEnded,
  emitLiveAttendanceUpdate 
} from "../socket/handlers/classAttendanceEvents";
import crypto from "crypto";
import { AttendanceService } from "../services/attendanceService";

const prisma = new PrismaClient();
const attendanceService = new AttendanceService();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const startSessionSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  deviceName: z.string().optional(),
  courseName: z.string().min(1, "Course name is required"),
  courseCode: z.string().min(1, "Course code is required"),
  lecturerName: z.string().optional(),
  notes: z.string().optional(),
  totalRegisteredStudents: z.number().int().min(0).optional(),
});

const recordAttendanceSchema = z.object({
  recordId: z.string().uuid("Invalid record ID"),
  studentId: z.string().uuid("Invalid student ID"),
  verificationMethod: z.enum(['QR_CODE', 'MANUAL_INDEX', 'BIOMETRIC_FINGERPRINT', 'BIOMETRIC_FACE']),
  deviceId: z.string().optional(),
  biometricConfidence: z.number().min(0).max(1).optional(),
  status: z.enum(['PRESENT', 'LATE', 'EXCUSED']).default('PRESENT'),
});

const recordAttendanceByIndexSchema = z.object({
  recordId: z.string().uuid("Invalid record ID"),
  indexNumber: z.string().min(1, "Index number is required"),
  verificationMethod: z.literal('MANUAL_INDEX'),
  status: z.enum(['PRESENT', 'LATE', 'EXCUSED']).default('PRESENT'),
});

const recordAttendanceByQRSchema = z.object({
  recordId: z.string().uuid("Invalid record ID"),
  qrCode: z.string().min(1, "QR code is required"),
  deviceId: z.string().optional(),
  status: z.enum(['PRESENT', 'LATE', 'EXCUSED']).default('PRESENT'),
});

const recordAttendanceByBiometricSchema = z.object({
  recordId: z.string().uuid("Invalid record ID"),
  biometricHash: z.string().min(1, "Biometric hash is required"),
  deviceId: z.string().min(1, "Device ID is required"),
  biometricConfidence: z.number().min(0).max(1),
  status: z.enum(['PRESENT', 'LATE', 'EXCUSED']).default('PRESENT'),
});

const endSessionSchema = z.object({
  recordId: z.string().uuid("Invalid record ID"),
  notes: z.string().optional(),
});

const generateLinkSchema = z.object({
  recordId: z.string().uuid("Invalid record ID"),
  expiresInMinutes: z.number().min(5).max(120).default(30),
  maxUses: z.number().min(1).optional(),
  geolocation: z.object({
    lat: z.number(),
    lng: z.number(),
    radius: z.number().min(10).max(5000), // meters
  }).optional(),
});

const validateLinkSchema = z.object({
  token: z.string().min(1, "Token is required"),
  studentLocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Start a new attendance recording session
 * POST /api/class-attendance/sessions/start
 * Roles: LECTURER, ADMIN, CLASS_REP
 */
export const startSession = async (req: Request, res: Response) => {
  try {
    const validatedData = startSessionSchema.parse(req.body);
    const userId = req.user!.userId;

    // Check if device already has an active session
    const existingSession = await prisma.attendanceSession.findFirst({
      where: {
        deviceId: validatedData.deviceId,
        isActive: true,
      },
      include: {
        attendanceRecords: {
          where: { status: RecordingStatus.IN_PROGRESS },
          take: 1,
        },
      },
    });

    if (existingSession && existingSession.attendanceRecords.length > 0) {
      res.status(400).json({
        error: "Device already has an active session",
        activeSession: existingSession.attendanceRecords[0],
      });
      return;
    }

    // Create or reactivate session
    let session = existingSession;
    if (!session) {
      const newSession = await prisma.attendanceSession.create({
        data: {
          deviceId: validatedData.deviceId,
          deviceName: validatedData.deviceName,
          sessionToken: crypto.randomBytes(32).toString('hex'),
          isActive: true,
        },
      });
      // Re-fetch with attendanceRecords relation
      session = await prisma.attendanceSession.findUnique({
        where: { id: newSession.id },
        include: {
          attendanceRecords: true,
        },
      });
    }

    if (!session) {
      res.status(500).json({ error: "Failed to create session" });
      return;
    }

    // Create attendance record
    const record = await prisma.classAttendanceRecord.create({
      data: {
        sessionId: session.id,
        userId: userId,
        courseName: validatedData.courseName,
        courseCode: validatedData.courseCode,
        lecturerName: validatedData.lecturerName,
        notes: validatedData.notes,
        totalStudents: validatedData.totalRegisteredStudents || 0,
        status: RecordingStatus.IN_PROGRESS,
      },
      include: {
        user: true,
        students: {
          include: {
            student: true,
          },
        },
      },
    });

    // Emit socket event
    emitSessionStarted(record);

    res.status(201).json({
      message: "Attendance session started successfully",
      record,
      session: {
        id: session.id,
        deviceId: session.deviceId,
        sessionToken: session.sessionToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
      return;
    }
    console.error("Error starting attendance session:", error);
    res.status(500).json({ error: "Failed to start attendance session" });
  }
};

/**
 * End an attendance recording session
 * POST /api/class-attendance/sessions/end
 * Roles: LECTURER, ADMIN, CLASS_REP
 */
export const endSession = async (req: Request, res: Response) => {
  try {
    const validatedData = endSessionSchema.parse(req.body);
    const userId = req.user!.userId;

    // Get the record
    const record = await prisma.classAttendanceRecord.findUnique({
      where: { id: validatedData.recordId },
      include: {
        students: {
          include: {
            student: true,
          },
        },
        user: true,
      },
    });

    if (!record) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    // Verify ownership or admin
    if (record.userId !== userId && req.user!.role !== "ADMIN") {
      res.status(403).json({ 
        error: "Unauthorized. Only the record creator or admin can end this session" 
      });
      return;
    }

    // Check if already completed
    if (record.status !== RecordingStatus.IN_PROGRESS) {
      res.status(400).json({ 
        error: "Session is not in progress", 
        currentStatus: record.status 
      });
      return;
    }

    // Update record
    const updatedRecord = await prisma.classAttendanceRecord.update({
      where: { id: validatedData.recordId },
      data: {
        status: RecordingStatus.COMPLETED,
        endTime: new Date(),
        notes: validatedData.notes || record.notes,
      },
      include: {
        students: {
          include: {
            student: true,
          },
        },
        user: true,
      },
    });

    // Deactivate any associated attendance links
    await prisma.attendanceLink.updateMany({
      where: {
        recordId: validatedData.recordId,
        isActive: true,
      },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    // Emit socket event
    emitSessionEnded(updatedRecord);

    res.json({
      message: "Attendance session ended successfully",
      record: updatedRecord,
      summary: {
        totalStudents: updatedRecord.totalStudents,
        duration: updatedRecord.endTime && updatedRecord.startTime 
          ? Math.round((updatedRecord.endTime.getTime() - updatedRecord.startTime.getTime()) / 1000 / 60)
          : 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
      return;
    }
    console.error("Error ending attendance session:", error);
    res.status(500).json({ error: "Failed to end attendance session" });
  }
};

// ============================================================================
// ATTENDANCE RECORDING
// ============================================================================

/**
 * Record attendance by QR code
 * POST /api/class-attendance/record/qr
 * Roles: LECTURER, ADMIN, CLASS_REP
 */
export const recordAttendanceByQR = async (req: Request, res: Response) => {
  try {
    const validatedData = recordAttendanceByQRSchema.parse(req.body);

    // Try to parse QR code as JSON first to extract student ID
    let student;
    try {
      const qrData = JSON.parse(validatedData.qrCode);
      if (qrData.type === "STUDENT" && qrData.id) {
        // Look up by student ID from parsed QR code
        student = await prisma.student.findUnique({
          where: { id: qrData.id },
        });
      }
    } catch (parseError) {
      // QR code is not JSON or doesn't have expected structure
      // Fall back to direct string match
    }

    // If not found by parsed ID, try direct string match
    if (!student) {
      student = await prisma.student.findUnique({
        where: { qrCode: validatedData.qrCode },
      });
    }

    if (!student) {
      res.status(404).json({ error: "Student not found with this QR code" });
      return;
    }

    // Record attendance
    const attendance = await attendanceService.recordAttendance({
      recordId: validatedData.recordId,
      studentId: student.id,
      verificationMethod: AttendanceMethod.QR_CODE,
      deviceId: validatedData.deviceId,
      status: validatedData.status as ClassAttendanceStatus,
      lecturerConfirmed: true,
    });

    res.status(201).json({
      message: "Attendance recorded successfully",
      attendance,
      student: {
        id: student.id,
        indexNumber: student.indexNumber,
        firstName: student.firstName,
        lastName: student.lastName,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
      return;
    }
    if (error instanceof Error) {
      // Check if it's a duplicate attendance error
      if (error.message.includes('has already been recorded')) {
        res.status(409).json({ error: error.message, code: 'ALREADY_RECORDED' });
        return;
      }
      res.status(400).json({ error: error.message });
      return;
    }
    console.error("Error recording QR attendance:", error);
    res.status(500).json({ error: "Failed to record attendance" });
  }
};

/**
 * Record attendance by index number (manual entry)
 * POST /api/class-attendance/record/index
 * Roles: LECTURER, ADMIN, CLASS_REP
 */
export const recordAttendanceByIndex = async (req: Request, res: Response) => {
  try {
    const validatedData = recordAttendanceByIndexSchema.parse(req.body);

    // Find student by index number
    const student = await prisma.student.findUnique({
      where: { indexNumber: validatedData.indexNumber },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found with this index number" });
      return;
    }

    // Record attendance
    const attendance = await attendanceService.recordAttendance({
      recordId: validatedData.recordId,
      studentId: student.id,
      verificationMethod: AttendanceMethod.MANUAL_INDEX,
      status: validatedData.status as ClassAttendanceStatus,
      lecturerConfirmed: true,
    });

    res.status(201).json({
      message: "Attendance recorded successfully",
      attendance,
      student: {
        id: student.id,
        indexNumber: student.indexNumber,
        firstName: student.firstName,
        lastName: student.lastName,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
      return;
    }
    if (error instanceof Error) {
      // Check if it's a duplicate attendance error
      if (error.message.includes('has already been recorded')) {
        res.status(409).json({ error: error.message, code: 'ALREADY_RECORDED' });
        return;
      }
      res.status(400).json({ error: error.message });
      return;
    }
    console.error("Error recording manual attendance:", error);
    res.status(500).json({ error: "Failed to record attendance" });
  }
};

/**
 * Record attendance by biometric verification
 * POST /api/class-attendance/record/biometric
 * Roles: LECTURER, ADMIN, CLASS_REP
 */
export const recordAttendanceByBiometric = async (req: Request, res: Response) => {
  try {
    const validatedData = recordAttendanceByBiometricSchema.parse(req.body);

    // Find student by biometric hash
    const student = await prisma.student.findUnique({
      where: { biometricTemplateHash: validatedData.biometricHash },
    });

    if (!student) {
      res.status(404).json({ error: "No student enrolled with this biometric data" });
      return;
    }

    // Verify confidence threshold
    if (validatedData.biometricConfidence < 0.8) {
      res.status(400).json({ 
        error: "Biometric confidence too low. Please try again or use manual verification",
        confidence: validatedData.biometricConfidence,
      });
      return;
    }

    // Record attendance
    const attendance = await attendanceService.recordAttendance({
      recordId: validatedData.recordId,
      studentId: student.id,
      verificationMethod: student.biometricProvider === 'FACEID' 
        ? AttendanceMethod.BIOMETRIC_FACE 
        : AttendanceMethod.BIOMETRIC_FINGERPRINT,
      deviceId: validatedData.deviceId,
      biometricConfidence: validatedData.biometricConfidence,
      status: validatedData.status as ClassAttendanceStatus,
      lecturerConfirmed: true,
    });

    res.status(201).json({
      message: "Attendance recorded successfully",
      attendance,
      student: {
        id: student.id,
        indexNumber: student.indexNumber,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      biometric: {
        confidence: validatedData.biometricConfidence,
        method: student.biometricProvider,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error("Error recording biometric attendance:", error);
    res.status(500).json({ error: "Failed to record attendance" });
  }
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get active sessions for current user
 * GET /api/class-attendance/sessions/active
 * Roles: LECTURER, ADMIN, CLASS_REP
 */
export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const whereClause = role === "ADMIN"
      ? { status: RecordingStatus.IN_PROGRESS }
      : { status: RecordingStatus.IN_PROGRESS, userId };

    const sessions = await prisma.classAttendanceRecord.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        students: {
          include: {
            student: true,
          },
          orderBy: {
            scanTime: 'desc',
          },
        },
        session: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    res.json({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("Error getting active sessions:", error);
    res.status(500).json({ error: "Failed to get active sessions" });
  }
};

/**
 * Get session details
 * GET /api/class-attendance/sessions/:id
 * Roles: LECTURER, ADMIN, CLASS_REP
 */
export const getSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const session = await prisma.classAttendanceRecord.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        students: {
          include: {
            student: true,
          },
          orderBy: {
            scanTime: 'desc',
          },
        },
        session: true,
      },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Check authorization
    if (role !== "ADMIN" && session.userId !== userId) {
      res.status(403).json({ error: "Unauthorized access to this session" });
      return;
    }

    res.json(session);
  } catch (error) {
    console.error("Error getting session:", error);
    res.status(500).json({ error: "Failed to get session details" });
  }
};

/**
 * Get live statistics for a specific session
 * GET /api/class-attendance/sessions/:id/live-stats
 * Roles: LECTURER, ADMIN, CLASS_REP
 */
export const getSessionLiveStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const session = await prisma.classAttendanceRecord.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                indexNumber: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
          orderBy: {
            scanTime: 'desc',
          },
        },
      },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Check authorization
    if (role !== "ADMIN" && session.userId !== userId) {
      res.status(403).json({ error: "Unauthorized access to this session" });
      return;
    }

    // Calculate method breakdown
    const methodBreakdown = {
      BIOMETRIC_FINGERPRINT: 0,
      QR_CODE: 0,
      MANUAL_INDEX: 0,
      BIOMETRIC_FACE: 0,
    };

    session.students.forEach((student) => {
      if (student.verificationMethod) {
        methodBreakdown[student.verificationMethod]++;
      }
    });

    // Calculate attendance by time (peak attendance tracking)
    const attendanceByHour: Record<string, number> = {};
    let peakHour = "";
    let peakCount = 0;

    session.students.forEach((student) => {
      const hour = new Date(student.scanTime).getHours();
      const hourKey = `${hour}:00`;
      attendanceByHour[hourKey] = (attendanceByHour[hourKey] || 0) + 1;
      
      if (attendanceByHour[hourKey] > peakCount) {
        peakCount = attendanceByHour[hourKey];
        peakHour = hourKey;
      }
    });

    // Get recent attendance (last 10)
    const recentAttendance = session.students.slice(0, 10).map((s) => ({
      studentId: s.studentId,
      studentName: s.student ? `${s.student.firstName} ${s.student.lastName}` : 'Unknown',
      indexNumber: s.student?.indexNumber,
      scanTime: s.scanTime,
      verificationMethod: s.verificationMethod,
      status: s.status,
    }));

    // Calculate statistics
    const totalRecorded = session.students.length;
    const presentCount = session.students.filter((s) => s.status === "PRESENT").length;
    const lateCount = session.students.filter((s) => s.status === "LATE").length;
    const excusedCount = session.students.filter((s) => s.status === "EXCUSED").length;

    // Calculate duration
    const startTime = new Date(session.startTime);
    const currentTime = session.endTime ? new Date(session.endTime) : new Date();
    const durationMinutes = Math.floor((currentTime.getTime() - startTime.getTime()) / 60000);

    // Attendance rate (based on total registered students)
    const totalRegisteredStudents = session.totalStudents;
    const attendanceRate = totalRegisteredStudents > 0 
      ? Math.round((totalRecorded / totalRegisteredStudents) * 100) 
      : null;

    res.json({
      sessionId: session.id,
      courseCode: session.courseCode,
      courseName: session.courseName,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      durationMinutes,
      statistics: {
        totalRecorded,
        presentCount,
        lateCount,
        excusedCount,
        totalRegisteredStudents,
        attendanceRate,
      },
      methodBreakdown: {
        biometric: methodBreakdown.BIOMETRIC_FINGERPRINT + methodBreakdown.BIOMETRIC_FACE,
        biometricPercent: totalRecorded > 0 
          ? Math.round(((methodBreakdown.BIOMETRIC_FINGERPRINT + methodBreakdown.BIOMETRIC_FACE) / totalRecorded) * 100)
          : 0,
        qrCode: methodBreakdown.QR_CODE,
        qrPercent: totalRecorded > 0 
          ? Math.round((methodBreakdown.QR_CODE / totalRecorded) * 100)
          : 0,
        manual: methodBreakdown.MANUAL_INDEX,
        manualPercent: totalRecorded > 0 
          ? Math.round((methodBreakdown.MANUAL_INDEX / totalRecorded) * 100)
          : 0,
      },
      peakAttendance: {
        hour: peakHour,
        count: peakCount,
        attendanceByHour,
      },
      recentAttendance,
    });
  } catch (error) {
    console.error("Error getting session live stats:", error);
    res.status(500).json({ error: "Failed to get session statistics" });
  }
};

/**
 * Get attendance history
 * GET /api/class-attendance/history
 * Roles: LECTURER, ADMIN, CLASS_REP
 */
export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { courseCode, startDate, endDate, status, limit = 50, offset = 0 } = req.query;

    const whereClause: any = role === "ADMIN" 
      ? {} 
      : { userId };

    if (courseCode) whereClause.courseCode = courseCode;
    if (status) whereClause.status = status;
    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime.gte = new Date(startDate as string);
      if (endDate) whereClause.startTime.lte = new Date(endDate as string);
    }

    const [records, total] = await Promise.all([
      prisma.classAttendanceRecord.findMany({
        where: whereClause,
        select: {
          id: true,
          courseCode: true,
          courseName: true,
          lecturerName: true,
          startTime: true,
          endTime: true,
          status: true,
          totalStudents: true,
          students: {
            select: {
              id: true,
              studentId: true,
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.classAttendanceRecord.count({ where: whereClause }),
    ]);

    res.json({
      records,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: total > Number(offset) + records.length,
      },
    });
  } catch (error) {
    console.error("Error getting attendance history:", error);
    res.status(500).json({ error: "Failed to get attendance history" });
  }
};

// ============================================================================
// SELF-SERVICE LINKS
// ============================================================================

/**
 * Generate self-service attendance link
 * POST /api/class-attendance/links/generate
 * Roles: LECTURER, ADMIN
 */
export const generateAttendanceLink = async (req: Request, res: Response) => {
  try {
    const validatedData = generateLinkSchema.parse(req.body);
    const userId = req.user!.userId;

    // Verify record exists and user has access
    const record = await prisma.classAttendanceRecord.findUnique({
      where: { id: validatedData.recordId },
    });

    if (!record) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    if (record.userId !== userId && req.user!.role !== "ADMIN") {
      res.status(403).json({ error: "Unauthorized access to this record" });
      return;
    }

    if (record.status !== RecordingStatus.IN_PROGRESS) {
      res.status(400).json({ error: "Cannot generate link for completed session" });
      return;
    }

    // Revoke existing active links for this session (single active link strategy)
    const now = new Date();
    await prisma.attendanceLink.updateMany({
      where: {
        recordId: validatedData.recordId,
        expiresAt: { gt: now }, // Only revoke non-expired links
        linkType: "ATTENDANCE",
      },
      data: {
        expiresAt: now, // Set to current time to immediately expire
      },
    });

    // Generate new link
    const linkToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + validatedData.expiresInMinutes);

    const link = await prisma.attendanceLink.create({
      data: {
        recordId: validatedData.recordId,
        linkToken,
        createdBy: userId,
        expiresAt,
        maxUses: validatedData.maxUses,
        geolocation: validatedData.geolocation ? JSON.parse(JSON.stringify(validatedData.geolocation)) : null,
        linkType: "ATTENDANCE",
      },
    });

    res.status(201).json({
      message: "Attendance link generated successfully",
      link: {
        id: link.id,
        token: link.linkToken,
        url: `${process.env.APP_URL || 'http://localhost:5173'}/student-attendance?token=${link.linkToken}`,
        expiresAt: link.expiresAt,
        maxUses: link.maxUses,
      },
      note: "If accessing from network IP, you may need to use HTTP instead of HTTPS for development builds without proper SSL certificates",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
      return;
    }
    console.error("Error generating attendance link:", error);
    res.status(500).json({ error: "Failed to generate attendance link" });
  }
};

/**
 * Get active attendance links for a session
 * GET /api/class-attendance/sessions/:recordId/links
 */
export const getActiveLinks = async (req: Request, res: Response) => {
  try {
    const { recordId } = req.params;
    const userId = req.user!.userId;

    // Verify record exists and user has access
    const record = await prisma.classAttendanceRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    if (record.userId !== userId && req.user!.role !== "ADMIN") {
      res.status(403).json({ error: "Unauthorized access to this record" });
      return;
    }

    // Find active links (non-expired)
    const now = new Date();
    const activeLinks = await prisma.attendanceLink.findMany({
      where: {
        recordId,
        expiresAt: { gt: now },
        linkType: "ATTENDANCE",
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      links: activeLinks.map(link => ({
        id: link.id,
        token: link.linkToken,
        url: `${process.env.APP_URL || 'http://localhost:5173'}/student-attendance?token=${link.linkToken}`,
        expiresAt: link.expiresAt,
        maxUses: link.maxUses,
        usageCount: link.usesCount,
        geolocation: link.geolocation as any,
        createdAt: link.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching active links:", error);
    res.status(500).json({ error: "Failed to fetch active links" });
  }
};

/**
 * Validate attendance link and enforce security settings
 * POST /api/class-attendance/links/validate
 * Public endpoint (no authentication required)
 * Body: { token, studentLocation?: { lat, lng } }
 */
export const validateAttendanceLink = async (req: Request, res: Response) => {
  try {
    const validatedData = validateLinkSchema.parse(req.body);
    const { token, studentLocation } = validatedData;

    // Find the link
    const link = await prisma.attendanceLink.findUnique({
      where: { linkToken: token },
    });

    if (!link) {
      console.warn(`[Link Validation] Link not found:`, { token: token.substring(0, 8) + '...' });
      res.status(404).json({ 
        valid: false, 
        error: "Invalid or expired attendance link" 
      });
      return;
    }

    // Check if link is expired
    if (new Date() > link.expiresAt) {
      console.warn(`[Link Validation] Link expired:`, { 
        token: token.substring(0, 8) + '...',
        expiresAt: link.expiresAt,
        now: new Date(),
      });
      res.status(400).json({ 
        valid: false, 
        error: "This attendance link has expired" 
      });
      return;
    }

    // Check if link has reached max uses
    if (link.maxUses && link.usesCount >= link.maxUses) {
      console.warn(`[Link Validation] Max uses reached:`, { 
        token: token.substring(0, 8) + '...',
        usesCount: link.usesCount,
        maxUses: link.maxUses,
      });
      res.status(400).json({ 
        valid: false, 
        error: "This attendance link has reached its maximum usage limit" 
      });
      return;
    }

    // Get the attendance record
    if (!link.recordId) {
      res.status(400).json({ 
        valid: false, 
        error: "This link is not associated with an attendance session" 
      });
      return;
    }

    const record = await prisma.classAttendanceRecord.findUnique({
      where: { id: link.recordId },
      include: {
        session: true,
      },
    });

    if (!record) {
      res.status(404).json({ 
        valid: false, 
        error: "Attendance session not found" 
      });
      return;
    }

    // Check if session is still active
    if (record.status !== RecordingStatus.IN_PROGRESS) {
      res.status(400).json({ 
        valid: false, 
        error: "This attendance session has ended" 
      });
      return;
    }

    // Enforce geofencing if configured
    let distanceFromVenue: number | null = null;
    if (link.geolocation && studentLocation) {
      const geolocation = link.geolocation as { lat: number; lng: number; radius: number };
      
      distanceFromVenue = calculateDistance(
        geolocation.lat,
        geolocation.lng,
        studentLocation.lat,
        studentLocation.lng
      );

      // Round to 2 decimal places
      distanceFromVenue = Math.round(distanceFromVenue * 100) / 100;

      if (distanceFromVenue > geolocation.radius) {
        console.warn(`[Geofencing] Student too far from venue:`, {
          token: token.substring(0, 8) + '...',
          distanceFromVenue,
          requiredRadius: geolocation.radius,
          studentLocation,
          venueLocation: { lat: geolocation.lat, lng: geolocation.lng },
        });
        
        res.status(403).json({
          valid: false,
          error: `You must be within ${geolocation.radius}m of the venue to mark attendance`,
          distanceFromVenue,
          requiredRadius: geolocation.radius,
        });
        return;
      }
    } else if (link.geolocation && !studentLocation) {
      // Geofencing is enabled but student location not provided
      res.status(400).json({
        valid: false,
        error: "Location validation is required for this attendance session",
        requiresLocation: true,
      });
      return;
    }

    // Link is valid - return session details
    res.status(200).json({
      valid: true,
      session: {
        id: record.id,
        courseCode: record.courseCode,
        courseName: record.courseName,
        lecturerName: record.lecturerName,
        startTime: record.startTime,
        notes: record.notes,
      },
      distanceFromVenue,
      requiresLocation: !!link.geolocation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
      return;
    }
    console.error("Error validating attendance link:", error);
    res.status(500).json({ error: "Failed to validate attendance link" });
  }
};

// ============================================================================
// BIOMETRIC ENROLLMENT
// ============================================================================

/**
 * Enroll biometric data for a student
 * POST /api/class-attendance/biometric/enroll
 * Roles: LECTURER, ADMIN
 */
// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get attendance statistics
 * GET /api/class-attendance/analytics/stats
 * Roles: LECTURER, ADMIN
 */
export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { courseCode, startDate, endDate } = req.query;

    const whereClause: any = role === "ADMIN" ? {} : { userId };
    if (courseCode) whereClause.courseCode = courseCode;
    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime.gte = new Date(startDate as string);
      if (endDate) whereClause.startTime.lte = new Date(endDate as string);
    }

    const [totalSessions, completedSessions, totalStudentsRecorded, methodBreakdown] = await Promise.all([
      prisma.classAttendanceRecord.count({ where: whereClause }),
      prisma.classAttendanceRecord.count({ 
        where: { ...whereClause, status: RecordingStatus.COMPLETED } 
      }),
      prisma.classAttendance.count({
        where: {
          record: whereClause.courseCode || whereClause.userId 
            ? { courseCode: whereClause.courseCode, userId: whereClause.userId }
            : undefined,
        },
      }),
      prisma.classAttendance.groupBy({
        by: ['verificationMethod'],
        _count: true,
        where: {
          record: whereClause.courseCode || whereClause.userId 
            ? { courseCode: whereClause.courseCode, userId: whereClause.userId }
            : undefined,
        },
      }),
    ]);

    res.json({
      overview: {
        totalSessions,
        completedSessions,
        activeSessions: totalSessions - completedSessions,
        totalStudentsRecorded,
      },
      methodBreakdown: methodBreakdown.map(m => ({
        method: m.verificationMethod,
        count: m._count,
      })),
    });
  } catch (error) {
    console.error("Error getting attendance stats:", error);
    res.status(500).json({ error: "Failed to get attendance statistics" });
  }
};
