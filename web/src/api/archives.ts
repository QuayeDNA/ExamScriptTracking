// ============================================================================
// ARCHIVE API CLIENT
// ============================================================================

import { apiClient } from "@/lib/api-client";
import type {
  CreateArchiveRequest,
  UpdateArchiveRequest,
  AddSessionsToArchiveRequest,
  ArchiveResponse,
  ArchiveListResponse,
  ArchiveSummary,
} from "@/types";

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
    data: UpdateArchiveRequest
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
    data: AddSessionsToArchiveRequest
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