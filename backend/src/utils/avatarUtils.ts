// Utility functions for handling avatar URLs and file paths
import { getFileUrl } from "./fileUtils";

/**
 * Get the default avatar URL based on environment
 * In production, uses Cloudinary URL from students/ folder
 * In development, uses local file path
 */
export const getDefaultAvatarUrl = (): string => {
  // Check for explicit environment variable first
  const defaultAvatarUrl = process.env.DEFAULT_AVATAR_URL;
  if (defaultAvatarUrl) {
    return defaultAvatarUrl;
  }

  // Fallback to environment-based logic
  if (process.env.NODE_ENV === "production") {
    // Use Cloudinary URL from environment variable
    const cloudinaryUrl = process.env.CLOUDINARY_DEFAULT_AVATAR_URL;
    if (cloudinaryUrl) {
      return cloudinaryUrl;
    }
    // If no environment variable set, throw error or use a placeholder
    throw new Error("CLOUDINARY_DEFAULT_AVATAR_URL environment variable must be set in production");
  }

  // In development, use local file
  const localPath = process.env.DEFAULT_AVATAR_LOCAL_PATH || "/uploads/students/default-avatar.png";
  return getFileUrl(localPath);
};