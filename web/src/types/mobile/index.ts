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

export interface UserActivity {
  id: string;
  type: "audit" | "incident" | "transfer" | "attendance";
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

export interface UserActivityResponse {
  activities: UserActivity[];
  summary: {
    totalActivities: number;
    auditLogs: number;
    incidents: number;
    transfers: number;
    attendance: number;
  };
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
// Mobile-specific types for web implementation
// ============================================

export interface ExpectedStudent {
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
  // Mobile app compatible properties
  attendanceRecords?: Array<{
    id: string;
    action: "ENTRY" | "EXIT" | "SUBMISSION";
    timestamp: string;
  }>;
  status?: "SUBMITTED" | "NOT_SUBMITTED";
}

export interface MobileExamSession extends ExamSession {
  expectedStudents?: ExpectedStudent[];
  attendances?: ExamAttendance[];
  transfers?: Array<{
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
}
