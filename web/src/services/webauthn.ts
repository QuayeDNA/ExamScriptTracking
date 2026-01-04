// ========================================
// WEBAUTHN SERVICE
// Handles REAL biometric registration and verification using WebAuthn API
// ========================================

import { generateDeviceId } from '@/utils/biometric';

export interface BiometricRegistrationResult {
  success: boolean;
  credentialId: string;
  biometricHash: string;
  publicKey: string;
  deviceId: string;
  authenticatorData: string;
  transports: string[];
  confidence: number;
  error?: string;
}

export interface BiometricVerificationResult {
  success: boolean;
  credentialId: string;
  signature: string;
  authenticatorData: string;
  clientDataJSON: string;
  confidence: number;
  error?: string;
}

/**
 * Helper: Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper: Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Helper: Generate random challenge
 */
function generateChallenge(): ArrayBuffer {
  return crypto.getRandomValues(new Uint8Array(32)).buffer;
}

/**
 * Register REAL biometric credentials for a student
 * This prompts for fingerprint/Face ID/Windows Hello
 */
export async function registerBiometric(
  studentId: string,
  indexNumber: string,
  firstName: string,
  lastName: string
): Promise<BiometricRegistrationResult> {
  try {
    // Check WebAuthn support
    if (!window.PublicKeyCredential) {
      return {
        success: false,
        credentialId: '',
        biometricHash: '',
        publicKey: '',
        deviceId: '',
        authenticatorData: '',
        transports: [],
        confidence: 0,
        error: 'WebAuthn not supported on this device',
      };
    }

    // Generate challenge
    const challenge = generateChallenge();

    // Get device ID
    const deviceId = generateDeviceId();

    // Create WebAuthn credential
    // THIS WILL PROMPT FOR BIOMETRIC!
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: challenge,
        rp: {
          name: 'Exam Script Tracking',
          id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(studentId),
          name: indexNumber,
          displayName: `${firstName} ${lastName}`,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256 (ECDSA P-256)
          { alg: -257, type: 'public-key' }, // RS256 (RSA PKCS#1)
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Prefer device biometric
          userVerification: 'required',        // MUST verify user (biometric/PIN)
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none', // We don't need attestation for our use case
      },
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Credential creation failed');
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    // Extract credential data
    const credentialId = arrayBufferToBase64(credential.rawId);
    const publicKeyBytes = arrayBufferToBase64(response.getPublicKey()!);
    const authenticatorDataBytes = arrayBufferToBase64(response.getAuthenticatorData());

    // Get transports if available
    const transports = response.getTransports ? response.getTransports() : [];

    // Generate hash for backward compatibility
    const biometricHash = await generateBiometricHash(credentialId);

    // Calculate confidence from authenticator data
    const confidence = calculateRegistrationConfidence(response.getAuthenticatorData());

    console.log('[WebAuthn] Registration successful:', {
      credentialId: credentialId.substring(0, 20) + '...',
      confidence,
      transports,
    });

    return {
      success: true,
      credentialId,
      biometricHash,
      publicKey: publicKeyBytes,
      deviceId,
      authenticatorData: authenticatorDataBytes,
      transports,
      confidence,
    };
  } catch (error) {
    const err = error as Error & { name: string };
    console.error('Biometric registration error:', err);

    // User-friendly error messages
    let errorMessage = 'Failed to register biometric';
    if (err.name === 'NotAllowedError') {
      errorMessage = 'Biometric registration was cancelled or timed out';
    } else if (err.name === 'NotSupportedError') {
      errorMessage = 'Your device does not support biometric authentication';
    } else if (err.name === 'SecurityError') {
      errorMessage = 'Biometric authentication requires a secure connection (HTTPS)';
    } else if (err.name === 'InvalidStateError') {
      errorMessage = 'This biometric is already registered';
    }

    return {
      success: false,
      credentialId: '',
      biometricHash: '',
      publicKey: '',
      deviceId: '',
      authenticatorData: '',
      transports: [],
      confidence: 0,
      error: errorMessage,
    };
  }
}

/**
 * Verify REAL biometric credentials for attendance
 * This prompts for fingerprint/Face ID/Windows Hello
 */
export async function verifyBiometric(
  credentialId: string,
  challenge?: ArrayBuffer
): Promise<BiometricVerificationResult> {
  try {
    // Check WebAuthn support
    if (!window.PublicKeyCredential) {
      return {
        success: false,
        credentialId: '',
        signature: '',
        authenticatorData: '',
        clientDataJSON: '',
        confidence: 0,
        error: 'WebAuthn not supported on this device',
      };
    }

    // Generate challenge if not provided
    const authChallenge = challenge || generateChallenge();

    // Convert credential ID from Base64
    const credentialIdBytes = base64ToArrayBuffer(credentialId);

    // Get WebAuthn assertion
    // THIS WILL PROMPT FOR BIOMETRIC!
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: authChallenge,
        allowCredentials: [
          {
            id: credentialIdBytes,
            type: 'public-key',
            transports: ['internal', 'usb', 'nfc', 'ble'],
          },
        ],
        userVerification: 'required', // MUST verify user (biometric/PIN)
        timeout: 60000,
      },
    }) as PublicKeyCredential;

    if (!assertion) {
      throw new Error('Assertion failed');
    }

    const response = assertion.response as AuthenticatorAssertionResponse;

    // Extract assertion data
    const signatureBytes = arrayBufferToBase64(response.signature);
    const authenticatorDataBytes = arrayBufferToBase64(response.authenticatorData);
    const clientDataJSONBytes = arrayBufferToBase64(response.clientDataJSON);

    // Calculate confidence from authenticator data
    const confidence = calculateVerificationConfidence(response.authenticatorData);

    console.log('[WebAuthn] Verification successful:', {
      credentialId: credentialId.substring(0, 20) + '...',
      confidence,
    });

    return {
      success: true,
      credentialId: arrayBufferToBase64(assertion.rawId),
      signature: signatureBytes,
      authenticatorData: authenticatorDataBytes,
      clientDataJSON: clientDataJSONBytes,
      confidence,
    };
  } catch (error) {
    const err = error as Error & { name: string };
    console.error('Biometric verification error:', err);

    // User-friendly error messages
    let errorMessage = 'Failed to verify biometric';
    if (err.name === 'NotAllowedError') {
      errorMessage = 'Biometric verification was cancelled or timed out';
    } else if (err.name === 'NotSupportedError') {
      errorMessage = 'Your device does not support biometric authentication';
    } else if (err.name === 'SecurityError') {
      errorMessage = 'Biometric authentication requires a secure connection (HTTPS)';
    } else if (err.name === 'InvalidStateError') {
      errorMessage = 'Biometric credential not found. Please re-enroll.';
    }

    return {
      success: false,
      credentialId: '',
      signature: '',
      authenticatorData: '',
      clientDataJSON: '',
      confidence: 0,
      error: errorMessage,
    };
  }
}

/**
 * Calculate confidence score from registration authenticator data
 */
function calculateRegistrationConfidence(authenticatorData: ArrayBuffer): number {
  try {
    const dataView = new Uint8Array(authenticatorData);
    if (dataView.length < 37) return 60;

    const flags = dataView[32];
    
    let confidence = 60; // Base score

    // User present (UP flag)
    if ((flags & 0x01) !== 0) confidence += 10;
    
    // User verified (UV flag) - THIS IS WHAT MATTERS FOR BIOMETRIC
    if ((flags & 0x04) !== 0) confidence += 30;

    return Math.min(confidence, 100);
  } catch {
    return 60;
  }
}

/**
 * Calculate confidence score from verification authenticator data
 */
function calculateVerificationConfidence(authenticatorData: ArrayBuffer): number {
  try {
    const dataView = new Uint8Array(authenticatorData);
    if (dataView.length < 37) return 60;

    const flags = dataView[32];
    
    let confidence = 50; // Base score for verification

    // User present (UP flag)
    if ((flags & 0x01) !== 0) confidence += 20;
    
    // User verified (UV flag) - THIS IS WHAT MATTERS FOR BIOMETRIC
    if ((flags & 0x04) !== 0) confidence += 30;

    return Math.min(confidence, 100);
  } catch {
    return 60;
  }
}

/**
 * Generate SHA-256 hash from credential ID (for backward compatibility)
 */
async function generateBiometricHash(credentialId: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(credentialId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
    'NotAllowedError': 'Operation cancelled or timed out. Please try again.',
    'NotSupportedError': 'Your device does not support biometric authentication.',
    'InvalidStateError': 'Biometric credential issue. You may need to re-enroll.',
    'SecurityError': 'Security error. Please ensure you are on a secure connection (HTTPS).',
    'AbortError': 'Operation timed out. Please try again.',
    'NetworkError': 'Network error. Please check your connection.',
  };

  return errorMessages[errorName] || error.message || 'An unknown error occurred';
}
