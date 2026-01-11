// ============================================================================
// ARCHIVE API CLIENT - MOBILE
// ============================================================================

import { apiClient } from "@/lib/api-client";

export interface CreateArchiveRequest {
  name: string;
  description?: string;
  sessionIds: string[];
}

export interface ArchiveResponse {
  id: string;
  name: string;
  description?: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  sessionCount: number;
  sessions: {
    id: string;
    courseCode: string;
    courseName: string;
    status: string;
    isArchived: boolean;
    examDate: string;
  }[];
}

export interface ArchiveListResponse {
  archives: (ArchiveResponse & { sessionCount: number })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ArchiveSummary {
  id: string;
  name: string;
  description?: string;
  createdBy: {
    id: string;
    firstName: string;
  };
  createdAt: string;
  sessionCount: number;
}

export const archiveApi = {
  // Create new archive with sessions
  createArchive: async (data: CreateArchiveRequest): Promise<ArchiveResponse> => {
    return apiClient.post("/archives", data);
  },

  // Get all archives (paginated)
  getArchives: async (page = 1, limit = 10): Promise<ArchiveListResponse> => {
    return apiClient.get(`/archives?page=${page}&limit=${limit}`);
  },

  // Get single archive
  getArchive: async (id: string): Promise<{ archive: ArchiveResponse }> => {
    return apiClient.get(`/archives/${id}`);
  },

  // Update archive
  updateArchive: async (
    id: string,
    data: { name?: string; description?: string }
  ): Promise<{ message: string; archive: ArchiveSummary }> => {
    return apiClient.put(`/archives/${id}`, data);
  },

  // Delete archive
  deleteArchive: async (id: string): Promise<{ message: string; unarchivedSessions: number }> => {
    return apiClient.delete(`/archives/${id}`);
  },

  // Add sessions to existing archive
  addSessionsToArchive: async (
    id: string,
    data: { sessionIds: string[] }
  ): Promise<{ message: string; archive: ArchiveSummary }> => {
    return apiClient.post(`/archives/${id}/sessions`, data);
  },

  // Remove session from archive
  removeSessionFromArchive: async (
    archiveId: string,
    sessionId: string
  ): Promise<{ message: string }> => {
    return apiClient.delete(`/archives/${archiveId}/sessions/${sessionId}`);
  },
};