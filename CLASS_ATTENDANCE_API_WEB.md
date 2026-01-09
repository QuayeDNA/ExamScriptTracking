# Class Attendance API - Web Integration Guide

**Target Platform:** Web Frontend (React + TypeScript)  
**Use Cases:** Admin Dashboard + Student Self-Service  
**Base URL:** `/api/class-attendance`

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
- `GET /links/:linkId/validate` - Validate attendance link
- `POST /links/:linkId/mark` - Self-mark attendance via link

### Student Endpoints (Auth Required)
- `GET /sessions/my-attendance` - View own attendance history

### Admin Endpoints (Role: ADMIN)
- `GET /sessions` - View all sessions
- `GET /sessions/export` - Export attendance data
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
  sessionId: string;
  courseCode: string;
  courseName: string;
  lecturerId: string;
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

**Endpoint:** `GET /links/:linkId/validate`  
**Auth:** Not required  
**Description:** Validate if attendance link is active and accessible

#### Request
```typescript
GET /api/class-attendance/links/lnk_abc123xyz/validate
```

#### Success Response (200)
```json
{
  "valid": true,
  "session": {
    "sessionId": "ses_xyz789",
    "courseCode": "CS101",
    "courseName": "Introduction to Computer Science",
    "lecturerName": "Dr. John Smith",
    "venue": "Room A204",
    "startTime": "2026-01-08T08:00:00Z"
  },
  "requiresLocation": true,
  "geofence": {
    "latitude": 5.6037,
    "longitude": -0.1870,
    "radius": 100
  },
  "expiresAt": "2026-01-08T10:00:00Z"
}
```

#### Error Response (404)
```json
{
  "message": "Link not found or has been revoked"
}
```

#### Error Response (410)
```json
{
  "message": "Link has expired"
}
```

---

### 2. Self-Mark Attendance

**Endpoint:** `POST /links/:linkId/mark`  
**Auth:** Not required  
**Description:** Student marks their own attendance using shared link

#### Request
```typescript
POST /api/class-attendance/links/lnk_abc123xyz/mark

{
  "indexNumber": "20210001",
  "location": {
    "latitude": 5.6037,
    "longitude": -0.1870
  }
}
```

#### Request Schema
```typescript
interface SelfMarkRequest {
  indexNumber: string;        // Student's index number
  location?: {                // Required if link.requiresLocation is true
    latitude: number;
    longitude: number;
  };
}
```

#### Success Response (200)
```json
{
  "success": true,
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
GET /api/class-attendance/sessions/my-attendance?page=1&limit=20

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

### 1. Get All Sessions (Admin View)

**Endpoint:** `GET /sessions`  
**Auth:** Required (ADMIN, LECTURER)  
**Description:** Retrieve all attendance sessions with filtering and pagination

#### Request
```typescript
GET /api/class-attendance/sessions?status=IN_PROGRESS&page=1&limit=20

Headers:
{
  "Authorization": "Bearer <admin_jwt_token>"
}
```

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | SessionStatus | No | - | Filter by status |
| courseCode | string | No | - | Filter by course |
| lecturerId | string | No | - | Filter by lecturer |
| startDate | string | No | - | ISO date (from) |
| endDate | string | No | - | ISO date (to) |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Records per page |

#### Success Response (200)
```json
{
  "sessions": [
    {
      "sessionId": "ses_xyz789",
      "courseCode": "CS101",
      "courseName": "Introduction to Computer Science",
      "lecturerName": "Dr. John Smith",
      "venue": "Room A204",
      "status": "IN_PROGRESS",
      "startTime": "2026-01-08T08:00:00Z",
      "endTime": null,
      "expectedStudents": 50,
      "stats": {
        "totalRecorded": 42,
        "confirmed": 35,
        "pending": 7,
        "present": 40,
        "late": 2,
        "absent": 0
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalRecords": 200,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 2. Get Session Details with Full Statistics

**Endpoint:** `GET /sessions/:sessionId`  
**Auth:** Required (ADMIN, LECTURER, CLASS_REP)  
**Description:** Get detailed information about a specific session

#### Request
```typescript
GET /api/class-attendance/sessions/ses_xyz789

Headers:
{
  "Authorization": "Bearer <admin_jwt_token>"
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
GET /api/class-attendance/sessions/export?startDate=2026-01-01&endDate=2026-01-31&courseCode=CS101

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
GET /api/class-attendance/sessions/analytics?startDate=2026-01-01&endDate=2026-01-31

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

#### 1. Attendance Recorded
**Event:** `attendance:recorded`

```typescript
socket.on('attendance:recorded', (data) => {
  console.log('New attendance recorded:', data);
  // Update UI with new attendance record
});

// Payload
{
  "sessionId": "ses_xyz789",
  "attendance": {
    "attendanceId": "att_001",
    "studentId": "std_001",
    "status": "PRESENT",
    "verificationMethod": "LINK_SELF_MARK",
    "markedAt": "2026-01-08T08:15:00Z",
    "confirmed": false,
    "student": {
      "indexNumber": "20210001",
      "firstName": "Jane",
      "lastName": "Doe"
    }
  }
}
```

#### 2. Live Session Update
**Event:** `attendance:liveUpdate`

```typescript
socket.on('attendance:liveUpdate', (data) => {
  console.log('Session stats updated:', data);
  // Update live counter
});

// Payload
{
  "sessionId": "ses_xyz789",
  "stats": {
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

```typescript
interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}
```

### Common HTTP Status Codes

| Status | Description | Common Scenarios |
|--------|-------------|------------------|
| 200 | Success | Operation completed successfully |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions, outside geofence |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate record (attendance already marked) |
| 410 | Gone | Link expired |
| 500 | Server Error | Unexpected server error |

### Example Error Handling

```typescript
async function markAttendance(linkId: string, data: SelfMarkRequest) {
  try {
    const response = await fetch(`/api/class-attendance/links/${linkId}/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      
      switch (response.status) {
        case 404:
          throw new Error('Student not found. Please check your index number.');
        case 409:
          throw new Error('You have already marked attendance for this session.');
        case 403:
          throw new Error(error.message); // "You are not within the required location"
        case 410:
          throw new Error('This attendance link has expired.');
        default:
          throw new Error(error.message || 'Failed to mark attendance');
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Attendance marking failed:', error);
    throw error;
  }
}
```

---

## Implementation Examples

### Student Self-Service Page

```typescript
// pages/attendance/mark/[linkId].tsx

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface LinkValidation {
  valid: boolean;
  session: {
    courseCode: string;
    courseName: string;
    lecturerName: string;
    venue: string;
  };
  requiresLocation: boolean;
  geofence?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

export default function MarkAttendancePage() {
  const { linkId } = useParams();
  const [validation, setValidation] = useState<LinkValidation | null>(null);
  const [indexNumber, setIndexNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    validateLink();
  }, [linkId]);

  async function validateLink() {
    try {
      const response = await fetch(`/api/class-attendance/links/${linkId}/validate`);
      
      if (!response.ok) {
        throw new Error('Invalid or expired link');
      }

      const data = await response.json();
      setValidation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let location;
      
      if (validation?.requiresLocation) {
        location = await getCurrentLocation();
      }

      const response = await fetch(`/api/class-attendance/links/${linkId}/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indexNumber,
          location
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      setSuccess(true);
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
    const response = await fetch('/api/class-attendance/sessions?status=IN_PROGRESS', {
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
**Backend API Base:** `/api/class-attendance`
