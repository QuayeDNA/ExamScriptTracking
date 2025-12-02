// User & Auth Types
export const Role = {
  ADMIN: "ADMIN",
  INVIGILATOR: "INVIGILATOR",
  DEPARTMENT_HEAD: "DEPARTMENT_HEAD",
  FACULTY_OFFICER: "FACULTY_OFFICER",
  LECTURER: "LECTURER",
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

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface FirstTimePasswordData {
  newPassword: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  department: string;
  role: Role;
}

export interface CreateUserResponse {
  message: string;
  email: string;
  temporaryPassword: string;
}

export interface UpdateUserData {
  name?: string;
  department?: string;
  role?: Role;
}

export interface UsersListResponse {
  users: User[];
}

export interface HandlersListResponse {
  handlers: User[];
}

// Student Types
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

// Exam Session Types
export const BatchStatus = {
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

// Attendance Types
export const AttendanceStatus = {
  PRESENT: "PRESENT",
  SUBMITTED: "SUBMITTED",
  LEFT_WITHOUT_SUBMITTING: "LEFT_WITHOUT_SUBMITTING",
  ABSENT: "ABSENT",
} as const;

export type AttendanceStatus =
  (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

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

// Transfer Types
export const TransferStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  DISCREPANCY_REPORTED: "DISCREPANCY_REPORTED",
  RESOLVED: "RESOLVED",
} as const;

export type TransferStatus =
  (typeof TransferStatus)[keyof typeof TransferStatus];

export interface BatchTransfer {
  id: string;
  examSessionId: string;
  fromHandlerId: string;
  toHandlerId: string;
  requestedAt: string;
  confirmedAt?: string;
  status: TransferStatus;
  scriptsExpected: number;
  scriptsReceived?: number;
  discrepancyNote?: string;
  location?: string;
  fromHandler: User;
  toHandler: User;
}

// API Error Types
export interface ApiError {
  error: string;
  details?: Array<{
    path: string[];
    message: string;
  }>;
}

// Query Filters
export interface UserFilters {
  role?: Role;
  isActive?: boolean;
  search?: string;
}

export interface ExamSessionFilters {
  status?: BatchStatus;
  department?: string;
  faculty?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Auth Context Types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}
