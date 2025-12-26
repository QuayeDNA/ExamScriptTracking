/**
 * Storage Service Abstraction
 * Handles file uploads to different storage providers (local, cloudinary, cloudflare, etc.)
 */

import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Storage provider types
export type StorageProvider = "local" | "cloudinary" | "cloudflare";

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
        case "cloudflare":
          return await this.uploadToCloudflare(file, folder);
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
   */
  async deleteFile(url: string, publicId?: string): Promise<boolean> {
    try {
      switch (this.config.provider) {
        case "local":
          return await this.deleteFromLocal(url);
        case "cloudinary":
          return await this.deleteFromCloudinary(publicId || url);
        case "cloudflare":
          return await this.deleteFromCloudflare(url);
        default:
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
    // This would use the existing local upload logic
    // For now, return a placeholder - will be integrated with existing middleware
    const fileName = `${uuidv4()}-${file.originalname}`;
    const relativePath = `uploads/${folder}/${fileName}`;

    return {
      success: true,
      url: `/${relativePath}`,
      provider: "local",
    };
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

    // Dynamic import to avoid requiring cloudinary in production if not used
    const cloudinary = await import("cloudinary").then((m) => m.v2);

    // Configure cloudinary
    cloudinary.config({
      cloud_name: this.config.cloudinary.cloudName,
      api_key: this.config.cloudinary.apiKey,
      api_secret: this.config.cloudinary.apiSecret,
    });

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
          if (error) reject(error);
          else resolve(result);
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
   * Upload to Cloudflare R2 (free tier)
   */
  private async uploadToCloudflare(
    file: Express.Multer.File,
    folder: string
  ): Promise<UploadResult> {
    if (!this.config.cloudflare) {
      throw new Error("Cloudflare configuration missing");
    }

    // Dynamic import to avoid requiring AWS SDK in development
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${this.config.cloudflare.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.cloudflare.accessKeyId,
        secretAccessKey: this.config.cloudflare.secretAccessKey,
      },
    });

    const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: this.config.cloudflare.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    });

    await s3Client.send(command);

    const publicUrl = `${this.config.cloudflare.publicUrl}/${fileName}`;

    return {
      success: true,
      url: publicUrl,
      provider: "cloudflare",
    };
  }

  /**
   * Delete from local filesystem
   */
  private async deleteFromLocal(url: string): Promise<boolean> {
    try {
      // Extract relative path from URL
      const relativePath = url.startsWith("/") ? url.substring(1) : url;
      const fullPath = path.join(process.cwd(), relativePath);

      await fs.unlink(fullPath);
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

  /**
   * Delete from Cloudflare R2
   */
  private async deleteFromCloudflare(url: string): Promise<boolean> {
    try {
      if (!this.config.cloudflare) {
        throw new Error("Cloudflare configuration missing");
      }

      const { S3Client, DeleteObjectCommand } = await import(
        "@aws-sdk/client-s3"
      );

      const s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${this.config.cloudflare.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.config.cloudflare.accessKeyId,
          secretAccessKey: this.config.cloudflare.secretAccessKey,
        },
      });

      // Extract key from URL
      const urlParts = url.split("/");
      const fileName = urlParts.slice(-2).join("/"); // folder/filename

      const command = new DeleteObjectCommand({
        Bucket: this.config.cloudflare.bucketName,
        Key: fileName,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error("Cloudflare delete error:", error);
      return false;
    }
  }
}

// Factory function to create storage service based on environment
export function createStorageService(): StorageService {
  // Auto-select provider based on NODE_ENV
  const nodeEnv = process.env.NODE_ENV || "development";
  const provider: StorageProvider =
    nodeEnv === "production" ? "cloudinary" : "local";

  console.log(`📁 Using ${provider} storage for ${nodeEnv} environment`);

  const config: StorageConfig = { provider };

  switch (provider) {
    case "local":
      config.local = {
        uploadDir: process.env.UPLOAD_DIR || "uploads",
      };
      break;

    case "cloudinary":
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
      break;

    case "cloudflare":
      if (
        !process.env.CLOUDFLARE_ACCOUNT_ID ||
        !process.env.CLOUDFLARE_ACCESS_KEY_ID ||
        !process.env.CLOUDFLARE_SECRET_ACCESS_KEY ||
        !process.env.CLOUDFLARE_BUCKET_NAME
      ) {
        throw new Error("Cloudflare R2 environment variables not configured");
      }
      config.cloudflare = {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
        bucketName: process.env.CLOUDFLARE_BUCKET_NAME,
        publicUrl:
          process.env.CLOUDFLARE_PUBLIC_URL ||
          `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      };
      break;
  }

  return new StorageService(config);
}

// Export singleton instance
export const storageService = createStorageService();
