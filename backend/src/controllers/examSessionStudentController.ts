import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Validation schemas
const addStudentsSchema = z.object({
  students: z
    .array(
      z.object({
        indexNumber: z.string().min(1, "Index number is required"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        program: z.string().optional(),
        level: z.number().int().optional(),
      })
    )
    .min(1, "At least one student is required"),
});

const addStudentsBulkSchema = z.object({
  indexNumbers: z
    .array(z.string().min(1, "Index number cannot be empty"))
    .min(1, "At least one index number is required"),
});

/**
 * Add expected students to an exam session (with full student data)
 */
export const addExpectedStudents = async (req: Request, res: Response) => {
  try {
    const { id: examSessionId } = req.params;
    const validatedData = addStudentsSchema.parse(req.body);

    // Check if exam session exists
    const examSession = await prisma.examSession.findUnique({
      where: { id: examSessionId },
    });

    if (!examSession) {
      return res.status(404).json({ error: "Exam session not found" });
    }

    // Add students with raw data (using createMany with skipDuplicates)
    const result = await prisma.examSessionStudent.createMany({
      data: validatedData.students.map((student) => ({
        examSessionId,
        indexNumber: student.indexNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        program: student.program,
        level: student.level,
      })),
      skipDuplicates: true,
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "ADD_EXPECTED_STUDENTS",
        entity: "ExamSessionStudent",
        entityId: examSessionId,
        details: {
          indexNumbers: validatedData.students.map((s) => s.indexNumber),
          count: result.count,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    res.json({
      message: `${result.count} student(s) added to exam session`,
      added: result.count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.issues,
      });
    }
    console.error("Add expected students error:", error);
    res.status(500).json({ error: "Failed to add expected students" });
  }
};

/**
 * Add expected students by index numbers (bulk import from CSV - index numbers only)
 */
export const addExpectedStudentsByIndex = async (
  req: Request,
  res: Response
) => {
  try {
    const { id: examSessionId } = req.params;
    const validatedData = addStudentsBulkSchema.parse(req.body);

    // Check if exam session exists
    const examSession = await prisma.examSession.findUnique({
      where: { id: examSessionId },
    });

    if (!examSession) {
      return res.status(404).json({ error: "Exam session not found" });
    }

    // Optional: Try to enrich data from Student model if students exist in system
    // (useful for future lecturer attendance feature)
    const existingStudents = await prisma.student.findMany({
      where: {
        indexNumber: {
          in: validatedData.indexNumbers,
        },
      },
      select: {
        indexNumber: true,
        firstName: true,
        lastName: true,
        program: true,
        level: true,
      },
    });

    // Create a map for quick lookup
    const studentDataMap = new Map(
      existingStudents.map((s) => [s.indexNumber, s])
    );

    // Add students - enrich with existing data if available, otherwise just index number
    const studentsToAdd = validatedData.indexNumbers.map((indexNumber) => {
      const existingData = studentDataMap.get(indexNumber);
      return {
        examSessionId,
        indexNumber,
        firstName: existingData?.firstName,
        lastName: existingData?.lastName,
        program: existingData?.program,
        level: existingData?.level,
      };
    });

    const result = await prisma.examSessionStudent.createMany({
      data: studentsToAdd,
      skipDuplicates: true,
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "ADD_EXPECTED_STUDENTS_BULK",
        entity: "ExamSessionStudent",
        entityId: examSessionId,
        details: {
          studentsAdded: result.count,
          totalProvided: validatedData.indexNumbers.length,
          enrichedFromDatabase: existingStudents.length,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    res.json({
      message: `${result.count} student(s) added to exam session`,
      added: result.count,
      totalProvided: validatedData.indexNumbers.length,
      enrichedWithExistingData: existingStudents.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.issues,
      });
    }
    console.error("Add expected students by index error:", error);
    res.status(500).json({ error: "Failed to add expected students" });
  }
};

/**
 * Get expected students for an exam session
 */
export const getExpectedStudents = async (req: Request, res: Response) => {
  try {
    const { id: examSessionId } = req.params;

    const expectedStudents = await prisma.examSessionStudent.findMany({
      where: { examSessionId },
      orderBy: {
        indexNumber: "asc",
      },
    });

    // Get attendance status for each student by matching index numbers
    const studentsWithAttendance = await Promise.all(
      expectedStudents.map(async (expected) => {
        // Find attendance by matching student's index number
        const student = await prisma.student.findUnique({
          where: { indexNumber: expected.indexNumber },
          select: { id: true },
        });

        let attendance = null;
        if (student) {
          attendance = await prisma.examAttendance.findUnique({
            where: {
              studentId_examSessionId: {
                studentId: student.id,
                examSessionId,
              },
            },
            select: {
              id: true,
              entryTime: true,
              exitTime: true,
              submissionTime: true,
              status: true,
              discrepancyNote: true,
            },
          });
        }

        return {
          id: expected.id,
          indexNumber: expected.indexNumber,
          firstName: expected.firstName,
          lastName: expected.lastName,
          program: expected.program,
          level: expected.level,
          expectedAt: expected.createdAt,
          attendance: attendance || null,
        };
      })
    );

    res.json({
      examSessionId,
      expectedStudents: studentsWithAttendance,
      count: studentsWithAttendance.length,
    });
  } catch (error) {
    console.error("Get expected students error:", error);
    res.status(500).json({ error: "Failed to fetch expected students" });
  }
};

/**
 * Remove a student from expected list
 */
export const removeExpectedStudent = async (req: Request, res: Response) => {
  try {
    const { id: examSessionId, studentId } = req.params;

    // studentId here is actually the ExamSessionStudent record ID
    const existing = await prisma.examSessionStudent.findUnique({
      where: {
        id: studentId,
      },
    });

    if (!existing || existing.examSessionId !== examSessionId) {
      return res.status(404).json({
        error: "Student not found in expected list for this exam session",
      });
    }

    // Remove the record
    await prisma.examSessionStudent.delete({
      where: {
        id: studentId,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "REMOVE_EXPECTED_STUDENT",
        entity: "ExamSessionStudent",
        entityId: examSessionId,
        details: {
          recordId: studentId,
          indexNumber: existing.indexNumber,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    res.json({ message: "Student removed from expected list" });
  } catch (error) {
    console.error("Remove expected student error:", error);
    res.status(500).json({ error: "Failed to remove student" });
  }
};

/**
 * Get attendance summary with expected vs actual comparison
 */
export const getAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { id: examSessionId } = req.params;

    const [examSession, expectedStudents, actualAttendance] = await Promise.all(
      [
        prisma.examSession.findUnique({
          where: { id: examSessionId },
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            venue: true,
            examDate: true,
            status: true,
          },
        }),
        prisma.examSessionStudent.findMany({
          where: { examSessionId },
        }),
        prisma.examAttendance.findMany({
          where: { examSessionId },
          include: {
            student: {
              select: {
                indexNumber: true,
              },
            },
          },
        }),
      ]
    );

    if (!examSession) {
      return res.status(404).json({ error: "Exam session not found" });
    }

    const expectedCount = expectedStudents.length;
    const totalAttended = actualAttendance.length;

    // Calculate statistics
    const submitted = actualAttendance.filter(
      (a: { status: string }) => a.status === "SUBMITTED"
    ).length;
    const present = actualAttendance.filter(
      (a: { status: string }) => a.status === "PRESENT"
    ).length;
    const leftWithout = actualAttendance.filter(
      (a: { status: string }) => a.status === "LEFT_WITHOUT_SUBMITTING"
    ).length;

    // Find students who haven't arrived yet
    const attendedIndexNumbers = new Set(
      actualAttendance.map((a: any) => a.student.indexNumber)
    );
    const notYetArrived = expectedStudents.filter(
      (exp) => !attendedIndexNumbers.has(exp.indexNumber)
    );

    res.json({
      examSession,
      summary: {
        expectedStudents: expectedCount,
        totalAttended: totalAttended,
        submitted: submitted,
        present: present,
        leftWithoutSubmitting: leftWithout,
        attendanceRate:
          expectedCount > 0
            ? ((totalAttended / expectedCount) * 100).toFixed(2)
            : "0.00",
        submissionRate:
          totalAttended > 0
            ? ((submitted / totalAttended) * 100).toFixed(2)
            : "0.00",
        notYetArrived: notYetArrived.map((s) => ({
          id: s.id,
          indexNumber: s.indexNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          program: s.program,
          level: s.level,
        })),
      },
    });
  } catch (error) {
    console.error("Get attendance summary error:", error);
    res.status(500).json({ error: "Failed to fetch attendance summary" });
  }
};
