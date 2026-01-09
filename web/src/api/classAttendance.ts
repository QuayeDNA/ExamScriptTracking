import { apiClient } from "@/lib/api-client";
import type {
  ValidateLinkResponse,
  SelfMarkAttendanceRequest,
  SelfMarkAttendanceResponse,
  AttendanceHistoryResponse,
  AttendanceHistoryFilters,
  ActiveSessionsResponse,
  SessionDetailsResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  GenerateLinkRequest,
  GenerateLinkResponse,
  ActiveLinksResponse,
  AttendanceAnalyticsResponse,
  AnalyticsFilters,
} from "@/types";

export const classAttendanceApi = {
  // Student Self-Service Endpoints

  /**
   * Validate an attendance link
   */
  validateAttendanceLink: async (
    token: string,
    lat?: number,
    lng?: number
  ): Promise<ValidateLinkResponse> => {
    const params = new URLSearchParams();
    if (lat !== undefined) params.append('lat', lat.toString());
    if (lng !== undefined) params.append('lng', lng.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<ValidateLinkResponse>(`/attendance/links/${token}/validate${query}`, {
      skipAuth: true
    });
  },

  /**
   * Self-mark attendance using a link
   */
  selfMarkAttendance: async (
    data: SelfMarkAttendanceRequest
  ): Promise<SelfMarkAttendanceResponse> => {
    return apiClient.post<SelfMarkAttendanceResponse>('/attendance/self-mark', data, {
      skipAuth: true
    });
  },

  /**
   * Lookup student by index number (for self-mark flow)
   * This is a public endpoint that returns minimal student info
   */
  lookupStudentByIndex: async (indexNumber: string): Promise<{ id: string; indexNumber: string; firstName: string; lastName: string }> => {
    // Use the existing student QR endpoint which is public
    const student = await apiClient.get<{ id: string; indexNumber: string; firstName: string; lastName: string }>(
      `/students/qr?indexNumber=${encodeURIComponent(indexNumber)}`,
      { skipAuth: true }
    );
    return student;
  },

  /**
   * Get attendance history for authenticated user
   */
  getAttendanceHistory: async (
    filters: AttendanceHistoryFilters = {}
  ): Promise<AttendanceHistoryResponse> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.courseCode) params.append('courseCode', filters.courseCode);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<AttendanceHistoryResponse>(`/attendance/history${query}`);
  },

  // Admin Dashboard Endpoints

  /**
   * Get all active attendance sessions
   */
  getActiveSessions: async (): Promise<ActiveSessionsResponse> => {
    return apiClient.get<ActiveSessionsResponse>('/attendance/sessions/active');
  },

  /**
   * Get detailed information about a specific session
   */
  getSessionDetails: async (sessionId: string): Promise<SessionDetailsResponse> => {
    return apiClient.get<SessionDetailsResponse>(`/attendance/sessions/${sessionId}`);
  },

  /**
   * Export session attendance data as CSV
   */
  exportSessionData: async (sessionId: string): Promise<Blob> => {
    return apiClient.getBlob(`/attendance/sessions/${sessionId}/export`);
  },

  /**
   * Create a new attendance session
   */
  createSession: async (data: CreateSessionRequest): Promise<CreateSessionResponse> => {
    return apiClient.post<CreateSessionResponse>('/attendance/sessions', data);
  },

  /**
   * End an active attendance session
   */
  endSession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post(`/attendance/sessions/${sessionId}/end`);
  },

  /**
   * Generate a new attendance link for a session
   */
  generateAttendanceLink: async (
    sessionId: string,
    data: GenerateLinkRequest
  ): Promise<GenerateLinkResponse> => {
    return apiClient.post<GenerateLinkResponse>(`/attendance/sessions/${sessionId}/links`, data);
  },

  /**
   * Get all active links for a session
   */
  getActiveLinks: async (sessionId: string): Promise<ActiveLinksResponse> => {
    return apiClient.get<ActiveLinksResponse>(`/attendance/sessions/${sessionId}/links`);
  },

  /**
   * Revoke/deactivate an attendance link
   */
  revokeLink: async (token: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete(`/attendance/links/${token}`);
  },

  /**
   * Export attendance data across multiple sessions
   */
  exportAttendanceData: async (filters: {
    startDate?: string;
    endDate?: string;
    courseCode?: string;
    lecturerId?: string;
  } = {}): Promise<Blob> => {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.courseCode) params.append('courseCode', filters.courseCode);
    if (filters.lecturerId) params.append('lecturerId', filters.lecturerId);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.getBlob(`/attendance/sessions/export${query}`);
  },

  /**
   * Get attendance analytics
   */
  getAttendanceAnalytics: async (filters: AnalyticsFilters): Promise<AttendanceAnalyticsResponse> => {
    const params = new URLSearchParams();

    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);
    if (filters.courseCode) params.append('courseCode', filters.courseCode);
    if (filters.lecturerId) params.append('lecturerId', filters.lecturerId);
    if (filters.groupBy) params.append('groupBy', filters.groupBy);

    const query = `?${params.toString()}`;
    return apiClient.get<AttendanceAnalyticsResponse>(`/attendance/sessions/analytics${query}`);
  },
};