import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import QRCode from "qrcode";

const prisma = new PrismaClient();

// Validation schemas
const createStudentSchema = z.object({
  indexNumber: z.string().min(1, "Index number is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  program: z.string().min(1, "Program is required"),
  level: z.number().int().positive("Level must be a positive integer"),
});

const updateStudentSchema = z.object({
  indexNumber: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  program: z.string().min(1).optional(),
  level: z.number().int().positive().optional(),
});

const bulkCreateStudentSchema = z.array(
  z.object({
    indexNumber: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    program: z.string().min(1),
    level: z.number().int().positive(),
  })
);

// Create student
export const createStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[CREATE_STUDENT] Request from:", req.user?.email);

    const validatedData = createStudentSchema.parse(req.body);

    // Check if index number already exists
    const existingStudent = await prisma.student.findUnique({
      where: { indexNumber: validatedData.indexNumber },
    });

    if (existingStudent) {
      res
        .status(400)
        .json({ error: "Student with this index number already exists" });
      return;
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      type: "STUDENT",
      id: "", // Will be updated after creation
      indexNumber: validatedData.indexNumber,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      program: validatedData.program,
      level: validatedData.level,
      timestamp: new Date().toISOString(),
    });

    // Create student
    const student = await prisma.student.create({
      data: {
        ...validatedData,
        qrCode: qrData, // Temporary, will regenerate with ID
      },
    });

    // Regenerate QR code with actual ID
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

    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: { qrCode: updatedQrData },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "CREATE_STUDENT",
        entity: "Student",
        entityId: student.id,
        details: {
          indexNumber: student.indexNumber,
          name: `${student.firstName} ${student.lastName}`,
          program: student.program,
        },
        ipAddress: req.ip,
      },
    });

    console.log("[CREATE_STUDENT] Student created:", student.indexNumber);

    res.status(201).json({
      message: "Student created successfully",
      student: updatedStudent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
      return;
    }
    console.error("Create student error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all students with filters
export const getStudents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[GET_STUDENTS] Request from:", req.user?.email);

    const { program, level, search, page = "1", limit = "50" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (program) {
      where.program = program;
    }

    if (level) {
      where.level = parseInt(level as string);
    }

    if (search) {
      where.OR = [
        { indexNumber: { contains: search as string, mode: "insensitive" } },
        { firstName: { contains: search as string, mode: "insensitive" } },
        { lastName: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { indexNumber: "asc" },
      }),
      prisma.student.count({ where }),
    ]);

    res.json({
      students,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get single student
export const getStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[GET_STUDENT] Request from:", req.user?.email);

    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        attendances: {
          include: {
            examSession: {
              select: {
                courseCode: true,
                courseName: true,
                examDate: true,
                venue: true,
              },
            },
          },
          orderBy: { entryTime: "desc" },
        },
      },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.json({ student });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update student
export const updateStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[UPDATE_STUDENT] Request from:", req.user?.email);

    const { id } = req.params;
    const validatedData = updateStudentSchema.parse(req.body);

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    // If index number is being changed, check uniqueness
    if (
      validatedData.indexNumber &&
      validatedData.indexNumber !== existingStudent.indexNumber
    ) {
      const duplicateStudent = await prisma.student.findUnique({
        where: { indexNumber: validatedData.indexNumber },
      });

      if (duplicateStudent) {
        res
          .status(400)
          .json({ error: "Student with this index number already exists" });
        return;
      }
    }

    // Update student
    const student = await prisma.student.update({
      where: { id },
      data: validatedData,
    });

    // Regenerate QR code if data changed
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

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { qrCode: updatedQrData },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "UPDATE_STUDENT",
        entity: "Student",
        entityId: student.id,
        details: {
          changes: validatedData,
        },
        ipAddress: req.ip,
      },
    });

    console.log("[UPDATE_STUDENT] Student updated:", student.indexNumber);

    res.json({
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
      return;
    }
    console.error("Update student error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete student
export const deleteStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[DELETE_STUDENT] Request from:", req.user?.email);

    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        attendances: true,
      },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    // Check if student has exam attendance records
    if (student.attendances.length > 0) {
      res.status(400).json({
        error: "Cannot delete student with existing exam attendance records",
        attendanceCount: student.attendances.length,
      });
      return;
    }

    await prisma.student.delete({
      where: { id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "DELETE_STUDENT",
        entity: "Student",
        entityId: id,
        details: {
          indexNumber: student.indexNumber,
          name: `${student.firstName} ${student.lastName}`,
        },
        ipAddress: req.ip,
      },
    });

    console.log("[DELETE_STUDENT] Student deleted:", student.indexNumber);

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Bulk create students
export const bulkCreateStudents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[BULK_CREATE_STUDENTS] Request from:", req.user?.email);

    const { students } = req.body;
    const validatedStudents = bulkCreateStudentSchema.parse(students);

    const results = {
      success: [] as any[],
      failed: [] as any[],
    };

    for (const studentData of validatedStudents) {
      try {
        // Check if index number already exists
        const existingStudent = await prisma.student.findUnique({
          where: { indexNumber: studentData.indexNumber },
        });

        if (existingStudent) {
          results.failed.push({
            indexNumber: studentData.indexNumber,
            error: "Student with this index number already exists",
          });
          continue;
        }

        // Generate QR code data
        const qrData = JSON.stringify({
          type: "STUDENT",
          id: "", // Temporary
          ...studentData,
          timestamp: new Date().toISOString(),
        });

        const student = await prisma.student.create({
          data: {
            ...studentData,
            qrCode: qrData,
          },
        });

        // Update QR code with actual ID
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

        results.success.push({
          indexNumber: student.indexNumber,
          name: `${student.firstName} ${student.lastName}`,
        });
      } catch (error) {
        results.failed.push({
          indexNumber: studentData.indexNumber,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "BULK_CREATE_STUDENTS",
        entity: "Student",
        entityId: "bulk",
        details: {
          totalAttempted: validatedStudents.length,
          successful: results.success.length,
          failed: results.failed.length,
        },
        ipAddress: req.ip,
      },
    });

    console.log(
      "[BULK_CREATE_STUDENTS] Created:",
      results.success.length,
      "Failed:",
      results.failed.length
    );

    res.status(201).json({
      message: "Bulk student creation completed",
      ...results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
      return;
    }
    console.error("Bulk create students error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Generate QR code image for student
export const generateStudentQRCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[GENERATE_STUDENT_QR] Request from:", req.user?.email);

    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(student.qrCode, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    res.json({
      qrCode: qrCodeDataURL,
      student: {
        id: student.id,
        indexNumber: student.indexNumber,
        name: `${student.firstName} ${student.lastName}`,
      },
    });
  } catch (error) {
    console.error("Generate student QR code error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get distinct programs (for filters)
export const getPrograms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const students = await prisma.student.findMany({
      select: { program: true },
      distinct: ["program"],
      orderBy: { program: "asc" },
    });

    const programs = students.map((s) => s.program);

    res.json({ programs });
  } catch (error) {
    console.error("Get programs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get distinct levels (for filters)
export const getLevels = async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await prisma.student.findMany({
      select: { level: true },
      distinct: ["level"],
      orderBy: { level: "asc" },
    });

    const levels = students.map((s) => s.level);

    res.json({ levels });
  } catch (error) {
    console.error("Get levels error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get student by index number (public route for QR lookup)
export const getStudentByIndexNumber = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { indexNumber } = req.query;

    if (!indexNumber || typeof indexNumber !== "string") {
      res.status(400).json({ error: "Index number is required" });
      return;
    }

    const student = await prisma.student.findUnique({
      where: { indexNumber: indexNumber.trim() },
      select: {
        id: true,
        indexNumber: true,
        firstName: true,
        lastName: true,
        program: true,
        level: true,
        qrCode: true,
        createdAt: true,
      },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.json(student);
  } catch (error) {
    console.error("Get student by index number error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Lookup student for incident reporting (includes expected students from current session)
export const lookupStudentForIncident = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { indexNumber, examSessionId } = req.query;

    if (!indexNumber || typeof indexNumber !== "string") {
      res.status(400).json({ error: "Index number is required" });
      return;
    }

    const trimmedIndexNumber = indexNumber.trim();

    // First, try to find the student in the database
    const student = await prisma.student.findUnique({
      where: { indexNumber: trimmedIndexNumber },
      select: {
        id: true,
        indexNumber: true,
        firstName: true,
        lastName: true,
        program: true,
        level: true,
        createdAt: true,
      },
    });

    let expectedStudent = null;

    // If exam session is provided, also check expected students
    if (examSessionId && typeof examSessionId === "string") {
      expectedStudent = await prisma.examSessionStudent.findUnique({
        where: {
          examSessionId_indexNumber: {
            examSessionId,
            indexNumber: trimmedIndexNumber,
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
    }

    // Return result
    if (student) {
      res.json({
        found: true,
        source: "database",
        student,
      });
    } else if (expectedStudent) {
      res.json({
        found: true,
        source: "expected",
        student: {
          id: null, // Not in database yet
          indexNumber: expectedStudent.indexNumber,
          firstName: expectedStudent.firstName || "",
          lastName: expectedStudent.lastName || "",
          program: expectedStudent.program || "",
          level: expectedStudent.level || null,
        },
      });
    } else {
      res.json({
        found: false,
        student: null,
      });
    }
  } catch (error) {
    console.error("Lookup student for incident error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
