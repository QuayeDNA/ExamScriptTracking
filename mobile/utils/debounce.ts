/**
 * Debounce utility for delaying function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file attachment
 */
export interface AttachmentFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAttachment(file: AttachmentFile): ValidationResult {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = ['image/', 'video/', 'application/pdf'];

  if (file.size && file.size > MAX_SIZE) {
    return { valid: false, error: `File too large (max 50MB). This file is ${formatFileSize(file.size)}.` };
  }

  const isAllowedType = ALLOWED_TYPES.some(type => file.type.startsWith(type));
  if (!isAllowedType) {
    return { valid: false, error: 'Only images, videos, and PDFs are allowed.' };
  }

  return { valid: true };
}
