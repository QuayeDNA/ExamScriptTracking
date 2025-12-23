import { apiClient } from "@/lib/api-client";

// Types
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
    status?: string;
  };
  fromHandler: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  toHandler: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export type TransferStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DISCREPANCY_REPORTED"
  | "RESOLVED";

export interface CreateTransferRequest {
  examSessionId: string;
  toHandlerId: string;
  examsExpected: number;
  location?: string;
}

export interface ConfirmTransferRequest {
  examsReceived: number;
  discrepancyNote?: string;
}

// API Functions

/**
 * Get transfers with optional filters
 */
export const getTransfers = async (filters?: {
  examSessionId?: string;
  status?: TransferStatus;
  fromHandlerId?: string;
  toHandlerId?: string;
  handlerId?: string;
}): Promise<{ transfers: BatchTransfer[]; count: number }> => {
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

  return apiClient.get<{ transfers: BatchTransfer[]; count: number }>(url);
};

/**
 * Get single transfer by ID
 */
export const getTransferById = async (
  id: string
): Promise<{ transfer: BatchTransfer }> => {
  return apiClient.get<{ transfer: BatchTransfer }>(`/batch-transfers/${id}`);
};

/**
 * Get transfer history for an exam session (chain of custody)
 */
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
  return apiClient.get<{
    examSession: {
      courseCode: string;
      courseName: string;
      venue: string;
      examDate: string;
      status: string;
    };
    transfers: BatchTransfer[];
    count: number;
  }>(`/batch-transfers/history/${examSessionId}`);
};

/**
 * Create a new transfer request
 */
export const createTransfer = async (
  data: CreateTransferRequest
): Promise<{ message: string; transfer: BatchTransfer }> => {
  return apiClient.post<{ message: string; transfer: BatchTransfer }>(
    "/batch-transfers",
    data
  );
};

/**
 * Confirm a transfer (receiver accepts)
 */
export const confirmTransfer = async (
  transferId: string,
  data: ConfirmTransferRequest
): Promise<{ message: string; transfer: BatchTransfer }> => {
  return apiClient.patch<{ message: string; transfer: BatchTransfer }>(
    `/batch-transfers/${transferId}/confirm`,
    data
  );
};

/**
 * Reject a transfer
 */
export const rejectTransfer = async (
  transferId: string,
  reason?: string
): Promise<{ message: string }> => {
  return apiClient.patch<{ message: string }>(
    `/batch-transfers/${transferId}/reject`,
    { reason }
  );
};

/**
 * Update transfer status (admin only)
 */
export const updateTransferStatus = async (
  transferId: string,
  status: TransferStatus
): Promise<{ message: string; transfer: BatchTransfer }> => {
  return apiClient.patch<{ message: string; transfer: BatchTransfer }>(
    `/batch-transfers/${transferId}/status`,
    { status }
  );
};
