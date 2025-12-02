import { apiClient } from "@/lib/api-client";
import type {
  LoginCredentials,
  LoginResponse,
  ChangePasswordData,
  FirstTimePasswordData,
  User,
  SessionsResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  AdminResetPasswordResponse,
  AuditLogsResponse,
  AuditLogFilters,
  PasswordResetRequest,
  PasswordResetResponse,
  PasswordResetWithTokenRequest,
  PasswordResetWithTokenResponse,
} from "@/types";

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>("/auth/login", credentials);
  },

  logout: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>("/auth/logout");
  },

  getProfile: async (): Promise<{ user: User }> => {
    return apiClient.get<{ user: User }>("/auth/profile");
  },

  changePassword: async (
    data: ChangePasswordData
  ): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>("/auth/change-password", data);
  },

  firstTimePasswordChange: async (
    data: FirstTimePasswordData
  ): Promise<{ message: string; token: string; refreshToken: string }> => {
    return apiClient.post<{
      message: string;
      token: string;
      refreshToken: string;
    }>("/auth/first-time-password", data);
  },

  refreshToken: async (
    data: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> => {
    return apiClient.post<RefreshTokenResponse>("/auth/refresh-token", data);
  },

  getSessions: async (): Promise<SessionsResponse> => {
    return apiClient.get<SessionsResponse>("/auth/sessions");
  },

  revokeSession: async (sessionId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/auth/sessions/${sessionId}`);
  },

  logoutAllSessions: async (): Promise<{ message: string; count: number }> => {
    return apiClient.post<{ message: string; count: number }>(
      "/auth/logout-all"
    );
  },

  unlockUserAccount: async (userId: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(
      `/auth/unlock-account/${userId}`
    );
  },

  adminResetPassword: async (
    userId: string
  ): Promise<AdminResetPasswordResponse> => {
    return apiClient.post<AdminResetPasswordResponse>(
      `/auth/admin-reset-password/${userId}`
    );
  },

  forceLogoutUser: async (
    userId: string
  ): Promise<{ message: string; count: number }> => {
    return apiClient.post<{ message: string; count: number }>(
      `/auth/force-logout/${userId}`
    );
  },

  getAuditLogs: async (
    filters?: AuditLogFilters
  ): Promise<AuditLogsResponse> => {
    return apiClient.get<AuditLogsResponse>("/auth/audit-logs", {
      params: filters,
    });
  },

  requestPasswordReset: async (
    data: PasswordResetRequest
  ): Promise<PasswordResetResponse> => {
    return apiClient.post<PasswordResetResponse>(
      "/auth/request-password-reset",
      data
    );
  },

  resetPasswordWithToken: async (
    data: PasswordResetWithTokenRequest
  ): Promise<PasswordResetWithTokenResponse> => {
    return apiClient.post<PasswordResetWithTokenResponse>(
      "/auth/reset-password",
      data
    );
  },
};
