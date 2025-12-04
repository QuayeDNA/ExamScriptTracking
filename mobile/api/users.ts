import { apiClient } from "@/lib/api-client";

// Types
export interface Handler {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  passwordChanged: boolean;
  createdAt: string;
  updatedAt?: string;
}

// API Functions

/**
 * Get all active handlers (for transfer selection)
 * Handlers include: INVIGILATOR, LECTURER, DEPARTMENT_HEAD, FACULTY_OFFICER
 */
export const getHandlers = async (): Promise<{
  handlers: Handler[];
  count: number;
}> => {
  return apiClient.get<{ handlers: Handler[]; count: number }>(
    "/users/handlers"
  );
};

/**
 * Get all users (admin only)
 */
export const getUsers = async (filters?: {
  role?: string;
  isActive?: boolean;
  search?: string;
}): Promise<{ users: User[] }> => {
  const params = new URLSearchParams();
  if (filters?.role) params.append("role", filters.role);
  if (filters?.isActive !== undefined)
    params.append("isActive", filters.isActive.toString());
  if (filters?.search) params.append("search", filters.search);

  const queryString = params.toString();
  const url = `/users${queryString ? `?${queryString}` : ""}`;

  return apiClient.get<{ users: User[] }>(url);
};

/**
 * Get single user by ID
 */
export const getUser = async (id: string): Promise<{ user: User }> => {
  return apiClient.get<{ user: User }>(`/users/${id}`);
};
