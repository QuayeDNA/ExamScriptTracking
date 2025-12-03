import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas
const recordEntrySchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  examSessionId: z.string().uuid("Invalid exam session ID"),
});

const recordExitSchema = z.object({
  attendanceId: z.string().uuid("Invalid attendance ID"),
});

const recordSubmissionSchema = z.object({
  attendanceId: z.string().uuid("Invalid attendance ID"),
});

const updateDiscrepancySchema = z.object({
  attendanceId: z.string().uuid("Invalid attendance ID"),
  discrepancyNote: z.string().min(1, "Discrepancy note is required"),
});

// Record student entry
export const recordEntry = async (req: Request, res: Response) => {
  try {
    const validatedData = recordEntrySchema.parse(req.body);

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    // Check if exam session exists and is in progress
    const examSession = await prisma.examSession.findUnique({
      where: { id: validatedData.examSessionId },
    });

    if (!examSession) {
      res.status(404).json({ error: "Exam session not found" });
      return;
    }

    if (examSession.status !== "IN_PROGRESS") {
      res.status(400).json({
        error: "Cannot record attendance. Exam session is not in progress",
        currentStatus: examSession.status,
      });
      return;
    }

    // Check if student already has attendance for this session
    const existingAttendance = await prisma.examAttendance.findUnique({
      where: {
        studentId_examSessionId: {
          studentId: validatedData.studentId,
          examSessionId: validatedData.examSessionId,
        },
      },
    });

    if (existingAttendance) {
      res.status(400).json({
        error: "Student has already entered this exam session",
        attendance: existingAttendance,
      });
      return;
    }

    // Record entry
    const attendance = await prisma.examAttendance.create({
      data: {
        studentId: validatedData.studentId,
        examSessionId: validatedData.examSessionId,
        entryTime: new Date(),
        status: "PRESENT",
      },
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
        examSession: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            venue: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "RECORD_ENTRY",
        entity: "ExamAttendance",
        entityId: attendance.id,
        details: {
          studentId: student.id,
          indexNumber: student.indexNumber,
          studentName: `${student.firstName} ${student.lastName}`,
          examSessionId: examSession.id,
          courseCode: examSession.courseCode,
          entryTime: attendance.entryTime,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    res.status(201).json({
      message: "Student entry recorded successfully",
      attendance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        details: error.issues,
      });
      return;
    }
    console.error("Record entry error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Record student exit
export const recordExit = async (req: Request, res: Response) => {
  try {
    const validatedData = recordExitSchema.parse(req.body);

    const attendance = await prisma.examAttendance.findUnique({
      where: { id: validatedData.attendanceId },
      include: {
        student: true,
        examSession: true,
      },
    });

    if (!attendance) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    if (attendance.exitTime) {
      res.status(400).json({
        error: "Student exit already recorded",
        attendance,
      });
      return;
    }

    // Update exit time
    const updatedAttendance = await prisma.examAttendance.update({
      where: { id: validatedData.attendanceId },
      data: {
        exitTime: new Date(),
        status: attendance.submissionTime
          ? "SUBMITTED"
          : "LEFT_WITHOUT_SUBMITTING",
      },
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
        examSession: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            venue: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "RECORD_EXIT",
        entity: "ExamAttendance",
        entityId: updatedAttendance.id,
        details: {
          studentId: attendance.student.id,
          indexNumber: attendance.student.indexNumber,
          studentName: `${attendance.student.firstName} ${attendance.student.lastName}`,
          examSessionId: attendance.examSession.id,
          courseCode: attendance.examSession.courseCode,
          exitTime: updatedAttendance.exitTime,
          status: updatedAttendance.status,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    res.json({
      message: "Student exit recorded successfully",
      attendance: updatedAttendance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        details: error.issues,
      });
      return;
    }
    console.error("Record exit error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Record script submission
export const recordSubmission = async (req: Request, res: Response) => {
  try {
    const validatedData = recordSubmissionSchema.parse(req.body);

    const attendance = await prisma.examAttendance.findUnique({
      where: { id: validatedData.attendanceId },
      include: {
        student: true,
        examSession: true,
      },
    });

    if (!attendance) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    if (attendance.submissionTime) {
      res.status(400).json({
        error: "Script submission already recorded",
        attendance,
      });
      return;
    }

    // Update submission time and status
    const updatedAttendance = await prisma.examAttendance.update({
      where: { id: validatedData.attendanceId },
      data: {
        submissionTime: new Date(),
        status: "SUBMITTED",
      },
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
        examSession: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            venue: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "RECORD_SUBMISSION",
        entity: "ExamAttendance",
        entityId: updatedAttendance.id,
        details: {
          studentId: attendance.student.id,
          indexNumber: attendance.student.indexNumber,
          studentName: `${attendance.student.firstName} ${attendance.student.lastName}`,
          examSessionId: attendance.examSession.id,
          courseCode: attendance.examSession.courseCode,
          submissionTime: updatedAttendance.submissionTime,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    res.json({
      message: "Script submission recorded successfully",
      attendance: updatedAttendance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        details: error.issues,
      });
      return;
    }
    console.error("Record submission error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update discrepancy note
export const updateDiscrepancy = async (req: Request, res: Response) => {
  try {
    const validatedData = updateDiscrepancySchema.parse(req.body);

    const attendance = await prisma.examAttendance.findUnique({
      where: { id: validatedData.attendanceId },
      include: {
        student: true,
        examSession: true,
      },
    });

    if (!attendance) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    // Update discrepancy note
    const updatedAttendance = await prisma.examAttendance.update({
      where: { id: validatedData.attendanceId },
      data: {
        discrepancyNote: validatedData.discrepancyNote,
      },
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
        examSession: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            venue: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "UPDATE_DISCREPANCY",
        entity: "ExamAttendance",
        entityId: updatedAttendance.id,
        details: {
          studentId: attendance.student.id,
          indexNumber: attendance.student.indexNumber,
          studentName: `${attendance.student.firstName} ${attendance.student.lastName}`,
          examSessionId: attendance.examSession.id,
          courseCode: attendance.examSession.courseCode,
          discrepancyNote: validatedData.discrepancyNote,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    res.json({
      message: "Discrepancy note updated successfully",
      attendance: updatedAttendance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        details: error.issues,
      });
      return;
    }
    console.error("Update discrepancy error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get attendance by student ID and exam session ID
export const getAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId, examSessionId } = req.query;

    if (!studentId || !examSessionId) {
      res.status(400).json({
        error: "Both studentId and examSessionId are required",
      });
      return;
    }

    const attendance = await prisma.examAttendance.findUnique({
      where: {
        studentId_examSessionId: {
          studentId: studentId as string,
          examSessionId: examSessionId as string,
        },
      },
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
        examSession: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            venue: true,
            status: true,
          },
        },
      },
    });

    if (!attendance) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    res.json({ attendance });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
