import { apiClient } from "@/lib/api-client";
import type {
  User,
  CreateUserData,
  CreateUserResponse,
  UpdateUserData,
  UsersListResponse,
  HandlersListResponse,
  UserFilters,
  BulkUserCreate,
  BulkCreateResponse,
  BulkDeactivateRequest,
  BulkUpdateRolesRequest,
  BulkUpdateRolesResponse,
  UserStatistics,
  ProfilePictureUpdate,
  ProfilePictureResponse,
} from "@/types";

export const usersApi = {
  getUsers: async (filters?: UserFilters): Promise<UsersListResponse> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append("role", filters.role);
    if (filters?.isActive !== undefined)
      params.append("isActive", String(filters.isActive));
    if (filters?.search) params.append("search", filters.search);

    const queryString = params.toString();
    return apiClient.get<UsersListResponse>(
      `/users${queryString ? `?${queryString}` : ""}`
    );
  },

  getUser: async (id: string): Promise<{ user: User }> => {
    return apiClient.get<{ user: User }>(`/users/${id}`);
  },

  createUser: async (data: CreateUserData): Promise<CreateUserResponse> => {
    return apiClient.post<CreateUserResponse>("/users", data);
  },

  updateUser: async (
    id: string,
    data: UpdateUserData
  ): Promise<{ message: string; user: User }> => {
    return apiClient.put<{ message: string; user: User }>(`/users/${id}`, data);
  },

  deactivateUser: async (
    id: string
  ): Promise<{ message: string; user: User }> => {
    return apiClient.delete<{ message: string; user: User }>(`/users/${id}`);
  },

  reactivateUser: async (
    id: string
  ): Promise<{ message: string; user: User }> => {
    return apiClient.patch<{ message: string; user: User }>(
      `/users/${id}/reactivate`
    );
  },

  getHandlers: async (): Promise<HandlersListResponse> => {
    return apiClient.get<HandlersListResponse>("/users/handlers");
  },

  bulkCreateUsers: async (
    users: BulkUserCreate[]
  ): Promise<BulkCreateResponse> => {
    return apiClient.post<BulkCreateResponse>("/users/bulk/create", { users });
  },

  bulkDeactivateUsers: async (
    data: BulkDeactivateRequest
  ): Promise<{ message: string; count: number }> => {
    return apiClient.post<{ message: string; count: number }>(
      "/users/bulk/deactivate",
      data
    );
  },

  bulkUpdateRoles: async (
    data: BulkUpdateRolesRequest
  ): Promise<BulkUpdateRolesResponse> => {
    return apiClient.post<BulkUpdateRolesResponse>(
      "/users/bulk/update-roles",
      data
    );
  },

  uploadProfilePicture: async (
    data: ProfilePictureUpdate
  ): Promise<ProfilePictureResponse> => {
    return apiClient.post<ProfilePictureResponse>(
      "/users/profile-picture",
      data
    );
  },

  getStatistics: async (): Promise<UserStatistics> => {
    return apiClient.get<UserStatistics>("/users/statistics");
  },

  exportUsers: (filters?: {
    role?: string;
    isActive?: boolean;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): string => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const queryString = params.toString();
    return `${API_URL}/api/users/export${queryString ? `?${queryString}` : ""}`;
  },
};
