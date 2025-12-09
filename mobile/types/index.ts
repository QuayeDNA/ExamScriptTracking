export const Role = {
  ADMIN: "ADMIN",
  INVIGILATOR: "INVIGILATOR",
  DEPARTMENT_HEAD: "DEPARTMENT_HEAD",
  FACULTY_OFFICER: "FACULTY_OFFICER",
  LECTURER: "LECTURER",
  CLASS_REP: "CLASS_REP",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  role: Role;
  isSuperAdmin: boolean;
  isActive: boolean;
  passwordChanged: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: User;
}

export interface ClassAttendanceStudent {
  id: string;
  studentId: string;
  scanTime: string;
  student: {
    id: string;
    indexNumber: string;
    firstName: string;
    lastName: string;
    program?: string | null;
    level?: number | null;
  };
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface FirstTimePasswordData {
  newPassword: string;
}

export const AttendanceStatus = {
  PRESENT: "PRESENT",
  SUBMITTED: "SUBMITTED",
  LEFT_WITHOUT_SUBMITTING: "LEFT_WITHOUT_SUBMITTING",
  ABSENT: "ABSENT",
} as const;

export type AttendanceStatus =
  (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export interface Student {
  id: string;
  indexNumber: string;
  firstName: string;
  lastName: string;
  program: string;
  level: number;
  qrCode: string;
  createdAt: string;
}

export const BatchStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  IN_TRANSIT: "IN_TRANSIT",
  WITH_LECTURER: "WITH_LECTURER",
  UNDER_GRADING: "UNDER_GRADING",
  GRADED: "GRADED",
  RETURNED: "RETURNED",
  COMPLETED: "COMPLETED",
} as const;

export type BatchStatus = (typeof BatchStatus)[keyof typeof BatchStatus];

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
}

export interface ExamAttendance {
  id: string;
  studentId: string;
  examSessionId: string;
  entryTime: string;
  exitTime?: string;
  submissionTime?: string;
  status: AttendanceStatus;
  discrepancyNote?: string;
  student: Student;
}

export interface ApiError {
  error: string;
  details?: Array<{
    path: string[];
    message: string;
  }>;
}
