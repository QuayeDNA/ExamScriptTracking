import { apiClient } from "@/lib/api-client";

export type IncidentType =
  | "MISSING_SCRIPT"
  | "DAMAGED_SCRIPT"
  | "MALPRACTICE"
  | "STUDENT_ILLNESS"
  | "VENUE_ISSUE"
  | "COUNT_DISCREPANCY"
  | "LATE_SUBMISSION"
  | "OTHER";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentStatus =
  | "REPORTED"
  | "INVESTIGATING"
  | "RESOLVED"
  | "CLOSED"
  | "ESCALATED";

export interface Incident {
  id: string;
  incidentNumber: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  isConfidential: boolean;
  autoCreated: boolean;
  title: string;
  description: string;
  location?: string;
  reporterId: string;
  assigneeId?: string;
  studentId?: string;
  examSessionId?: string;
  attendanceId?: string;
  transferId?: string;
  incidentDate: string;
  reportedAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  metadata?: Record<string, unknown>;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  reporter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  student?: {
    id: string;
    indexNumber: string;
    firstName: string;
    lastName: string;
    program: string;
    level: number;
  };
  examSession?: {
    id: string;
    batchQrCode: string;
    courseCode: string;
    courseName: string;
  };
  _count?: {
    attachments: number;
    comments: number;
  };
  attachments?: IncidentAttachment[];
  comments?: IncidentComment[];
  statusHistory?: IncidentStatusHistory[];
}

export interface IncidentAttachment {
  id: string;
  incidentId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  uploader?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  userId: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export interface IncidentStatusHistory {
  id: string;
  incidentId: string;
  fromStatus?: IncidentStatus;
  toStatus: IncidentStatus;
  changedBy: string;
  reason?: string;
  changedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateIncidentData {
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location?: string;
  assigneeId?: string;
  studentId?: string;
  examSessionId?: string;
  attendanceId?: string;
  transferId?: string;
  incidentDate?: string;
  isConfidential?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateIncidentData {
  type?: IncidentType;
  severity?: IncidentSeverity;
  title?: string;
  description?: string;
  location?: string;
  assigneeId?: string;
  isConfidential?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateStatusData {
  status: IncidentStatus;
  reason?: string;
  resolutionNotes?: string;
}

export interface AssignIncidentData {
  assigneeId: string;
  reason?: string;
}

export interface AddCommentData {
  comment: string;
  isInternal?: boolean;
}

export interface IncidentFilters {
  type?: IncidentType;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  reporterId?: string;
  assigneeId?: string;
  studentId?: string;
  examSessionId?: string;
  isConfidential?: boolean;
  autoCreated?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface IncidentStatistics {
  total: number;
  byType: Record<IncidentType, number>;
  bySeverity: Record<IncidentSeverity, number>;
  byStatus: Record<IncidentStatus, number>;
  avgResolutionTime: number;
  openIncidents: number;
  resolvedToday: number;
}

export const incidentsApi = {
  /**
   * Get all incidents with filters
   */
  getIncidents: async (
    filters?: IncidentFilters
  ): Promise<{
    incidents: Incident[];
    total: number;
    page: number;
    limit: number;
  }> => {
    return apiClient.get("/incidents", { params: filters });
  },

  /**
   * Get single incident by ID
   */
  getIncident: async (id: string): Promise<{ incident: Incident }> => {
    return apiClient.get(`/incidents/${id}`);
  },

  /**
   * Create new incident
   */
  createIncident: async (
    data: CreateIncidentData
  ): Promise<{ incident: Incident }> => {
    return apiClient.post("/incidents", data);
  },

  /**
   * Update incident
   */
  updateIncident: async (
    id: string,
    data: UpdateIncidentData
  ): Promise<{ incident: Incident }> => {
    return apiClient.patch(`/incidents/${id}`, data);
  },

  /**
   * Delete incident (Admin only)
   */
  deleteIncident: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/incidents/${id}`);
  },

  /**
   * Update incident status
   */
  updateStatus: async (
    id: string,
    data: UpdateStatusData
  ): Promise<{ incident: Incident }> => {
    return apiClient.patch(`/incidents/${id}/status`, data);
  },

  /**
   * Assign incident to user
   */
  assignIncident: async (
    id: string,
    data: AssignIncidentData
  ): Promise<{ incident: Incident }> => {
    return apiClient.patch(`/incidents/${id}/assign`, data);
  },

  /**
   * Add comment to incident
   */
  addComment: async (
    id: string,
    data: AddCommentData
  ): Promise<{ comment: IncidentComment }> => {
    return apiClient.post(`/incidents/${id}/comments`, data);
  },

  /**
   * Get comments for incident
   */
  getComments: async (id: string): Promise<{ comments: IncidentComment[] }> => {
    return apiClient.get(`/incidents/${id}/comments`);
  },

  /**
   * Upload attachments
   */
  uploadAttachments: async (
    id: string,
    files: FileList
  ): Promise<{ attachments: IncidentAttachment[] }> => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });
    return apiClient.post(`/incidents/${id}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * Delete attachment
   */
  deleteAttachment: async (
    id: string,
    attachmentId: string
  ): Promise<{ message: string }> => {
    return apiClient.delete(`/incidents/${id}/attachments/${attachmentId}`);
  },

  /**
   * Get incident statistics
   */
  getStatistics: async (
    filters?: Pick<IncidentFilters, "startDate" | "endDate">
  ): Promise<{ statistics: IncidentStatistics }> => {
    return apiClient.get("/incidents/statistics", { params: filters });
  },

  /**
   * Export incident as PDF
   */
  exportPDF: async (id: string): Promise<Blob> => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/incidents/${id}/export/pdf`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    if (!response.ok) throw new Error("Export failed");
    return response.blob();
  },

  /**
   * Export incidents summary as Excel
   */
  exportSummary: async (filters?: IncidentFilters): Promise<Blob> => {
    const params = new URLSearchParams(filters as Record<string, string>);
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/incidents/export/summary?${params}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    if (!response.ok) throw new Error("Export failed");
    return response.blob();
  },

  /**
   * Export multiple incidents as individual PDFs in a ZIP file
   */
  exportBulkPDF: async (incidentIds: string[]): Promise<Blob> => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/incidents/export/bulk-pdf`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ incidentIds }),
      }
    );
    if (!response.ok) throw new Error("Bulk export failed");
    return response.blob();
  },
};
