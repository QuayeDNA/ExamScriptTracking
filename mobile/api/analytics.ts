/**
 * Analytics API Client for Mobile
 * Provides analytics and activity data for the mobile app
 */

import { apiClient } from "@/lib/api-client";

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

/**
 * Get recent activity for the logged-in user
 */
export const getUserActivity = async (): Promise<UserActivityResponse> => {
  const response = await apiClient.get("/analytics/user-activity");
  return response as UserActivityResponse;
};

/**
 * Clear all recent activity for the logged-in user
 */
export const clearUserActivity = async (): Promise<{
  message: string;
  deletedCount: number;
}> => {
  const response = await apiClient.delete("/analytics/user-activity");
  return response as { message: string; deletedCount: number };
};
