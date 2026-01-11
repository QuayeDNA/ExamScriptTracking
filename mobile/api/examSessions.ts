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
  isArchived: boolean;
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
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "IN_TRANSIT"
  | "WITH_LECTURER"
  | "UNDER_GRADING"
  | "GRADED"
  | "RETURNED"
  | "COMPLETED";

export const examSessionsApi = {
  getExamSessions: async (): Promise<ExamSession[]> => {
    const response = await apiClient.get<{
      examSessions: ExamSession[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>("/exam-sessions?limit=1000");
    return response.examSessions;
  },

  getExamSession: async (id: string): Promise<ExamSession> => {
    const response = await apiClient.get<{ examSession: ExamSession }>(
      `/exam-sessions/${id}`
    );
    return response.examSession;
  },

  getExpectedStudents: async (examSessionId: string) => {
    return apiClient.get<{
      expectedStudents: Array<{
        id: string;
        indexNumber: string;
        firstName?: string | null;
        lastName?: string | null;
        program?: string | null;
        level?: number | null;
        attendance?: {
          id: string;
          entryTime: string;
          exitTime: string | null;
          submissionTime: string | null;
          status: string;
        } | null;
      }>;
    }>(`/exam-sessions/${examSessionId}/students`);
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

  endExamSession: async (
    id: string
  ): Promise<{
    message: string;
    examSession: { id: string; status: BatchStatus; scriptsCount: number };
  }> => {
    return apiClient.post<{
      message: string;
      examSession: { id: string; status: BatchStatus; scriptsCount: number };
    }>(`/exam-sessions/${id}/end`, {});
  },
};
