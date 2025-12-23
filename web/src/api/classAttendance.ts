import { apiClient } from "@/lib/api-client";

export interface AttendanceSession {
  id: string;
  deviceId: string;
  deviceName: string | null;
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
  totalRecordings: number;
}

export interface AttendanceSessionsResponse {
  sessions: AttendanceSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UpdateAttendanceSessionData {
  deviceName?: string;
  isActive?: boolean;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  lecturerName: string | null;
  courseName: string | null;
  courseCode: string | null;
  notes: string | null;
  status: string;
  totalStudents: number;
  startTime: string;
  endTime: string | null;
  session?: {
    id: string;
    deviceId: string;
    deviceName: string | null;
  };
  students?: Array<{
    id: string;
    studentId: string;
    recordId: string;
    scanTime: string;
    lecturerConfirmed: boolean;
    confirmedAt?: string;
    student: {
      id: string;
      indexNumber: string;
      firstName: string;
      lastName: string;
      program?: string | null;
      level?: number | null;
    };
  }>;
}

export interface AttendanceRecordsResponse {
  records: AttendanceRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const classAttendanceApi = {
  getAttendanceSessions: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<AttendanceSessionsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.isActive !== undefined)
      queryParams.append("isActive", params.isActive.toString());

    const queryString = queryParams.toString();
    return apiClient.get<AttendanceSessionsResponse>(
      `/class-attendance/admin/sessions${queryString ? `?${queryString}` : ""}`
    );
  },

  updateAttendanceSession: async (
    id: string,
    data: UpdateAttendanceSessionData
  ): Promise<{ session: AttendanceSession }> => {
    return apiClient.patch<{ session: AttendanceSession }>(
      `/class-attendance/admin/sessions/${id}`,
      data
    );
  },

  getAttendanceRecords: async (
    sessionId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<AttendanceRecordsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get<AttendanceRecordsResponse>(
      `/class-attendance/sessions/${sessionId}/records${
        queryString ? `?${queryString}` : ""
      }`
    );
  },

  getAttendanceRecordById: async (
    recordId: string
  ): Promise<{ record: AttendanceRecord }> => {
    return apiClient.get<{ record: AttendanceRecord }>(
      `/class-attendance/records/${recordId}`
    );
  },

  confirmAttendance: async (
    attendanceId: string
  ): Promise<{ message: string; attendance: any }> => {
    return apiClient.post("/class-attendance/records/attendance/confirm", {
      attendanceId,
    });
  },
};
