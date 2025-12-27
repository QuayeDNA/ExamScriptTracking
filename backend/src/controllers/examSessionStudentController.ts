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
 * Hybrid Approach: Auto-creates Student records with QR codes if they don't exist
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

    let studentsCreated = 0;
    let studentsExisting = 0;

    // Process each student: create Student record if not exists
    for (const studentData of validatedData.students) {
      // Check if Student exists by indexNumber
      let student = await prisma.student.findUnique({
        where: { indexNumber: studentData.indexNumber },
      });

      // If student doesn't exist, create with QR code
      if (!student) {
        const qrData = JSON.stringify({
          type: "STUDENT",
          indexNumber: studentData.indexNumber,
          firstName: studentData.firstName || "",
          lastName: studentData.lastName || "",
          program: studentData.program || "",
          level: studentData.level || 0,
          timestamp: new Date().toISOString(),
        });

        student = await prisma.student.create({
          data: {
            indexNumber: studentData.indexNumber,
            firstName: studentData.firstName || "Unknown",
            lastName: studentData.lastName || "Unknown",
            program: studentData.program || "Unknown",
            level: studentData.level || 100,
            qrCode: qrData,
            profilePicture: "/uploads/students/default-avatar.png", // Default avatar for auto-created students
          },
        });

        // Update QR code with actual student ID
        const updatedQrData = JSON.stringify({
          type: "STUDENT",
          id: student.id,
          indexNumber: student.indexNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          program: student.program,
          level: student.level,
          timestamp: new Date().toISOString(),
        });

        await prisma.student.update({
          where: { id: student.id },
          data: { qrCode: updatedQrData },
        });

        studentsCreated++;
      } else {
        studentsExisting++;
      }
    }

    // Add students to expected list with raw data (using createMany with skipDuplicates)
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
          expectedStudentsAdded: result.count,
          newStudentRecordsCreated: studentsCreated,
          existingStudentRecords: studentsExisting,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    res.json({
      message: `${result.count} student(s) added to exam session`,
      added: result.count,
      newStudentRecordsCreated: studentsCreated,
      existingStudentRecords: studentsExisting,
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
 * Hybrid Approach: Auto-creates Student records with QR codes if they don't exist
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

    // Check which students already exist in Student table
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

    const existingIndexNumbers = new Set(
      existingStudents.map((s) => s.indexNumber)
    );

    // Find students that need to be created
    const studentsToCreate = validatedData.indexNumbers.filter(
      (indexNumber) => !existingIndexNumbers.has(indexNumber)
    );

    let studentsCreated = 0;

    // Create Student records for those that don't exist
    for (const indexNumber of studentsToCreate) {
      const qrData = JSON.stringify({
        type: "STUDENT",
        indexNumber: indexNumber,
        firstName: "",
        lastName: "",
        program: "",
        level: 0,
        timestamp: new Date().toISOString(),
      });

      const student = await prisma.student.create({
        data: {
          indexNumber: indexNumber,
          firstName: "Unknown",
          lastName: "Unknown",
          program: "Unknown",
          level: 100,
          qrCode: qrData,
          profilePicture: "/uploads/students/default-avatar.png", // Default avatar for auto-created students
        },
      });

      // Update QR code with actual student ID
      const updatedQrData = JSON.stringify({
        type: "STUDENT",
        id: student.id,
        indexNumber: student.indexNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        program: student.program,
        level: student.level,
        timestamp: new Date().toISOString(),
      });

      await prisma.student.update({
        where: { id: student.id },
        data: { qrCode: updatedQrData },
      });

      studentsCreated++;
    }

    // Now fetch all students again to get enriched data
    const allStudents = await prisma.student.findMany({
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
    const studentDataMap = new Map(allStudents.map((s) => [s.indexNumber, s]));

    // Add students - enrich with existing data
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
          expectedStudentsAdded: result.count,
          totalProvided: validatedData.indexNumbers.length,
          newStudentRecordsCreated: studentsCreated,
          existingStudentRecords: existingStudents.length,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    res.json({
      message: `${result.count} student(s) added to exam session`,
      added: result.count,
      totalProvided: validatedData.indexNumbers.length,
      newStudentRecordsCreated: studentsCreated,
      existingStudentRecords: existingStudents.length,
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
        // Find student with profile picture
        const student = await prisma.student.findUnique({
          where: { indexNumber: expected.indexNumber },
          select: {
            id: true,
            profilePicture: true,
          },
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
          profilePicture: student?.profilePicture || null,
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
