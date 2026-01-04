import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import QRCode from "qrcode";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { storageService } from "../services/storageService";
import {
  hashBiometricTemplate,
  generateBiometricSalt,
  isValidBiometricProvider
} from "../utils/biometricHash";
import { getFileUrl } from "../utils/fileUtils";
import { getDefaultAvatarUrl } from "../utils/avatarUtils";

const prisma = new PrismaClient();

// Configure multer for profile picture uploads
const getStorageConfig = () => {
  const nodeEnv = process.env.NODE_ENV || "development";
  const explicitProvider = process.env.STORAGE_PROVIDER;
  
  // Determine actual provider (explicit setting overrides NODE_ENV)
  let provider: string;
  if (explicitProvider && ["local", "cloudinary"].includes(explicitProvider)) {
    provider = explicitProvider;
  } else {
    provider = nodeEnv === "production" ? "cloudinary" : "local";
  }

  console.log(`[MULTER_CONFIG] Using ${provider} storage (NODE_ENV: ${nodeEnv}, STORAGE_PROVIDER: ${explicitProvider || 'not set'})`);

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
        // Generate unique filename with student- prefix and UUID
        const uniqueFileName = `student-${uuidv4()}-${file.originalname}`;
        console.log(`[MULTER_CONFIG] Generated filename: ${uniqueFileName}`);
        cb(null, uniqueFileName);
      },
    });
  } else {
    // For cloud storage, use memory storage
    console.log(`[MULTER_CONFIG] Using memory storage for cloud uploads`);
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
  option: z.string().optional().nullable().transform(val => {
    if (val === undefined || val === null || val === "") return null;
    return val;
  }),
  department: z.string().optional().nullable().transform(val => {
    if (val === undefined || val === null || val === "") return null;
    return val;
  }),
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
  option: z.string().optional().nullable().transform(val => {
    if (val === undefined || val === null || val === "") return null;
    return val;
  }),
  department: z.string().optional().nullable().transform(val => {
    if (val === undefined || val === null || val === "") return null;
    return val;
  }),
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
    option: z.string().optional(), // Optional program option
    department: z.string().optional(), // Optional department
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
    console.log("[CREATE_STUDENT] Request body:", {
      ...req.body,
      profilePicture: req.file ? "File received" : "No file"
    });

    const validatedData = createStudentSchema.parse(req.body);
    console.log("[CREATE_STUDENT] Validated data:", validatedData);

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
    
    console.log("[CREATE_STUDENT] File received:", {
      originalname: req.file?.originalname,
      size: req.file?.size,
      hasPath: !!req.file?.path,
      hasBuffer: !!req.file?.buffer,
      filename: req.file?.filename
    });

    // Use storage service for all uploads (it handles both local and cloud)
    const uploadResult = await storageService.uploadFile(req.file, "students");
    
    if (!uploadResult.success) {
      console.error("[CREATE_STUDENT] Upload failed:", uploadResult.error);
      res.status(500).json({
        error: "Failed to upload profile picture",
        details: uploadResult.error,
      });
      return;
    }
    
    profilePictureUrl = uploadResult.url;
    console.log("[CREATE_STUDENT] File uploaded successfully:", {
      url: profilePictureUrl,
      provider: uploadResult.provider
    });

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
        option: validatedData.option,
        department: validatedData.department,
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
    console.log("[UPDATE_STUDENT] Request body:", {
      ...req.body,
      profilePicture: req.file ? "File received" : "No file"
    });

    const { id } = req.params;
    const validatedData = updateStudentSchema.parse(req.body);
    console.log("[UPDATE_STUDENT] Validated data:", validatedData);

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
      console.log("[UPDATE_STUDENT] File received:", {
        originalname: req.file?.originalname,
        size: req.file?.size,
        hasPath: !!req.file?.path,
        hasBuffer: !!req.file?.buffer,
        filename: req.file?.filename
      });

      // Use storage service for all uploads (it handles both local and cloud)
      const uploadResult = await storageService.uploadFile(req.file, "students");
      
      if (!uploadResult.success) {
        console.error("[UPDATE_STUDENT] Upload failed:", uploadResult.error);
        res.status(500).json({
          error: "Failed to upload profile picture",
          details: uploadResult.error,
        });
        return;
      }
      
      profilePictureUrl = uploadResult.url;
      console.log("[UPDATE_STUDENT] File uploaded successfully:", {
        url: profilePictureUrl,
        provider: uploadResult.provider
      });
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
      console.log("[UPDATE_STUDENT] Deleting old profile picture:", oldPictureUrl);
      try {
        // Storage service will auto-detect provider based on URL
        await storageService.deleteFile(oldPictureUrl);
        console.log("[UPDATE_STUDENT] Old profile picture deleted successfully");
      } catch (error) {
        console.error("[UPDATE_STUDENT] Failed to delete old profile picture:", error);
        // Don't fail the update if deletion fails
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
    // Clean up uploaded file on error (only for local disk storage)
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("[UPDATE_STUDENT] Failed to cleanup file:", cleanupError);
      }
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
            profilePicture: getDefaultAvatarUrl(), // Use environment-appropriate default avatar
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

// Lookup student for incident reporting (prioritizes expected students from session)
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

    let expectedStudent = null;

    // PRIORITY 1: If exam session provided, check expected students FIRST
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

      // If found in expected students, return immediately
      if (expectedStudent) {
        res.json({
          found: true,
          source: "expected",
          student: {
            id: null, // Not in global database
            indexNumber: expectedStudent.indexNumber,
            firstName: expectedStudent.firstName || "",
            lastName: expectedStudent.lastName || "",
            program: expectedStudent.program || "",
            level: expectedStudent.level || null,
          },
        });
        return;
      }
    }

    // PRIORITY 2: Search global student database
    const student = await prisma.student.findUnique({
      where: { indexNumber: trimmedIndexNumber },
      select: {
        id: true,
        indexNumber: true,
        firstName: true,
        lastName: true,
        program: true,
        level: true,
        profilePicture: true,
        createdAt: true,
      },
    });

    // Return result
    if (student) {
      res.json({
        found: true,
        source: "database",
        student,
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

/**
 * Public biometric enrollment for students
 * POST /api/students/biometric/enroll
 * No authentication required - students enroll themselves
 * Now supports REAL WebAuthn biometric enrollment
 */
export const enrollStudentBiometric = async (req: Request, res: Response) => {
  try {
    const enrollmentSchema = z.object({
      studentId: z.string().uuid("Invalid student ID"),
      biometricHash: z.string().min(1, "Biometric hash is required (legacy)"),
      deviceId: z.string().min(1, "Device ID is required"),
      provider: z.string().min(1, "Provider is required"),
      // NEW: WebAuthn fields
      credentialId: z.string().optional(), // Base64 WebAuthn credential ID
      publicKey: z.string().optional(),    // Base64 public key (SPKI format)
      authenticatorData: z.string().optional(), // Base64 authenticator data
      transports: z.array(z.string()).optional(), // ['internal', 'usb', etc.]
    });

    const { 
      studentId, 
      biometricHash, 
      deviceId, 
      provider,
      credentialId,
      publicKey,
      authenticatorData,
      transports
    } = enrollmentSchema.parse(req.body);

    // Validate provider
    if (!isValidBiometricProvider(provider)) {
      res.status(400).json({ error: "Invalid biometric provider" });
      return;
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        indexNumber: true,
        firstName: true,
        lastName: true,
        biometricTemplateHash: true,
        biometricCredentialId: true,
        biometricEnrolledAt: true,
      },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    // Check if already enrolled (either legacy or WebAuthn)
    if (student.biometricTemplateHash || student.biometricCredentialId) {
      res.status(400).json({ 
        error: "Biometric already enrolled",
        enrolledAt: student.biometricEnrolledAt,
      });
      return;
    }

    // Validate WebAuthn data if provided
    if (credentialId && publicKey) {
      // This is a real WebAuthn enrollment
      if (!authenticatorData) {
        res.status(400).json({ error: "Authenticator data is required for WebAuthn enrollment" });
        return;
      }

      // Validate authenticator data structure
      try {
        const { validateAuthenticatorData, base64ToBuffer } = await import('../utils/webauthn');
        const authDataBuffer = base64ToBuffer(authenticatorData);
        const validation = validateAuthenticatorData(authDataBuffer);
        
        if (!validation.valid) {
          res.status(400).json({ error: `Invalid authenticator data: ${validation.error}` });
          return;
        }
      } catch (error) {
        console.error("Authenticator data validation error:", error);
        res.status(400).json({ error: "Failed to validate authenticator data" });
        return;
      }

      // Store WebAuthn credentials
      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: {
          // Legacy fields (for backward compatibility)
          biometricTemplateHash: biometricHash,
          biometricDeviceId: deviceId,
          biometricProvider: provider,
          biometricEnrolledAt: new Date(),
          // NEW: WebAuthn fields
          biometricCredentialId: credentialId,
          biometricPublicKey: publicKey,
          biometricCounter: 0, // Initialize counter
          biometricTransports: transports || [],
        },
        select: {
          id: true,
          indexNumber: true,
          firstName: true,
          lastName: true,
          biometricEnrolledAt: true,
          biometricProvider: true,
        },
      });

      res.json({
        success: true,
        webauthn: true, // Indicate this is a real WebAuthn enrollment
        student: {
          id: updatedStudent.id,
          indexNumber: updatedStudent.indexNumber,
          firstName: updatedStudent.firstName,
          lastName: updatedStudent.lastName,
        },
        biometric: {
          enrolledAt: updatedStudent.biometricEnrolledAt,
          provider: updatedStudent.biometricProvider,
        },
      });
    } else {
      // Legacy enrollment (fallback for devices without WebAuthn)
      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: {
          biometricTemplateHash: biometricHash,
          biometricDeviceId: deviceId,
          biometricProvider: provider,
          biometricEnrolledAt: new Date(),
        },
        select: {
          id: true,
          indexNumber: true,
          firstName: true,
          lastName: true,
          biometricEnrolledAt: true,
          biometricProvider: true,
        },
      });

      res.json({
        success: true,
        webauthn: false, // Legacy enrollment
        student: {
          id: updatedStudent.id,
          indexNumber: updatedStudent.indexNumber,
          firstName: updatedStudent.firstName,
          lastName: updatedStudent.lastName,
        },
        biometric: {
          enrolledAt: updatedStudent.biometricEnrolledAt,
          provider: updatedStudent.biometricProvider,
        },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error("Enroll student biometric error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
