import multer from "multer";
import { Request } from "express";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads/incidents");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
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
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 5, // Max 5 files per request
  },
});

// Middleware for single file upload
export const uploadSingleIncidentFile = incidentUpload.single("file");

// Middleware for multiple files upload
export const uploadMultipleIncidentFiles = incidentUpload.array("files", 5);

// Helper function to delete incident folder
export const deleteIncidentFolder = (incidentId: string): void => {
  const incidentDir = path.join(uploadsDir, incidentId);
  if (fs.existsSync(incidentDir)) {
    fs.rmSync(incidentDir, { recursive: true, force: true });
  }
};

// Helper function to delete specific file
export const deleteIncidentFile = (filePath: string): void => {
  const fullPath = path.join(__dirname, "../../", filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// Helper function to get file URL
export const getIncidentFileUrl = (req: Request, filePath: string): string => {
  const protocol = req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}/${filePath}`;
};
