// ========================================
// WEBAUTHN SERVICE
// Handles biometric registration and verification
// ========================================

import { 
  startRegistration, 
  startAuthentication,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON 
} from '@simplewebauthn/browser';
import { generateDeviceId } from '@/utils/biometric';

// Base URL for API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface BiometricRegistrationResult {
  success: boolean;
  credentialId: string;
  biometricHash: string;
  publicKey: string;
  deviceId: string;
  confidence: number;
  error?: string;
}

export interface BiometricVerificationResult {
  success: boolean;
  credentialId: string;
  confidence: number;
  authenticatorData?: string;
  error?: string;
}

/**
 * Register biometric credentials for a student
 * @param studentId Student's unique ID
 * @param indexNumber Student's index number
 * @returns Registration result with credential details
 */
export async function registerBiometric(
  studentId: string,
  indexNumber: string
): Promise<BiometricRegistrationResult> {
  try {
    // Step 1: Get registration options from backend
    const optionsResponse = await fetch(`${API_BASE_URL}/api/attendance/portal/webauthn/register/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId,
        indexNumber,
      }),
    });

    if (!optionsResponse.ok) {
      throw new Error('Failed to get registration options from server');
    }

    const options = await optionsResponse.json();

    // Step 2: Start WebAuthn registration (browser prompts for biometric)
    let registrationResponse: RegistrationResponseJSON;
    try {
      registrationResponse = await startRegistration(options);
    } catch (error) {
      const err = error as Error & { name: string };
      // User cancelled or device doesn't support
      if (err.name === 'NotAllowedError') {
        return {
          success: false,
          credentialId: '',
          biometricHash: '',
          publicKey: '',
          deviceId: '',
          confidence: 0,
          error: 'Biometric authentication was cancelled. Please try again.',
        };
      }
      throw error;
    }

    // Step 3: Generate device ID
    const deviceId = generateDeviceId();

    // Step 4: Calculate confidence score
    // Base confidence on authenticator characteristics
    const confidence = calculateConfidenceScore(registrationResponse);

    // Step 5: Generate biometric hash from credential ID
    const biometricHash = await generateBiometricHash(registrationResponse.id);

    // Step 6: Return registration data
    return {
      success: true,
      credentialId: registrationResponse.id,
      biometricHash,
      publicKey: registrationResponse.response.publicKey || '',
      deviceId,
      confidence,
    };
  } catch (error) {
    const err = error as Error;
    console.error('Biometric registration error:', err);
    return {
      success: false,
      credentialId: '',
      biometricHash: '',
      publicKey: '',
      deviceId: '',
      confidence: 0,
      error: err.message || 'Failed to register biometric credentials',
    };
  }
}

/**
 * Verify biometric credentials for attendance
 * @param credentialId Previously registered credential ID
 * @returns Verification result with confidence score
 */
export async function verifyBiometric(
  credentialId?: string
): Promise<BiometricVerificationResult> {
  try {
    // Step 1: Get authentication options from backend
    const optionsResponse = await fetch(`${API_BASE_URL}/api/attendance/portal/webauthn/authenticate/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credentialId, // Optional: specific credential to use
      }),
    });

    if (!optionsResponse.ok) {
      throw new Error('Failed to get authentication options from server');
    }

    const options = await optionsResponse.json();

    // Step 2: Start WebAuthn authentication (browser prompts for biometric)
    let authenticationResponse: AuthenticationResponseJSON;
    try {
      authenticationResponse = await startAuthentication(options);
    } catch (error) {
      const err = error as Error & { name: string };
      // User cancelled or device doesn't support
      if (err.name === 'NotAllowedError') {
        return {
          success: false,
          credentialId: '',
          confidence: 0,
          error: 'Biometric verification was cancelled. Please try again.',
        };
      }
      throw error;
    }

    // Step 3: Calculate confidence score
    const confidence = calculateConfidenceScore(authenticationResponse);

    // Step 4: Return verification data
    return {
      success: true,
      credentialId: authenticationResponse.id,
      confidence,
      authenticatorData: authenticationResponse.response.authenticatorData,
    };
  } catch (error) {
    const err = error as Error;
    console.error('Biometric verification error:', err);
    return {
      success: false,
      credentialId: '',
      confidence: 0,
      error: err.message || 'Failed to verify biometric credentials',
    };
  }
}

/**
 * Calculate confidence score based on authenticator characteristics
 * Higher score = more secure/reliable authentication
 * @returns Confidence score (0-100)
 */
function calculateConfidenceScore(
  response: RegistrationResponseJSON | AuthenticationResponseJSON
): number {
  let confidence = 70; // Base score

  // Check if response has authenticatorData (present in both types)
  if (response.response.authenticatorData) {
    confidence += 10;
  }

  // Parse authenticator flags for additional confidence
  const flags = response.response.authenticatorData 
    ? parseAuthenticatorFlags(response.response.authenticatorData)
    : null;

  if (flags) {
    if (flags.userPresent) confidence += 5;
    if (flags.userVerified) confidence += 10;
    if (!flags.backupEligible) confidence += 5; // Device-bound is more secure
  }

  // Cap at 100
  return Math.min(confidence, 100);
}

/**
 * Parse authenticator data flags
 */
function parseAuthenticatorFlags(authenticatorData: string): {
  userPresent: boolean;
  userVerified: boolean;
  backupEligible: boolean;
  backupState: boolean;
} | null {
  try {
    // Decode base64url to get flags byte
    const decoded = atob(authenticatorData.replace(/-/g, '+').replace(/_/g, '/'));
    const flags = decoded.charCodeAt(32); // Flags at byte 32

    return {
      userPresent: (flags & 0x01) !== 0,
      userVerified: (flags & 0x04) !== 0,
      backupEligible: (flags & 0x08) !== 0,
      backupState: (flags & 0x10) !== 0,
    };
  } catch {
    return null;
  }
}

/**
 * Generate SHA-256 hash from credential ID
 * This serves as the biometric identifier stored in the database
 */
async function generateBiometricHash(credentialId: string): Promise<string> {
  try {
    // Convert credential ID to ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(credentialId);

    // Generate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  } catch (error) {
    console.error('Failed to generate biometric hash:', error);
    throw new Error('Failed to generate biometric hash');
  }
}

/**
 * Check if WebAuthn is available in current browser
 */
export function isWebAuthnSupported(): boolean {
  return window?.PublicKeyCredential !== undefined &&
         typeof window.PublicKeyCredential === 'function';
}

/**
 * Check if platform authenticator (device biometric) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * Get friendly error message for WebAuthn errors
 */
export function getWebAuthnErrorMessage(error: Error): string {
  const errorName = error.name;
  
  const errorMessages: Record<string, string> = {
    'NotAllowedError': 'Operation cancelled. Please try again.',
    'NotSupportedError': 'Your device does not support biometric authentication.',
    'InvalidStateError': 'You have already registered on this device.',
    'SecurityError': 'Security error occurred. Please try again.',
    'AbortError': 'Operation timed out. Please try again.',
    'NetworkError': 'Network error. Please check your connection.',
  };

  return errorMessages[errorName] || error.message || 'An unknown error occurred';
}
