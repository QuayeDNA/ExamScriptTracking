import { apiClient } from "@/lib/api-client";

export interface ExamAttendance {
  id: string;
  studentId: string;
  examSessionId: string;
  entryTime: string;
  exitTime: string | null;
  submissionTime: string | null;
  status: AttendanceStatus;
  discrepancyNote: string | null;
  student: {
    id: string;
    indexNumber: string;
    firstName: string;
    lastName: string;
    program: string;
    level: number;
  };
  examSession: {
    id: string;
    courseCode: string;
    courseName: string;
    venue: string;
    status?: string;
  };
}

export type AttendanceStatus =
  | "PRESENT"
  | "SUBMITTED"
  | "LEFT_WITHOUT_SUBMITTING"
  | "ABSENT";

export const attendanceApi = {
  getAttendance: async (
    studentId: string,
    examSessionId: string
  ): Promise<ExamAttendance> => {
    const response = await apiClient.get<{ attendance: ExamAttendance }>(
      `/attendance?studentId=${studentId}&examSessionId=${examSessionId}`
    );
    return response.attendance;
  },

  recordEntry: async (
    studentId: string,
    examSessionId: string
  ): Promise<ExamAttendance> => {
    const response = await apiClient.post<{
      message: string;
      attendance: ExamAttendance;
    }>("/attendance/entry", { studentId, examSessionId });
    return response.attendance;
  },

  recordExit: async (attendanceId: string): Promise<ExamAttendance> => {
    const response = await apiClient.post<{
      message: string;
      attendance: ExamAttendance;
    }>("/attendance/exit", { attendanceId });
    return response.attendance;
  },

  recordSubmission: async (attendanceId: string): Promise<ExamAttendance> => {
    const response = await apiClient.post<{
      message: string;
      attendance: ExamAttendance;
    }>("/attendance/submission", { attendanceId });
    return response.attendance;
  },

  updateDiscrepancy: async (
    attendanceId: string,
    discrepancyNote: string
  ): Promise<ExamAttendance> => {
    const response = await apiClient.patch<{
      message: string;
      attendance: ExamAttendance;
    }>("/attendance/discrepancy", { attendanceId, discrepancyNote });
    return response.attendance;
  },
};
