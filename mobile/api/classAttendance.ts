import { apiClient } from "@/lib/api-client";

export interface AttendanceSession {
  id: string;
  deviceId: string;
  deviceName: string | null;
  sessionToken: string;
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
}

export interface ClassAttendanceRecord {
  id: string;
  sessionId: string;
  lecturerName?: string | null;
  courseName?: string | null;
  courseCode?: string | null;
  notes?: string | null;
  startTime: string;
  endTime?: string | null;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  totalStudents: number;
  students?: {
    id: string;
    studentId: string;
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
  }[];
}

export interface AttendanceRecordListResponse {
  records: ClassAttendanceRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const classAttendanceApi = {
  createOrGetSession: async (data: {
    deviceId: string;
    deviceName?: string;
  }): Promise<{ session: AttendanceSession }> => {
    return apiClient.post<{ session: AttendanceSession }>(
      "/class-attendance/sessions",
      data
    );
  },

  getSessionByToken: async (
    token: string
  ): Promise<
    { session: AttendanceSession } & { records?: ClassAttendanceRecord[] }
  > => {
    return apiClient.get(`/class-attendance/sessions/token/${token}`);
  },

  createRecord: async (data: {
    sessionId: string;
    lecturerName?: string;
    courseName?: string;
    courseCode?: string;
    notes?: string;
  }): Promise<{ record: ClassAttendanceRecord }> => {
    return apiClient.post("/class-attendance/records", data);
  },

  recordStudentAttendance: async (data: {
    recordId: string;
    studentId: string;
    studentData?: {
      indexNumber: string;
      name: string;
      program?: string;
      level?: string;
    };
  }): Promise<{ attendance: any; message: string }> => {
    return apiClient.post("/class-attendance/records/attendance", data);
  },

  endRecord: async (
    recordId: string
  ): Promise<{ record: ClassAttendanceRecord; message: string }> => {
    return apiClient.post(`/class-attendance/records/${recordId}/end`, {});
  },

  getSessionRecords: async (
    sessionId: string,
    params?: { page?: number; limit?: number }
  ): Promise<AttendanceRecordListResponse> => {
    const search = new URLSearchParams();
    if (params?.page) search.append("page", params.page.toString());
    if (params?.limit) search.append("limit", params.limit.toString());
    const qs = search.toString();
    return apiClient.get(
      `/class-attendance/sessions/${sessionId}/records${qs ? `?${qs}` : ""}`
    );
  },

  getRecord: async (id: string): Promise<{ record: ClassAttendanceRecord }> => {
    return apiClient.get(`/class-attendance/records/${id}`);
  },

  getAttendanceRecordById: async (
    recordId: string
  ): Promise<{ record: ClassAttendanceRecord }> => {
    return apiClient.get(`/class-attendance/records/${recordId}`);
  },

  getAutocompleteValues: async (): Promise<{
    lecturerNames: string[];
    courseNames: string[];
    courseCodes: string[];
  }> => {
    return apiClient.get("/class-attendance/autocomplete");
  },

  deleteRecord: async (recordId: string): Promise<{ message: string }> => {
    return apiClient.delete(`/class-attendance/records/${recordId}`);
  },

  confirmAttendance: async (
    attendanceId: string
  ): Promise<{ message: string; attendance: any }> => {
    return apiClient.post("/class-attendance/records/attendance/confirm", {
      attendanceId,
    });
  },
};
