/* eslint-disable @typescript-eslint/no-explicit-any */
// User & Auth Types
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
  profilePicture?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  identifier: string;
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

// Session Types
export interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
}

export interface SessionsResponse {
  sessions: Session[];
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  entity?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// Bulk Operations Types
export interface BulkUserCreate {
  email: string;
  role: Role;
  name: string;
  department: string;
}

export interface BulkCreateResponse {
  message: string;
  success: Array<{ email: string; temporaryPassword: string }>;
  failed: Array<{ email: string; error: string }>;
}

export interface BulkDeactivateRequest {
  userIds: string[];
}

export interface BulkUpdateRolesRequest {
  updates: Array<{ userId: string; role: Role }>;
}

export interface BulkUpdateRolesResponse {
  message: string;
  success: Array<{ userId: string; newRole: string }>;
  failed: Array<{ userId: string; error: string }>;
}

// Admin Actions Types
export interface AdminResetPasswordResponse {
  message: string;
  temporaryPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

// Password Reset Types
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  message: string;
  resetToken: string;
  expiresAt: string;
}

export interface PasswordResetWithTokenRequest {
  token: string;
  newPassword: string;
}

export interface PasswordResetWithTokenResponse {
  message: string;
}

// User Statistics Types
export interface UsersByRole {
  role: Role;
  count: number;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentLogins: number;
  usersByRole: UsersByRole[];
  lockedAccounts: number;
}

// Profile Picture Types
export interface ProfilePictureUpdate {
  profilePicture: string;
}

export interface ProfilePictureResponse {
  message: string;
  profilePicture: string;
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
  _count?: {
    attendances: number;
  };
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
  examsExpected: number;
  examsReceived?: number;
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

// Analytics Types
export interface AnalyticsOverview {
  overview: {
    totalExams: number;
    examsThisMonth: number;
    activeBatches: number;
    totalHandlers: number;
    totalDiscrepancies: number;
    discrepancyRate: number;
    avgTransferTimeHours: number;
  };
  trends: {
    examsByDay: Record<string, number>;
  };
}

export interface HandlerPerformance {
  handler: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  metrics: {
    totalTransfers: number;
    transfersReceived: number;
    transfersInitiated: number;
    avgResponseTimeHours: number;
    discrepancies: number;
    discrepancyRate: number;
    currentCustody: number;
  };
}

export interface DiscrepancyReport {
  id: string;
  examSessionId: string;
  courseCode: string;
  courseName: string;
  fromHandlerName: string;
  toHandlerName: string;
  examsExpected: number;
  examsReceived: number;
  note: string;
  reportedAt: string;
  resolvedAt?: string;
  status: TransferStatus;
}

export interface DiscrepanciesResponse {
  summary: {
    total: number;
    resolved: number;
    unresolved: number;
    resolutionRate: number;
  };
  breakdown: {
    byStatus: Record<string, number>;
    byDepartment: Record<string, number>;
  };
  trend: Record<string, number>;
  recentDiscrepancies: any[]; // BatchTransfer with relations
}

export interface ExamStatistics {
  examSessionId: string;
  courseCode: string;
  courseName: string;
  totalStudents: number;
  presentStudents: number;
  submittedScripts: number;
  completionRate: number; // percentage
  examDate: string;
  status: BatchStatus;
}

export interface ExamStatisticsResponse {
  summary: {
    totalExams: number;
    completedExams: number;
    completionRate: number;
    avgProcessingTimeDays: number;
    avgStudentsPerExam: number;
  };
  breakdown: {
    byStatus: Record<string, number>;
    byDepartment: Record<string, number>;
    byFaculty: Record<string, number>;
    byMonth: Record<string, number>;
  };
}

export interface DateRangeFilter {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface AnalyticsExportRequest extends DateRangeFilter {
  format: "pdf" | "excel";
  reportType: "overview" | "handlers" | "discrepancies" | "exams";
}
