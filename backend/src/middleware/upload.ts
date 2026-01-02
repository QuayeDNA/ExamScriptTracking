import multer from "multer";
import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { storageService } from "../services/storageService";

// Ensure uploads directory exists for local storage fallback
const uploadsDir = path.join(__dirname, "../../uploads/incidents");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage based on provider
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

  if (provider === "local") {
    return multer.diskStorage({
      destination: (
        req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, destination: string) => void
      ) => {
        // Create incident-specific folder
        const incidentId = req.params.id || "temp";
        const incidentDir = path.join(uploadsDir, incidentId);

        if (!fs.existsSync(incidentDir)) {
          fs.mkdirSync(incidentDir, { recursive: true });
        }

        cb(null, incidentDir);
      },
      filename: (
        req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, filename: string) => void
      ) => {
        // Generate unique filename: timestamp-originalname
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${basename}-${uniqueSuffix}${ext}`);
      },
    });
  } else {
    // For cloud storage, use memory storage
    return multer.memoryStorage();
  }
};

// File filter - allow images, videos, and PDFs
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allowed file types
  const allowedMimes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Videos
    "video/mp4",
    "video/mpeg",
    "video/quicktime", // .mov
    "video/x-msvideo", // .avi
    "video/webm",
    // Documents
    "application/pdf",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Allowed: images, videos (mp4, mov, avi, webm), and PDFs.`
      )
    );
  }
};

// Configure multer
export const incidentUpload = multer({
  storage: getStorageConfig(),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 5, // Max 5 files per request
  },
});

// Enhanced upload middleware that handles cloud storage
export const uploadMultipleIncidentFiles = [
  incidentUpload.array("files", 5),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return next();
      }

      const incidentId = req.params.id;
      if (!incidentId) {
        return next(new Error("Incident ID is required for file uploads"));
      }

      // If using cloud storage, upload files to cloud and store URLs in request
      if (process.env.STORAGE_PROVIDER !== "local") {
        const uploadPromises = files.map(async (file) => {
          const result = await storageService.uploadFile(
            file,
            `incidents/${incidentId}`
          );
          if (!result.success) {
            throw new Error(
              `Failed to upload ${file.originalname}: ${result.error}`
            );
          }
          return {
            filename: file.originalname,
            url: result.url,
            size: file.size,
            mimetype: file.mimetype,
            publicId: result.publicId,
            provider: result.provider,
          };
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        (req as any).uploadedFiles = uploadedFiles;
      }

      next();
    } catch (error) {
      next(error);
    }
  },
];

// Middleware for single file upload
export const uploadSingleIncidentFile = incidentUpload.single("file");

// Helper function to delete incident folder (local storage)
export const deleteIncidentFolder = (incidentId: string): void => {
  const incidentDir = path.join(uploadsDir, incidentId);
  if (fs.existsSync(incidentDir)) {
    fs.rmSync(incidentDir, { recursive: true, force: true });
  }
};

// Enhanced delete function that works with any storage provider
export const deleteIncidentFile = async (
  fileUrl: string,
  publicId?: string
): Promise<void> => {
  try {
    await storageService.deleteFile(fileUrl, publicId);
  } catch (error) {
    console.error("Error deleting file from storage:", error);
    // Fallback to local deletion if cloud deletion fails
    if (fileUrl.startsWith("/")) {
      const relativePath = fileUrl.startsWith("/")
        ? fileUrl.substring(1)
        : fileUrl;
      const fullPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  }
};

// Helper function to get file URL
export const getIncidentFileUrl = (req: Request, filePath: string): string => {
  const protocol = req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}/${filePath}`;
};
