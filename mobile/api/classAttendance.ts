import { apiClient } from "@/lib/api-client";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type RecordingStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type ClassAttendanceStatus = "PRESENT" | "LATE" | "EXCUSED";
export type AttendanceMethod =
  | "QR_CODE"
  | "MANUAL_INDEX"
  | "BIOMETRIC_FINGERPRINT"
  | "BIOMETRIC_FACE";

export interface AttendanceSession {
  id: string;
  deviceId: string;
  deviceName?: string;
  sessionToken: string;
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
  attendanceRecords: ClassAttendanceRecord[];
}

export interface ClassAttendanceRecord {
  id: string;
  sessionId: string;
  userId?: string;
  lecturerName?: string;
  courseName?: string;
  courseCode?: string;
  startTime: string;
  endTime?: string;
  status: RecordingStatus;
  totalStudents: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  students: ClassAttendance[];
}

export interface ClassAttendance {
  id: string;
  recordId: string;
  studentId: string;
  scanTime: string;
  status: ClassAttendanceStatus;
  lecturerConfirmed: boolean;
  confirmedAt?: string;
  verificationMethod?: AttendanceMethod;
  deviceId?: string;
  linkTokenUsed?: string;
  biometricConfidence?: number;
  student: {
    id: string;
    indexNumber: string;
    firstName: string;
    lastName: string;
    program: string;
    level: number;
  };
}

export interface AttendanceLink {
  id: string;
  recordId?: string;
  linkToken: string;
  createdBy: string;
  studentId?: string;
  enrollmentToken?: string;
  linkType: "ATTENDANCE" | "BIOMETRIC_ENROLLMENT";
  geolocation?: {
    lat: number;
    lng: number;
    radius: number;
  };
  networkIdentifier?: string;
  expiresAt: string;
  maxUses?: number;
  usesCount: number;
  isActive: boolean;
  deactivatedAt?: string;
  createdAt: string;
}

export interface AttendanceStats {
  totalRecords: number;
  totalStudents: number;
  averageAttendanceRate: number;
  byStatus: Record<ClassAttendanceStatus, number>;
  byCourse: Array<{
    courseCode: string;
    courseName: string;
    sessions: number;
    totalStudents: number;
    attendanceRate: number;
  }>;
}

export interface StudentAttendanceHistory {
  studentId: string;
  student: {
    indexNumber: string;
    firstName: string;
    lastName: string;
    program: string;
  };
  records: Array<{
    id: string;
    courseCode: string;
    courseName: string;
    scanTime: string;
    status: ClassAttendanceStatus;
    verificationMethod?: AttendanceMethod;
  }>;
  totalAttended: number;
  totalSessions: number;
  attendanceRate: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface StartSessionRequest {
  deviceId: string;
  deviceName?: string;
  courseCode: string;
  courseName?: string;
  lecturerName?: string;
  notes?: string;
  totalRegisteredStudents?: number;
}

export interface StartSessionResponse {
  message: string;
  record: ClassAttendanceRecord;
  session: {
    id: string;
    deviceId: string;
    sessionToken: string;
  };
}

export interface EndSessionRequest {
  recordId: string;
}

export interface EndSessionResponse {
  message: string;
  record: ClassAttendanceRecord;
  summary: {
    totalRecorded: number;
    presentCount: number;
    lateCount: number;
    excusedCount: number;
    duration: string;
  };
}

export interface RecordAttendanceByQRRequest {
  recordId: string;
  qrCode: string;
  deviceId: string;
  status?: ClassAttendanceStatus;
}

export interface RecordAttendanceByIndexRequest {
  recordId: string;
  indexNumber: string;
  verificationMethod: AttendanceMethod;
  status?: ClassAttendanceStatus;
}

export interface RecordAttendanceByBiometricRequest {
  recordId: string;
  studentId: string;
  biometricData: string;
  biometricConfidence: number;
  biometricType: "BIOMETRIC_FINGERPRINT" | "BIOMETRIC_FACE";
}

export interface RecordAttendanceResponse {
  message: string;
  attendance: ClassAttendance;
  student: {
    id: string;
    indexNumber: string;
    firstName: string;
    lastName: string;
  };
  biometric?: {
    confidence: number;
    method: string;
  };
}

export interface GenerateLinkRequest {
  recordId?: string;
  expiresInMinutes?: number;
  maxUses?: number;
  geolocation?: {
    lat: number;
    lng: number;
    radius: number;
  };
  requiresAuth?: boolean;
}

export interface GenerateLinkResponse {
  message: string;
  link: {
    id: string;
    token: string;
    url: string;
    expiresAt: string;
    maxUses?: number;
  };
}

export interface EnrollBiometricRequest {
  studentId: string;
  biometricData: string;
  biometricType: "BIOMETRIC_FINGERPRINT" | "BIOMETRIC_FACE";
  deviceId: string;
}

export interface EnrollBiometricResponse {
  message: string;
  student: {
    id: string;
    indexNumber: string;
    hasBiometric: boolean;
  };
}

export interface SessionLiveStats {
  sessionId: string;
  courseCode: string;
  courseName?: string;
  status: RecordingStatus;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  statistics: {
    totalRecorded: number;
    presentCount: number;
    lateCount: number;
    excusedCount: number;
    totalRegisteredStudents: number;
    attendanceRate: number | null;
  };
  methodBreakdown: {
    biometric: number;
    biometricPercent: number;
    qrCode: number;
    qrPercent: number;
    manual: number;
    manualPercent: number;
  };
  peakAttendance: {
    hour: string;
    count: number;
    attendanceByHour: Record<string, number>;
  };
  recentAttendance: Array<{
    studentId: string;
    studentName: string;
    indexNumber?: string;
    scanTime: string;
    verificationMethod?: AttendanceMethod;
    status: ClassAttendanceStatus;
  }>;
}

// ============================================================================
// API CLIENT
// ============================================================================

export const classAttendanceApi = {
  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Start a new attendance recording session
   */
  startSession: async (
    data: StartSessionRequest
  ): Promise<StartSessionResponse> => {
    return apiClient.post<StartSessionResponse>(
      "/class-attendance/sessions/start",
      data
    );
  },

  /**
   * End an active attendance session
   */
  endSession: async (data: EndSessionRequest): Promise<EndSessionResponse> => {
    return apiClient.post<EndSessionResponse>(
      "/class-attendance/sessions/end",
      data
    );
  },

  /**
   * Get all active attendance sessions
   */
  getActiveSessions: async (): Promise<{ sessions: ClassAttendanceRecord[] }> => {
    return apiClient.get<{ sessions: ClassAttendanceRecord[] }>(
      "/class-attendance/sessions/active"
    );
  },

  /**
   * Get details of a specific attendance session
   */
  getSession: async (
    recordId: string
  ): Promise<{ record: ClassAttendanceRecord }> => {
    return apiClient.get<{ record: ClassAttendanceRecord }>(
      `/class-attendance/sessions/${recordId}`
    );
  },

  /**
   * Get live statistics for a specific attendance session
   */
  getSessionLiveStats: async (
    recordId: string
  ): Promise<SessionLiveStats> => {
    return apiClient.get<SessionLiveStats>(
      `/class-attendance/sessions/${recordId}/live-stats`
    );
  },

  // ============================================================================
  // ATTENDANCE RECORDING
  // ============================================================================

  /**
   * Record attendance via QR code scan
   */
  recordAttendanceByQR: async (
    data: RecordAttendanceByQRRequest
  ): Promise<RecordAttendanceResponse> => {
    return apiClient.post<RecordAttendanceResponse>(
      "/class-attendance/record/qr",
      data
    );
  },

  /**
   * Record attendance via manual index number entry
   */
  recordAttendanceByIndex: async (
    data: RecordAttendanceByIndexRequest
  ): Promise<RecordAttendanceResponse> => {
    return apiClient.post<RecordAttendanceResponse>(
      "/class-attendance/record/index",
      data
    );
  },

  /**
   * Record attendance via biometric verification
   */
  recordAttendanceByBiometric: async (
    data: RecordAttendanceByBiometricRequest
  ): Promise<RecordAttendanceResponse> => {
    return apiClient.post<RecordAttendanceResponse>(
      "/class-attendance/record/biometric",
      data
    );
  },

  // ============================================================================
  // ATTENDANCE QUERIES
  // ============================================================================

  /**
   * Get attendance history with filters
   */
  getAttendanceHistory: async (params?: {
    courseCode?: string;
    startDate?: string;
    endDate?: string;
    status?: RecordingStatus;
    limit?: number;
    offset?: number;
  }): Promise<{
    records: ClassAttendanceRecord[];
    total: number;
    limit: number;
    offset: number;
  }> => {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return apiClient.get<{
      records: ClassAttendanceRecord[];
      total: number;
      limit: number;
      offset: number;
    }>(`/class-attendance/history${queryString ? `?${queryString}` : ""}`);
  },

  /**
   * Get student's attendance history
   */
  getStudentHistory: async (
    studentId: string
  ): Promise<StudentAttendanceHistory> => {
    return apiClient.get<StudentAttendanceHistory>(
      `/class-attendance/students/${studentId}/history`
    );
  },

  // ============================================================================
  // SELF-SERVICE LINKS
  // ============================================================================

  /**
   * Generate a self-service attendance link
   */
  generateAttendanceLink: async (
    data: GenerateLinkRequest
  ): Promise<GenerateLinkResponse> => {
    return apiClient.post<GenerateLinkResponse>(
      "/class-attendance/links/generate",
      data
    );
  },

  /**
   * Get active attendance links for a session
   */
  getActiveLinks: async (
    recordId: string
  ): Promise<{ links: Array<{ id: string; token: string; url: string; expiresAt: string; maxUses?: number; usageCount: number; geolocation: any; createdAt: string; }> }> => {
    return apiClient.get<{ links: Array<{ id: string; token: string; url: string; expiresAt: string; maxUses?: number; usageCount: number; geolocation: any; createdAt: string; }> }>(
      `/class-attendance/sessions/${recordId}/links`
    );
  },

  /**
   * Deactivate an attendance link
   */
  deactivateLink: async (
    linkId: string
  ): Promise<{ message: string; link: AttendanceLink }> => {
    return apiClient.patch<{ message: string; link: AttendanceLink }>(
      `/class-attendance/links/${linkId}/deactivate`,
      {}
    );
  },

  // ============================================================================
  // BIOMETRIC ENROLLMENT
  // ============================================================================

  /**
   * Enroll student biometric data
   */
  enrollBiometric: async (
    data: EnrollBiometricRequest
  ): Promise<EnrollBiometricResponse> => {
    return apiClient.post<EnrollBiometricResponse>(
      "/class-attendance/biometric/enroll",
      data
    );
  },

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  /**
   * Get attendance statistics
   */
  getAttendanceStats: async (params?: {
    startDate?: string;
    endDate?: string;
    courseCode?: string;
  }): Promise<AttendanceStats> => {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return apiClient.get<AttendanceStats>(
      `/class-attendance/stats${queryString ? `?${queryString}` : ""}`
    );
  },

  /**
   * Get lecturer's attendance statistics
   */
  getLecturerStats: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalSessions: number;
    totalStudentsRecorded: number;
    averageAttendanceRate: number;
    byCourse: Array<{
      courseCode: string;
      courseName: string;
      sessions: number;
      totalStudents: number;
      attendanceRate: number;
    }>;
  }> => {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return apiClient.get(
      `/class-attendance/analytics/stats${queryString ? `?${queryString}` : ""}`
    );
  },
};
