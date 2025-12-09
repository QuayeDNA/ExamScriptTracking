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
};
