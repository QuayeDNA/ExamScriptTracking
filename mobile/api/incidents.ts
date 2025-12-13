/**
 * Incidents API Client for Mobile
 * Handles incident management with offline support preparation
 */

import { apiClient } from "@/lib/api-client";

// ============================================
// Types & Enums
// ============================================

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
  title: string;
  description: string;
  location?: string;
  incidentDate?: string;
  isConfidential: boolean;
  autoCreated: boolean;
  reportedAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  metadata?: Record<string, unknown>;
  resolutionNotes?: string;
  reporterId: string;
  assigneeId?: string;
  studentId?: string;
  examSessionId?: string;
  examAttendanceId?: string;
  batchTransferId?: string;
  reporter?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  student?: {
    id: string;
    indexNumber: string;
    firstName: string;
    lastName: string;
    program?: string;
    level?: number;
  };
  examSession?: {
    id: string;
    courseCode: string;
    courseName: string;
    batchQrCode: string;
  };
  _count?: {
    comments: number;
    attachments: number;
    statusHistory: number;
  };
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  userId: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface IncidentAttachment {
  id: string;
  incidentId: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  uploader: {
    id: string;
    name: string;
  };
}

export interface IncidentStatusHistory {
  id: string;
  incidentId: string;
  fromStatus: IncidentStatus;
  toStatus: IncidentStatus;
  reason?: string;
  changedAt: string;
  changedById: string;
  changedBy: {
    id: string;
    name: string;
  };
}

export interface CreateIncidentData {
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location?: string;
  incidentDate?: string;
  isConfidential?: boolean;
  studentId?: string;
  examSessionId?: string;
  examAttendanceId?: string;
  batchTransferId?: string;
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
  isConfidential?: boolean;
  studentId?: string;
  examSessionId?: string;
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
  openIncidents: number;
  resolvedToday: number;
  avgResolutionTime: number;
}

// ============================================
// API Functions
// ============================================

/**
 * Get incidents with optional filters
 */
export const getIncidents = async (
  filters?: IncidentFilters
): Promise<{
  incidents: Incident[];
  total: number;
  page: number;
  limit: number;
}> => {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }

  const response = await apiClient.get(`/incidents?${params.toString()}`);
  return response as {
    incidents: Incident[];
    total: number;
    page: number;
    limit: number;
  };
};

/**
 * Get a single incident by ID
 */
export const getIncident = async (
  id: string
): Promise<{ incident: Incident }> => {
  const response = await apiClient.get(`/incidents/${id}`);
  return response as { incident: Incident };
};

/**
 * Create a new incident
 */
export const createIncident = async (
  data: CreateIncidentData
): Promise<{ incident: Incident }> => {
  const response = await apiClient.post("/incidents", data);
  return response as { incident: Incident };
};

/**
 * Update an incident
 */
export const updateIncident = async (
  id: string,
  data: UpdateIncidentData
): Promise<{ incident: Incident }> => {
  const response = await apiClient.put(`/incidents/${id}`, data);
  return response as { incident: Incident };
};

/**
 * Update incident status
 */
export const updateStatus = async (
  id: string,
  data: UpdateStatusData
): Promise<{ incident: Incident }> => {
  const response = await apiClient.patch(`/incidents/${id}/status`, data);
  return response as { incident: Incident };
};

/**
 * Assign incident to a user
 */
export const assignIncident = async (
  id: string,
  data: { assigneeId: string }
): Promise<{ incident: Incident }> => {
  const response = await apiClient.patch(`/incidents/${id}/assign`, data);
  return response as { incident: Incident };
};

/**
 * Get incident comments
 */
export const getComments = async (
  id: string
): Promise<{ comments: IncidentComment[] }> => {
  const response = await apiClient.get(`/incidents/${id}/comments`);
  return response as { comments: IncidentComment[] };
};

/**
 * Add a comment to an incident
 */
export const addComment = async (
  id: string,
  data: AddCommentData
): Promise<{ comment: IncidentComment }> => {
  const response = await apiClient.post(`/incidents/${id}/comments`, data);
  return response as { comment: IncidentComment };
};

/**
 * Get incident attachments
 */
export const getAttachments = async (
  id: string
): Promise<{ attachments: IncidentAttachment[] }> => {
  const response = await apiClient.get(`/incidents/${id}/attachments`);
  return response as { attachments: IncidentAttachment[] };
};

/**
 * Upload attachments to an incident
 * Note: For mobile, files are FormData objects
 */
export const uploadAttachments = async (
  id: string,
  formData: FormData
): Promise<{ attachments: IncidentAttachment[] }> => {
  const response = await apiClient.post(
    `/incidents/${id}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response as { attachments: IncidentAttachment[] };
};

/**
 * Get incident status history
 */
export const getStatusHistory = async (
  id: string
): Promise<{ history: IncidentStatusHistory[] }> => {
  const response = await apiClient.get(`/incidents/${id}/status-history`);
  return response as { history: IncidentStatusHistory[] };
};

/**
 * Get incident statistics
 */
export const getStatistics = async (): Promise<{
  statistics: IncidentStatistics;
}> => {
  const response = await apiClient.get("/incidents/statistics");
  return response as { statistics: IncidentStatistics };
};

/**
 * Delete an incident (admin only)
 */
export const deleteIncident = async (id: string): Promise<void> => {
  await apiClient.delete(`/incidents/${id}`);
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get human-readable incident type label
 */
export const getIncidentTypeLabel = (type: IncidentType): string => {
  const labels: Record<IncidentType, string> = {
    MISSING_SCRIPT: "Missing Script",
    DAMAGED_SCRIPT: "Damaged Script",
    MALPRACTICE: "Malpractice",
    STUDENT_ILLNESS: "Student Illness",
    VENUE_ISSUE: "Venue Issue",
    COUNT_DISCREPANCY: "Count Discrepancy",
    LATE_SUBMISSION: "Late Submission",
    OTHER: "Other",
  };
  return labels[type];
};

/**
 * Get human-readable status label
 */
export const getStatusLabel = (status: IncidentStatus): string => {
  const labels: Record<IncidentStatus, string> = {
    REPORTED: "Reported",
    INVESTIGATING: "Investigating",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
    ESCALATED: "Escalated",
  };
  return labels[status];
};

/**
 * Get severity color (OKLCH)
 */
export const getSeverityColor = (severity: IncidentSeverity): string => {
  const colors: Record<IncidentSeverity, string> = {
    LOW: "oklch(0.62 0.25 255)", // Blue
    MEDIUM: "oklch(0.72 0.18 70)", // Orange
    HIGH: "oklch(0.62 0.25 25)", // Red
    CRITICAL: "oklch(0.55 0.25 25)", // Dark Red
  };
  return colors[severity];
};

/**
 * Get status color (OKLCH)
 */
export const getStatusColor = (status: IncidentStatus): string => {
  const colors: Record<IncidentStatus, string> = {
    REPORTED: "oklch(0.52 0 240)", // Gray
    INVESTIGATING: "oklch(0.62 0.25 255)", // Blue
    RESOLVED: "oklch(0.65 0.22 145)", // Green
    CLOSED: "oklch(0.52 0 240)", // Gray
    ESCALATED: "oklch(0.62 0.25 25)", // Red
  };
  return colors[status];
};

export default {
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  updateStatus,
  assignIncident,
  getComments,
  addComment,
  getAttachments,
  uploadAttachments,
  getStatusHistory,
  getStatistics,
  deleteIncident,
  getIncidentTypeLabel,
  getStatusLabel,
  getSeverityColor,
  getStatusColor,
};
