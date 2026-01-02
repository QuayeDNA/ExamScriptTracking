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

const validateBiometricEnrollmentSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  biometricHash: z.string().min(1, "Biometric hash is required"),
  deviceId: z.string().min(1, "Device ID is required"),
  provider: z.enum(['TOUCHID', 'FACEID', 'FINGERPRINT']),
});

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
      session = await prisma.attendanceSession.create({
        data: {
          deviceId: validatedData.deviceId,
          deviceName: validatedData.deviceName,
          sessionToken: crypto.randomBytes(32).toString('hex'),
          isActive: true,
        },
      });
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
        status: RecordingStatus.IN_PROGRESS,
      },
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
      res.status(400).json({ error: error.errors });
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
      res.status(400).json({ error: error.errors });
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

    // Find student by QR code
    const student = await prisma.student.findUnique({
      where: { qrCode: validatedData.qrCode },
    });

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
      res.status(400).json({ error: error.errors });
      return;
    }
    if (error instanceof Error) {
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
      res.status(400).json({ error: error.errors });
      return;
    }
    if (error instanceof Error) {
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
      res.status(400).json({ error: error.errors });
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

    // Generate link
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
        geolocation: validatedData.geolocation || null,
        linkType: "ATTENDANCE",
      },
    });

    res.status(201).json({
      message: "Attendance link generated successfully",
      link: {
        id: link.id,
        token: link.linkToken,
        url: `${process.env.APP_URL}/attendance/mark/${link.linkToken}`,
        expiresAt: link.expiresAt,
        maxUses: link.maxUses,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error("Error generating attendance link:", error);
    res.status(500).json({ error: "Failed to generate attendance link" });
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
export const enrollBiometric = async (req: Request, res: Response) => {
  try {
    const validatedData = validateBiometricEnrollmentSchema.parse(req.body);

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    // Check if biometric already enrolled
    if (student.biometricTemplateHash) {
      res.status(400).json({ 
        error: "Student already has biometric data enrolled",
        enrolledAt: student.biometricEnrolledAt,
      });
      return;
    }

    // Check for hash collision (very unlikely but good practice)
    const existingBiometric = await prisma.student.findUnique({
      where: { biometricTemplateHash: validatedData.biometricHash },
    });

    if (existingBiometric) {
      res.status(409).json({ 
        error: "This biometric data is already enrolled to another student" 
      });
      return;
    }

    // Enroll biometric
    const updatedStudent = await prisma.student.update({
      where: { id: validatedData.studentId },
      data: {
        biometricTemplateHash: validatedData.biometricHash,
        biometricEnrolledAt: new Date(),
        biometricDeviceId: validatedData.deviceId,
        biometricProvider: validatedData.provider,
      },
    });

    res.json({
      message: "Biometric enrollment successful",
      student: {
        id: updatedStudent.id,
        indexNumber: updatedStudent.indexNumber,
        firstName: updatedStudent.firstName,
        lastName: updatedStudent.lastName,
        biometricEnrolledAt: updatedStudent.biometricEnrolledAt,
        biometricProvider: updatedStudent.biometricProvider,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error("Error enrolling biometric:", error);
    res.status(500).json({ error: "Failed to enroll biometric data" });
  }
};

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
