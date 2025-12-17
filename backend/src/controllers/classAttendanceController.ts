import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { io } from "../server";
import {
  emitClassAttendanceScanned,
  emitClassAttendanceStarted,
  emitClassAttendanceEnded,
} from "../socket/handlers/classAttendanceEvents";

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
  studentId: z.string().min(1, "Student ID is required"), // Accept any string (UUID or index number)
});

const endAttendanceRecordSchema = z.object({
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

    // Try to parse QR code data if it's JSON
    let studentIdentifier = validatedData.studentId;
    try {
      const qrData = JSON.parse(validatedData.studentId);
      studentIdentifier =
        qrData.id || qrData.indexNumber || validatedData.studentId;
    } catch {
      // Not JSON, use as-is
    }

    // Find student by UUID or index number
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: studentIdentifier }, { indexNumber: studentIdentifier }],
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
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
        studentId: student.id, // Use the found student's UUID
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
