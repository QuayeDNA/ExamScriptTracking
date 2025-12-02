import { apiClient } from "@/lib/api-client";
import type {
  User,
  CreateUserData,
  CreateUserResponse,
  UpdateUserData,
  UsersListResponse,
  HandlersListResponse,
  UserFilters,
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
};
