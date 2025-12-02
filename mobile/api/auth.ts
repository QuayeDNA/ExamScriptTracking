import { apiClient } from "@/lib/api-client";
import type {
  LoginCredentials,
  LoginResponse,
  ChangePasswordData,
  FirstTimePasswordData,
  User,
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
};
