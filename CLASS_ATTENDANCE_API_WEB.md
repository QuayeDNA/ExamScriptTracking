# Class Attendance API - Web Integration Guide

**Target Platform:** Web Frontend (React + TypeScript)  
**Use Cases:** Admin Dashboard + Student Self-Service  
**Base URL:** `/api/attendance`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Type Definitions](#type-definitions)
4. [Student Self-Service Endpoints](#student-self-service-endpoints)
5. [Admin Dashboard Endpoints](#admin-dashboard-endpoints)
6. [WebSocket Events](#websocket-events)
7. [Error Handling](#error-handling)
8. [Implementation Examples](#implementation-examples)

---

## Overview

The web platform serves two primary user types:

### 1. **Students (Self-Service)**
- Mark attendance via shared links
- View attendance history
- Check attendance status

### 2. **Administrators**
- Monitor all attendance sessions across institution
- Generate reports and analytics
- Manage users and permissions
- Export attendance data

---

## Authentication

### Required Headers
```typescript
{
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

### Public Endpoints (No Auth Required)
- `GET /api/attendance/links/:token/validate` - Validate attendance link
- `POST /api/attendance/self-mark` - Self-mark attendance via link

### Student Endpoints (Auth Required)
- `GET /api/attendance/history` - View session history (for authenticated users)

### Admin Endpoints (Role: ADMIN, LECTURER, CLASS_REP)
- `GET /api/attendance/sessions/active` - View active sessions
- `GET /api/attendance/sessions/:id` - Get session details
- `GET /api/attendance/sessions/:id/export` - Export attendance data
- All session management endpoints

---

## Type Definitions

### Core Types

```typescript
// Enums
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

export enum LinkType {
  ATTENDANCE = 'ATTENDANCE',
  BIOMETRIC_ENROLLMENT = 'BIOMETRIC_ENROLLMENT'
}

// Session Models
export interface AttendanceSession {
  id: string;
  courseCode: string;
  courseName: string;
  venue?: string;
  lecturerName?: string;
  notes?: string;
  createdBy: string;
  startTime: string;
  endTime?: string;
  status: SessionStatus;
  expectedStudentCount: number;
  createdAt: string;
  updatedAt: string;
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

export interface Student {
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

export interface User {
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

export enum Role {
  ADMIN = 'ADMIN',
  INVIGILATOR = 'INVIGILATOR',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  FACULTY_OFFICER = 'FACULTY_OFFICER',
  LECTURER = 'LECTURER',
  CLASS_REP = 'CLASS_REP'
}
  lecturerName: string | null;
  academicYear: string;
  semester: string;
  venue: string | null;
  expectedStudents: number | null;
  status: SessionStatus;
  startTime: string; // ISO datetime
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relations (if included)
  lecturer?: User;
  attendanceRecords?: StudentAttendance[];
  assistants?: AttendanceSessionAssistant[];
  links?: AttendanceLink[];
}

export interface StudentAttendance {
  attendanceId: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  verificationMethod: VerificationMethod;
  markedAt: string; // ISO datetime
  markedBy: string; // userId
  confirmedAt: string | null;
  confirmed: boolean;
  notes: string | null;
  metadata: Record<string, any> | null;
  
  // Relations (if included)
  session?: AttendanceSession;
  student?: Student;
  marker?: User;
}

export interface AttendanceLink {
  linkId: string;
  sessionId: string;
  linkType: LinkType;
  token: string;
  expiresAt: string;
  isActive: boolean;
  requiresLocation: boolean;
  geofence: {
    latitude: number;
    longitude: number;
    radius: number;
  } | null;
  usageCount: number;
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

export interface User {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'LECTURER' | 'CLASS_REP' | 'STUDENT';
}
```

---

## Student Self-Service Endpoints

### 1. Validate Attendance Link

**Endpoint:** `GET /api/attendance/links/:token/validate`  
**Auth:** Not required  
**Description:** Validate if attendance link is active and accessible

#### Request
```typescript
GET /api/attendance/links/lnk_abc123xyz/validate?lat=5.6037&lng=-0.1870
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| lat | number | No | Latitude for geofencing validation |
| lng | number | No | Longitude for geofencing validation |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "ses_xyz789",
    "courseCode": "CS101",
    "courseName": "Introduction to Computer Science",
    "lecturerName": "Dr. John Smith",
    "startTime": "2026-01-08T08:00:00Z",
    "venue": "Room A204"
  }
}
```

#### Error Response (400)
```json
{
  "success": false,
  "error": "Invalid or expired attendance link",
  "errorCode": "LINK_NOT_FOUND"
}
```

#### Error Response (400)
```json
{
  "success": false,
  "error": "This attendance session has ended",
  "errorCode": "SESSION_ENDED"
}
```

---

### 2. Self-Mark Attendance

**Endpoint:** `POST /api/attendance/self-mark`  
**Auth:** Not required  
**Description:** Student marks their own attendance using shared link

#### Request
```typescript
POST /api/attendance/self-mark

{
  "linkToken": "lnk_abc123xyz",
  "studentId": "stu_123456",
  "location": {
    "lat": 5.6037,
    "lng": -0.1870
  }
}
```

#### Request Schema
```typescript
interface SelfMarkAttendanceRequest {
  linkToken: string;
  studentId: string;
  location?: {
    lat: number;
    lng: number;
  };
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "id": "att_123456",
    "sessionId": "ses_xyz789",
    "studentId": "stu_123456",
    "verificationMethod": "LINK_SELF_MARK",
    "status": "PRESENT",
    "markedAt": "2026-01-08T08:15:00Z",
    "requiresConfirmation": true
  }
}
```

#### Error Responses

**Student Not Found (400)**
```json
{
  "success": false,
  "error": "Student not found"
}
```

**Already Marked (400)**
```json
{
  "success": false,
  "error": "Attendance already marked for this session"
}
```

**Outside Geofence (400)**
```json
{
  "success": false,
  "error": "Location validation failed"
}
```

---

### 3. View Session History

**Endpoint:** `GET /api/attendance/history`  
**Auth:** Required (ADMIN, LECTURER, CLASS_REP)  
**Description:** View attendance session history with filtering and pagination

#### Request
```typescript
GET /api/attendance/history?page=1&limit=20&startDate=2026-01-01&endDate=2026-01-31&courseCode=CS101&status=COMPLETED

Headers:
{
  "Authorization": "Bearer <admin_jwt_token>"
}
```

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Records per page |
| startDate | string | No | - | ISO date (from) |
| endDate | string | No | - | ISO date (to) |
| courseCode | string | No | - | Filter by course |
| status | SessionStatus | No | - | Filter by session status |

#### Success Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "ses_xyz789",
      "courseCode": "CS101",
      "courseName": "Introduction to Computer Science",
      "venue": "Room A204",
      "lecturerName": "Dr. John Smith",
      "status": "COMPLETED",
      "startTime": "2026-01-08T08:00:00Z",
      "endTime": "2026-01-08T09:30:00Z",
      "expectedStudentCount": 50,
      "attendanceCount": 45,
      "createdAt": "2026-01-08T07:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```
  "message": "Attendance marked successfully. Awaiting lecturer confirmation.",
  "attendance": {
    "attendanceId": "att_abc123",
    "sessionId": "ses_xyz789",
    "studentId": "std_456",
    "status": "PRESENT",
    "verificationMethod": "LINK_SELF_MARK",
    "markedAt": "2026-01-08T08:15:30Z",
    "confirmed": false,
    "student": {
      "firstName": "Jane",
      "lastName": "Doe",
      "indexNumber": "20210001"
    }
  }
```

#### Error Responses

**Student Not Found (404)**
```json
{
  "message": "Student with index number 20210001 not found"
}
```

**Already Marked (409)**
```json
{
  "message": "Attendance already marked for this session"
}
```

**Location Required (400)**
```json
{
  "message": "Location is required for this attendance link"
}
```

**Outside Geofence (403)**
```json
{
  "message": "You are not within the required location (distance: 250m)"
}
```

---

### 3. View Student Attendance History

**Endpoint:** `GET /sessions/my-attendance`  
**Auth:** Required (Student)  
**Description:** Students can view their attendance history

#### Request
```typescript
GET /api/attendance/history?page=1&limit=20

Headers:
{
  "Authorization": "Bearer <student_jwt_token>"
}
```

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Records per page |
| courseCode | string | No | - | Filter by course |
| status | AttendanceStatus | No | - | Filter by status |
| startDate | string | No | - | ISO date (from) |
| endDate | string | No | - | ISO date (to) |

#### Success Response (200)
```json
{
  "records": [
    {
      "attendanceId": "att_001",
      "sessionId": "ses_xyz789",
      "status": "PRESENT",
      "verificationMethod": "QR_SCAN",
      "markedAt": "2026-01-08T08:15:00Z",
      "confirmed": true,
      "session": {
        "courseCode": "CS101",
        "courseName": "Introduction to Computer Science",
        "lecturerName": "Dr. John Smith",
        "venue": "Room A204",
        "startTime": "2026-01-08T08:00:00Z"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 95,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "summary": {
    "totalPresent": 90,
    "totalLate": 5,
    "totalAbsent": 0,
    "attendanceRate": 95.0
  }
}
```

---

## Admin Dashboard Endpoints

### 1. Get Active Sessions

**Endpoint:** `GET /api/attendance/sessions/active`  
**Auth:** Required (ADMIN, LECTURER, CLASS_REP)  
**Description:** Retrieve all active attendance sessions

#### Request
```typescript
GET /api/attendance/sessions/active

Headers:
{
  "Authorization": "Bearer <admin_jwt_token>"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "ses_xyz789",
      "courseCode": "CS101",
      "courseName": "Introduction to Computer Science",
      "venue": "Room A204",
      "lecturerName": "Dr. John Smith",
      "status": "IN_PROGRESS",
      "startTime": "2026-01-08T08:00:00Z",
      "expectedStudentCount": 50,
      "createdAt": "2026-01-08T07:45:00Z",
      "attendanceCount": 42,
      "creator": {
        "id": "usr_123",
        "firstName": "John",
        "lastName": "Smith",
        "role": "LECTURER"
      }
    }
  ]
}
```

---

### 2. Get Session Details with Statistics

**Endpoint:** `GET /api/attendance/sessions/:id`  
**Auth:** Required (ADMIN, LECTURER, CLASS_REP)  
**Description:** Get detailed information about a specific session with real-time stats

#### Request
```typescript
GET /api/attendance/sessions/ses_xyz789

Headers:
{
  "Authorization": "Bearer <admin_jwt_token>"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "ses_xyz789",
      "courseCode": "CS101",
      "courseName": "Introduction to Computer Science",
      "venue": "Room A204",
      "lecturerName": "Dr. John Smith",
      "status": "IN_PROGRESS",
      "startTime": "2026-01-08T08:00:00Z",
      "expectedStudentCount": 50,
      "createdAt": "2026-01-08T07:45:00Z"
    },
    "stats": {
      "totalRecorded": 42,
      "byStatus": {
        "PRESENT": 40,
        "LATE": 2,
        "ABSENT": 0
      },
      "byMethod": {
        "QR_SCAN": 35,
        "LINK_SELF_MARK": 7
      },
      "confirmationStats": {
        "confirmed": 35,
        "pending": 7
      }
    },
    "recentAttendance": [
      {
        "id": "att_123456",
        "student": {
          "id": "stu_789",
          "indexNumber": "20210001",
          "firstName": "Jane",
          "lastName": "Doe"
        },
        "status": "PRESENT",
        "verificationMethod": "QR_SCAN",
        "markedAt": "2026-01-08T08:15:00Z",
        "requiresConfirmation": false
      }
    ],
    "links": [
      {
        "id": "lnk_abc123",
        "linkToken": "lnk_abc123xyz",
        "expiresAt": "2026-01-08T10:00:00Z",
        "maxUses": null,
        "usesCount": 7,
        "isActive": true,
        "requiresLocation": true,
        "geofence": {
          "lat": 5.6037,
          "lng": -0.1870,
          "radiusMeters": 100
        }
      }
    ]
  }
}
```

---

### 3. Export Session to CSV

**Endpoint:** `GET /api/attendance/sessions/:id/export`  
**Auth:** Required (ADMIN, LECTURER, CLASS_REP)  
**Description:** Export attendance data as CSV file

#### Request
```typescript
GET /api/attendance/sessions/ses_xyz789/export

Headers:
{
  "Authorization": "Bearer <admin_jwt_token>"
}
```

#### Success Response (200)
```
Content-Type: text/csv
Content-Disposition: attachment; filename="attendance-ses_xyz789.csv"

Session ID,Course Code,Course Name,Student Index,Student Name,Status,Verification Method,Marked At,Confirmed,Location
ses_xyz789,CS101,Introduction to Computer Science,20210001,Jane Doe,PRESENT,QR_SCAN,2026-01-08T08:15:00Z,true,"5.6037,-0.1870"
ses_xyz789,CS101,Introduction to Computer Science,20210002,John Smith,PRESENT,LINK_SELF_MARK,2026-01-08T08:20:00Z,false,"5.6038,-0.1871"
```

---

### 4. Create New Session

**Endpoint:** `POST /api/attendance/sessions`  
**Auth:** Required (ADMIN, LECTURER, CLASS_REP)  
**Description:** Create a new attendance session

#### Request
```typescript
POST /api/attendance/sessions

{
  "courseCode": "CS101",
  "courseName": "Introduction to Computer Science",
  "venue": "Room A204",
  "notes": "Mid-term lecture",
  "expectedStudentCount": 50
}

Headers:
{
  "Authorization": "Bearer <admin_jwt_token>"
}
```

#### Request Schema
```typescript
interface CreateSessionRequest {
  courseCode: string;
  courseName: string;
  venue?: string;
  notes?: string;
  expectedStudentCount?: number;
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "id": "ses_xyz789",
    "courseCode": "CS101",
    "courseName": "Introduction to Computer Science",
    "venue": "Room A204",
    "status": "IN_PROGRESS",
    "startTime": "2026-01-08T08:00:00Z",
    "expectedStudentCount": 50,
    "createdAt": "2026-01-08T07:45:00Z"
  }
}
```

---

### 5. End Session

**Endpoint:** `POST /api/attendance/sessions/:id/end`  
**Auth:** Required (ADMIN, LECTURER, CLASS_REP)  
**Description:** End an active attendance session

#### Request
```typescript
POST /api/attendance/sessions/ses_xyz789/end

Headers:
{
  "Authorization": "Bearer <admin_jwt_token>"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Session ended successfully",
  "data": {
    "id": "ses_xyz789",
    "status": "COMPLETED",
    "endTime": "2026-01-08T09:30:00Z",
    "finalStats": {
      "totalRecorded": 45,
      "byStatus": {
        "PRESENT": 42,
        "LATE": 3
      }
    }
  }
}
```

---

### 6. Generate Attendance Link

**Endpoint:** `POST /api/attendance/sessions/:id/links`  
**Auth:** Required (ADMIN, LECTURER)  
**Description:** Generate a new attendance link for self-service marking

#### Request
```typescript
POST /api/attendance/sessions/ses_xyz789/links

{
  "expiresInMinutes": 30,
  "maxUses": 100,
  "requiresLocation": true,
  "geofence": {
    "lat": 5.6037,
    "lng": -0.1870,
    "radiusMeters": 100
  }
}

Headers:
{
  "Authorization": "Bearer <admin_jwt_token>"
}
```

#### Request Schema
```typescript
interface GenerateLinkRequest {
  expiresInMinutes?: number; // 5-120, default 30
  maxUses?: number;
  requiresLocation?: boolean;
  geofence?: {
    lat: number;
    lng: number;
    radiusMeters: number; // 10-5000
  };
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Link generated successfully",
  "data": {
    "id": "lnk_abc123",
    "token": "lnk_abc123xyz",
    "url": "https://app.example.com/attend/lnk_abc123xyz",
    "qrCodeData": "{\"type\":\"ATTENDANCE_LINK\",\"token\":\"lnk_abc123xyz\",\"sessionId\":\"ses_xyz789\"}",
    "expiresAt": "2026-01-08T08:30:00Z",
    "maxUses": 100,
    "requiresLocation": true,
    "geofence": {
      "lat": 5.6037,
      "lng": -0.1870,
      "radiusMeters": 100
    }
  }
}
```

---

### 7. Get Active Links

**Endpoint:** `GET /api/attendance/sessions/:id/links`  
**Auth:** Required (ADMIN, LECTURER, CLASS_REP)  
**Description:** Get all active links for a session

#### Request
```typescript
GET /api/attendance/sessions/ses_xyz789/links

Headers:
{
  "Authorization": "Bearer <admin_jwt_token>"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "lnk_abc123",
      "linkToken": "lnk_abc123xyz",
      "url": "https://app.example.com/attend/lnk_abc123xyz",
      "expiresAt": "2026-01-08T08:30:00Z",
      "maxUses": 100,
      "usageCount": 45,
      "requiresLocation": true,
      "geofence": {
        "lat": 5.6037,
        "lng": -0.1870,
        "radiusMeters": 100
      },
      "createdAt": "2026-01-08T08:00:00Z"
    }
  ]
}
```

---

### 8. Revoke Link

**Endpoint:** `DELETE /api/attendance/links/:token`  
**Auth:** Required (ADMIN, LECTURER)  
**Description:** Deactivate an attendance link

#### Request
```typescript
DELETE /api/attendance/links/lnk_abc123xyz

Headers:
{
  "Authorization": "Bearer <admin_jwt_token>"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Link revoked successfully"
}
```

#### Success Response (200)
```json
{
  "sessionId": "ses_xyz789",
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
  "attendanceRecords": [
    {
      "attendanceId": "att_001",
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
  ],
  "assistants": [
    {
      "userId": "usr_classrep1",
      "role": "CLASS_REP",
      "addedAt": "2026-01-08T08:00:00Z",
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

### 3. Export Attendance Data (CSV)

**Endpoint:** `GET /sessions/export`  
**Auth:** Required (ADMIN, LECTURER)  
**Description:** Export attendance data as CSV file

#### Request
```typescript
GET /api/attendance/sessions/export?startDate=2026-01-01&endDate=2026-01-31&courseCode=CS101

Headers:
{
  "Authorization": "Bearer <admin_jwt_token>"
}
```

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| startDate | string | No | - | ISO date (from) |
| endDate | string | No | - | ISO date (to) |
| courseCode | string | No | - | Filter by course |
| lecturerId | string | No | - | Filter by lecturer |

#### Success Response (200)
```
Content-Type: text/csv
Content-Disposition: attachment; filename="attendance_export_20260108.csv"

Session ID,Course Code,Course Name,Student Index,Student Name,Status,Verification Method,Marked At,Confirmed,Lecturer,Venue
ses_xyz789,CS101,Introduction to Computer Science,20210001,Jane Doe,PRESENT,QR_SCAN,2026-01-08T08:15:00Z,true,Dr. John Smith,Room A204
```

---

### 4. Get Attendance Analytics

**Endpoint:** `GET /sessions/analytics`  
**Auth:** Required (ADMIN, LECTURER)  
**Description:** Get aggregated analytics for attendance data

#### Request
```typescript
GET /api/attendance/sessions/analytics?startDate=2026-01-01&endDate=2026-01-31

Headers:
{
  "Authorization": "Bearer <admin_jwt_token>"
}
```

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| startDate | string | Yes | - | ISO date (from) |
| endDate | string | Yes | - | ISO date (to) |
| courseCode | string | No | - | Filter by course |
| lecturerId | string | No | - | Filter by lecturer |
| groupBy | string | No | 'day' | Group by: 'day', 'week', 'month', 'course' |

#### Success Response (200)
```json
{
  "period": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  },
  "summary": {
    "totalSessions": 45,
    "totalStudentsRecorded": 2150,
    "averageAttendanceRate": 87.5,
    "completedSessions": 40,
    "inProgressSessions": 5,
    "cancelledSessions": 0
  },
  "byStatus": {
    "PRESENT": 1890,
    "LATE": 160,
    "EXCUSED": 50,
    "ABSENT": 50
  },
  "byMethod": {
    "QR_SCAN": 1200,
    "LINK_SELF_MARK": 750,
    "MANUAL_ENTRY": 150,
    "BIOMETRIC_FINGERPRINT": 40,
    "BIOMETRIC_FACE": 10
  },
  "byCourse": [
    {
      "courseCode": "CS101",
      "courseName": "Introduction to Computer Science",
      "sessions": 12,
      "totalRecorded": 580,
      "attendanceRate": 89.2
    }
  ],
  "timeline": [
    {
      "date": "2026-01-08",
      "sessions": 5,
      "totalRecorded": 235,
      "attendanceRate": 88.0
    }
  ]
}
```

---

## WebSocket Events

The web platform should listen to real-time WebSocket events for live updates.

### Connection Setup

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('auth_token')
  }
});
```

### Events to Listen For

#### 1. Session Started
**Event:** `attendance:sessionStarted`

```typescript
socket.on('attendance:sessionStarted', (payload) => {
  console.log('New session started:', payload);
  // Update session list
});

// Payload
{
  "type": "SESSION_STARTED",
  "data": {
    "id": "ses_xyz789",
    "courseCode": "CS101",
    "courseName": "Introduction to Computer Science",
    "lecturerName": "Dr. John Smith",
    "startTime": "2026-01-08T08:00:00Z",
    "createdBy": {
      "id": "usr_123",
      "name": "John Smith",
      "role": "LECTURER"
    }
  },
  "timestamp": "2026-01-08T08:00:00Z"
}
```

#### 2. Session Ended
**Event:** `attendance:sessionEnded`

```typescript
socket.on('attendance:sessionEnded', (payload) => {
  console.log('Session ended:', payload);
  // Update session status
});

// Payload
{
  "type": "SESSION_ENDED",
  "data": {
    "id": "ses_xyz789",
    "courseCode": "CS101",
    "courseName": "Introduction to Computer Science",
    "endTime": "2026-01-08T09:30:00Z",
    "totalStudents": 50,
    "duration": 90,
    "summary": {
      "totalRecorded": 45,
      "methods": {
        "QR_SCAN": 35,
        "LINK_SELF_MARK": 10
      }
    }
  },
  "timestamp": "2026-01-08T09:30:00Z"
}
```

#### 3. Attendance Recorded
**Event:** `attendance:recorded`

```typescript
socket.on('attendance:recorded', (payload) => {
  console.log('New attendance recorded:', payload);
  // Update attendance list
});

// Payload
{
  "type": "ATTENDANCE_RECORDED",
  "data": {
    "id": "att_123456",
    "sessionId": "ses_xyz789",
    "student": {
      "id": "stu_789",
      "indexNumber": "20210001",
      "firstName": "Jane",
      "lastName": "Doe"
    },
    "markedAt": "2026-01-08T08:15:00Z",
    "status": "PRESENT",
    "verificationMethod": "QR_SCAN",
    "requiresConfirmation": false,
    "biometricConfidence": null
  },
  "session": {
    "id": "ses_xyz789",
    "courseCode": "CS101",
    "courseName": "Introduction to Computer Science"
  },
  "timestamp": "2026-01-08T08:15:00Z"
}
```

#### 4. Live Attendance Update
**Event:** `attendance:liveUpdate`

```typescript
socket.on('attendance:liveUpdate', (payload) => {
  console.log('Session stats updated:', payload);
  // Update live counter
});

// Payload
{
  "type": "LIVE_UPDATE",
  "data": {
    "id": "ses_xyz789",
    "courseCode": "CS101",
    "courseName": "Introduction to Computer Science",
    "totalStudents": 50,
    "currentCount": 42,
    "recentStudents": [
      {
        "indexNumber": "20210001",
        "name": "Jane Doe",
        "scanTime": "2026-01-08T08:15:00Z",
        "method": "QR_SCAN",
        "status": "PRESENT"
      }
    ]
  },
  "timestamp": "2026-01-08T08:15:00Z"
}
```

#### 5. Link Generated
**Event:** `attendance:linkGenerated`

```typescript
socket.on('attendance:linkGenerated', (payload) => {
  console.log('New link generated:', payload);
  // Update links list
});

// Payload
{
  "type": "LINK_GENERATED",
  "data": {
    "recordId": "ses_xyz789",
    "token": "lnk_abc123xyz",
    "url": "https://app.example.com/attend/lnk_abc123xyz",
    "expiresAt": "2026-01-08T08:30:00Z",
    "maxUses": 100
  },
  "timestamp": "2026-01-08T08:00:00Z"
}
```

#### 6. Biometric Enrolled
**Event:** `attendance:biometricEnrolled`

```typescript
socket.on('attendance:biometricEnrolled', (payload) => {
  console.log('Biometric enrollment completed:', payload);
  // Update student biometric status
});

// Payload
{
  "type": "BIOMETRIC_ENROLLED",
  "data": {
    "studentId": "stu_789",
    "indexNumber": "20210001",
    "provider": "FINGERPRINT",
    "enrolledAt": "2026-01-08T08:00:00Z"
  },
  "timestamp": "2026-01-08T08:00:00Z"
}
```

#### 7. Attendance Error
**Event:** `attendance:error`

```typescript
socket.on('attendance:error', (payload) => {
  console.log('Attendance error:', payload);
  // Show error notification
});

// Payload
{
  "type": "ERROR",
  "data": {
    "recordId": "ses_xyz789",
    "error": "Student already marked present",
    "studentIndexNumber": "20210001"
  },
  "timestamp": "2026-01-08T08:15:00Z"
}
```

### Joining Session Rooms

```typescript
// Join a specific session room for targeted updates
socket.emit('attendance:joinSession', 'ses_xyz789');

// Listen for join confirmation
socket.on('attendance:joined', (data) => {
  console.log('Joined session:', data.sessionId);
});

// Leave session room
socket.emit('attendance:leaveSession', 'ses_xyz789');
```
    "totalRecorded": 43,
    "confirmed": 35,
    "pending": 8
  }
}
```

#### 3. Session Status Changed
**Event:** `session:statusChanged`

```typescript
socket.on('session:statusChanged', (data) => {
  console.log('Session status changed:', data);
  // Update session status in UI
});

// Payload
{
  "sessionId": "ses_xyz789",
  "status": "COMPLETED",
  "endTime": "2026-01-08T10:00:00Z"
}
```

---

## Error Handling

### Standard Error Response Format

All API endpoints return errors in a consistent format:

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
}
```

### Common HTTP Status Codes

| Status | Description | Common Scenarios |
|--------|-------------|------------------|
| 200 | Success | Operation completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input, validation failed, link validation failed |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions, outside geofence |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate record (attendance already marked) |
| 500 | Server Error | Unexpected server error |

### Example Error Handling

```typescript
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as ErrorResponse;

    switch (response.status) {
      case 400:
        if (error.errorCode === 'LINK_NOT_FOUND') {
          throw new Error('Invalid or expired attendance link');
        }
        if (error.errorCode === 'SESSION_ENDED') {
          throw new Error('This attendance session has ended');
        }
        throw new Error(error.error || 'Bad request');
      case 401:
        // Redirect to login
        window.location.href = '/login';
        throw new Error('Authentication required');
      case 403:
        throw new Error('Insufficient permissions');
      case 404:
        throw new Error('Resource not found');
      case 409:
        throw new Error('Attendance already marked for this session');
      default:
        throw new Error(error.error || 'An unexpected error occurred');
    }
  }

  return data;
}

// Usage example
async function validateLink(token: string) {
  try {
    const response = await apiRequest<{
      success: true;
      data: {
        id: string;
        courseCode: string;
        courseName: string;
        lecturerName?: string;
        startTime: string;
        venue?: string;
      }
    }>(`/api/attendance/links/${token}/validate`);

    return response.data;
  } catch (error) {
    console.error('Link validation failed:', error);
    throw error;
  }
}

async function selfMarkAttendance(data: {
  linkToken: string;
  studentId: string;
  location?: { lat: number; lng: number };
}) {
  try {
    const response = await apiRequest<{
      success: true;
      message: string;
      data: AttendanceRecord
    }>('/api/attendance/self-mark', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    return response.data;
  } catch (error) {
    console.error('Self-mark attendance failed:', error);
    throw error;
  }
}
```
    throw error;
  }
}
```

---

## Implementation Examples

### Student Self-Service Page

```typescript
// pages/attendance/mark/[token].tsx

import { useState, useEffect } from 'react';
import { useParams } from 'next/router';

interface LinkValidation {
  success: true;
  data: {
    id: string;
    courseCode: string;
    courseName: string;
    lecturerName?: string;
    startTime: string;
    venue?: string;
  };
}

interface SelfMarkRequest {
  linkToken: string;
  studentId: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export default function MarkAttendancePage() {
  const { token } = useParams();
  const [validation, setValidation] = useState<LinkValidation | null>(null);
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    validateLink();
  }, [token]);

  async function validateLink() {
    try {
      const response = await fetch(`/api/attendance/links/${token}/validate`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid or expired link');
      }

      const data: LinkValidation = await response.json();
      setValidation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function getCurrentLocation(): Promise<{ lat: number; lng: number } | undefined> {
    if (!navigator.geolocation) return undefined;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => resolve(undefined),
        { timeout: 10000 }
      );
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const location = await getCurrentLocation();

      const requestData: SelfMarkRequest = {
        linkToken: token,
        studentId,
        location
      };

      const response = await fetch('/api/attendance/self-mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark attendance');
      }

      const result = await response.json();
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (success) {
    return (
      <div className="success">
        <h2>Attendance Marked Successfully!</h2>
        <p>Thank you for marking your attendance.</p>
      </div>
    );
  }

  return (
    <div className="mark-attendance">
      <h1>Mark Attendance</h1>

      {validation && (
        <div className="session-info">
          <h2>{validation.data.courseName}</h2>
          <p><strong>Course:</strong> {validation.data.courseCode}</p>
          <p><strong>Lecturer:</strong> {validation.data.lecturerName || 'N/A'}</p>
          <p><strong>Venue:</strong> {validation.data.venue || 'N/A'}</p>
          <p><strong>Start Time:</strong> {new Date(validation.data.startTime).toLocaleString()}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="studentId">Student ID:</label>
          <input
            type="text"
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
            placeholder="Enter your student ID"
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Marking Attendance...' : 'Mark Attendance'}
        </button>
      </form>
    </div>
  );
}
```

### Admin Dashboard - Session Management

```typescript
// components/SessionManager.tsx

import { useState, useEffect } from 'react';

interface AttendanceSession {
  id: string;
  courseCode: string;
  courseName: string;
  venue?: string;
  lecturerName?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startTime: string;
  endTime?: string;
  expectedStudentCount: number;
  createdAt: string;
}

export default function SessionManager() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveSessions();
  }, []);

  async function loadActiveSessions() {
    try {
      const response = await fetch('/api/attendance/sessions/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load sessions');

      const data = await response.json();
      setSessions(data.data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createSession(sessionData: {
    courseCode: string;
    courseName: string;
    venue?: string;
    expectedStudentCount?: number;
  }) {
    try {
      const response = await fetch('/api/attendance/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) throw new Error('Failed to create session');

      const result = await response.json();
      setSessions(prev => [result.data, ...prev]);
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  async function endSession(sessionId: string) {
    try {
      const response = await fetch(`/api/attendance/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to end session');

      // Update local state
      setSessions(prev => prev.map(session =>
        session.id === sessionId
          ? { ...session, status: 'COMPLETED' as const, endTime: new Date().toISOString() }
          : session
      ));
    } catch (error) {
      console.error('Failed to end session:', error);
      throw error;
    }
  }

  async function exportSession(sessionId: string) {
    try {
      const response = await fetch(`/api/attendance/sessions/${sessionId}/export`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to export session');

      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${sessionId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export session:', error);
      throw error;
    }
  }

  if (loading) {
    return <div>Loading sessions...</div>;
  }

  return (
    <div className="session-manager">
      <h2>Active Sessions</h2>

      <div className="sessions-list">
        {sessions.map(session => (
          <div key={session.id} className="session-card">
            <div className="session-info">
              <h3>{session.courseName}</h3>
              <p><strong>Code:</strong> {session.courseCode}</p>
              <p><strong>Venue:</strong> {session.venue || 'N/A'}</p>
              <p><strong>Status:</strong> {session.status}</p>
              <p><strong>Expected:</strong> {session.expectedStudentCount}</p>
            </div>

            <div className="session-actions">
              {session.status === 'IN_PROGRESS' && (
                <button onClick={() => endSession(session.id)}>
                  End Session
                </button>
              )}

              <button onClick={() => exportSession(session.id)}>
                Export CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error('Failed to get location: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000
        }
      );
    });
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error && !validation) {
    return (
      <div className="error-container">
        <h2>Invalid Link</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="success-container">
        <h2>✓ Attendance Marked!</h2>
        <p>Your attendance has been recorded successfully.</p>
        <p className="note">Awaiting lecturer confirmation.</p>
      </div>
    );
  }

  return (
    <div className="attendance-form-container">
      <h2>Mark Attendance</h2>
      
      <div className="session-info">
        <p><strong>Course:</strong> {validation?.session.courseCode} - {validation?.session.courseName}</p>
        <p><strong>Lecturer:</strong> {validation?.session.lecturerName}</p>
        <p><strong>Venue:</strong> {validation?.session.venue}</p>
      </div>

      {validation?.requiresLocation && (
        <div className="location-notice">
          <p>📍 Location verification is required</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Index Number</label>
          <input
            type="text"
            value={indexNumber}
            onChange={(e) => setIndexNumber(e.target.value)}
            placeholder="e.g., 20210001"
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Marking Attendance...' : 'Mark Attendance'}
        </button>
      </form>
    </div>
  );
}
```

### Admin Dashboard - Active Sessions

```typescript
// pages/admin/attendance/sessions.tsx

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface SessionSummary {
  sessionId: string;
  courseCode: string;
  courseName: string;
  lecturerName: string;
  status: SessionStatus;
  startTime: string;
  stats: {
    totalRecorded: number;
    confirmed: number;
    pending: number;
  };
}

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    fetchActiveSessions();
    setupWebSocket();

    return () => {
      socket?.disconnect();
    };
  }, []);

  async function fetchActiveSessions() {
    const response = await fetch('/api/attendance/sessions?status=IN_PROGRESS', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    const data = await response.json();
    setSessions(data.sessions);
  }

  function setupWebSocket() {
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('auth_token')
      }
    });

    newSocket.on('attendance:liveUpdate', (data) => {
      setSessions(prev => prev.map(session => 
        session.sessionId === data.sessionId
          ? { ...session, stats: data.stats }
          : session
      ));
    });

    newSocket.on('session:statusChanged', (data) => {
      if (data.status !== 'IN_PROGRESS') {
        setSessions(prev => prev.filter(s => s.sessionId !== data.sessionId));
      }
    });

    setSocket(newSocket);
  }

  return (
    <div className="admin-dashboard">
      <h1>Active Attendance Sessions</h1>
      
      <div className="sessions-grid">
        {sessions.map(session => (
          <div key={session.sessionId} className="session-card">
            <h3>{session.courseCode}</h3>
            <p>{session.courseName}</p>
            <p className="lecturer">{session.lecturerName}</p>
            
            <div className="stats">
              <div className="stat">
                <span className="value">{session.stats.totalRecorded}</span>
                <span className="label">Total Recorded</span>
              </div>
              <div className="stat">
                <span className="value">{session.stats.confirmed}</span>
                <span className="label">Confirmed</span>
              </div>
              <div className="stat pending">
                <span className="value">{session.stats.pending}</span>
                <span className="label">Pending</span>
              </div>
            </div>

            <a href={`/admin/attendance/sessions/${session.sessionId}`}>
              View Details →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Quick Reference

### Student Self-Service Flow

```
1. Student receives link (QR code or URL)
   ↓
2. GET /links/:linkId/validate
   ↓
3. Student enters index number
   ↓
4. POST /links/:linkId/mark
   ↓
5. Success: "Awaiting confirmation"
```

### Admin Analytics Flow

```
1. GET /sessions?status=IN_PROGRESS (active sessions)
   ↓
2. WebSocket: Listen for live updates
   ↓
3. GET /sessions/:sessionId (detailed view)
   ↓
4. GET /sessions/export (download CSV)
```

---

**Document Version:** 1.0  
**Last Updated:** January 8, 2026  
**Backend API Base:** `/api/attendance`
