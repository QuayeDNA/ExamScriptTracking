# Class Attendance API - Mobile Integration Guide

**Target Platform:** React Native with Expo (TypeScript)  
**Use Case:** Lecturer View - Record and Manage Attendance  
**Base URL:** `/api/class-attendance`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Migration from Old API](#migration-from-old-api)
3. [Type Definitions](#type-definitions)
4. [Session Management](#session-management)
5. [Recording Attendance](#recording-attendance)
6. [Assistant Collaboration](#assistant-collaboration)
7. [Link Generation](#link-generation)
8. [Bulk Operations](#bulk-operations)
9. [Templates](#templates)
10. [WebSocket Integration](#websocket-integration)
11. [Implementation Examples](#implementation-examples)

---

## Overview

The mobile app provides a comprehensive lecturer interface for:

- **Session Management:** Create, monitor, and end attendance sessions
- **Multi-Method Recording:** QR scanning, manual entry, biometric, and self-service links
- **Real-Time Monitoring:** Live updates as students mark attendance
- **Assistant Collaboration:** Add teaching assistants to help record attendance
- **Bulk Operations:** Confirm or reject multiple attendance records at once
- **Templates:** Save and reuse common session configurations

---

## Migration from Old API

### Type Name Changes

Update your existing TypeScript types:

```typescript
// OLD TYPES (DEPRECATED)
ClassAttendanceRecord → AttendanceSession
ClassAttendance → StudentAttendance
RecordingStatus → SessionStatus
AttendanceMethod → VerificationMethod

// OLD FIELDS (DEPRECATED)
recordId → sessionId
scanTime → markedAt
recordedBy → markedBy
geolocation → geofence
```

### API Endpoint Changes

```typescript
// OLD ENDPOINTS (mobile/api/classAttendance.ts)
POST /api/class-attendance/start-recording
POST /api/class-attendance/record
POST /api/class-attendance/end-recording
GET /api/class-attendance/active

// NEW ENDPOINTS (USE THESE)
POST /api/class-attendance/sessions
POST /api/class-attendance/sessions/:id/record
POST /api/class-attendance/sessions/:id/end
GET /api/class-attendance/sessions/active
```

### Updated API Client

Create or update `mobile/api/classAttendance.ts`:

```typescript
import apiClient from '@/lib/api-client';
import type {
  AttendanceSession,
  StudentAttendance,
  SessionStatus,
  AttendanceStatus,
  VerificationMethod,
  AttendanceLink
} from '@/types';

// Session Management
export async function createSession(data: CreateSessionRequest): Promise<CreateSessionResponse> {
  const response = await apiClient.post('/class-attendance/sessions', data);
  return response.data;
}

export async function getActiveSessions(): Promise<AttendanceSession[]> {
  const response = await apiClient.get('/class-attendance/sessions/active');
  return response.data;
}

export async function getSessionDetails(sessionId: string): Promise<SessionDetailsResponse> {
  const response = await apiClient.get(`/class-attendance/sessions/${sessionId}`);
  return response.data;
}

export async function endSession(sessionId: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/class-attendance/sessions/${sessionId}/end`);
  return response.data;
}

export async function deleteSession(sessionId: string): Promise<{ message: string }> {
  const response = await apiClient.delete(`/class-attendance/sessions/${sessionId}`);
  return response.data;
}

// Recording Attendance
export async function recordAttendance(
  sessionId: string,
  data: RecordAttendanceRequest
): Promise<RecordAttendanceResponse> {
  const response = await apiClient.post(
    `/class-attendance/sessions/${sessionId}/record`,
    data
  );
  return response.data;
}

export async function recordBulkAttendance(
  sessionId: string,
  data: BulkRecordRequest
): Promise<BulkRecordResponse> {
  const response = await apiClient.post(
    `/class-attendance/sessions/${sessionId}/record/bulk`,
    data
  );
  return response.data;
}

// Student Search
export async function searchStudents(query: string): Promise<Student[]> {
  const response = await apiClient.get('/class-attendance/students/search', {
    params: { q: query, limit: 10 }
  });
  return response.data.students;
}

// Link Generation
export async function generateAttendanceLink(
  sessionId: string,
  data: GenerateLinkRequest
): Promise<AttendanceLink> {
  const response = await apiClient.post(
    `/class-attendance/sessions/${sessionId}/links`,
    data
  );
  return response.data;
}

export async function getActiveLinks(sessionId: string): Promise<AttendanceLink[]> {
  const response = await apiClient.get(`/class-attendance/sessions/${sessionId}/links`);
  return response.data;
}

export async function revokeLink(token: string): Promise<{ message: string }> {
  const response = await apiClient.delete(`/class-attendance/links/${token}`);
  return response.data;
}

// Assistant Management
export async function addAssistant(
  sessionId: string,
  assistantId: string
): Promise<{ message: string }> {
  const response = await apiClient.post(
    `/class-attendance/sessions/${sessionId}/assistants`,
    { assistantId }
  );
  return response.data;
}

export async function removeAssistant(
  sessionId: string,
  assistantId: string
): Promise<{ message: string }> {
  const response = await apiClient.delete(
    `/class-attendance/sessions/${sessionId}/assistants/${assistantId}`
  );
  return response.data;
}

// Bulk Operations
export async function bulkConfirmAttendance(
  sessionId: string,
  data: BulkConfirmRequest
): Promise<BulkConfirmResponse> {
  const response = await apiClient.post(
    `/class-attendance/sessions/${sessionId}/confirm-bulk`,
    data
  );
  return response.data;
}

// Update/Delete Individual Records
export async function updateAttendanceStatus(
  attendanceId: string,
  data: UpdateStatusRequest
): Promise<StudentAttendance> {
  const response = await apiClient.patch(
    `/class-attendance/${attendanceId}`,
    data
  );
  return response.data;
}

export async function deleteAttendance(attendanceId: string): Promise<{ message: string }> {
  const response = await apiClient.delete(`/class-attendance/${attendanceId}`);
  return response.data;
}

// Templates
export async function saveSessionTemplate(
  data: { sessionId: string; name: string }
): Promise<{ templateId: string; message: string }> {
  const response = await apiClient.post('/class-attendance/templates', data);
  return response.data;
}

export async function createFromTemplate(templateId: string): Promise<CreateSessionResponse> {
  const response = await apiClient.post('/class-attendance/sessions/from-template', {
    templateId
  });
  return response.data;
}

// History & Export
export async function getAttendanceHistory(params?: {
  page?: number;
  limit?: number;
  courseCode?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  sessions: AttendanceSession[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const response = await apiClient.get('/class-attendance/history', { params });
  return response.data;
}

export async function exportSession(sessionId: string): Promise<Blob> {
  const response = await apiClient.get(
    `/class-attendance/sessions/${sessionId}/export`,
    { responseType: 'blob' }
  );
  return response.data;
}
    `/class-attendance/sessions/${sessionId}/export`,
    { responseType: 'blob' }
  );
  return response.data;
}
```

---

## Type Definitions

### Core Types (Backend Synchronized)

```typescript
// Enums (from @prisma/client)
export enum SessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
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

// Request/Response Interfaces
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
    location?: {
      lat: number;
      lng: number;
    };
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
      name: string;
    };
  };
}

export interface BulkRecordRequest {
  students: Array<{
    identifier: string;
    method: VerificationMethod;
    status?: AttendanceStatus;
  }>;
}

export interface BulkRecordResponse {
  success: boolean;
  message: string;
  data: {
    successful: number;
    failed: number;
    results: Array<{
      student: { id: string; indexNumber: string; name: string };
      success: boolean;
      error?: string;
    }>;
  };
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

export interface AttendanceLink {
  id: string;
  token: string;
  url: string;
  qrCodeData: string;
  expiresAt: string;
  maxUses?: number;
  requiresLocation: boolean;
  geofence?: {
    lat: number;
    lng: number;
    radiusMeters: number;
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

export interface UpdateStatusRequest {
  status: AttendanceStatus;
  notes?: string;
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
    recentStudents: Array<{
      indexNumber: string;
      name: string;
      scanTime: string;
      method: VerificationMethod;
      status: AttendanceStatus;
    }>;
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
  maxUsage: number | null;
  createdBy: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface Student {
  studentId: string;
  indexNumber: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string;
  phone: string | null;
  programme: string;
  level: number;
  profileImageUrl: string | null;
}

// Request Types
export interface CreateSessionRequest {
  courseCode: string;
  courseName: string;
  academicYear: string;
  semester: string;
  venue?: string;
  expectedStudents?: number;
}

export interface RecordAttendanceRequest {
  studentId: string;
  verificationMethod: VerificationMethod;
  status?: AttendanceStatus;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface BulkRecordRequest {
  students: Array<{
    studentId: string;
    status?: AttendanceStatus;
    notes?: string;
  }>;
  verificationMethod: VerificationMethod;
}

export interface GenerateLinkRequest {
  expiryMinutes?: number;
  requiresLocation?: boolean;
  geofence?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  maxUsage?: number;
}

export interface UpdateStatusRequest {
  status: AttendanceStatus;
  notes?: string;
  metadata?: Record<string, any>;
}

// Response Types
export interface RecordAttendanceResponse {
  success: boolean;
  message: string;
  attendance: StudentAttendance;
}

export interface BulkRecordResponse {
  success: boolean;
  recorded: number;
  failed: number;
  results: Array<{
    studentId: string;
    success: boolean;
    error?: string;
    attendance?: StudentAttendance;
  }>;
}

export interface BulkConfirmResponse {
  success: boolean;
  updated: number;
  failed: number;
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
  templateId: string;
  templateName: string;
  courseCode: string;
  courseName: string;
  venue: string | null;
  expectedStudents: number | null;
  createdBy: string;
  createdAt: string;
}

export interface HistoryParams {
  page?: number;
  limit?: number;
  status?: SessionStatus;
  courseCode?: string;
  startDate?: string;
  endDate?: string;
}

export interface HistoryResponse {
  sessions: AttendanceSession[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
```

---

## Session Management

### 1. Create New Session

**Endpoint:** `POST /sessions/create`

#### Request
```typescript
import { createSession } from '@/api/classAttendance';

const newSession = await createSession({
  courseCode: 'CS101',
  courseName: 'Introduction to Computer Science',
  academicYear: '2025/2026',
  semester: '1',
  venue: 'Room A204',
  expectedStudents: 50
});
```

#### Response
```json
{
  "sessionId": "ses_xyz789abc",
  "courseCode": "CS101",
  "courseName": "Introduction to Computer Science",
  "lecturerId": "usr_lecturer1",
  "lecturerName": "Dr. John Smith",
  "academicYear": "2025/2026",
  "semester": "1",
  "venue": "Room A204",
  "expectedStudents": 50,
  "status": "IN_PROGRESS",
  "startTime": "2026-01-08T08:00:00Z",
  "endTime": null,
  "createdAt": "2026-01-08T08:00:00Z",
  "updatedAt": "2026-01-08T08:00:00Z"
}
```

---

### 2. Get Active Sessions

**Endpoint:** `GET /sessions/active`

#### Request
```typescript
const activeSessions = await getActiveSessions();
```

#### Response
```json
[
  {
    "sessionId": "ses_xyz789",
    "courseCode": "CS101",
    "courseName": "Introduction to Computer Science",
    "status": "IN_PROGRESS",
    "startTime": "2026-01-08T08:00:00Z",
    "venue": "Room A204",
    "stats": {
      "totalRecorded": 42,
      "confirmed": 35,
      "pending": 7
    }
  }
]
```

---

### 3. Get Session Details

**Endpoint:** `GET /sessions/:sessionId`

#### Request
```typescript
const sessionDetails = await getSessionDetails('ses_xyz789');
```

#### Response
```json
{
  "sessionId": "ses_xyz789",
  "courseCode": "CS101",
  "courseName": "Introduction to Computer Science",
  "status": "IN_PROGRESS",
  "startTime": "2026-01-08T08:00:00Z",
  "venue": "Room A204",
  "attendanceRecords": [
    {
      "attendanceId": "att_001",
      "studentId": "std_001",
      "status": "PRESENT",
      "verificationMethod": "QR_SCAN",
      "markedAt": "2026-01-08T08:15:00Z",
      "confirmed": true,
      "student": {
        "indexNumber": "20210001",
        "firstName": "Jane",
        "lastName": "Doe",
        "profileImageUrl": "/uploads/students/20210001.jpg"
      }
    }
  ],
  "assistants": [
    {
      "userId": "usr_assistant1",
      "role": "CLASS_REP",
      "addedAt": "2026-01-08T08:05:00Z",
      "user": {
        "firstName": "John",
        "lastName": "Assistant"
      }
    }
  ],
  "activeLinks": [
    {
      "linkId": "lnk_abc123",
      "token": "abc123xyz789",
      "expiresAt": "2026-01-08T10:00:00Z",
      "requiresLocation": true,
      "usageCount": 15
    }
  ],
  "stats": {
    "totalRecorded": 42,
    "confirmed": 35,
    "pending": 7,
    "byStatus": {
      "PRESENT": 40,
      "LATE": 2,
      "EXCUSED": 0,
      "ABSENT": 0
    },
    "byMethod": {
      "QR_SCAN": 20,
      "MANUAL_ENTRY": 5,
      "LINK_SELF_MARK": 15,
      "BIOMETRIC_FINGERPRINT": 2,
      "BIOMETRIC_FACE": 0
    },
    "attendanceRate": 84.0
  }
}
```

---

### 4. End Session

**Endpoint:** `POST /sessions/:sessionId/end`

#### Request
```typescript
await endSession('ses_xyz789');
```

#### Response
```json
{
  "message": "Session ended successfully",
  "session": {
    "sessionId": "ses_xyz789",
    "status": "COMPLETED",
    "endTime": "2026-01-08T10:00:00Z",
    "summary": {
      "totalRecorded": 42,
      "attendanceRate": 84.0,
      "duration": "2h 0m"
    }
  }
}
```

---

### 5. Delete Session

**Endpoint:** `DELETE /sessions/:sessionId`

#### Request
```typescript
await deleteSession('ses_xyz789');
```

#### Response
```json
{
  "message": "Session and all related attendance records deleted successfully"
}
```

---

## Recording Attendance

### 1. Record Single Attendance

**Endpoint:** `POST /sessions/:sessionId/record`

#### QR Scan
```typescript
const result = await recordAttendance('ses_xyz789', {
  studentId: 'std_001',
  verificationMethod: 'QR_SCAN',
  status: 'PRESENT'
});
```

#### Manual Entry
```typescript
const result = await recordAttendance('ses_xyz789', {
  studentId: 'std_001',
  verificationMethod: 'MANUAL_ENTRY',
  status: 'LATE',
  notes: 'Arrived 15 minutes late'
});
```

#### Biometric
```typescript
const result = await recordAttendance('ses_xyz789', {
  studentId: 'std_001',
  verificationMethod: 'BIOMETRIC_FINGERPRINT',
  status: 'PRESENT',
  metadata: {
    biometricConfidence: 0.98,
    deviceId: 'fingerprint_scanner_01'
  }
});
```

#### Response
```json
{
  "success": true,
  "message": "Attendance recorded successfully",
  "attendance": {
    "attendanceId": "att_001",
    "sessionId": "ses_xyz789",
    "studentId": "std_001",
    "status": "PRESENT",
    "verificationMethod": "QR_SCAN",
    "markedAt": "2026-01-08T08:15:00Z",
    "markedBy": "usr_lecturer1",
    "confirmed": true,
    "student": {
      "indexNumber": "20210001",
      "firstName": "Jane",
      "lastName": "Doe",
      "programme": "BSc Computer Science",
      "level": 200
    }
  }
}
```

---

### 2. Record Bulk Attendance

**Endpoint:** `POST /sessions/:sessionId/record-bulk`

#### Request
```typescript
const result = await recordBulkAttendance('ses_xyz789', {
  students: [
    { studentId: 'std_001', status: 'PRESENT' },
    { studentId: 'std_002', status: 'PRESENT' },
    { studentId: 'std_003', status: 'LATE', notes: 'Arrived late' }
  ],
  verificationMethod: 'MANUAL_ENTRY'
});
```

#### Response
```json
{
  "success": true,
  "recorded": 3,
  "failed": 0,
  "results": [
    {
      "studentId": "std_001",
      "success": true,
      "attendance": {
        "attendanceId": "att_001",
        "status": "PRESENT",
        "markedAt": "2026-01-08T08:15:00Z"
      }
    },
    {
      "studentId": "std_002",
      "success": true,
      "attendance": {
        "attendanceId": "att_002",
        "status": "PRESENT",
        "markedAt": "2026-01-08T08:15:01Z"
      }
    },
    {
      "studentId": "std_003",
      "success": true,
      "attendance": {
        "attendanceId": "att_003",
        "status": "LATE",
        "markedAt": "2026-01-08T08:15:02Z"
      }
    }
  ]
}
```

---

### 3. Student Search (Autocomplete)

**Endpoint:** `GET /students/search`

#### Request
```typescript
// As user types "Jane"
const students = await searchStudents('Jane');
```

#### Response
```json
{
  "students": [
    {
      "studentId": "std_001",
      "indexNumber": "20210001",
      "firstName": "Jane",
      "lastName": "Doe",
      "programme": "BSc Computer Science",
      "level": 200,
      "profileImageUrl": "/uploads/students/20210001.jpg"
    },
    {
      "studentId": "std_045",
      "indexNumber": "20210045",
      "firstName": "Janet",
      "lastName": "Smith",
      "programme": "BSc Computer Science",
      "level": 200,
      "profileImageUrl": null
    }
  ]
}
```

---

## Assistant Collaboration

### 1. Add Assistant to Session

**Endpoint:** `POST /sessions/:sessionId/assistants`

#### Request
```typescript
await addAssistant('ses_xyz789', 'usr_classrep1');
```

#### Response
```json
{
  "message": "Assistant added successfully",
  "assistant": {
    "sessionId": "ses_xyz789",
    "userId": "usr_classrep1",
    "role": "CLASS_REP",
    "addedAt": "2026-01-08T08:05:00Z",
    "user": {
      "firstName": "John",
      "lastName": "Assistant",
      "email": "john.assistant@university.edu"
    }
  }
}
```

---

### 2. Remove Assistant

**Endpoint:** `DELETE /sessions/:sessionId/assistants/:assistantId`

#### Request
```typescript
await removeAssistant('ses_xyz789', 'usr_classrep1');
```

#### Response
```json
{
  "message": "Assistant removed successfully"
}
```

---

## Link Generation

### 1. Generate Attendance Link

**Endpoint:** `POST /sessions/:sessionId/generate-link`

#### Without Location (Simple Link)
```typescript
const link = await generateAttendanceLink('ses_xyz789', {
  expiryMinutes: 30,
  requiresLocation: false
});
```

#### With Geofencing
```typescript
// Get current location first
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High
});

const link = await generateAttendanceLink('ses_xyz789', {
  expiryMinutes: 60,
  requiresLocation: true,
  geofence: {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    radius: 100 // meters
  },
  maxUsage: 50
});
```

#### Response
```json
{
  "linkId": "lnk_abc123xyz",
  "sessionId": "ses_xyz789",
  "token": "abc123xyz789def456",
  "linkType": "ATTENDANCE",
  "expiresAt": "2026-01-08T09:30:00Z",
  "isActive": true,
  "requiresLocation": true,
  "geofence": {
    "latitude": 5.6037,
    "longitude": -0.1870,
    "radius": 100
  },
  "usageCount": 0,
  "maxUsage": 50,
  "fullUrl": "https://attendance.university.edu/mark/abc123xyz789def456",
  "qrCode": "data:image/png;base64,iVBOR..."
}
```

---

### 2. Revoke Link

**Endpoint:** `POST /sessions/:sessionId/links/:linkId/revoke`

#### Request
```typescript
await revokeLink('ses_xyz789', 'lnk_abc123xyz');
```

#### Response
```json
{
  "message": "Link revoked successfully"
}
```

---

## Bulk Operations

### 1. Bulk Confirm/Reject Attendance

**Endpoint:** `POST /sessions/:sessionId/bulk-confirm`

#### Confirm Multiple Records
```typescript
await bulkConfirmAttendance(
  'ses_xyz789',
  ['att_001', 'att_002', 'att_003'],
  true // confirm
);
```

#### Reject Multiple Records
```typescript
await bulkConfirmAttendance(
  'ses_xyz789',
  ['att_004', 'att_005'],
  false // reject
);
```

#### Response
```json
{
  "success": true,
  "updated": 3,
  "failed": 0,
  "message": "Successfully confirmed 3 attendance records"
}
```

---

### 2. Update Attendance Status

**Endpoint:** `PATCH /sessions/:sessionId/attendance/:attendanceId`

#### Request
```typescript
const updated = await updateAttendanceStatus(
  'ses_xyz789',
  'att_001',
  {
    status: 'LATE',
    notes: 'Changed from PRESENT to LATE - arrived after roll call',
    metadata: {
      changedReason: 'Manual correction',
      originalStatus: 'PRESENT'
    }
  }
);
```

#### Response
```json
{
  "attendanceId": "att_001",
  "sessionId": "ses_xyz789",
  "studentId": "std_001",
  "status": "LATE",
  "verificationMethod": "QR_SCAN",
  "markedAt": "2026-01-08T08:15:00Z",
  "markedBy": "usr_lecturer1",
  "confirmed": true,
  "notes": "Changed from PRESENT to LATE - arrived after roll call",
  "metadata": {
    "changedReason": "Manual correction",
    "originalStatus": "PRESENT",
    "lastModifiedAt": "2026-01-08T09:30:00Z",
    "lastModifiedBy": "usr_lecturer1"
  }
}
```

---

### 3. Delete Attendance (Undo)

**Endpoint:** `DELETE /sessions/:sessionId/attendance/:attendanceId`

#### Request
```typescript
await deleteAttendance('ses_xyz789', 'att_001');
```

#### Response
```json
{
  "message": "Attendance record deleted successfully"
}
```

---

## Templates

### 1. Save Session as Template

**Endpoint:** `POST /sessions/:sessionId/save-template`

#### Request
```typescript
const result = await saveSessionTemplate('ses_xyz789', 'CS101 Weekly Lecture');
```

#### Response
```json
{
  "templateId": "tpl_abc123",
  "message": "Session template saved successfully"
}
```

---

### 2. Get All Templates

**Endpoint:** `GET /templates`

#### Request
```typescript
const templates = await getSessionTemplates();
```

#### Response
```json
{
  "templates": [
    {
      "templateId": "tpl_abc123",
      "templateName": "CS101 Weekly Lecture",
      "courseCode": "CS101",
      "courseName": "Introduction to Computer Science",
      "venue": "Room A204",
      "expectedStudents": 50,
      "createdBy": "usr_lecturer1",
      "createdAt": "2026-01-08T08:00:00Z"
    }
  ]
}
```

---

### 3. Create Session from Template

**Endpoint:** `POST /templates/create-session`

#### Request
```typescript
const newSession = await createFromTemplate('tpl_abc123');
```

#### Response
```json
{
  "sessionId": "ses_new123",
  "courseCode": "CS101",
  "courseName": "Introduction to Computer Science",
  "venue": "Room A204",
  "expectedStudents": 50,
  "status": "IN_PROGRESS",
  "startTime": "2026-01-08T10:00:00Z",
  "message": "Session created from template successfully"
}
```

---

## WebSocket Integration

### Setup WebSocket Connection

```typescript
// hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    async function connect() {
      const token = await AsyncStorage.getItem('auth_token');
      
      const newSocket = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connected');
      });

      newSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      setSocket(newSocket);
    }

    connect();

    return () => {
      socket?.disconnect();
    };
  }, []);

  return socket;
}
```

### Listen to Events

```typescript
// In your component
const socket = useSocket();
const [liveStats, setLiveStats] = useState<LiveUpdateEvent['data'] | null>(null);

useEffect(() => {
  if (!socket) return;

  // Join session room
  socket.emit('attendance:joinSession', sessionId);

  // Listen for new attendance records
  socket.on('attendance:recorded', (event: AttendanceRecordedEvent) => {
    console.log('New attendance:', event.data);
    // Update UI - add to recent recordings list
    addRecentRecording(event.data);
  });

  // Listen for live stats updates
  socket.on('attendance:liveUpdate', (event: LiveUpdateEvent) => {
    console.log('Live update:', event.data);
    setLiveStats(event.data);
  });

  // Listen for session started
  socket.on('attendance:sessionStarted', (event: SessionStartedEvent) => {
    console.log('Session started:', event.data);
    // Update session status
  });

  // Listen for session ended
  socket.on('attendance:sessionEnded', (event: SessionEndedEvent) => {
    console.log('Session ended:', event.data);
    // Show summary and navigate
  });

  // Listen for link generation
  socket.on('attendance:linkGenerated', (data) => {
    console.log('Link generated:', data);
    // Update link display
  });

  // Listen for errors
  socket.on('attendance:error', (data) => {
    console.log('Error:', data);
    // Show error message
  });

  return () => {
    socket.emit('attendance:leaveSession', sessionId);
    socket.off('attendance:recorded');
    socket.off('attendance:liveUpdate');
    socket.off('attendance:sessionStarted');
    socket.off('attendance:sessionEnded');
    socket.off('attendance:linkGenerated');
    socket.off('attendance:error');
  };
}, [socket, sessionId]);
```

---

## Implementation Examples

### Complete Session Lifecycle

```typescript
// screens/AttendanceSessionScreen.tsx

import { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import {
  createSession,
  getSessionDetails,
  recordAttendance,
  endSession,
  type AttendanceSession,
  type SessionDetailsResponse
} from '@/api/classAttendance';
import { useSocket } from '@/hooks/useSocket';

export default function AttendanceSessionScreen() {
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [details, setDetails] = useState<SessionDetailsResponse | null>(null);
  const socket = useSocket();

  // 1. Create session
  async function handleCreateSession() {
    try {
      const response = await createSession({
        courseCode: 'CS101',
        courseName: 'Introduction to Computer Science',
        venue: 'Room A204',
        expectedStudentCount: 50
      });

      setSession(response.data);
      loadSessionDetails(response.data.id);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }

  // 2. Load session details
  async function loadSessionDetails(sessionId: string) {
    try {
      const data = await getSessionDetails(sessionId);
      setDetails(data);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }

  // 3. Record attendance (QR scan handler)
  async function handleQRScan(qrData: string) {
    if (!session) return;

    try {
      // Parse QR data to get student identifier (index number, etc.)
      const identifier = parseQRCode(qrData);

      await recordAttendance(session.id, {
        identifier,
        method: VerificationMethod.QR_SCAN,
        status: AttendanceStatus.PRESENT
      });

      // Success feedback
      playSuccessSound();
      showCheckmark();

    } catch (error) {
      console.error('Failed to record attendance:', error);
      showError(error.message);
    }
  }

  // 4. Listen for real-time updates
  useEffect(() => {
    if (!socket || !session) return;

    socket.on('attendance:recorded', (data) => {
      if (data.sessionId === session.sessionId) {
        // Refresh details to get latest stats
        loadSessionDetails(session.sessionId);
      }
    });

    socket.on('attendance:liveUpdate', (data) => {
      if (data.sessionId === session.sessionId) {
        // Update live stats without full refresh
        setDetails(prev => prev ? {
          ...prev,
          stats: data.stats
        } : null);
      }
    });

    return () => {
      socket.off('attendance:recorded');
      socket.off('attendance:liveUpdate');
    };
  }, [socket, session]);

  // 5. End session
  async function handleEndSession() {
    if (!session) return;

    try {
      await endSession(session.sessionId);
      
      // Show summary
      showSessionSummary(details?.stats);
      
      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  return (
    <View>
      {!session ? (
        <Button title="Start New Session" onPress={handleCreateSession} />
      ) : (
        <>
          <Text>{details?.courseCode} - {details?.courseName}</Text>
          <Text>Recorded: {details?.stats.totalRecorded} / {details?.expectedStudents}</Text>
          <Text>Pending Confirmation: {details?.stats.pending}</Text>
          
          <Button title="Scan QR Code" onPress={() => openQRScanner(handleQRScan)} />
          <Button title="End Session" onPress={handleEndSession} />
        </>
      )}
    </View>
  );
}
```

### Self-Service Link Generation

```typescript
// components/LinkGeneratorModal.tsx

import { useState } from 'react';
import { View, Text, Switch, Button, Image } from 'react-native';
import * as Location from 'expo-location';
import { generateAttendanceLink, type AttendanceLink } from '@/api/classAttendance';

export default function LinkGeneratorModal({ sessionId, onClose }) {
  const [requireLocation, setRequireLocation] = useState(true);
  const [expiryMinutes, setExpiryMinutes] = useState(30);
  const [link, setLink] = useState<AttendanceLink | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    
    try {
      let geofence;
      
      if (requireLocation) {
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Location permission is required for geofencing');
          return;
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        geofence = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          radius: 100 // 100 meters
        };
      }

      const result = await generateAttendanceLink(sessionId, {
        expiryMinutes,
        requiresLocation: requireLocation,
        geofence
      });

      setLink(result);
    } catch (error) {
      console.error('Failed to generate link:', error);
      alert('Failed to generate link: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Text>Generate Attendance Link</Text>
      
      <View>
        <Text>Require Location Verification</Text>
        <Switch value={requireLocation} onValueChange={setRequireLocation} />
      </View>

      <View>
        <Text>Expires in: {expiryMinutes} minutes</Text>
        {/* Add slider for expiry time */}
      </View>

      <Button 
        title={loading ? 'Generating...' : 'Generate Link'}
        onPress={handleGenerate}
        disabled={loading}
      />

      {link && (
        <View>
          <Text>Link Generated!</Text>
          
          {/* Show QR Code */}
          <Image 
            source={{ uri: link.qrCode }}
            style={{ width: 250, height: 250 }}
          />
          
          {/* Copy Link */}
          <Button 
            title="Copy Link"
            onPress={() => Clipboard.setString(link.fullUrl)}
          />
          
          <Text>Expires: {new Date(link.expiresAt).toLocaleString()}</Text>
          {link.requiresLocation && (
            <Text>📍 Location verification enabled</Text>
          )}
        </View>
      )}
    </View>
  );
}
```

---

## Flow Diagrams

### Quick Session Flow (Most Common)

```
1. Tap "New Session"
   ↓
2. createSession() → Get sessionId
   ↓
3. Open QR Scanner
   ↓
4. For each scan:
   recordAttendance(sessionId, studentId, 'QR_SCAN')
   ↓
5. Listen to WebSocket for live updates
   ↓
6. endSession(sessionId)
   ↓
7. Show summary & navigate back
```

### Self-Service Link Flow

```
1. createSession()
   ↓
2. getCurrentLocation()
   ↓
3. generateAttendanceLink(sessionId, {geofence, expiry})
   ↓
4. Display QR code on screen / Share link
   ↓
5. Listen to WebSocket for attendance:recorded events
   ↓
6. Review pending attendance (if any)
   ↓
7. bulkConfirmAttendance(sessionId, attendanceIds, true)
   ↓
8. endSession(sessionId)
```

### Assistant Collaboration Flow

```
1. Lecturer: createSession()
   ↓
2. Lecturer: addAssistant(sessionId, assistantUserId)
   ↓
3. Assistant opens app → sees active session
   ↓
4. Assistant: recordAttendance() (same as lecturer)
   ↓
5. Both devices get WebSocket updates
   ↓
6. Lecturer: endSession() (only lecturer can end)
```

---

## Best Practices

### 1. Offline Support
```typescript
// Store recordings locally when offline
import AsyncStorage from '@react-native-async-storage/async-storage';

async function recordAttendanceOffline(sessionId: string, data: RecordAttendanceRequest) {
  const offlineQueue = await AsyncStorage.getItem('offline_attendance') || '[]';
  const queue = JSON.parse(offlineQueue);
  
  queue.push({
    sessionId,
    data,
    timestamp: new Date().toISOString()
  });
  
  await AsyncStorage.setItem('offline_attendance', JSON.stringify(queue));
}

// Sync when back online
async function syncOfflineRecordings() {
  const offlineQueue = await AsyncStorage.getItem('offline_attendance') || '[]';
  const queue = JSON.parse(offlineQueue);
  
  for (const item of queue) {
    try {
      await recordAttendance(item.sessionId, item.data);
    } catch (error) {
      console.error('Failed to sync:', error);
    }
  }
  
  await AsyncStorage.removeItem('offline_attendance');
}
```

### 2. Error Handling
```typescript
try {
  await recordAttendance(sessionId, data);
} catch (error) {
  if (error.response?.status === 409) {
    // Already marked
    showToast('Student already marked for this session');
  } else if (error.response?.status === 404) {
    // Student not found
    showToast('Student not found. Check QR code.');
  } else {
    // Generic error
    showToast('Failed to record attendance');
  }
}
```

### 3. Performance Optimization
```typescript
// Debounce search
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query: string) => {
  const results = await searchStudents(query);
  setSearchResults(results);
}, 300);
```

---

**Document Version:** 1.0  
**Last Updated:** January 8, 2026  
**Backend API Base:** `/api/class-attendance`
