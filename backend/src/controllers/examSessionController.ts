import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import QRCode from "qrcode";
import { io } from "../server";
import {
  emitBatchStatusUpdated,
  emitBatchCreated,
} from "../socket/handlers/batchEvents";
import { incidentService } from "../services/incidentService";

const prisma = new PrismaClient();

// Validation schemas
const createExamSessionSchema = z.object({
  courseCode: z.string().min(1, "Course code is required"),
  courseName: z.string().min(1, "Course name is required"),
  lecturerId: z.string().min(1, "Lecturer ID is required"),
  lecturerName: z.string().min(1, "Lecturer name is required"),
  department: z.string().min(1, "Department is required"),
  faculty: z.string().min(1, "Faculty is required"),
  venue: z.string().min(1, "Venue is required"),
  examDate: z.string().datetime("Invalid exam date"),
});

const updateExamSessionSchema = z.object({
  courseCode: z.string().min(1).optional(),
  courseName: z.string().min(1).optional(),
  lecturerId: z.string().min(1).optional(),
  lecturerName: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  faculty: z.string().min(1).optional(),
  venue: z.string().min(1).optional(),
  examDate: z.string().datetime().optional(),
  status: z
    .enum([
      "NOT_STARTED",
      "IN_PROGRESS",
      "SUBMITTED",
      "IN_TRANSIT",
      "WITH_LECTURER",
      "UNDER_GRADING",
      "GRADED",
      "RETURNED",
      "COMPLETED",
    ])
    .optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    "NOT_STARTED",
    "IN_PROGRESS",
    "SUBMITTED",
    "IN_TRANSIT",
    "WITH_LECTURER",
    "UNDER_GRADING",
    "GRADED",
    "RETURNED",
    "COMPLETED",
  ]),
});

// Status transition validation logic
type BatchStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "IN_TRANSIT"
  | "WITH_LECTURER"
  | "UNDER_GRADING"
  | "GRADED"
  | "RETURNED"
  | "COMPLETED";

function validateStatusTransition(
  currentStatus: BatchStatus,
  newStatus: BatchStatus
): { valid: boolean; error?: string } {
  // Define allowed transitions
  const allowedTransitions: Record<BatchStatus, BatchStatus[]> = {
    NOT_STARTED: ["IN_PROGRESS"], // Auto-triggered only
    IN_PROGRESS: ["SUBMITTED"], // Auto-triggered only on session end
    SUBMITTED: ["IN_TRANSIT"], // When transfer starts
    IN_TRANSIT: ["WITH_LECTURER", "SUBMITTED"], // Normal flow or return
    WITH_LECTURER: ["IN_TRANSIT", "UNDER_GRADING"], // Rollback or progress
    UNDER_GRADING: ["GRADED"],
    GRADED: ["RETURNED"],
    RETURNED: ["COMPLETED"],
    COMPLETED: [], // Terminal state
  };

  // Check if transition is allowed
  const allowed = allowedTransitions[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${
        allowed.join(", ") || "none"
      }`,
    };
  }

  return { valid: true };
}

// Helper function to generate batch QR code
async function generateBatchQRCode(examSession: {
  id: string;
  batchQrCode: string;
  courseCode: string;
  courseName: string;
  examDate: Date;
  venue: string;
}): Promise<string> {
  const qrData = {
    type: "EXAM_BATCH",
    id: examSession.id,
    batchQrCode: examSession.batchQrCode,
    courseCode: examSession.courseCode,
    courseName: examSession.courseName,
    examDate: examSession.examDate.toISOString(),
    venue: examSession.venue,
    timestamp: new Date().toISOString(),
  };

  const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
    width: 400,
    margin: 2,
  });

  return qrCodeDataUrl;
}

// Create exam session
export const createExamSession = async (req: Request, res: Response) => {
  try {
    const validatedData = createExamSessionSchema.parse(req.body);

    // Generate unique batch QR code
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const batchQrCode = `BATCH-${validatedData.courseCode}-${timestamp}-${random}`;

    // Create exam session
    const examSession = await prisma.examSession.create({
      data: {
        ...validatedData,
        examDate: new Date(validatedData.examDate),
        batchQrCode,
        createdById: req.user!.userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Generate QR code
    const qrCodeDataUrl = await generateBatchQRCode(examSession);

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "CREATE_EXAM_SESSION",
        entity: "ExamSession",
        entityId: examSession.id,
        details: {
          courseCode: examSession.courseCode,
          courseName: examSession.courseName,
          examDate: examSession.examDate,
          venue: examSession.venue,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    // Emit socket event for batch creation
    emitBatchCreated(io, {
      id: examSession.id,
      batchQrCode: examSession.batchQrCode,
      courseCode: examSession.courseCode,
      courseName: examSession.courseName,
      department: examSession.department,
      faculty: examSession.faculty,
      examDate: examSession.examDate,
    });

    res.status(201).json({
      message: "Exam session created successfully",
      examSession: {
        ...examSession,
        qrCode: qrCodeDataUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0].message });
    }
    console.error("Create exam session error:", error);
    res.status(500).json({ message: "Failed to create exam session" });
  }
};

// Get all exam sessions with filters and pagination
export const getExamSessions = async (req: Request, res: Response) => {
  try {
    const {
      status,
      department,
      faculty,
      courseCode,
      search,
      dateFrom,
      dateTo,
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (department) {
      where.department = department;
    }

    if (faculty) {
      where.faculty = faculty;
    }

    if (courseCode) {
      where.courseCode = courseCode;
    }

    if (search) {
      where.OR = [
        { courseCode: { contains: search as string, mode: "insensitive" } },
        { courseName: { contains: search as string, mode: "insensitive" } },
        { lecturerName: { contains: search as string, mode: "insensitive" } },
        { venue: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (dateFrom || dateTo) {
      where.examDate = {};
      if (dateFrom) {
        where.examDate.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        where.examDate.lte = new Date(dateTo as string);
      }
    }

    // Get total count
    const total = await prisma.examSession.count({ where });

    // Get exam sessions
    const examSessions = await prisma.examSession.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: {
        examDate: "desc",
      },
      skip,
      take: limitNum,
    });

    res.json({
      examSessions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get exam sessions error:", error);
    res.status(500).json({ message: "Failed to fetch exam sessions" });
  }
};

// Get single exam session with details
export const getExamSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [examSession, expectedCount] = await Promise.all([
      prisma.examSession.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          invigilators: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: {
              assignedAt: "asc",
            },
          },
          attendances: {
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
              entryTime: "desc",
            },
          },
          transfers: {
            include: {
              fromHandler: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              toHandler: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: {
              requestedAt: "asc",
            },
          },
        },
      }),
      prisma.examSessionStudent.count({
        where: { examSessionId: id },
      }),
    ]);

    if (!examSession) {
      return res.status(404).json({ message: "Exam session not found" });
    }

    // Calculate attendance statistics
    const totalAttended = examSession.attendances.length;
    const submitted = examSession.attendances.filter(
      (a) => a.status === "SUBMITTED"
    ).length;
    const present = examSession.attendances.filter(
      (a) => a.status === "PRESENT"
    ).length;

    res.json({
      examSession: {
        ...examSession,
        stats: {
          expectedStudents: expectedCount,
          totalAttended,
          submitted,
          present,
          attendanceRate:
            expectedCount > 0
              ? ((totalAttended / expectedCount) * 100).toFixed(2)
              : null,
        },
      },
    });
  } catch (error) {
    console.error("Get exam session error:", error);
    res.status(500).json({ message: "Failed to fetch exam session" });
  }
};

// Update exam session
export const updateExamSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateExamSessionSchema.parse(req.body);

    // Check if exam session exists
    const existingSession = await prisma.examSession.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return res.status(404).json({ message: "Exam session not found" });
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    if (validatedData.examDate) {
      updateData.examDate = new Date(validatedData.examDate);
    }

    // Update exam session
    const examSession = await prisma.examSession.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "UPDATE_EXAM_SESSION",
        entity: "ExamSession",
        entityId: examSession.id,
        details: {
          changes: validatedData,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    res.json({
      message: "Exam session updated successfully",
      examSession,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0].message });
    }
    console.error("Update exam session error:", error);
    res.status(500).json({ message: "Failed to update exam session" });
  }
};

// Update exam session status
export const updateExamSessionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateStatusSchema.parse(req.body);

    // Get current exam session
    const currentSession = await prisma.examSession.findUnique({
      where: { id },
    });

    if (!currentSession) {
      res.status(404).json({ message: "Exam session not found" });
      return;
    }

    // Validate status transition
    const validation = validateStatusTransition(
      currentSession.status as BatchStatus,
      validatedData.status as BatchStatus
    );

    if (!validation.valid) {
      res.status(400).json({ message: validation.error });
      return;
    }

    const examSession = await prisma.examSession.update({
      where: { id },
      data: {
        status: validatedData.status,
      },
    });

    // If status is being set to SUBMITTED, create initial custody record
    if (validatedData.status === "SUBMITTED") {
      // Check if this is the first custody record (no transfers exist yet)
      const existingTransfers = await prisma.batchTransfer.count({
        where: { examSessionId: id },
      });

      if (existingTransfers === 0) {
        // Get the count of present students (attendances) for examsExpected
        // This represents all students who attended the exam
        const submittedCount = await prisma.examAttendance.count({
          where: {
            examSessionId: id,
          },
        });

        // Create initial custody transfer record
        // This establishes the submitter (invigilator) as the first custodian
        await prisma.batchTransfer.create({
          data: {
            examSessionId: id,
            fromHandlerId: req.user!.userId,
            toHandlerId: req.user!.userId, // Self-transfer to establish custody
            status: "CONFIRMED",
            examsExpected: submittedCount,
            examsReceived: submittedCount,
            requestedAt: new Date(),
            confirmedAt: new Date(),
            discrepancyNote: "Initial custody established upon submission",
          },
        });
      }
    }

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "UPDATE_EXAM_SESSION_STATUS",
        entity: "ExamSession",
        entityId: examSession.id,
        details: {
          statusChange: {
            to: validatedData.status,
          },
        },
        ipAddress: req.ip || "unknown",
      },
    });

    // Emit socket event for batch status update
    emitBatchStatusUpdated(io, {
      id: examSession.id,
      batchQrCode: examSession.batchQrCode,
      courseCode: examSession.courseCode,
      courseName: examSession.courseName,
      status: examSession.status,
      department: examSession.department,
      faculty: examSession.faculty,
    });

    res.json({
      message: "Exam session status updated successfully",
      examSession,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0].message });
    }
    console.error("Update exam session status error:", error);
    res.status(500).json({ message: "Failed to update exam session status" });
  }
};

// Delete exam session
export const deleteExamSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if exam session exists
    const existingSession = await prisma.examSession.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendances: true,
          },
        },
      },
    });

    if (!existingSession) {
      return res.status(404).json({ message: "Exam session not found" });
    }

    // Prevent deletion if there are attendance records
    if (existingSession._count.attendances > 0) {
      return res.status(400).json({
        message: "Cannot delete exam session with attendance records",
        attendanceCount: existingSession._count.attendances,
      });
    }

    // Delete exam session
    await prisma.examSession.delete({
      where: { id },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "DELETE_EXAM_SESSION",
        entity: "ExamSession",
        entityId: id,
        details: {
          courseCode: existingSession.courseCode,
          courseName: existingSession.courseName,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    res.json({ message: "Exam session deleted successfully" });
  } catch (error) {
    console.error("Delete exam session error:", error);
    res.status(500).json({ message: "Failed to delete exam session" });
  }
};

// Generate batch QR code for existing session
export const generateBatchQRCodeEndpoint = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const examSession = await prisma.examSession.findUnique({
      where: { id },
    });

    if (!examSession) {
      return res.status(404).json({ message: "Exam session not found" });
    }

    const qrCodeDataUrl = await generateBatchQRCode(examSession);

    res.json({
      qrCode: qrCodeDataUrl,
      examSession: {
        id: examSession.id,
        batchQrCode: examSession.batchQrCode,
        courseCode: examSession.courseCode,
        courseName: examSession.courseName,
      },
    });
  } catch (error) {
    console.error("Generate batch QR code error:", error);
    res.status(500).json({ message: "Failed to generate batch QR code" });
  }
};

// Get exam session manifest (for printing)
export const getExamSessionManifest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const examSession = await prisma.examSession.findUnique({
      where: { id },
      include: {
        attendances: {
          include: {
            student: {
              select: {
                indexNumber: true,
                firstName: true,
                lastName: true,
                program: true,
                level: true,
              },
            },
          },
          orderBy: {
            entryTime: "asc",
          },
        },
      },
    });

    if (!examSession) {
      return res.status(404).json({ message: "Exam session not found" });
    }

    const manifest = {
      examSession: {
        batchQrCode: examSession.batchQrCode,
        courseCode: examSession.courseCode,
        courseName: examSession.courseName,
        examDate: examSession.examDate,
        venue: examSession.venue,
        lecturerName: examSession.lecturerName,
        department: examSession.department,
        faculty: examSession.faculty,
        status: examSession.status,
      },
      statistics: {
        totalStudents: examSession.attendances.length,
        submitted: examSession.attendances.filter((a: any) => a.submissionTime)
          .length,
        entryOnly: examSession.attendances.filter(
          (a: any) => !a.submissionTime && !a.exitTime
        ).length,
        exitWithoutSubmission: examSession.attendances.filter(
          (a: any) => a.exitTime && !a.submissionTime
        ).length,
      },
      attendances: examSession.attendances.map((a: any) => ({
        indexNumber: a.student.indexNumber,
        name: `${a.student.firstName} ${a.student.lastName}`,
        program: a.student.program,
        level: a.student.level,
        entryTime: a.entryTime,
        exitTime: a.exitTime,
        submissionTime: a.submissionTime,
        status: a.status,
        discrepancyNote: a.discrepancyNote,
      })),
    };

    res.json(manifest);
  } catch (error) {
    console.error("Get exam session manifest error:", error);
    res.status(500).json({ message: "Failed to fetch exam session manifest" });
  }
};

// Get filter options
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.examSession.findMany({
      select: {
        department: true,
      },
      distinct: ["department"],
      orderBy: {
        department: "asc",
      },
    });

    res.json({
      departments: departments.map((d: any) => d.department),
    });
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({ message: "Failed to fetch departments" });
  }
};

export const getFaculties = async (req: Request, res: Response) => {
  try {
    const faculties = await prisma.examSession.findMany({
      select: {
        faculty: true,
      },
      distinct: ["faculty"],
      orderBy: {
        faculty: "asc",
      },
    });

    res.json({
      faculties: faculties.map((f: any) => f.faculty),
    });
  } catch (error) {
    console.error("Get faculties error:", error);
    res.status(500).json({ message: "Failed to fetch faculties" });
  }
};

// End exam session (auto-update status to SUBMITTED)
export const endExamSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get current exam session
    const currentSession = await prisma.examSession.findUnique({
      where: { id },
      include: {
        attendances: true,
      },
    });

    if (!currentSession) {
      res.status(404).json({ message: "Exam session not found" });
      return;
    }

    // Only allow ending sessions that are IN_PROGRESS
    if (currentSession.status !== "IN_PROGRESS") {
      res.status(400).json({
        message: `Cannot end session. Current status is ${currentSession.status}. Only IN_PROGRESS sessions can be ended.`,
      });
      return;
    }

    // Update status to SUBMITTED
    const examSession = await prisma.examSession.update({
      where: { id },
      data: {
        status: "SUBMITTED",
      },
    });

    // Update attendance records: students who entered and exited should be marked as SUBMITTED
    await prisma.examAttendance.updateMany({
      where: {
        examSessionId: id,
        entryTime: { not: undefined },
        exitTime: { not: undefined },
        status: { not: "SUBMITTED" }, // Don't update already submitted records
      },
      data: {
        status: "SUBMITTED",
        submissionTime: new Date(), // Set submission time to now when session ends
      },
    });

    // Get updated attendance count for submitted scripts
    const updatedAttendances = await prisma.examAttendance.findMany({
      where: {
        examSessionId: id,
        status: "SUBMITTED",
      },
    });

    const submittedCount = updatedAttendances.length;

    // Create initial custody record
    const existingTransfers = await prisma.batchTransfer.count({
      where: { examSessionId: id },
    });

    if (existingTransfers === 0 && submittedCount > 0) {
      await prisma.batchTransfer.create({
        data: {
          examSessionId: id,
          fromHandlerId: req.user!.userId,
          toHandlerId: req.user!.userId, // Self-transfer to establish custody
          status: "CONFIRMED",
          examsExpected: submittedCount,
          examsReceived: submittedCount,
          requestedAt: new Date(),
          confirmedAt: new Date(),
          discrepancyNote: "Initial custody established upon session end",
        },
      });
    }

    // AUTO-INCIDENT CREATION: Check for attendance discrepancies
    // Find students who entered but didn't submit (excluding those who exited without submitting)
    const discrepancyAttendances = await prisma.examAttendance.findMany({
      where: {
        examSessionId: id,
        entryTime: { not: undefined },
        submissionTime: null,
        exitTime: null, // Still in exam or didn't mark exit
      },
      include: {
        student: true,
      },
    });

    // Create auto-incidents for discrepancies
    for (const attendance of discrepancyAttendances) {
      try {
        await incidentService.autoCreateIncident({
          type: "PROCEDURAL_VIOLATION",
          severity: "LOW",
          title: `Student entry recorded without submission - ${attendance.student.indexNumber}`,
          description: `Student ${attendance.student.firstName} ${
            attendance.student.lastName
          } (${
            attendance.student.indexNumber
          }) entered the exam at ${attendance.entryTime.toLocaleTimeString()} but did not submit their script. This may indicate a procedural issue or the student left without proper exit recording.`,
          location: currentSession.venue,
          reporterId: req.user!.userId,
          studentId: attendance.studentId,
          examSessionId: id,
          attendanceId: attendance.id,
          incidentDate: new Date(),
          isConfidential: false,
        });
      } catch (error) {
        console.error(
          `Failed to create auto-incident for attendance ${attendance.id}:`,
          error
        );
      }
    }

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "END_EXAM_SESSION",
        entity: "ExamSession",
        entityId: examSession.id,
        details: {
          statusChange: {
            from: "IN_PROGRESS",
            to: "SUBMITTED",
          },
          scriptsCount: submittedCount,
          discrepanciesFound: discrepancyAttendances.length,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    // Emit socket event for batch status update
    emitBatchStatusUpdated(io, {
      id: examSession.id,
      batchQrCode: examSession.batchQrCode,
      courseCode: examSession.courseCode,
      courseName: examSession.courseName,
      status: examSession.status,
      department: examSession.department,
      faculty: examSession.faculty,
    });

    res.json({
      message: "Exam session ended successfully",
      examSession: {
        id: examSession.id,
        status: examSession.status,
        scriptsCount: submittedCount,
      },
    });
  } catch (error) {
    console.error("End exam session error:", error);
    res.status(500).json({ message: "Failed to end exam session" });
  }
};
