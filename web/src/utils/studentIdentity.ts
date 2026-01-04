/**
 * Student Identity Management
 * Binds this device to a specific student on first use
 * Prevents multiple students from using the same device
 */

export interface StudentIdentity {
  indexNumber: string;
  firstName: string;
  lastName: string;
  program?: string;
  level?: number;
  email?: string;
  phone?: string;
  deviceId: string;
  registeredAt: string;
  lastUsed: string;
}

const STORAGE_KEY = 'student-identity';
const DEVICE_ID_KEY = 'device-fingerprint';

/**
 * Generate a unique device fingerprint
 * Uses browser characteristics to create a semi-persistent ID
 */
export function generateDeviceFingerprint(): string {
  const stored = localStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;

  // Create fingerprint from browser characteristics
  const fingerprint = btoa(
    [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width,
      screen.height,
      screen.colorDepth,
      Date.now(), // Add timestamp for uniqueness
      Math.random().toString(36), // Add random component
    ].join('|')
  );

  localStorage.setItem(DEVICE_ID_KEY, fingerprint);
  return fingerprint;
}

/**
 * Check if student is registered on this device
 */
export function isStudentRegistered(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Get registered student identity
 */
export function getStudentIdentity(): StudentIdentity | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Register student on this device
 * This binds the device to a specific student
 */
export function registerStudent(data: Omit<StudentIdentity, 'deviceId' | 'registeredAt' | 'lastUsed'>): StudentIdentity {
  const identity: StudentIdentity = {
    ...data,
    deviceId: generateDeviceFingerprint(),
    registeredAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}

/**
 * Update last used timestamp
 */
export function updateLastUsed(): void {
  const identity = getStudentIdentity();
  if (!identity) return;

  identity.lastUsed = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

/**
 * Clear student registration (for testing or device transfer)
 * Should require confirmation!
 */
export function clearStudentIdentity(): void {
  localStorage.removeItem(STORAGE_KEY);
  // Don't remove device fingerprint - keep for audit trail
}

/**
 * Verify if the provided index number matches registered student
 * Used to prevent device sharing
 */
export function verifyStudentIdentity(indexNumber: string): boolean {
  const identity = getStudentIdentity();
  if (!identity) return false;
  
  return identity.indexNumber.toLowerCase() === indexNumber.toLowerCase();
}
