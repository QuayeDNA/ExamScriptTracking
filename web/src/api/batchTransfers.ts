import { apiClient } from "../lib/api-client";

export interface BatchTransfer {
  id: string;
  examSessionId: string;
  fromHandlerId: string;
  toHandlerId: string;
  requestedAt: string;
  confirmedAt: string | null;
  status: TransferStatus;
  examsExpected: number;
  examsReceived: number | null;
  discrepancyNote: string | null;
  location: string | null;
  examSession: {
    id: string;
    batchQrCode: string;
    courseCode: string;
    courseName: string;
    venue: string;
    examDate: string;
    status: string;
  };
  fromHandler: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  };
  toHandler: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  };
  resolutionNote: string;
}

export type TransferStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DISCREPANCY_REPORTED"
  | "RESOLVED";

export interface TransferFilters {
  examSessionId?: string;
  status?: TransferStatus;
  fromHandlerId?: string;
  toHandlerId?: string;
  handlerId?: string;
}

// Get all transfers with optional filters
export const getTransfers = async (
  filters?: TransferFilters
): Promise<{ transfers: BatchTransfer[]; count: number }> => {
  const params = new URLSearchParams();
  if (filters?.examSessionId)
    params.append("examSessionId", filters.examSessionId);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.fromHandlerId)
    params.append("fromHandlerId", filters.fromHandlerId);
  if (filters?.toHandlerId) params.append("toHandlerId", filters.toHandlerId);
  if (filters?.handlerId) params.append("handlerId", filters.handlerId);

  const queryString = params.toString();
  const url = `/batch-transfers${queryString ? `?${queryString}` : ""}`;

  return apiClient.get(url);
};

// Get single transfer by ID
export const getTransferById = async (
  id: string
): Promise<{ transfer: BatchTransfer }> => {
  return apiClient.get(`/batch-transfers/${id}`);
};

// Get transfer history for an exam session
export const getTransferHistory = async (
  examSessionId: string
): Promise<{
  examSession: {
    courseCode: string;
    courseName: string;
    venue: string;
    examDate: string;
    status: string;
  };
  transfers: BatchTransfer[];
  count: number;
}> => {
  return apiClient.get(`/batch-transfers/history/${examSessionId}`);
};

// Create a new transfer request
export const createTransfer = async (data: {
  examSessionId: string;
  toHandlerId: string;
  examsExpected: number;
  location?: string;
}): Promise<{ message: string; transfer: BatchTransfer }> => {
  return apiClient.post("/batch-transfers", data);
};

// Confirm transfer (receiver accepts)
export const confirmTransfer = async (
  transferId: string,
  data: {
    examsReceived: number;
    discrepancyNote?: string;
  }
): Promise<{ message: string; transfer: BatchTransfer }> => {
  return apiClient.patch(`/batch-transfers/${transferId}/confirm`, data);
};

// Reject transfer
export const rejectTransfer = async (
  transferId: string,
  reason?: string
): Promise<{ message: string }> => {
  return apiClient.patch(`/batch-transfers/${transferId}/reject`, { reason });
};

// Update transfer status (admin only)
export const updateTransferStatus = async (
  transferId: string,
  status: TransferStatus
): Promise<{ message: string; transfer: BatchTransfer }> => {
  return apiClient.patch(`/batch-transfers/${transferId}/status`, { status });
};
