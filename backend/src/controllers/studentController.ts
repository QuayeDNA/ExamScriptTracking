import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import QRCode from "qrcode";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storageService } from "../services/storageService";
import {
  hashBiometricTemplate,
  generateBiometricSalt,
  isValidBiometricProvider
} from "../utils/biometricHash";

const prisma = new PrismaClient();

// Utility function to construct full URLs for uploaded files
const getFileUrl = (relativePath: string): string => {
  if (!relativePath) return "";

  // If it's already a full URL (e.g., from Cloudinary), return as-is
  if (
    relativePath.startsWith("http://") ||
    relativePath.startsWith("https://")
  ) {
    return relativePath;
  }

  // Remove leading slash if present and construct full URL
  const cleanPath = relativePath.startsWith("/")
    ? relativePath.substring(1)
    : relativePath;

  const API_URL =
    process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${API_URL}/${cleanPath}`;
};

// Configure multer for profile picture uploads
const getStorageConfig = () => {
  const provider = process.env.STORAGE_PROVIDER || "local";

  if (provider === "local") {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../../uploads/students");
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `student-${uniqueSuffix}${path.extname(file.originalname)}`);
      },
    });
  } else {
    // For cloud storage, use memory storage
    return multer.memoryStorage();
  }
};

// File filter for images only
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

// Configure multer upload
export const uploadStudentPicture = multer({
  storage: getStorageConfig(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Validation schemas
const createStudentSchema = z.object({
  indexNumber: z.string().min(1, "Index number is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  program: z.string().min(1, "Program is required"),
  level: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine(
      (val) => !isNaN(val) && val > 0,
      "Level must be a positive integer"
    ),
  // Optional biometric enrollment during creation
  biometricTemplate: z.string().optional(),
  biometricProvider: z.enum(['TOUCHID', 'FACEID', 'FINGERPRINT', 'WEBAUTHN']).optional(),
  biometricDeviceId: z.string().optional(),
}).refine(
  (data) => {
    // If any biometric field is provided, all must be provided
    const biometricFields = ['biometricTemplate', 'biometricProvider', 'biometricDeviceId'];
    const providedFields = biometricFields.filter(field => data[field as keyof typeof data]);
    return providedFields.length === 0 || providedFields.length === biometricFields.length;
  },
  {
    message: "All biometric fields (template, provider, deviceId) must be provided together",
    path: ["biometricTemplate"]
  }
);

const updateStudentSchema = z.object({
  indexNumber: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  program: z.string().min(1).optional(),
  level: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine(
      (val) => val === undefined || (!isNaN(val) && val > 0),
      "Level must be a positive integer"
    ),
  // Optional biometric update (admin can update/remove biometrics)
  biometricTemplate: z.string().optional(),
  biometricProvider: z.enum(['TOUCHID', 'FACEID', 'FINGERPRINT', 'WEBAUTHN']).optional(),
  biometricDeviceId: z.string().optional(),
}).refine(
  (data) => {
    // If any biometric field is provided, all must be provided
    const biometricFields = ['biometricTemplate', 'biometricProvider', 'biometricDeviceId'];
    const providedFields = biometricFields.filter(field => data[field as keyof typeof data]);
    return providedFields.length === 0 || providedFields.length === biometricFields.length;
  },
  {
    message: "All biometric fields (template, provider, deviceId) must be provided together",
    path: ["biometricTemplate"]
  }
);

const bulkCreateStudentSchema = z.array(
  z.object({
    indexNumber: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    program: z.string().min(1),
    level: z
      .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
      .refine(
        (val) => !isNaN(val) && val > 0,
        "Level must be a positive integer"
      ),
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

    // Check if profile picture was uploaded
    if (!req.file) {
      res.status(400).json({ error: "Profile picture is required" });
      return;
    }

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

    // Handle profile picture upload
    let profilePictureUrl: string;
    const isLocalStorage =
      (process.env.STORAGE_PROVIDER || "local") === "local";

    if (isLocalStorage) {
      // For local storage, use the multer-generated path
      profilePictureUrl = `/uploads/students/${req.file.filename}`;
    } else {
      // For cloud storage, upload using storage service
      const uploadResult = await storageService.uploadFile(
        req.file,
        "students"
      );
      if (!uploadResult.success) {
        res.status(500).json({
          error: "Failed to upload profile picture",
          details: uploadResult.error,
        });
        return;
      }
      profilePictureUrl = uploadResult.url;
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      type: "STUDENT",
      id: "", // Will be updated after creation
      indexNumber: validatedData.indexNumber,
    });

    // Prepare biometric data if provided
    let biometricData = {};
    if (validatedData.biometricTemplate && validatedData.biometricProvider && validatedData.biometricDeviceId) {
      // Validate biometric provider
      if (!isValidBiometricProvider(validatedData.biometricProvider)) {
        res.status(400).json({ error: "Invalid biometric provider" });
        return;
      }

      // Generate salt and hash the template
      const biometricSalt = generateBiometricSalt();
      const biometricTemplateHash = hashBiometricTemplate(validatedData.biometricTemplate, biometricSalt);

      biometricData = {
        biometricTemplateHash,
        biometricEnrolledAt: new Date(),
        biometricDeviceId: validatedData.biometricDeviceId,
        biometricProvider: validatedData.biometricProvider,
      };
    }

    // Create student
    const student = await prisma.student.create({
      data: {
        indexNumber: validatedData.indexNumber,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        program: validatedData.program,
        level: validatedData.level,
        profilePicture: profilePictureUrl,
        qrCode: qrData, // Temporary, will regenerate with ID
        ...biometricData,
      },
    });

    // Regenerate QR code with actual ID
    const updatedQrData = JSON.stringify({
      type: "STUDENT",
      id: student.id,
      indexNumber: student.indexNumber,
    });

    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: { qrCode: updatedQrData },
    });

    // Log audit
    const auditDetails: any = {
      indexNumber: student.indexNumber,
      name: `${student.firstName} ${student.lastName}`,
      program: student.program,
      profilePicture: profilePictureUrl,
    };

    if (student.biometricEnrolledAt) {
      auditDetails.biometricEnrolled = true;
      auditDetails.biometricProvider = student.biometricProvider;
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "CREATE_STUDENT",
        entity: "Student",
        entityId: student.id,
        details: auditDetails,
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
        // Clean up uploaded file if validation fails
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res
          .status(400)
          .json({ error: "Student with this index number already exists" });
        return;
      }
    }

    // Handle profile picture update
    let profilePictureUrl = existingStudent.profilePicture;
    let oldPictureUrl = existingStudent.profilePicture;
    if (req.file) {
      const isLocalStorage =
        (process.env.STORAGE_PROVIDER || "local") === "local";

      if (isLocalStorage) {
        // For local storage, use the multer-generated path
        profilePictureUrl = `/uploads/students/${req.file.filename}`;
      } else {
        // For cloud storage, upload using storage service
        const uploadResult = await storageService.uploadFile(
          req.file,
          "students"
        );
        if (!uploadResult.success) {
          res.status(500).json({
            error: "Failed to upload profile picture",
            details: uploadResult.error,
          });
          return;
        }
        profilePictureUrl = uploadResult.url;
      }
    }

    // Handle biometric update if provided
    let biometricData = {};
    if (validatedData.biometricTemplate && validatedData.biometricProvider && validatedData.biometricDeviceId) {
      // Validate biometric provider
      if (!isValidBiometricProvider(validatedData.biometricProvider)) {
        res.status(400).json({ error: "Invalid biometric provider" });
        return;
      }

      // Generate salt and hash the template
      const biometricSalt = generateBiometricSalt();
      const biometricTemplateHash = hashBiometricTemplate(validatedData.biometricTemplate, biometricSalt);

      biometricData = {
        biometricTemplateHash,
        biometricEnrolledAt: new Date(),
        biometricDeviceId: validatedData.biometricDeviceId,
        biometricProvider: validatedData.biometricProvider,
      };
    }

    // Update student
    const student = await prisma.student.update({
      where: { id },
      data: {
        ...validatedData,
        profilePicture: profilePictureUrl,
        ...biometricData,
      },
    });

    // Delete old profile picture if it was replaced
    if (req.file && oldPictureUrl) {
      const isLocalStorage =
        (process.env.STORAGE_PROVIDER || "local") === "local";
      if (isLocalStorage) {
        // For local storage, delete from filesystem
        const oldPath = path.join(__dirname, "../../", oldPictureUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } else {
        // For cloud storage, delete using storage service
        await storageService.deleteFile(oldPictureUrl);
      }
    }

    // Regenerate QR code if data changed
    const updatedQrData = JSON.stringify({
      type: "STUDENT",
      id: student.id,
      indexNumber: student.indexNumber,
    });

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { qrCode: updatedQrData },
    });

    // Log audit
    const auditDetails: any = {
      changes: validatedData,
      profilePictureUpdated: !!req.file,
    };

    if (student.biometricEnrolledAt) {
      auditDetails.biometricUpdated = true;
      auditDetails.biometricProvider = student.biometricProvider;
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "UPDATE_STUDENT",
        entity: "Student",
        entityId: student.id,
        details: auditDetails,
        ipAddress: req.ip,
      },
    });

    console.log("[UPDATE_STUDENT] Student updated:", student.indexNumber);

    res.json({
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

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

    // Delete profile picture if it exists
    if (student.profilePicture) {
      const isLocalStorage =
        (process.env.STORAGE_PROVIDER || "local") === "local";
      if (isLocalStorage) {
        // For local storage, delete from filesystem
        const picturePath = path.join(
          __dirname,
          "../../",
          student.profilePicture
        );
        if (fs.existsSync(picturePath)) {
          fs.unlinkSync(picturePath);
        }
      } else {
        // For cloud storage, delete using storage service
        await storageService.deleteFile(student.profilePicture);
      }
    }

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
          indexNumber: studentData.indexNumber,
        });

        const student = await prisma.student.create({
          data: {
            ...studentData,
            profilePicture: "/uploads/students/default-avatar.png", // Placeholder - requires manual upload
            qrCode: qrData,
          },
        });

        // Update QR code with actual ID
        const updatedQrData = JSON.stringify({
          type: "STUDENT",
          id: student.id,
          indexNumber: student.indexNumber,
        });

        await prisma.student.update({
          where: { id: student.id },
          data: { qrCode: updatedQrData },
        });

        results.success.push({
          indexNumber: student.indexNumber,
          name: `${student.firstName} ${student.lastName}`,
          note: "Profile picture requires manual upload",
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

    // Generate QR code data containing only ID and index number
    const qrData = {
      type: "STUDENT",
      id: student.id,
      indexNumber: student.indexNumber,
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 600,
      margin: 2,
      errorCorrectionLevel: "L",
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
        profilePicture: true,
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

// Export students to PDF with images and QR codes
export const exportStudentsPDF = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Export PDF request received:", req.query);
    const { program, level } = req.query;

    // Build where clause for filtering
    const where: any = {};
    if (program && typeof program === "string") {
      where.program = program;
    }
    if (level && typeof level === "string") {
      where.level = parseInt(level);
    }

    // Fetch students with filters
    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        indexNumber: true,
        firstName: true,
        lastName: true,
        program: true,
        level: true,
        qrCode: true,
        profilePicture: true,
        createdAt: true,
      },
      orderBy: [
        { program: "asc" },
        { level: "asc" },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    });

    console.log(`Found ${students.length} students for export`);

    if (students.length === 0) {
      res
        .status(404)
        .json({ error: "No students found matching the criteria" });
      return;
    }

    // Prepare export data
    const exportData = {
      students: students.map((student) => ({
        ...student,
        profilePicture: getFileUrl(student.profilePicture),
        createdAt: student.createdAt.toISOString(),
      })),
      title: "Student Directory",
      subtitle: `Total Students: ${students.length}`,
      program: program as string,
      level: level ? parseInt(level as string) : undefined,
    };

    // Generate PDF
    console.log("Starting PDF generation...");
    const { exportStudentData } = await import("../utils/exportUtils");
    const pdfBuffer = await exportStudentData(exportData);
    console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=students_${program || "all"}_${level || "all"}_${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Export students PDF error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Generate biometric enrollment link for student
export const generateBiometricEnrollmentLink = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { expiresInHours = 24 } = req.body; // Default 24 hours

    console.log("[GENERATE_BIOMETRIC_LINK] Request for student:", id);

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        indexNumber: true,
        firstName: true,
        lastName: true,
        biometricEnrolledAt: true,
      },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    // Check if student already has biometric enrolled
    if (student.biometricEnrolledAt) {
      res.status(400).json({ error: "Student already has biometric enrolled" });
      return;
    }

    // Generate secure token
    const crypto = require('crypto');
    const enrollmentToken = crypto.randomBytes(32).toString('hex');

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + parseInt(expiresInHours.toString()));

    // Create enrollment link record
    const enrollmentLink = await prisma.attendanceLink.create({
      data: {
        studentId: id,
        enrollmentToken,
        linkType: 'BIOMETRIC_ENROLLMENT',
        maxUses: 1, // One-time use
        usesCount: 0,
        createdBy: req.user!.userId,
        expiresAt,
        linkToken: `enrollment_${enrollmentToken}`, // Provide required linkToken
      },
    });

    // Generate enrollment URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const enrollmentUrl = `${baseUrl}/enroll-biometric?token=${enrollmentToken}`;

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "GENERATE_BIOMETRIC_ENROLLMENT_LINK",
        entity: "Student",
        entityId: id,
        details: {
          indexNumber: student.indexNumber,
          name: `${student.firstName} ${student.lastName}`,
          expiresAt: expiresAt.toISOString(),
          enrollmentUrl,
        },
        ipAddress: req.ip,
      },
    });

    console.log("[GENERATE_BIOMETRIC_LINK] Link generated for:", student.indexNumber);

    res.status(201).json({
      message: "Biometric enrollment link generated successfully",
      enrollmentLink: {
        token: enrollmentToken,
        url: enrollmentUrl,
        expiresAt: expiresAt.toISOString(),
        studentId: id,
        studentName: `${student.firstName} ${student.lastName}`,
      },
    });
  } catch (error) {
    console.error("Generate biometric enrollment link error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Submit biometric enrollment data
export const enrollBiometric = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, biometricTemplate, biometricProvider, biometricDeviceId } = req.body;

    console.log("[ENROLL_BIOMETRIC] Enrollment attempt with token");

    // Validate required fields
    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    // Find and validate enrollment link
    const enrollmentLink = await prisma.attendanceLink.findFirst({
      where: {
        enrollmentToken: token,
        linkType: 'BIOMETRIC_ENROLLMENT',
        expiresAt: { gt: new Date() },
        usesCount: { lt: prisma.attendanceLink.fields.maxUses },
      },
      include: {
        student: {
          select: {
            id: true,
            indexNumber: true,
            firstName: true,
            lastName: true,
            biometricEnrolledAt: true,
          },
        },
      },
    });

    if (!enrollmentLink) {
      res.status(400).json({ error: "Invalid or expired enrollment token" });
      return;
    }

    if (!enrollmentLink.student) {
      res.status(400).json({ error: "Invalid enrollment link - student not found" });
      return;
    }

    // Check if student already has biometric enrolled
    if (enrollmentLink.student.biometricEnrolledAt) {
      res.status(400).json({ error: "Student already has biometric enrolled" });
      return;
    }

    let biometricTemplateHash: string;
    let finalBiometricProvider: string;
    let finalBiometricDeviceId: string;

    // Handle different enrollment methods
    if (biometricTemplate && typeof biometricTemplate === 'string') {
      // Legacy mobile app enrollment
      if (!biometricProvider || !biometricDeviceId) {
        res.status(400).json({ error: "Missing biometric provider or device ID" });
        return;
      }

      if (!isValidBiometricProvider(biometricProvider)) {
        res.status(400).json({ error: "Invalid biometric provider" });
        return;
      }

      // Generate salt and hash the template
      const biometricSalt = generateBiometricSalt();
      biometricTemplateHash = hashBiometricTemplate(biometricTemplate, biometricSalt);
      finalBiometricProvider = biometricProvider;
      finalBiometricDeviceId = biometricDeviceId;
    } else if (biometricTemplate && typeof biometricTemplate === 'object') {
      // WebAuthn enrollment
      const { credentialId } = biometricTemplate;

      if (!credentialId) {
        res.status(400).json({ error: "Invalid WebAuthn credential data" });
        return;
      }

      // Use credential ID as the template to hash
      const biometricSalt = generateBiometricSalt();
      biometricTemplateHash = hashBiometricTemplate(credentialId, biometricSalt);
      finalBiometricProvider = "WEBAUTHN"; // Special provider for WebAuthn
      finalBiometricDeviceId = biometricDeviceId || req.get('User-Agent') || 'web-browser';
    } else {
      res.status(400).json({ error: "Invalid biometric data format" });
      return;
    }

    // Update student with biometric data
    const updatedStudent = await prisma.student.update({
      where: { id: enrollmentLink.student!.id },
      data: {
        biometricTemplateHash,
        biometricEnrolledAt: new Date(),
        biometricDeviceId: finalBiometricDeviceId,
        biometricProvider: finalBiometricProvider,
      },
    });

    // Mark link as used
    await prisma.attendanceLink.update({
      where: { id: enrollmentLink.id },
      data: { usesCount: { increment: 1 } },
    });

    // Log audit (no user context for public endpoint)
    await prisma.auditLog.create({
      data: {
        action: "BIOMETRIC_ENROLLMENT_COMPLETED",
        entity: "Student",
        entityId: enrollmentLink.student!.id,
        details: {
          indexNumber: enrollmentLink.student!.indexNumber,
          name: `${enrollmentLink.student!.firstName} ${enrollmentLink.student!.lastName}`,
          biometricProvider: finalBiometricProvider,
          enrollmentMethod: "WEBAUTHN_ENROLLMENT",
        },
        ipAddress: req.ip,
      },
    });

    console.log("[ENROLL_BIOMETRIC] Enrollment completed for:", enrollmentLink.student!.indexNumber);

    res.status(200).json({
      message: "Biometric enrollment completed successfully",
      student: {
        id: updatedStudent.id,
        indexNumber: updatedStudent.indexNumber,
        name: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
        biometricEnrolledAt: updatedStudent.biometricEnrolledAt,
      },
    });
  } catch (error) {
    console.error("Biometric enrollment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
