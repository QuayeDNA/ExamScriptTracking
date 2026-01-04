import crypto from 'crypto';

/**
 * WebAuthn Utility Functions for Biometric Authentication
 * Provides server-side signature verification and authenticator data parsing
 */

export interface AuthenticatorFlags {
  userPresent: boolean;      // UP flag (0x01) - User was present
  userVerified: boolean;     // UV flag (0x04) - User was verified (biometric/PIN)
  backupEligible: boolean;   // BE flag (0x08) - Credential can be backed up
  backupState: boolean;      // BS flag (0x10) - Credential is currently backed up
  attestedCredential: boolean; // AT flag (0x40) - Attested credential data included
  extensionData: boolean;    // ED flag (0x80) - Extension data included
}

export interface WebAuthnVerificationResult {
  verified: boolean;
  confidence: number;  // 0-100
  flags: AuthenticatorFlags;
  counter: number;
  errorMessage?: string;
}

/**
 * Convert Base64 string to Buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  // Handle URL-safe base64
  const base64Cleaned = base64.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64Cleaned, 'base64');
}

/**
 * Convert Buffer to Base64 string
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

/**
 * Extract authenticator flags from authenticator data
 * Flags byte is at position 32 in authenticator data
 */
export function extractAuthenticatorFlags(authenticatorData: Buffer): AuthenticatorFlags {
  if (authenticatorData.length < 37) {
    throw new Error('Authenticator data too short');
  }

  const flags = authenticatorData[32];

  return {
    userPresent: (flags & 0x01) !== 0,
    userVerified: (flags & 0x04) !== 0,
    backupEligible: (flags & 0x08) !== 0,
    backupState: (flags & 0x10) !== 0,
    attestedCredential: (flags & 0x40) !== 0,
    extensionData: (flags & 0x80) !== 0,
  };
}

/**
 * Extract signature counter from authenticator data
 * Counter is a 32-bit unsigned integer at bytes 33-36
 */
export function extractCounter(authenticatorData: Buffer): number {
  if (authenticatorData.length < 37) {
    throw new Error('Authenticator data too short');
  }

  return authenticatorData.readUInt32BE(33);
}

/**
 * Parse client data JSON to extract challenge and other data
 */
export function parseClientDataJSON(clientDataJSON: string): {
  type: string;
  challenge: string;
  origin: string;
  crossOrigin?: boolean;
} {
  try {
    const parsed = JSON.parse(clientDataJSON);
    return {
      type: parsed.type,
      challenge: parsed.challenge,
      origin: parsed.origin,
      crossOrigin: parsed.crossOrigin,
    };
  } catch (error) {
    throw new Error('Invalid client data JSON');
  }
}

/**
 * Verify the RP ID hash in authenticator data
 * First 32 bytes of authenticator data should be SHA-256 hash of RP ID
 */
export function verifyRpIdHash(authenticatorData: Buffer, expectedRpId: string): boolean {
  if (authenticatorData.length < 32) {
    return false;
  }

  const rpIdHash = authenticatorData.subarray(0, 32);
  const expectedHash = crypto.createHash('sha256').update(expectedRpId).digest();

  return rpIdHash.equals(expectedHash);
}

/**
 * Convert COSE public key to Node.js crypto format
 * COSE key format used by WebAuthn for ECDSA P-256
 */
export function coseToJwk(cosePublicKey: Buffer): crypto.JsonWebKey {
  // For simplicity, assuming ES256 (ECDSA P-256)
  // In production, parse CBOR to extract proper key parameters
  
  // This is a simplified version - you may need a CBOR library for full parsing
  // For now, we'll assume the public key is already in a usable format
  
  throw new Error('COSE key parsing not yet implemented - use imported public key directly');
}

/**
 * Verify WebAuthn assertion signature
 * This is the core function that validates the biometric authentication
 */
export async function verifyWebAuthnSignature(params: {
  publicKey: string;          // Base64-encoded public key (SPKI format)
  signature: string;          // Base64-encoded signature
  authenticatorData: string;  // Base64-encoded authenticator data
  clientDataJSON: string;     // Base64-encoded client data JSON
}): Promise<WebAuthnVerificationResult> {
  try {
    // Decode inputs
    const publicKeyBuffer = base64ToBuffer(params.publicKey);
    const signatureBuffer = base64ToBuffer(params.signature);
    const authenticatorDataBuffer = base64ToBuffer(params.authenticatorData);
    const clientDataJSONBuffer = base64ToBuffer(params.clientDataJSON);

    // Extract flags and counter
    const flags = extractAuthenticatorFlags(authenticatorDataBuffer);
    const counter = extractCounter(authenticatorDataBuffer);

    // Create hash of client data JSON
    const clientDataHash = crypto
      .createHash('sha256')
      .update(clientDataJSONBuffer)
      .digest();

    // Concatenate authenticator data and client data hash
    // This is what was signed by the authenticator
    const signedData = Buffer.concat([authenticatorDataBuffer, clientDataHash]);

    // Import public key
    const publicKey = crypto.createPublicKey({
      key: publicKeyBuffer,
      format: 'der',
      type: 'spki',
    });

    // Verify signature using ECDSA with SHA-256 (ES256)
    const verify = crypto.createVerify('SHA256');
    verify.update(signedData);
    verify.end();

    const isValid = verify.verify(publicKey, signatureBuffer);

    // Calculate confidence score
    let confidence = 50; // Base confidence

    if (isValid) {
      confidence += 30; // Valid signature adds 30%
    }

    if (flags.userVerified) {
      confidence += 20; // Biometric verification adds 20%
    }

    if (!flags.userPresent) {
      confidence = 0; // User must be present
    }

    return {
      verified: isValid && flags.userPresent,
      confidence: Math.min(confidence, 100),
      flags,
      counter,
    };
  } catch (error) {
    return {
      verified: false,
      confidence: 0,
      flags: {
        userPresent: false,
        userVerified: false,
        backupEligible: false,
        backupState: false,
        attestedCredential: false,
        extensionData: false,
      },
      counter: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

/**
 * Generate a random challenge for WebAuthn
 * Challenge should be at least 16 bytes for security
 */
export function generateChallenge(length: number = 32): Buffer {
  return crypto.randomBytes(length);
}

/**
 * Validate that a counter has incremented (prevents replay attacks)
 */
export function validateCounter(newCounter: number, storedCounter: number): boolean {
  // Counter of 0 means the authenticator doesn't support counters
  if (newCounter === 0) {
    return true;
  }

  // Counter must increment
  return newCounter > storedCounter;
}

/**
 * Calculate confidence score from verification result
 * Used to provide a percentage match similar to biometric systems
 */
export function calculateConfidence(result: WebAuthnVerificationResult): number {
  if (!result.verified) {
    return 0;
  }

  let confidence = 60; // Base confidence for valid signature

  if (result.flags.userVerified) {
    confidence += 30; // Biometric/PIN verification
  }

  if (result.flags.userPresent) {
    confidence += 10; // User presence
  }

  return Math.min(confidence, 100);
}

/**
 * Validate authenticator data structure
 */
export function validateAuthenticatorData(authenticatorData: Buffer): {
  valid: boolean;
  error?: string;
} {
  // Minimum length: 32 (RP ID hash) + 1 (flags) + 4 (counter) = 37 bytes
  if (authenticatorData.length < 37) {
    return {
      valid: false,
      error: 'Authenticator data too short (minimum 37 bytes)',
    };
  }

  const flags = extractAuthenticatorFlags(authenticatorData);

  // User must be present
  if (!flags.userPresent) {
    return {
      valid: false,
      error: 'User presence flag not set',
    };
  }

  return { valid: true };
}

/**
 * Get user-friendly error message for WebAuthn errors
 */
export function getWebAuthnErrorMessage(error: Error): string {
  const errorName = error.name || '';
  const errorMessage = error.message || '';

  // Common WebAuthn error mappings
  if (errorName === 'NotAllowedError') {
    return 'Biometric authentication was cancelled or timed out';
  }

  if (errorName === 'InvalidStateError') {
    return 'This biometric credential is already registered';
  }

  if (errorName === 'NotSupportedError') {
    return 'Your device does not support biometric authentication';
  }

  if (errorName === 'SecurityError') {
    return 'Biometric authentication is only available on secure connections (HTTPS)';
  }

  if (errorMessage.includes('authenticator')) {
    return 'No biometric authenticator found on this device';
  }

  return 'Biometric authentication failed. Please try again.';
}
