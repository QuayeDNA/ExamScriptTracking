import { apiClient } from "@/lib/api-client";

export interface CreateSessionRequest {
  expiresInMinutes: number;
}

export interface CreateSessionResponse {
  sessionId: string;
  qrToken: string;
  expiresAt: string;
  qrCodeData: {
    type: "REGISTRATION";
    token: string;
    expiresAt: string;
  };
}

export interface RegistrationSession {
  id: string;
  qrToken: string;
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

export const registrationApi = {
  createSession: async (
    expiresInMinutes: number
  ): Promise<CreateSessionResponse> => {
    return apiClient.post<CreateSessionResponse>(
      "/registration/create-session",
      {
        expiresInMinutes,
      }
    );
  },

  getSessions: async (page = 1, limit = 20): Promise<GetSessionsResponse> => {
    return apiClient.get<GetSessionsResponse>(
      `/registration/sessions?page=${page}&limit=${limit}`
    );
  },
};
