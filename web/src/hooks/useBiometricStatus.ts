/* eslint-disable react-hooks/set-state-in-effect */
// ========================================
// BIOMETRIC STATUS HOOK
// Check if student is enrolled in biometric system
// ========================================

import { useState, useEffect, useCallback } from 'react';
import { classAttendancePortalApi, type BiometricStatusResponse } from '@/api/classAttendancePortal';
import { checkDeviceSupport } from '@/utils/biometric';

const CACHE_KEY = 'biometric_status_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedStatus {
  enrolled: boolean;
  provider?: string;
  enrolledAt?: string;
  cachedAt: number;
  indexNumber: string;
}

export interface BiometricStatus {
  enrolled: boolean;
  provider?: string;
  enrolledAt?: string;
  deviceSupported: boolean;
  deviceType?: string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to check biometric enrollment status
 * Combines API status check + device capability detection
 * Caches result in sessionStorage for performance
 * 
 * @param indexNumber Student's index number
 * @returns BiometricStatus object with enrollment status and device capability
 */
export function useBiometricStatus(indexNumber: string | null): BiometricStatus {
  const [status, setStatus] = useState<BiometricStatus>({enrolled: false, deviceSupported: false, loading: true, error: null, refetch: async () => {}});

  const fetchStatus = useCallback(async () => {
    if (!indexNumber) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: 'No index number provided',
      }));
      return;
    }

    setStatus(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check cache first
      const cached = getCachedStatus(indexNumber);
      if (cached) {
        // Use cached data but still check device support
        const deviceSupport = await checkDeviceSupport();
        
        setStatus(prev => ({
          ...prev,
          enrolled: cached.enrolled,
          provider: cached.provider,
          enrolledAt: cached.enrolledAt,
          deviceSupported: deviceSupport.supported && deviceSupport.platformAuthenticator,
          deviceType: deviceSupport.type,
          loading: false,
          error: null,
        }));
        return;
      }

      // Fetch from API if not cached
      // Don't call API for public attendance - it requires authentication
      // Just check device support and WebAuthn credentials locally
      const deviceSupport = await checkDeviceSupport();
      
      // Check if WebAuthn credentials exist locally (indicates enrollment)
      let enrolled = false;
      if (window.PublicKeyCredential && deviceSupport.platformAuthenticator) {
        try {
          enrolled = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch {
          enrolled = false;
        }
      }

      const statusData = {
        enrolled,
        provider: deviceSupport.type,
        enrolledAt: undefined,
      };

      // Cache the status
      setCachedStatus(indexNumber, statusData);

      setStatus(prev => ({
        ...prev,
        enrolled: statusData.enrolled,
        provider: statusData.provider,
        enrolledAt: statusData.enrolledAt,
        deviceSupported: deviceSupport.supported && deviceSupport.platformAuthenticator,
        deviceType: deviceSupport.type,
        loading: false,
        error: null,
      }));
    } catch (err) {
      const error = err as Error;
      console.error('[useBiometricStatus] Error:', error);
      
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to check biometric enrollment status',
      }));
    }
  }, [indexNumber]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Update refetch reference in state
  useEffect(() => {
    setStatus(prev => {
      if (prev.refetch !== fetchStatus) {
        return { ...prev, refetch: fetchStatus };
      }
      return prev;
    });
  }, [fetchStatus]);

  return status;
}

/**
 * Get cached biometric status from sessionStorage
 */
function getCachedStatus(indexNumber: string): CachedStatus | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached) as CachedStatus;
    
    // Check if cache is for the same student and not expired
    if (data.indexNumber !== indexNumber) return null;
    if (Date.now() - data.cachedAt > CACHE_DURATION) return null;

    return data;
  } catch (error) {
    console.error('Failed to retrieve cached status:', error);
    return null;
  }
}

/**
 * Cache biometric status in sessionStorage
 */
function setCachedStatus(
  indexNumber: string,
  status: BiometricStatusResponse
): void {
  try {
    const cacheData: CachedStatus = {
      enrolled: status.enrolled,
      provider: status.provider,
      enrolledAt: status.enrolledAt,
      cachedAt: Date.now(),
      indexNumber,
    };

    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache biometric status:', error);
  }
}

/**
 * Clear cached biometric status (useful after enrollment)
 */
export function clearBiometricStatusCache(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear biometric status cache:', error);
  }
}
