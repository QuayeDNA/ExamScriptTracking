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
   * GET /api/class-attendance/links/validate?token=ABC123
   */
  validateLink: async (token: string): Promise<ValidateLinkResponse> => {
    return apiClient.get<ValidateLinkResponse>(
      `/class-attendance/links/validate?token=${encodeURIComponent(token)}`
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
   * Lookup student by index number
   * GET /api/students/lookup?indexNumber=20230001
   */
  lookupStudent: async (
    indexNumber: string
  ): Promise<StudentLookupResponse> => {
    return apiClient.get<StudentLookupResponse>(
      `/students/lookup?indexNumber=${encodeURIComponent(indexNumber)}`
    );
  },

  /**
   * Record attendance via biometric verification
   * POST /api/class-attendance/record/biometric
   */
  recordBiometric: async (data: {
    recordId: string;
    biometricHash: string;
    biometricConfidence: number;
    deviceId: string;
    location?: { lat: number; lng: number };
  }): Promise<RecordAttendanceResponse> => {
    return apiClient.post<RecordAttendanceResponse>(
      "/class-attendance/record/biometric",
      data
    );
  },

  /**
   * Record attendance via QR code self-scan
   * POST /api/class-attendance/record/qr
   */
  recordQR: async (data: {
    recordId: string;
    qrData: string;
    location?: { lat: number; lng: number };
  }): Promise<RecordAttendanceResponse> => {
    return apiClient.post<RecordAttendanceResponse>(
      "/class-attendance/record/qr",
      data
    );
  },

  /**
   * Record attendance via manual index number entry
   * POST /api/class-attendance/record/index
   */
  recordManual: async (data: {
    recordId: string;
    indexNumber: string;
    location?: { lat: number; lng: number };
  }): Promise<RecordAttendanceResponse> => {
    return apiClient.post<RecordAttendanceResponse>(
      "/class-attendance/record/index",
      data
    );
  },

  /**
   * Enroll student biometric (self-service)
   * POST /api/class-attendance/biometric/enroll
   */
  enrollBiometric: async (data: {
    studentId: string;
    biometricHash: string;
    deviceId: string;
    provider: string;
  }): Promise<{
    success: boolean;
    student: {
      id: string;
      indexNumber: string;
      firstName: string;
      lastName: string;
    };
    biometric: {
      enrolledAt: string;
      provider: string;
    };
  }> => {
    return apiClient.post("/class-attendance/biometric/enroll", data);
  },
};
