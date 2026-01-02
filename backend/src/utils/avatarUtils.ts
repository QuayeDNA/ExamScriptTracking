// Utility functions for handling avatar URLs and file paths
import { getFileUrl } from "./fileUtils";

/**
 * Get the default avatar URL based on environment
 * Priority: Explicit STORAGE_PROVIDER > NODE_ENV
 * - Cloudinary mode: uses CLOUDINARY_DEFAULT_AVATAR_URL
 * - Local mode: uses local file path
 */
export const getDefaultAvatarUrl = (): string => {
  const nodeEnv = process.env.NODE_ENV || "development";
  const explicitProvider = process.env.STORAGE_PROVIDER;
  
  // Determine actual provider (explicit setting overrides NODE_ENV)
  let provider: string;
  if (explicitProvider && ["local", "cloudinary"].includes(explicitProvider)) {
    provider = explicitProvider;
  } else {
    provider = nodeEnv === "production" ? "cloudinary" : "local";
  }

  console.log(`[AVATAR] Using ${provider} default avatar (NODE_ENV: ${nodeEnv}, STORAGE_PROVIDER: ${explicitProvider || 'not set'})`);

  if (provider === "cloudinary") {
    // Use Cloudinary URL from environment variable
    const cloudinaryUrl = process.env.CLOUDINARY_DEFAULT_AVATAR_URL;
    if (!cloudinaryUrl) {
      throw new Error("CLOUDINARY_DEFAULT_AVATAR_URL environment variable must be set when using Cloudinary");
    }
    return cloudinaryUrl;
  }

  // In local mode, use local file
  const localPath = process.env.DEFAULT_AVATAR_URL || "/uploads/students/default-avatar.png";
  return getFileUrl(localPath);
};