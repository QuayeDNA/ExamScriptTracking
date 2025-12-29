import { createHash } from 'crypto';

/**
 * Biometric Hashing Utility
 * Provides secure hashing for biometric templates without storing raw data
 */

/**
 * Hash a biometric template using SHA-256 with salt
 * @param template - The biometric template data (string representation)
 * @param salt - Optional salt for additional security
 * @returns SHA-256 hash of the template
 */
export function hashBiometricTemplate(template: string, salt?: string): string {
  const saltedTemplate = salt ? `${template}:${salt}` : template;
  return createHash('sha256').update(saltedTemplate).digest('hex');
}

/**
 * Generate a random salt for biometric hashing
 * @param length - Length of the salt in bytes (default: 16)
 * @returns Random salt as hex string
 */
export function generateBiometricSalt(length: number = 16): string {
  return require('crypto').randomBytes(length).toString('hex');
}

/**
 * Verify a biometric template against a stored hash
 * @param template - The biometric template to verify
 * @param storedHash - The stored hash to compare against
 * @param salt - The salt used during original hashing
 * @returns True if the template matches the hash
 */
export function verifyBiometricTemplate(
  template: string,
  storedHash: string,
  salt?: string
): boolean {
  const computedHash = hashBiometricTemplate(template, salt);
  return computedHash === storedHash;
}

/**
 * Validate biometric provider type
 * @param provider - The biometric provider string
 * @returns True if valid provider
 */
export function isValidBiometricProvider(provider: string): boolean {
  const validProviders = ['TOUCHID', 'FACEID', 'FINGERPRINT', 'WEBAUTHN'];
  return validProviders.includes(provider.toUpperCase());
}

/**
 * Generate a unique biometric enrollment ID
 * @returns UUID for biometric enrollment tracking
 */
export function generateBiometricEnrollmentId(): string {
  return require('crypto').randomUUID();
}