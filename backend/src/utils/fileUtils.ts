// Utility functions for handling file URLs and paths

/**
 * Construct full URLs for uploaded files
 * If the path is already a full URL (e.g., from Cloudinary), return as-is
 * Otherwise, construct a full URL using the API_URL environment variable
 */
export const getFileUrl = (relativePath: string): string => {
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