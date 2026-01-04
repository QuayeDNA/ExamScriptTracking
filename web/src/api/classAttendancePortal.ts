import { apiClient } from "@/lib/api-client";

// ========================================
// TYPES & INTERFACES
// ========================================

export interface SessionInfo {
  id: string;
  courseCode: string;
  courseName: string;
  lecturerName: string;
  venue: string;
  startTime: string;
  status: string;
}

export interface ValidateLinkResponse {
  valid: boolean;
  session: SessionInfo | null;
  error?: string;
}

export interface BiometricStatusResponse {
  enrolled: boolean;
  provider?: string;
  enrolledAt?: string;
}

export interface StudentLookupResponse {
  id: string;
  indexNumber: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  program: string;
  level: number;
}

export interface RecordAttendanceResponse {
  success: boolean;
  message: string;
  attendance: {
    id: string;
    studentId: string;
    studentName: string;
    verificationMethod: string;
    scanTime: string;
    confidence?: number;
  };
}

// ========================================
// CLASS ATTENDANCE PORTAL API
// ========================================

export const classAttendancePortalApi = {
  /**
   * Validate session link token
   * POST /api/class-attendance/links/validate
   * Body: { token, studentLocation?: { lat, lng } }
   */
  validateLink: async (
    token: string, 
    studentLocation?: { lat: number; lng: number }
  ): Promise<ValidateLinkResponse> => {
    return apiClient.post<ValidateLinkResponse>(
      `/class-attendance/links/validate`,
      { token, studentLocation }
    );
  },

  /**
   * Get biometric enrollment status for a student
   * GET /api/students/:id/biometric-status
   */
  getBiometricStatus: async (
    studentId: string
  ): Promise<BiometricStatusResponse> => {
    return apiClient.get<BiometricStatusResponse>(
      `/students/${studentId}/biometric-status`
    );
  },

  /**
   * Lookup student by index number (PUBLIC)
   * POST /api/public/attendance/lookup-student
   * Body: { token, indexNumber }
   */
  lookupStudent: async (
    token: string,
    indexNumber: string
  ): Promise<StudentLookupResponse> => {
    return apiClient.post<StudentLookupResponse>(
      `/public/attendance/lookup-student`,
      { token, indexNumber }
    );
  },

  /**
   * Record attendance via biometric verification (PUBLIC - NOW WITH WEBAUTHN)
   * POST /api/public/attendance/record-biometric
   */
  recordBiometric: async (data: {
    token: string;
    indexNumber: string;
    biometricHash: string;
    biometricConfidence: number;
    deviceId: string;
    location?: { lat: number; lng: number };
    // NEW: WebAuthn fields for REAL verification
    credentialId?: string;
    signature?: string;
    authenticatorData?: string;
    clientDataJSON?: string;
  }): Promise<RecordAttendanceResponse> => {
    return apiClient.post<RecordAttendanceResponse>(
      "/public/attendance/record-biometric",
      data
    );
  },

  /**
   * Record attendance via QR code self-scan (PUBLIC)
   * POST /api/public/attendance/record-qr
   */
  recordQR: async (data: {
    token: string;
    indexNumber: string;
    qrData: string;
    location?: { lat: number; lng: number };
  }): Promise<RecordAttendanceResponse> => {
    return apiClient.post<RecordAttendanceResponse>(
      "/public/attendance/record-qr",
      data
    );
  },

  /**
   * Record attendance via manual index number entry (PUBLIC)
   * POST /api/public/attendance/record-manual
   */
  recordManual: async (data: {
    token: string;
    indexNumber: string;
    location?: { lat: number; lng: number };
  }): Promise<RecordAttendanceResponse> => {
    return apiClient.post<RecordAttendanceResponse>(
      "/public/attendance/record-manual",
      data
    );
  },
};
