/**
 * Device Fingerprint Utility
 * Generates a unique fingerprint for the browser/device to prevent duplicate submissions
 */

/**
 * Generate a device fingerprint using browser characteristics
 * This is a simple fingerprint - for production, consider using a library like fingerprintjs
 */
export function generateDeviceFingerprint(): string {
  const components: string[] = [];

  // User Agent
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    components.push(navigator.userAgent);
  }

  // Screen resolution
  if (typeof screen !== 'undefined') {
    components.push(`${screen.width}x${screen.height}`);
    components.push(`${screen.colorDepth || 0}`);
  }

  // Timezone
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    try {
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch (e) {
      // Ignore
    }
  }

  // Language
  if (typeof navigator !== 'undefined' && navigator.language) {
    components.push(navigator.language);
  }

  // Platform
  if (typeof navigator !== 'undefined' && navigator.platform) {
    components.push(navigator.platform);
  }

  // Hardware concurrency
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    components.push(`cores:${navigator.hardwareConcurrency}`);
  }

  // Canvas fingerprint (simple version)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      components.push(canvas.toDataURL().slice(0, 50));
    }
  } catch (e) {
    // Ignore canvas errors
  }

  // Combine and hash
  const combined = components.join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `device_${Math.abs(hash).toString(36)}`;
}

/**
 * Get or create device fingerprint and store in localStorage
 */
export function getDeviceFingerprint(): string {
  const STORAGE_KEY = 'attendance_device_fingerprint';
  
  try {
    let fingerprint = localStorage.getItem(STORAGE_KEY);
    
    if (!fingerprint) {
      fingerprint = generateDeviceFingerprint();
      localStorage.setItem(STORAGE_KEY, fingerprint);
    }
    
    return fingerprint;
  } catch (e) {
    // Fallback if localStorage is not available
    return generateDeviceFingerprint();
  }
}

/**
 * Check if this device has already marked attendance for a session
 */
export function hasDeviceMarkedAttendance(sessionId: string): boolean {
  const STORAGE_KEY = `attendance_marked_${sessionId}`;
  
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Mark that this device has submitted attendance for a session
 */
export function markDeviceAttendance(sessionId: string): void {
  const STORAGE_KEY = `attendance_marked_${sessionId}`;
  
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
    
    // Also store timestamp for potential cleanup
    const timestampKey = `attendance_marked_${sessionId}_timestamp`;
    localStorage.setItem(timestampKey, Date.now().toString());
  } catch (e) {
    // Ignore localStorage errors
    console.warn('Failed to store attendance marker:', e);
  }
}

/**
 * Clear attendance markers (useful for testing or cleanup)
 */
export function clearAttendanceMarkers(sessionId?: string): void {
  try {
    if (sessionId) {
      localStorage.removeItem(`attendance_marked_${sessionId}`);
      localStorage.removeItem(`attendance_marked_${sessionId}_timestamp`);
    } else {
      // Clear all attendance markers
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('attendance_marked_')) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (e) {
    // Ignore errors
  }
}
