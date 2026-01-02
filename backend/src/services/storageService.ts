/**
 * Storage Service Abstraction
 * Handles file uploads to different storage providers (local, cloudinary, cloudflare, etc.)
 */

import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Storage provider types
export type StorageProvider = "local" | "cloudinary";

// Storage configuration
export interface StorageConfig {
  provider: StorageProvider;
  local?: {
    uploadDir: string;
  };
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    uploadPreset?: string;
  };
  cloudflare?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
  };
}

// File upload result
export interface UploadResult {
  success: boolean;
  url: string;
  publicId?: string;
  provider: StorageProvider;
  error?: string;
}

// Storage service class
export class StorageService {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  /**
   * Upload a file to the configured storage provider
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = "incidents"
  ): Promise<UploadResult> {
    try {
      switch (this.config.provider) {
        case "local":
          return await this.uploadToLocal(file, folder);
        case "cloudinary":
          return await this.uploadToCloudinary(file, folder);
        default:
          throw new Error(
            `Unsupported storage provider: ${this.config.provider}`
          );
      }
    } catch (error) {
      console.error("Storage upload error:", error);
      return {
        success: false,
        url: "",
        provider: this.config.provider,
        error: error instanceof Error ? error.message : "Unknown upload error",
      };
    }
  }

  /**
   * Delete a file from storage
   * Automatically detects provider based on URL pattern
   */
  async deleteFile(url: string, publicId?: string): Promise<boolean> {
    try {
      // Detect provider from URL
      const isCloudinaryUrl = url.includes('cloudinary.com') || url.includes('res.cloudinary');
      const isLocalUrl = url.startsWith('/uploads') || url.startsWith('uploads');

      if (isCloudinaryUrl) {
        console.log("[DELETE] Detected Cloudinary URL, using Cloudinary delete");
        
        // If publicId not provided, extract it from the URL
        if (!publicId) {
          // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{extension}
          // Extract public_id with folder path
          const urlParts = url.split('/upload/');
          if (urlParts.length > 1) {
            // Remove version (v1234567890) and get the rest
            const pathAfterUpload = urlParts[1].replace(/^v\d+\//, '');
            // Remove file extension
            publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
            console.log("[DELETE] Extracted public_id from URL:", publicId);
          } else {
            console.error("[DELETE] Could not extract public_id from Cloudinary URL:", url);
            return false;
          }
        }
        
        return await this.deleteFromCloudinary(publicId);
      } else if (isLocalUrl) {
        console.log("[DELETE] Detected local URL, using local delete");
        return await this.deleteFromLocal(url);
      } else {
        console.warn("[DELETE] Unknown URL pattern, skipping deletion:", url);
        return false;
      }
    } catch (error) {
      console.error("Storage delete error:", error);
      return false;
    }
  }

  /**
   * Upload to local filesystem (existing implementation)
   */
  private async uploadToLocal(
    file: Express.Multer.File,
    folder: string
  ): Promise<UploadResult> {
    try {
      // For disk storage (file.path exists), file is already saved by multer
      if (file.path) {
        const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, '/');
        console.log("[LOCAL_STORAGE] File already saved by multer at:", relativePath);
        return {
          success: true,
          url: `/${relativePath}`,
          provider: "local",
        };
      }

      // For memory storage (file.buffer exists), manually save the file
      // Add prefix based on folder type (student- for students, incident- for incidents, etc.)
      const prefix = folder === "students" ? "student-" : folder === "incidents" ? "incident-" : "";
      const fileName = `${prefix}${uuidv4()}-${file.originalname}`;
      const uploadDir = path.join(process.cwd(), "uploads", folder);
      const filePath = path.join(uploadDir, fileName);
      const relativePath = `uploads/${folder}/${fileName}`;

      // Ensure directory exists
      await fs.mkdir(uploadDir, { recursive: true });

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);
      
      console.log("[LOCAL_STORAGE] File saved to:", relativePath);

      return {
        success: true,
        url: `/${relativePath}`,
        provider: "local",
      };
    } catch (error) {
      console.error("[LOCAL_STORAGE] Upload error:", error);
      throw error;
    }
  }

  /**
   * Upload to Cloudinary (free tier for development)
   */
  private async uploadToCloudinary(
    file: Express.Multer.File,
    folder: string
  ): Promise<UploadResult> {
    if (!this.config.cloudinary) {
      throw new Error("Cloudinary configuration missing");
    }

    console.log("[CLOUDINARY] Starting upload for folder:", folder);
    console.log("[CLOUDINARY] File details:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      hasBuffer: !!file.buffer,
      bufferLength: file.buffer?.length
    });

    // Dynamic import to avoid requiring cloudinary in production if not used
    const cloudinary = await import("cloudinary").then((m) => m.v2);

    // Configure cloudinary
    cloudinary.config({
      cloud_name: this.config.cloudinary.cloudName,
      api_key: this.config.cloudinary.apiKey,
      api_secret: this.config.cloudinary.apiSecret,
    });

    console.log("[CLOUDINARY] Configured with cloud_name:", this.config.cloudinary.cloudName);

    // Upload to cloudinary
    const uploadOptions: any = {
      folder: `exam-script-tracking/${folder}`,
      public_id: uuidv4(),
      resource_type: "auto",
    };

    if (this.config.cloudinary.uploadPreset) {
      uploadOptions.upload_preset = this.config.cloudinary.uploadPreset;
    }

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: any, result: any) => {
          if (error) {
            console.error("[CLOUDINARY] Upload error:", error);
            reject(error);
          } else {
            console.log("[CLOUDINARY] Upload successful:", result.secure_url);
            resolve(result);
          }
        }
      );

      // Convert buffer to stream
      const { Readable } = require("stream");
      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      provider: "cloudinary",
    };
  }

  /**
   * Delete from local filesystem
   */
  private async deleteFromLocal(url: string): Promise<boolean> {
    try {
      // Extract relative path from URL
      const relativePath = url.startsWith("/") ? url.substring(1) : url;
      // Use process.cwd() to get project root instead of __dirname
      const fullPath = path.join(process.cwd(), relativePath);
      
      console.log("[DELETE_LOCAL] Attempting to delete:", fullPath);

      await fs.unlink(fullPath);
      console.log("[DELETE_LOCAL] File deleted successfully");
      return true;
    } catch (error) {
      console.error("Local file delete error:", error);
      return false;
    }
  }

  /**
   * Delete from Cloudinary
   */
  private async deleteFromCloudinary(publicId: string): Promise<boolean> {
    try {
      const cloudinary = await import("cloudinary").then((m) => m.v2);

      if (!this.config.cloudinary) {
        throw new Error("Cloudinary configuration missing");
      }

      cloudinary.config({
        cloud_name: this.config.cloudinary.cloudName,
        api_key: this.config.cloudinary.apiKey,
        api_secret: this.config.cloudinary.apiSecret,
      });

      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      return false;
    }
  }
}

// Factory function to create storage service based on environment
export function createStorageService(): StorageService {
  const nodeEnv = process.env.NODE_ENV || "development";
  const explicitProvider = process.env.STORAGE_PROVIDER as StorageProvider;

  // Priority 1: Check for explicit STORAGE_PROVIDER setting (overrides NODE_ENV)
  if (explicitProvider && ["local", "cloudinary"].includes(explicitProvider)) {
    console.log(`📁 Using explicitly set ${explicitProvider} storage provider (NODE_ENV: ${nodeEnv})`);
    const config: StorageConfig = { provider: explicitProvider };
    
    // Configure based on explicit provider
    if (explicitProvider === "local") {
      config.local = {
        uploadDir: process.env.UPLOAD_DIR || "uploads",
      };
    } else if (explicitProvider === "cloudinary") {
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        throw new Error("Cloudinary environment variables not configured");
      }
      config.cloudinary = {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
      };
    }
    return new StorageService(config);
  }

  // Priority 2: Auto-select based on NODE_ENV
  // Development: default to local storage
  // Production: default to cloudinary
  const provider: StorageProvider = nodeEnv === "production" ? "cloudinary" : "local";
  console.log(`📁 Auto-selected ${provider} storage for ${nodeEnv} environment`);

  const config: StorageConfig = { provider };

  if (provider === "local") {
    config.local = {
      uploadDir: process.env.UPLOAD_DIR || "uploads",
    };
  } else if (provider === "cloudinary") {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error("Cloudinary environment variables not configured");
    }
    config.cloudinary = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
    };
  }

  return new StorageService(config);
}

// Export singleton instance
export const storageService = createStorageService();
