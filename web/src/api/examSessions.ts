import { apiClient } from "@/lib/api-client";

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
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count?: {
    attendances: number;
  };
  stats?: {
    expectedStudents: number;
    totalAttended: number;
    submitted: number;
    present: number;
    attendanceRate: string;
  };
  attendances?: Array<{
    id: string;
    entryTime: string;
    exitTime: string | null;
    submissionTime: string | null;
    status: string;
    student: {
      id: string;
      indexNumber: string;
      firstName: string;
      lastName: string;
      program: string;
      level: number;
    };
  }>;
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

export interface CreateExamSessionData {
  courseCode: string;
  courseName: string;
  lecturerId: string;
  lecturerName: string;
  department: string;
  faculty: string;
  venue: string;
  examDate: string;
}

export interface UpdateExamSessionData {
  courseCode?: string;
  courseName?: string;
  lecturerId?: string;
  lecturerName?: string;
  department?: string;
  faculty?: string;
  venue?: string;
  examDate?: string;
  status?: BatchStatus;
}

export interface ExamSessionsResponse {
  examSessions: ExamSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ExamSessionDetailResponse {
  examSession: ExamSession & {
    attendances: Array<{
      id: string;
      entryTime: string;
      exitTime: string | null;
      submissionTime: string | null;
      status: string;
      student: {
        id: string;
        indexNumber: string;
        firstName: string;
        lastName: string;
        program: string;
        level: number;
      };
    }>;
    transfers: Array<{
      id: string;
      requestedAt: string;
      confirmedAt: string | null;
      status: string;
      fromHandler: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      toHandler: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    }>;
  };
}

export interface QRCodeResponse {
  qrCode: string;
  examSession: {
    id: string;
    batchQrCode: string;
    courseCode: string;
    courseName: string;
  };
}

export interface ManifestResponse {
  examSession: {
    batchQrCode: string;
    courseCode: string;
    courseName: string;
    examDate: string;
    venue: string;
    lecturerName: string;
    department: string;
    faculty: string;
    status: string;
  };
  statistics: {
    totalStudents: number;
    submitted: number;
    entryOnly: number;
    exitWithoutSubmission: number;
  };
  attendances: Array<{
    indexNumber: string;
    name: string;
    program: string;
    level: number;
    entryTime: string;
    exitTime: string | null;
    submissionTime: string | null;
    status: string;
    discrepancyNote: string | null;
  }>;
}

export const examSessionsApi = {
  getExamSessions: async (filters?: {
    status?: string;
    department?: string;
    faculty?: string;
    courseCode?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<ExamSessionsResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return apiClient.get<ExamSessionsResponse>(
      `/exam-sessions${queryString ? `?${queryString}` : ""}`
    );
  },

  getExamSession: async (id: string): Promise<ExamSessionDetailResponse> => {
    return apiClient.get<ExamSessionDetailResponse>(`/exam-sessions/${id}`);
  },

  createExamSession: async (
    data: CreateExamSessionData
  ): Promise<{
    message: string;
    examSession: ExamSession & { qrCode: string };
  }> => {
    return apiClient.post<{
      message: string;
      examSession: ExamSession & { qrCode: string };
    }>("/exam-sessions", data);
  },

  updateExamSession: async (
    id: string,
    data: UpdateExamSessionData
  ): Promise<{ message: string; examSession: ExamSession }> => {
    return apiClient.put<{ message: string; examSession: ExamSession }>(
      `/exam-sessions/${id}`,
      data
    );
  },

  updateExamSessionStatus: async (
    id: string,
    status: BatchStatus
  ): Promise<{ message: string; examSession: ExamSession }> => {
    return apiClient.patch<{ message: string; examSession: ExamSession }>(
      `/exam-sessions/${id}/status`,
      { status }
    );
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

  deleteExamSession: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/exam-sessions/${id}`);
  },

  getQRCode: async (id: string): Promise<QRCodeResponse> => {
    return apiClient.get<QRCodeResponse>(`/exam-sessions/${id}/qr-code`);
  },

  getManifest: async (id: string): Promise<ManifestResponse> => {
    return apiClient.get<ManifestResponse>(`/exam-sessions/${id}/manifest`);
  },

  getDepartments: async (): Promise<{ departments: string[] }> => {
    return apiClient.get<{ departments: string[] }>(
      "/exam-sessions/departments"
    );
  },

  getFaculties: async (): Promise<{ faculties: string[] }> => {
    return apiClient.get<{ faculties: string[] }>("/exam-sessions/faculties");
  },

  // Expected Students API
  getExpectedStudents: async (
    examSessionId: string
  ): Promise<{
    expectedStudents: Array<{
      id: string;
      indexNumber: string;
      firstName?: string | null;
      lastName?: string | null;
      program?: string | null;
      level?: number | null;
      profilePicture?: string | null;
      expectedAt: string;
      attendance?: {
        id: string;
        entryTime: string;
        exitTime: string | null;
        submissionTime: string | null;
        status: string;
        discrepancyNote: string | null;
      } | null;
    }>;
  }> => {
    return apiClient.get<{
      expectedStudents: Array<{
        id: string;
        indexNumber: string;
        firstName?: string | null;
        lastName?: string | null;
        program?: string | null;
        level?: number | null;
        expectedAt: string;
        attendance?: {
          id: string;
          entryTime: string;
          exitTime: string | null;
          submissionTime: string | null;
          status: string;
          discrepancyNote: string | null;
        } | null;
      }>;
    }>(`/exam-sessions/${examSessionId}/students`);
  },

  addExpectedStudents: async (
    examSessionId: string,
    students: Array<{
      indexNumber: string;
      firstName?: string;
      lastName?: string;
      program?: string;
      level?: number;
    }>
  ): Promise<{
    message: string;
    added: number;
    newStudentRecordsCreated: number;
    existingStudentRecords: number;
  }> => {
    return apiClient.post<{
      message: string;
      added: number;
      newStudentRecordsCreated: number;
      existingStudentRecords: number;
    }>(`/exam-sessions/${examSessionId}/students`, { students });
  },

  addExpectedStudentsByIndexes: async (
    examSessionId: string,
    indexNumbers: string[]
  ): Promise<{
    message: string;
    added: number;
    totalProvided: number;
    newStudentRecordsCreated: number;
    existingStudentRecords: number;
  }> => {
    return apiClient.post<{
      message: string;
      added: number;
      totalProvided: number;
      newStudentRecordsCreated: number;
      existingStudentRecords: number;
    }>(`/exam-sessions/${examSessionId}/students/bulk`, { indexNumbers });
  },

  removeExpectedStudent: async (
    examSessionId: string,
    studentId: string
  ): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(
      `/exam-sessions/${examSessionId}/students/${studentId}`
    );
  },

  getAttendanceSummary: async (
    examSessionId: string
  ): Promise<{
    summary: {
      expectedStudents: number;
      totalAttended: number;
      submitted: number;
      present: number;
      leftWithoutSubmitting: number;
      attendanceRate: string;
      notYetArrived: Array<{
        id: string;
        indexNumber: string;
        firstName: string;
        lastName: string;
        program: string;
        level: number;
      }>;
    };
  }> => {
    return apiClient.get<{
      summary: {
        expectedStudents: number;
        totalAttended: number;
        submitted: number;
        present: number;
        leftWithoutSubmitting: number;
        attendanceRate: string;
        notYetArrived: Array<{
          id: string;
          indexNumber: string;
          firstName: string;
          lastName: string;
          program: string;
          level: number;
        }>;
      };
    }>(`/exam-sessions/${examSessionId}/attendance-summary`);
  },
};
