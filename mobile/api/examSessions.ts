import { apiClient } from "@/lib/api-client";
import type { ExamAttendance } from "@/types";

export interface ExamSession {
  id: string;
  batchQrCode: string;
  courseCode: string;
  courseName: string;
  lecturerId: string;
  lecturerName: string;
  department: string;
  faculty: string;
  venue: string;
  examDate: string;
  status: BatchStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  attendances?: ExamAttendance[];
  stats?: {
    expectedStudents: number;
    totalAttended: number;
    submitted: number;
    present: number;
    attendanceRate: string;
  };
}

export type BatchStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "IN_TRANSIT"
  | "WITH_LECTURER"
  | "UNDER_GRADING"
  | "GRADED"
  | "RETURNED"
  | "COMPLETED";

export const examSessionsApi = {
  getExamSession: async (id: string): Promise<ExamSession> => {
    const response = await apiClient.get<{ examSession: ExamSession }>(
      `/exam-sessions/${id}`
    );
    return response.examSession;
  },

  updateStatus: async (
    id: string,
    status: BatchStatus
  ): Promise<ExamSession> => {
    const response = await apiClient.patch<{ examSession: ExamSession }>(
      `/exam-sessions/${id}/status`,
      { status }
    );
    return response.examSession;
  },
};
