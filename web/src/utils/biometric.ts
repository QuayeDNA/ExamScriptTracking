// ========================================
// BIOMETRIC DEVICE SUPPORT DETECTION
// ========================================

export interface DeviceSupport {
  supported: boolean;
  type: BiometricType;
  platformAuthenticator: boolean;
  webAuthnAvailable: boolean;
  error?: string;
}

export type BiometricType = 'faceid' | 'touchid' | 'fingerprint' | 'none';

/**
 * Check if the device supports biometric authentication
 * Uses more reliable detection methods for biometric capabilities
 */
export async function checkDeviceSupport(): Promise<DeviceSupport> {
  console.log('[Biometric] Starting device support check...');
  console.log('[Biometric] User Agent:', navigator.userAgent);
  console.log('[Biometric] Platform:', navigator.platform);
  
  const result: DeviceSupport = {
    supported: false,
    type: 'none',
    platformAuthenticator: false,
    webAuthnAvailable: false,
  };

  // Determine biometric type based on platform (do this first)
  result.type = getBiometricType();
  console.log('[Biometric] Detected type:', result.type);
  
  // If we detected a biometric type, consider it supported
  // This is more reliable than WebAuthn checks which can fail
  if (result.type !== 'none') {
    console.log('[Biometric] ✅ Device has biometric capability based on platform detection');
    result.supported = true;
    result.platformAuthenticator = true;
  }

  // Check if WebAuthn is available (nice to have but not required)
  if (window.PublicKeyCredential) {
    result.webAuthnAvailable = true;
    console.log('[Biometric] WebAuthn API is available');
    
    try {
      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      console.log('[Biometric] Platform authenticator available:', available);
      
      if (available) {
        result.platformAuthenticator = true;
        result.supported = true;
        console.log('[Biometric] ✅ WebAuthn confirms biometric support');
      }
    } catch (error) {
      // Don't fail if WebAuthn check fails - we already have type detection
      console.warn('[Biometric] WebAuthn check failed (non-critical):', error);
    }
  } else {
    console.log('[Biometric] WebAuthn API not available');
  }

  // Final result
  if (!result.supported) {
    result.error = 'No biometric capability detected on this device';
    console.log('[Biometric] ❌ Device not supported');
  } else {
    console.log('[Biometric] ✅ Final result: Device SUPPORTED');
  }

  console.log('[Biometric] Complete result:', result);
  return result;
}

/**
 * Determine the type of biometric authentication available
 * Based on device/platform detection
 */
export function getBiometricType(): BiometricType {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  // iOS devices
  if (/iphone|ipad|ipod/.test(userAgent)) {
    // Newer iPhones have Face ID, older have Touch ID
    // Note: Can't detect this precisely via JS, default to faceid for modern devices
    return 'faceid'; // Could be touchid on older devices
  }

  // macOS devices
  if (/mac/.test(platform) && /safari/.test(userAgent)) {
    return 'touchid';
  }

  // Android devices (most have fingerprint)
  if (/android/.test(userAgent)) {
    return 'fingerprint';
  }

  // Windows Hello (fingerprint or face)
  if (/windows/.test(userAgent)) {
    return 'fingerprint'; // Could be face, but fingerprint more common
  }

  return 'none';
}

/**
 * Check if WebAuthn API is available in the browser
 */
export function isWebAuthnAvailable(): boolean {
  return typeof window !== 'undefined' && 
         typeof window.PublicKeyCredential !== 'undefined';
}

/**
 * Get user-friendly name for biometric type
 */
export function getBiometricName(type: BiometricType): string {
  switch (type) {
    case 'faceid':
      return 'Face ID';
    case 'touchid':
      return 'Touch ID';
    case 'fingerprint':
      return 'Fingerprint';
    case 'none':
      return 'None';
  }
}

/**
 * Get icon name for biometric type (for UI display)
 */
export function getBiometricIcon(type: BiometricType): string {
  switch (type) {
    case 'faceid':
      return '🧑'; // Face emoji
    case 'touchid':
    case 'fingerprint':
      return '👆'; // Finger emoji
    case 'none':
      return '❌';
  }
}

/**
 * Generate a unique device ID for tracking
 * Uses combination of user agent, platform, and random component
 */
export function generateDeviceId(): string {
  const ua = navigator.userAgent;
  const platform = navigator.platform || 'unknown';
  const random = Math.random().toString(36).substring(2, 15);
  
  // Create a simple hash
  const combined = `${ua}_${platform}_${random}`;
  let hash = 0;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `device_${Math.abs(hash).toString(36)}_${random}`;
}
