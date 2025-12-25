import { apiClient } from "@/lib/api-client";
import type {
  AnalyticsOverview,
  HandlerPerformance,
  DiscrepanciesResponse,
  ExamStatisticsResponse,
  DateRangeFilter,
  AnalyticsExportRequest,
} from "@/types";

export interface UserActivity {
  id: string;
  type: "audit" | "incident" | "transfer" | "attendance";
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

export interface UserActivityResponse {
  activities: UserActivity[];
  summary: {
    totalActivities: number;
    auditLogs: number;
    incidents: number;
    transfers: number;
    attendance: number;
  };
}

export const analyticsApi = {
  /**
   * Get analytics overview with trends
   */
  getOverview: async (
    filters?: DateRangeFilter
  ): Promise<AnalyticsOverview> => {
    const params = new URLSearchParams();
    if (filters?.startDate) {
      params.append("startDate", filters.startDate);
    }
    if (filters?.endDate) {
      params.append("endDate", filters.endDate);
    }

    return apiClient.get<AnalyticsOverview>(
      `/analytics/overview${params.toString() ? `?${params.toString()}` : ""}`
    );
  },

  /**
   * Get handler performance metrics
   */
  getHandlerPerformance: async (
    filters?: DateRangeFilter
  ): Promise<HandlerPerformance[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) {
      params.append("startDate", filters.startDate);
    }
    if (filters?.endDate) {
      params.append("endDate", filters.endDate);
    }

    return apiClient.get<HandlerPerformance[]>(
      `/analytics/handler-performance${
        params.toString() ? `?${params.toString()}` : ""
      }`
    );
  },

  /**
   * Get discrepancy reports
   */
  getDiscrepancies: async (
    filters?: DateRangeFilter
  ): Promise<DiscrepanciesResponse> => {
    const params = new URLSearchParams();
    if (filters?.startDate) {
      params.append("startDate", filters.startDate);
    }
    if (filters?.endDate) {
      params.append("endDate", filters.endDate);
    }

    return apiClient.get<DiscrepanciesResponse>(
      `/analytics/discrepancies${
        params.toString() ? `?${params.toString()}` : ""
      }`
    );
  },

  /**
   * Get exam statistics
   */
  getExamStats: async (
    filters?: DateRangeFilter
  ): Promise<ExamStatisticsResponse> => {
    const params = new URLSearchParams();
    if (filters?.startDate) {
      params.append("startDate", filters.startDate);
    }
    if (filters?.endDate) {
      params.append("endDate", filters.endDate);
    }

    return apiClient.get<ExamStatisticsResponse>(
      `/analytics/exam-stats${params.toString() ? `?${params.toString()}` : ""}`
    );
  },

  /**
   * Export analytics report (PDF or Excel)
   * Returns a blob for download
   */
  exportReport: async (request: AnalyticsExportRequest): Promise<Blob> => {
    const params = new URLSearchParams();
    if (request.startDate) {
      params.append("startDate", request.startDate);
    }
    if (request.endDate) {
      params.append("endDate", request.endDate);
    }

    // Map report types to correct endpoints
    const endpointMap = {
      overview: "analytics-overview",
      handlers: "handler-performance",
      discrepancies: "discrepancies",
      exams: "analytics-overview", // Use overview for exams as well
    };

    const endpoint = endpointMap[request.reportType];
    const queryString = params.toString() ? `?${params.toString()}` : "";

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/reports/export/${endpoint}${queryString}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to export report" }));
      throw new Error(error.error || "Failed to export report");
    }

    return response.blob();
  },

  /**
   * Helper to download exported report
   */
  downloadReport: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Export batch manifest PDF
   */
  exportBatchManifest: async (examSessionId: string): Promise<Blob> => {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/reports/export/batch-manifest/${examSessionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to export batch manifest" }));
      throw new Error(error.error || "Failed to export batch manifest");
    }

    return response.blob();
  },

  /**
   * Export attendance report PDF
   */
  exportAttendanceReport: async (examSessionId: string): Promise<Blob> => {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/reports/export/attendance/${examSessionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to export attendance report" }));
      throw new Error(error.error || "Failed to export attendance report");
    }

    return response.blob();
  },

  /**
   * Get user activity for the current user
   */
  getUserActivity: async (): Promise<UserActivityResponse> => {
    return apiClient.get<UserActivityResponse>("/analytics/user-activity");
  },

  /**
   * Clear user activity for the current user
   */
  clearUserActivity: async (): Promise<{
    message: string;
    deletedCount: number;
  }> => {
    return apiClient.delete("/analytics/user-activity");
  },
};
