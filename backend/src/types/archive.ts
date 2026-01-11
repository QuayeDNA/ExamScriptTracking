// ============================================================================
// ARCHIVE TYPES
// ============================================================================

export interface CreateArchiveRequest {
  name: string;
  description?: string;
  sessionIds: string[];
}

export interface UpdateArchiveRequest {
  name?: string;
  description?: string;
}

export interface AddSessionsToArchiveRequest {
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
    lastName: string;
  };
  createdAt: string;
  sessionCount: number;
}