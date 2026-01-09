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

export interface ApiError {
  error: string;
  details?: any;
}

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
  phone?: string;
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
  phone?: string;
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
  phone?: string;
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
  phone?: string;
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
  option?: string; // Program option (e.g., "Software Option", "Networking Option")
  department?: string; // Student's department
  level: number;
  qrCode: string;
  profilePicture: string;
  createdAt: string;
  // Biometric fields
  biometricEnrolledAt?: string;
  biometricProvider?: string;
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
  invigilatorId?: string;
  invigilatorName?: string;
  invigilators?: ExamSessionInvigilator[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    attendances: number;
  };
}

export interface ExamSessionInvigilator {
  id: string;
  examSessionId: string;
  userId: string;
  role: InvigilatorRole;
  assignedAt: string;
  firstScanAt?: string;
  lastScanAt?: string;
  studentsScanned: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const InvigilatorRole = {
  PRIMARY: "PRIMARY",
  ASSISTANT: "ASSISTANT",
} as const;

export type InvigilatorRole = (typeof InvigilatorRole)[keyof typeof InvigilatorRole];

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

export interface ApiError {
  error: string;
  details?: any;
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

// Class Attendance Types
export const ClassSessionStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

export type ClassSessionStatus = (typeof ClassSessionStatus)[keyof typeof ClassSessionStatus];

export const ClassAttendanceStatus = {
  PRESENT: 'PRESENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED',
  ABSENT: 'ABSENT'
} as const;

export type ClassAttendanceStatus = (typeof ClassAttendanceStatus)[keyof typeof ClassAttendanceStatus];

export const VerificationMethod = {
  QR_SCAN: 'QR_SCAN',
  MANUAL_ENTRY: 'MANUAL_ENTRY',
  BIOMETRIC_FINGERPRINT: 'BIOMETRIC_FINGERPRINT',
  BIOMETRIC_FACE: 'BIOMETRIC_FACE',
  LINK_SELF_MARK: 'LINK_SELF_MARK'
} as const;

export type VerificationMethod = (typeof VerificationMethod)[keyof typeof VerificationMethod];

export const LinkType = {
  ATTENDANCE: 'ATTENDANCE',
  BIOMETRIC_ENROLLMENT: 'BIOMETRIC_ENROLLMENT'
} as const;

export type LinkType = (typeof LinkType)[keyof typeof LinkType];

export interface ClassAttendanceSession {
  id: string;
  courseCode: string;
  courseName: string;
  venue?: string;
  lecturerName?: string;
  notes?: string;
  createdBy: string;
  startTime: string;
  endTime?: string;
  status: ClassSessionStatus;
  expectedStudentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentClassAttendance {
  id: string;
  sessionId: string;
  studentId: string;
  verificationMethod: VerificationMethod;
  status: ClassAttendanceStatus;
  markedAt: string;
  requiresConfirmation: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  recordedBy: string;
  deviceId?: string;
  biometricConfidence?: number;
  linkTokenUsed?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface AttendanceLink {
  id: string;
  linkToken: string;
  linkType: LinkType;
  sessionId?: string;
  studentId?: string;
  createdBy: string;
  expiresAt: string;
  maxUses?: number;
  usesCount: number;
  requiresLocation: boolean;
  geofence?: {
    lat: number;
    lng: number;
    radiusMeters: number;
  };
  isActive: boolean;
  deactivatedAt?: string;
  createdAt: string;
}

export interface ClassStudent {
  id: string;
  indexNumber: string;
  firstName: string;
  lastName: string;
  program: string;
  level: number;
  department?: string;
  option?: string;
  qrCode: string;
  profilePicture?: string;
  biometricEnrolled: boolean;
  biometricProvider?: string;
  biometricEnrolledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  department?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface SelfMarkAttendanceRequest {
  linkToken: string;
  studentId: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface ValidateLinkResponse {
  success: boolean;
  data: {
    id: string;
    courseCode: string;
    courseName: string;
    lecturerName?: string;
    venue?: string;
    startTime: string;
    endTime?: string;
    status: ClassSessionStatus;
    expectedStudentCount: number;
  };
}

export interface SelfMarkAttendanceResponse {
  success: boolean;
  message: string;
  data: StudentClassAttendance;
}

export interface AttendanceHistoryResponse {
  success: boolean;
  data: {
    records: StudentClassAttendance[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface ActiveSessionsResponse {
  success: boolean;
  data: ClassAttendanceSession[];
}

export interface SessionDetailsResponse {
  success: boolean;
  data: {
    session: ClassAttendanceSession;
    attendance: StudentClassAttendance[];
    stats: {
      totalExpected: number;
      totalPresent: number;
      totalLate: number;
      totalExcused: number;
      totalAbsent: number;
      attendanceRate: number;
    };
  };
}

export interface CreateSessionRequest {
  courseCode: string;
  courseName: string;
  venue?: string;
  lecturerName?: string;
  notes?: string;
  startTime: string;
  endTime?: string;
  expectedStudentCount?: number;
}

export interface CreateSessionResponse {
  success: boolean;
  message: string;
  data: ClassAttendanceSession;
}

export interface GenerateLinkRequest {
  expiresInMinutes?: number;
  maxUses?: number;
  requiresLocation?: boolean;
  geofence?: {
    lat: number;
    lng: number;
    radiusMeters: number;
  };
}

export interface GenerateLinkResponse {
  success: boolean;
  message: string;
  data: AttendanceLink;
}

export interface ActiveLinksResponse {
  success: boolean;
  data: AttendanceLink[];
}

export interface AttendanceAnalyticsResponse {
  success: boolean;
  data: {
    period: {
      startDate: string;
      endDate: string;
    };
    summary: {
      totalSessions: number;
      totalAttendance: number;
      averageAttendanceRate: number;
      totalStudents: number;
    };
    trends: {
      daily: Record<string, number>;
      courseBreakdown: Record<string, {
        sessions: number;
        attendance: number;
        rate: number;
      }>;
    };
  };
}

// WebSocket Event Types
export interface WebSocketEvent {
  type: string;
  sessionId?: string;
  data?: unknown;
  timestamp: string;
}

export interface SessionStartedEvent extends WebSocketEvent {
  type: 'SESSION_STARTED';
  data: ClassAttendanceSession;
}

export interface SessionEndedEvent extends WebSocketEvent {
  type: 'SESSION_ENDED';
  data: {
    sessionId: string;
    endTime: string;
  };
}

export interface AttendanceRecordedEvent extends WebSocketEvent {
  type: 'ATTENDANCE_RECORDED';
  data: StudentClassAttendance;
}

export interface LiveUpdateEvent extends WebSocketEvent {
  type: 'LIVE_UPDATE';
  data: {
    sessionId: string;
    totalRecorded: number;
    totalExpected: number;
    attendanceRate: number;
  };
}

export interface LinkGeneratedEvent extends WebSocketEvent {
  type: 'LINK_GENERATED';
  data: AttendanceLink;
}

export interface BiometricEnrolledEvent extends WebSocketEvent {
  type: 'BIOMETRIC_ENROLLED';
  data: {
    studentId: string;
    provider: string;
  };
}

export interface AttendanceErrorEvent extends WebSocketEvent {
  type: 'ERROR';
  data: {
    error: string;
    sessionId?: string;
  };
}

// Query Parameters
export interface AttendanceHistoryFilters {
  page?: number;
  limit?: number;
  courseCode?: string;
  status?: ClassAttendanceStatus;
  startDate?: string;
  endDate?: string;
}

export interface SessionFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  courseCode?: string;
  status?: ClassSessionStatus;
}

export interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  courseCode?: string;
  lecturerId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'course';
}
