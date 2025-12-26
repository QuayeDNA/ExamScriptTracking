import { apiClient } from "@/lib/api-client";
import type { Role } from "@/types";

export interface CreateSessionRequest {
  expiresInMinutes: number;
  department: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  qrToken: string;
  expiresAt: string;
  qrCodeData: {
    type: "REGISTRATION";
    token: string;
    department: string;
    expiresAt: string;
  };
}

export interface RegistrationSession {
  id: string;
  qrToken: string;
  department: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface GetSessionsResponse {
  sessions: RegistrationSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RegisterWithQRRequest {
  qrToken: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
}

export interface RegisterWithQRResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    department: string;
    role: Role;
    isSuperAdmin: boolean;
    isActive: boolean;
    passwordChanged: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export const registrationApi = {
  createSession: async (
    expiresInMinutes: number,
    department: string
  ): Promise<CreateSessionResponse> => {
    return apiClient.post<CreateSessionResponse>(
      "/registration/create-session",
      {
        expiresInMinutes,
        department,
      }
    );
  },

  getSessions: async (page = 1, limit = 20): Promise<GetSessionsResponse> => {
    return apiClient.get<GetSessionsResponse>(
      `/registration/sessions?page=${page}&limit=${limit}`
    );
  },

  register: async (
    data: RegisterWithQRRequest
  ): Promise<RegisterWithQRResponse> => {
    return apiClient.post<RegisterWithQRResponse>(
      "/registration/register",
      data
    );
  },
};
