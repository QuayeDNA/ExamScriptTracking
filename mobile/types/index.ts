/* eslint-disable @typescript-eslint/no-redeclare */
import type { IncidentAttachment } from "../api/incidents";

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

export interface Student {
  id: string;
  indexNumber: string;
  firstName: string;
  lastName: string;
  program: string;
  option?: string; // Program option
  department?: string; // Department
  level: number;
  qrCode: string;
  profilePicture: string;
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
  isArchived: boolean;
  invigilatorId?: string;
  invigilatorName?: string;
  invigilators?: ExamSessionInvigilator[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
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

export enum InvigilatorRole {
  PRIMARY = "PRIMARY",
  ASSISTANT = "ASSISTANT",
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
  details?: {
    path: string[];
    message: string;
  }[];
  status?: number;
  code?: string;
}

// ============================================
// Incident Management Types
// ============================================

export const IncidentType = {
  MISSING_SCRIPT: "MISSING_SCRIPT",
  DAMAGED_SCRIPT: "DAMAGED_SCRIPT",
  MALPRACTICE: "MALPRACTICE",
  STUDENT_ILLNESS: "STUDENT_ILLNESS",
  VENUE_ISSUE: "VENUE_ISSUE",
  COUNT_DISCREPANCY: "COUNT_DISCREPANCY",
  LATE_SUBMISSION: "LATE_SUBMISSION",
  OTHER: "OTHER",
} as const;

export type IncidentType = (typeof IncidentType)[keyof typeof IncidentType];

export const IncidentSeverity = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export type IncidentSeverity =
  (typeof IncidentSeverity)[keyof typeof IncidentSeverity];

export const IncidentStatus = {
  REPORTED: "REPORTED",
  INVESTIGATING: "INVESTIGATING",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
  ESCALATED: "ESCALATED",
} as const;

export type IncidentStatus =
  (typeof IncidentStatus)[keyof typeof IncidentStatus];

export interface Incident {
  id: string;
  incidentNumber: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  location?: string;
  incidentDate?: string;
  isConfidential: boolean;
  autoCreated: boolean;
  reportedAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  metadata?: Record<string, unknown>;
  resolutionNotes?: string;
  reporterId: string;
  assigneeId?: string;
  studentId?: string;
  examSessionId?: string;
  attachments?: IncidentAttachment[];
  reporter?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  student?: {
    id: string;
    indexNumber: string;
    firstName: string;
    lastName: string;
    program?: string;
    level?: number;
  };
  examSession?: {
    id: string;
    courseCode: string;
    courseName: string;
    batchQrCode: string;
  };
  _count?: {
    comments: number;
    attachments: number;
    statusHistory: number;
  };
}
// ============================================
// Class Attendance Types
// ============================================

export const AttendanceMethod = {
  QR_CODE: "QR_CODE",
  MANUAL_INDEX: "MANUAL_INDEX",
  BIOMETRIC_FINGERPRINT: "BIOMETRIC_FINGERPRINT",
  BIOMETRIC_FACE: "BIOMETRIC_FACE",
} as const;

export type AttendanceMethod =
  (typeof AttendanceMethod)[keyof typeof AttendanceMethod];


export interface AttendanceStats {
  totalRecords: number;
  totalStudents: number;
  averageAttendanceRate: number;
  byStatus: Record<AttendanceStatus, number>;
  byCourse: {
    courseCode: string;
    courseName: string;
    sessions: number;
    totalStudents: number;
    attendanceRate: number;
  }[];
}

export interface StudentAttendanceHistory {
  studentId: string;
  student: {
    indexNumber: string;
    firstName: string;
    lastName: string;
    program: string;
  };
  records: {
    id: string;
    courseCode: string;
    courseName: string;
    scanTime: string;
    status: AttendanceStatus;
    verificationMethod?: AttendanceMethod;
  }[];
  totalAttended: number;
  totalSessions: number;
  attendanceRate: number;
}

export interface StartSessionRequest {
  deviceId: string;
  deviceName?: string;
  courseCode: string;
  courseName?: string;
  lecturerName?: string;
  notes?: string;
  totalRegisteredStudents?: number;
}

// ============================================
// Class Attendance Types (NEW - replaces old attendance types)
// ============================================

// Enums
export enum SessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
  ABSENT = 'ABSENT'
}

export enum VerificationMethod {
  QR_SCAN = 'QR_SCAN',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  BIOMETRIC_FINGERPRINT = 'BIOMETRIC_FINGERPRINT',
  BIOMETRIC_FACE = 'BIOMETRIC_FACE',
  LINK_SELF_MARK = 'LINK_SELF_MARK'
}

export enum LinkType {
  ATTENDANCE = 'ATTENDANCE',
  BIOMETRIC_ENROLLMENT = 'BIOMETRIC_ENROLLMENT'
}

export enum AssistantRole {
  ASSISTANT = 'ASSISTANT',
  OBSERVER = 'OBSERVER'
}

// Models (matching Prisma schema exactly)
export interface AttendanceSession {
  id: string;
  courseCode: string;
  courseName: string;
  venue?: string;
  lecturerName?: string;
  notes?: string;
  createdBy: string;
  creator?: User;
  startTime: string;
  endTime?: string;
  status: SessionStatus;
  expectedStudentCount: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  attendance?: StudentAttendance[];
  links?: AttendanceLink[];
  assistants?: AttendanceSessionAssistant[];
}

export interface StudentAttendance {
  id: string;
  sessionId: string;
  studentId: string;
  verificationMethod: VerificationMethod;
  status: AttendanceStatus;
  markedAt: string;
  requiresConfirmation: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  confirmer?: User;
  recordedBy: string;
  recorder?: User;
  deviceId?: string;
  biometricConfidence?: number;
  linkTokenUsed?: string;
  location?: { lat: number; lng: number };
  metadata?: any;
  session?: AttendanceSession;
  student?: Student;
}

export interface AttendanceSessionAssistant {
  id: string;
  sessionId: string;
  userId: string;
  role: AssistantRole;
  addedAt: string;
  recordedCount: number;
  session?: AttendanceSession;
  user?: User;
}

export interface AttendanceLink {
  id: string;
  linkToken: string; // 5-digit code (e.g., "12345")
  token?: string; // Alias for linkToken used in some API responses
  url?: string; // Full URL including the token
  linkType: LinkType;
  sessionId?: string;
  studentId?: string;
  createdBy: string;
  creator?: User;
  expiresAt: string;
  maxUses?: number;
  maxUsage?: number; // Alias for maxUses
  usesCount: number;
  usageCount?: number; // Alias for usesCount
  requiresLocation: boolean;
  geofence?: { lat: number; lng: number; radiusMeters: number };
  isActive: boolean;
  deactivatedAt?: string;
  createdAt: string;
  session?: AttendanceSession;
  enrollmentStudent?: Student;
}

// Request Types
export interface CreateSessionRequest {
  courseCode: string;
  courseName: string;
  venue?: string;
  notes?: string;
  expectedStudentCount?: number;
}

export interface CreateSessionResponse {
  success: boolean;
  message: string;
  data: AttendanceSession;
}

export interface RecordAttendanceRequest {
  identifier: string; // QR code, index number, or biometric hash
  method: VerificationMethod;
  status?: AttendanceStatus;
  metadata?: {
    deviceId?: string;
    biometricConfidence?: number;
    location?: { lat: number; lng: number };
  };
}

export interface RecordAttendanceResponse {
  success: boolean;
  message: string;
  data: {
    attendance: StudentAttendance;
    student: {
      id: string;
      indexNumber: string;
      name: string; // Full name: "FirstName LastName"
    };
  };
}

export interface BulkRecordRequest {
  students: {
    identifier: string;
    method: VerificationMethod;
    status?: AttendanceStatus;
  }[];
}

export interface BulkRecordResponse {
  success: boolean;
  message: string;
  data: {
    successful: number;
    failed: number;
    results: {
      student: { id: string; indexNumber: string; name: string };
      success: boolean;
      error?: string;
    }[];
  };
}

export interface UpdateStatusRequest {
  status: AttendanceStatus;
  notes?: string;
}

export interface GenerateLinkRequest {
  expiresInMinutes?: number; // 5-120, default 30
  maxUses?: number;
  requiresLocation?: boolean;
  geofence?: {
    lat: number;
    lng: number;
    radiusMeters: number; // 10-5000
  };
}

export interface SelfMarkAttendanceRequest {
  linkToken: string;
  studentId: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface LinkValidationResponse {
  valid: boolean;
  error?: string;
  errorCode?: string;
  session?: {
    id: string;
    courseCode: string;
    courseName: string;
    lecturerName?: string;
    startTime: string;
    venue?: string;
  };
  distanceFromVenue?: number;
}

export interface BulkConfirmRequest {
  attendanceIds: string[];
  confirm: boolean; // true = confirm, false = reject
}

export interface BulkConfirmResponse {
  success: boolean;
  message: string;
  data: {
    confirmed: number;
    rejected: number;
    total: number;
  };
}

// WebSocket Event Types
export interface SessionStartedEvent {
  type: "SESSION_STARTED";
  data: {
    id: string;
    courseCode: string;
    courseName: string;
    lecturerName?: string;
    startTime: string;
    createdBy: {
      id: string;
      name: string;
      role: string;
    } | null;
  };
  timestamp: string;
}

export interface AttendanceRecordedEvent {
  type: "ATTENDANCE_RECORDED";
  data: {
    id: string;
    sessionId: string;
    student: {
      id: string;
      indexNumber: string;
      firstName: string;
      lastName: string;
    };
    markedAt: string;
    status: AttendanceStatus;
    verificationMethod: VerificationMethod;
    requiresConfirmation: boolean;
    biometricConfidence?: number;
  };
  session: {
    id: string;
    courseCode: string;
    courseName: string;
  };
  timestamp: string;
}

export interface LiveUpdateEvent {
  type: "LIVE_UPDATE";
  data: {
    id: string;
    courseCode: string;
    courseName: string;
    totalStudents: number;
    currentCount: number;
    recentStudents: {
      indexNumber: string;
      name: string;
      scanTime: string;
      method: VerificationMethod;
      status: AttendanceStatus;
    }[];
  };
  timestamp: string;
}

export interface SessionEndedEvent {
  type: "SESSION_ENDED";
  data: {
    id: string;
    courseCode: string;
    courseName: string;
    endTime: string;
    totalStudents: number;
    duration: number;
    summary: {
      totalRecorded: number;
      methods: Record<string, number>;
    };
  };
  timestamp: string;
}

export interface SessionDetailsResponse extends AttendanceSession {
  attendanceRecords: StudentAttendance[];
  assistants: AttendanceSessionAssistant[];
  activeLinks: AttendanceLink[];
  stats: {
    totalRecorded: number;
    confirmed: number;
    pending: number;
    byStatus: Record<AttendanceStatus, number>;
    byMethod: Record<VerificationMethod, number>;
    attendanceRate: number;
  };
}

export interface SessionTemplate {
  id: string;
  name: string;
  courseCode: string;
  courseName: string;
  venue?: string;
  expectedStudentCount?: number;
  createdBy: string;
  createdAt: string;
}

export interface HistoryParams {
  page?: number;
  limit?: number;
  courseCode?: string;
  startDate?: string;
  endDate?: string;
}

export interface HistoryResponse {
  sessions: AttendanceSession[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  courseCode?: string;
  lecturerId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'course';
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