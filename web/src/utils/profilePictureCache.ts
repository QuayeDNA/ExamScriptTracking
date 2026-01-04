// ========================================
// PROFILE PICTURE CACHING SYSTEM
// Stores student profile pictures locally as base64
// ========================================

import { getFileUrl } from "@/lib/api-client";

const CACHE_KEY_PREFIX = 'student_profile_';
const MAX_IMAGE_SIZE_KB = 100; // 100KB limit per image
const MAX_CACHE_SIZE_MB = 10;   // 10MB total cache limit

export interface CachedProfilePicture {
  indexNumber: string;
  base64Data: string;
  cachedAt: string;
  sizeKB: number;
}

/**
 * Download and cache a student's profile picture
 * @param indexNumber Student index number
 * @param imageUrl URL of the profile picture (can be relative path)
 * @returns base64 encoded image data
 */
export async function cacheProfilePicture(
  indexNumber: string, 
  imageUrl: string
): Promise<string> {
  try {
    // Check if already cached
    const cached = getCachedPicture(indexNumber);
    if (cached) {
      return cached.base64Data;
    }
    
    // Convert relative path to full URL using getFileUrl
    const fullUrl = getFileUrl(imageUrl);
    
    // Download image
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error('Failed to download profile picture');
    }
    
    const blob = await response.blob();
    
    // Check size
    const sizeKB = blob.size / 1024;
    if (sizeKB > MAX_IMAGE_SIZE_KB) {
      console.warn(`Profile picture too large (${sizeKB.toFixed(1)}KB), compressing...`);
      // In production, you might want to compress the image here
    }
    
    // Convert to base64
    const base64Data = await blobToBase64(blob);
    
    // Store in cache
    const cacheData: CachedProfilePicture = {
      indexNumber,
      base64Data,
      cachedAt: new Date().toISOString(),
      sizeKB,
    };
    
    localStorage.setItem(
      `${CACHE_KEY_PREFIX}${indexNumber}`, 
      JSON.stringify(cacheData)
    );
    
    return base64Data;
  } catch (error) {
    console.error('Failed to cache profile picture:', error);
    // Return placeholder/default image
    return getPlaceholderImage();
  }
}

/**
 * Get cached profile picture
 */
export function getCachedPicture(indexNumber: string): CachedProfilePicture | null {
  try {
    const data = localStorage.getItem(`${CACHE_KEY_PREFIX}${indexNumber}`);
    if (!data) return null;
    
    return JSON.parse(data) as CachedProfilePicture;
  } catch (error) {
    console.error('Failed to retrieve cached picture:', error);
    return null;
  }
}

/**
 * Get profile picture (cached or placeholder)
 */
export function getProfilePicture(indexNumber: string): string {
  const cached = getCachedPicture(indexNumber);
  return cached ? cached.base64Data : getPlaceholderImage();
}

/**
 * Check if profile picture is cached
 */
export function isPictureCached(indexNumber: string): boolean {
  return getCachedPicture(indexNumber) !== null;
}

/**
 * Delete a cached profile picture
 */
export function deleteCachedPicture(indexNumber: string): void {
  try {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${indexNumber}`);
  } catch (error) {
    console.error('Failed to delete cached picture:', error);
  }
}

/**
 * Get all cached profile pictures
 */
export function getAllCachedPictures(): CachedProfilePicture[] {
  const pictures: CachedProfilePicture[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          pictures.push(JSON.parse(data));
        }
      }
    }
  } catch (error) {
    console.error('Failed to retrieve cached pictures:', error);
  }
  
  return pictures;
}

/**
 * Get total cache size in MB
 */
export function getCacheSizeMB(): number {
  const pictures = getAllCachedPictures();
  const totalKB = pictures.reduce((sum, pic) => sum + pic.sizeKB, 0);
  return totalKB / 1024;
}

/**
 * Clear all cached profile pictures
 */
export function clearAllCachedPictures(): void {
  try {
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keys.push(key);
      }
    }
    
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear cached pictures:', error);
  }
}

/**
 * Clean up old cache if over limit
 */
export function cleanupCache(): void {
  const cacheSizeMB = getCacheSizeMB();
  
  if (cacheSizeMB > MAX_CACHE_SIZE_MB) {
    // Get all pictures sorted by date (oldest first)
    const pictures = getAllCachedPictures().sort((a, b) => 
      new Date(a.cachedAt).getTime() - new Date(b.cachedAt).getTime()
    );
    
    // Delete oldest pictures until under limit
    let currentSize = cacheSizeMB;
    for (const picture of pictures) {
      if (currentSize <= MAX_CACHE_SIZE_MB * 0.8) break; // Keep 80% of limit
      
      deleteCachedPicture(picture.indexNumber);
      currentSize -= picture.sizeKB / 1024;
    }
  }
}

/**
 * Convert Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get placeholder/default profile image (base64 SVG)
 */
function getPlaceholderImage(): string {
  // Simple gray user icon SVG as base64
  const svg = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#e0e0e0"/>
      <circle cx="50" cy="35" r="20" fill="#bdbdbd"/>
      <path d="M 50 55 Q 30 55 20 75 L 20 100 L 80 100 L 80 75 Q 70 55 50 55" fill="#bdbdbd"/>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Compress image if needed (future enhancement)
 * Can use canvas API to resize/compress large images
 */
export async function compressImage(base64: string, maxSizeKB: number): Promise<string> {
  // TODO: Implement image compression using canvas
  // For now, just return original
  return base64;
}
