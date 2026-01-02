# Class Attendance API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api/class-attendance`  
**Authentication:** Bearer Token (JWT) required for all endpoints

---

## 📋 Table of Contents
- [Overview](#overview)
- [Authentication & Authorization](#authentication--authorization)
- [Session Management](#session-management)
- [Attendance Recording](#attendance-recording)
- [Queries & History](#queries--history)
- [Self-Service Links](#self-service-links)
- [Biometric Enrollment](#biometric-enrollment)
- [Analytics](#analytics)
- [Real-Time Events (Socket.IO)](#real-time-events-socketio)
- [Error Handling](#error-handling)

---

## 🎯 Overview

The Class Attendance API provides comprehensive endpoints for managing class attendance in educational institutions. It supports multiple verification methods including:
- QR Code scanning
- Manual index number entry
- Biometric verification (fingerprint/face recognition)
- Self-service student links

---

## 🔐 Authentication & Authorization

### Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| `ADMIN` | Full access to all endpoints and all users' data |
| `LECTURER` | Can manage their own sessions, record attendance, generate links |
| `CLASS_REP` | Can record attendance for assigned classes |

---

## 📅 Session Management

### Start Attendance Session
**POST** `/sessions/start`

Start a new attendance recording session for a class.

**Access:** LECTURER, ADMIN, CLASS_REP

**Request Body:**
```json
{
  "deviceId": "device-uuid-123",
  "deviceName": "John's iPhone",
  "courseName": "Data Structures and Algorithms",
  "courseCode": "CS201",
  "lecturerName": "Dr. Smith",
  "notes": "Morning session"
}
```

**Response (201):**
```json
{
  "message": "Attendance session started successfully",
  "record": {
    "id": "record-uuid",
    "sessionId": "session-uuid",
    "courseCode": "CS201",
    "courseName": "Data Structures and Algorithms",
    "status": "IN_PROGRESS",
    "startTime": "2026-01-02T08:00:00Z",
    "totalStudents": 0,
    "user": {
      "id": "user-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "role": "LECTURER"
    }
  },
  "session": {
    "id": "session-uuid",
    "deviceId": "device-uuid-123",
    "sessionToken": "session-token-hex"
  }
}
```

---

### End Attendance Session
**POST** `/sessions/end`

End an active attendance recording session.

**Access:** LECTURER, ADMIN, CLASS_REP (must be session owner or admin)

**Request Body:**
```json
{
  "recordId": "record-uuid",
  "notes": "Good attendance today"
}
```

**Response (200):**
```json
{
  "message": "Attendance session ended successfully",
  "record": {
    "id": "record-uuid",
    "status": "COMPLETED",
    "endTime": "2026-01-02T10:00:00Z",
    "totalStudents": 45
  },
  "summary": {
    "totalStudents": 45,
    "duration": 120
  }
}
```

---

### Get Active Sessions
**GET** `/sessions/active`

Retrieve all active attendance sessions for the current user (or all sessions if admin).

**Access:** LECTURER, ADMIN, CLASS_REP

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "record-uuid",
      "courseCode": "CS201",
      "courseName": "Data Structures",
      "startTime": "2026-01-02T08:00:00Z",
      "totalStudents": 45,
      "status": "IN_PROGRESS",
      "user": {
        "id": "user-uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "students": [...]
    }
  ],
  "count": 1
}
```

---

### Get Session Details
**GET** `/sessions/:id`

Get detailed information about a specific attendance session.

**Access:** LECTURER, ADMIN, CLASS_REP (must be session owner or admin)

**Response (200):**
```json
{
  "id": "record-uuid",
  "courseCode": "CS201",
  "courseName": "Data Structures",
  "startTime": "2026-01-02T08:00:00Z",
  "endTime": null,
  "status": "IN_PROGRESS",
  "totalStudents": 45,
  "students": [
    {
      "id": "attendance-uuid",
      "scanTime": "2026-01-02T08:05:00Z",
      "status": "PRESENT",
      "verificationMethod": "QR_CODE",
      "student": {
        "indexNumber": "2021001",
        "firstName": "Alice",
        "lastName": "Johnson"
      }
    }
  ]
}
```

---

## ✅ Attendance Recording

### Record Attendance by QR Code
**POST** `/record/qr`

Record student attendance by scanning their QR code.

**Access:** LECTURER, ADMIN, CLASS_REP

**Request Body:**
```json
{
  "recordId": "record-uuid",
  "qrCode": "QR-2021001-abc123",
  "deviceId": "device-uuid-123",
  "status": "PRESENT"
}
```

**Response (201):**
```json
{
  "message": "Attendance recorded successfully",
  "attendance": {
    "id": "attendance-uuid",
    "recordId": "record-uuid",
    "studentId": "student-uuid",
    "scanTime": "2026-01-02T08:05:00Z",
    "status": "PRESENT",
    "verificationMethod": "QR_CODE"
  },
  "student": {
    "id": "student-uuid",
    "indexNumber": "2021001",
    "firstName": "Alice",
    "lastName": "Johnson"
  }
}
```

**Error Cases:**
- `404`: Student not found
- `400`: Student already recorded
- `400`: Session not active

---

### Record Attendance by Index Number
**POST** `/record/index`

Manually record student attendance by entering their index number.

**Access:** LECTURER, ADMIN, CLASS_REP

**Request Body:**
```json
{
  "recordId": "record-uuid",
  "indexNumber": "2021001",
  "verificationMethod": "MANUAL_INDEX",
  "status": "LATE"
}
```

**Response (201):**
```json
{
  "message": "Attendance recorded successfully",
  "attendance": {
    "id": "attendance-uuid",
    "status": "LATE",
    "verificationMethod": "MANUAL_INDEX"
  },
  "student": {
    "indexNumber": "2021001",
    "firstName": "Alice",
    "lastName": "Johnson"
  }
}
```

---

### Record Attendance by Biometric
**POST** `/record/biometric`

Record attendance using biometric verification (fingerprint or face recognition).

**Access:** LECTURER, ADMIN, CLASS_REP

**Request Body:**
```json
{
  "recordId": "record-uuid",
  "biometricHash": "hash-abc123",
  "deviceId": "device-uuid-123",
  "biometricConfidence": 0.95,
  "status": "PRESENT"
}
```

**Response (201):**
```json
{
  "message": "Attendance recorded successfully",
  "attendance": {
    "id": "attendance-uuid",
    "verificationMethod": "BIOMETRIC_FINGERPRINT",
    "biometricConfidence": 0.95
  },
  "student": {
    "indexNumber": "2021001",
    "firstName": "Alice",
    "lastName": "Johnson"
  },
  "biometric": {
    "confidence": 0.95,
    "method": "FINGERPRINT"
  }
}
```

**Error Cases:**
- `404`: No student enrolled with this biometric
- `400`: Confidence too low (< 0.8)

---

## 📊 Queries & History

### Get Attendance History
**GET** `/history`

Retrieve attendance history with optional filters.

**Access:** LECTURER, ADMIN, CLASS_REP

**Query Parameters:**
- `courseCode` (string, optional): Filter by course code
- `startDate` (ISO date, optional): Start date range
- `endDate` (ISO date, optional): End date range
- `status` (enum, optional): Filter by status (IN_PROGRESS, COMPLETED, CANCELLED)
- `limit` (number, default: 50): Number of records per page
- `offset` (number, default: 0): Pagination offset

**Example:**
```
GET /history?courseCode=CS201&startDate=2026-01-01&limit=10
```

**Response (200):**
```json
{
  "records": [
    {
      "id": "record-uuid",
      "courseCode": "CS201",
      "courseName": "Data Structures",
      "startTime": "2026-01-02T08:00:00Z",
      "endTime": "2026-01-02T10:00:00Z",
      "status": "COMPLETED",
      "totalStudents": 45
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## 🔗 Self-Service Links

### Generate Attendance Link
**POST** `/links/generate`

Generate a self-service link for students to mark their own attendance.

**Access:** LECTURER, ADMIN

**Request Body:**
```json
{
  "recordId": "record-uuid",
  "expiresInMinutes": 30,
  "maxUses": 50,
  "geolocation": {
    "lat": 5.6037,
    "lng": -0.1870,
    "radius": 100
  }
}
```

**Response (201):**
```json
{
  "message": "Attendance link generated successfully",
  "link": {
    "id": "link-uuid",
    "token": "link-token-hex",
    "url": "https://app.example.com/attendance/mark/link-token-hex",
    "expiresAt": "2026-01-02T08:30:00Z",
    "maxUses": 50
  }
}
```

**Features:**
- Time-limited (configurable expiration)
- Usage-limited (optional max uses)
- Geofencing support (optional location validation)
- Automatic deactivation when session ends

---

## 🔐 Biometric Enrollment

### Enroll Biometric Data
**POST** `/biometric/enroll`

Enroll biometric data (fingerprint/face) for a student.

**Access:** LECTURER, ADMIN

**Request Body:**
```json
{
  "studentId": "student-uuid",
  "biometricHash": "hash-abc123",
  "deviceId": "device-uuid-123",
  "provider": "FINGERPRINT"
}
```

**Providers:**
- `TOUCHID` - Apple Touch ID
- `FACEID` - Apple Face ID
- `FINGERPRINT` - Android fingerprint

**Response (200):**
```json
{
  "message": "Biometric enrollment successful",
  "student": {
    "id": "student-uuid",
    "indexNumber": "2021001",
    "firstName": "Alice",
    "lastName": "Johnson",
    "biometricEnrolledAt": "2026-01-02T08:00:00Z",
    "biometricProvider": "FINGERPRINT"
  }
}
```

**Error Cases:**
- `400`: Student already has biometric enrolled
- `409`: Biometric data already enrolled to another student

---

## 📈 Analytics

### Get Attendance Statistics
**GET** `/analytics/stats`

Get attendance statistics and analytics.

**Access:** LECTURER, ADMIN

**Query Parameters:**
- `courseCode` (string, optional): Filter by course
- `startDate` (ISO date, optional): Start date range
- `endDate` (ISO date, optional): End date range

**Example:**
```
GET /analytics/stats?courseCode=CS201
```

**Response (200):**
```json
{
  "overview": {
    "totalSessions": 24,
    "completedSessions": 22,
    "activeSessions": 2,
    "totalStudentsRecorded": 1080
  },
  "methodBreakdown": [
    {
      "method": "QR_CODE",
      "count": 900
    },
    {
      "method": "BIOMETRIC_FINGERPRINT",
      "count": 150
    },
    {
      "method": "MANUAL_INDEX",
      "count": 30
    }
  ]
}
```

---

## 🔴 Real-Time Events (Socket.IO)

### Connection

Connect to Socket.IO server with authentication:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Join Attendance Session

```javascript
socket.emit('attendance:joinSession', 'session-id');

socket.on('attendance:joined', (data) => {
  console.log('Joined session:', data.sessionId);
});
```

### Event Types

#### Session Started
```javascript
socket.on('attendance:sessionStarted', (payload) => {
  console.log('New session started:', payload.data);
});
```

#### Session Ended
```javascript
socket.on('attendance:sessionEnded', (payload) => {
  console.log('Session ended:', payload.data);
});
```

#### Attendance Recorded
```javascript
socket.on('attendance:recorded', (payload) => {
  console.log('Student attendance recorded:', payload.data.student);
});
```

#### Live Updates
```javascript
socket.on('attendance:liveUpdate', (payload) => {
  console.log('Current count:', payload.data.currentCount);
  console.log('Recent students:', payload.data.recentStudents);
});
```

#### Link Generated
```javascript
socket.on('attendance:linkGenerated', (payload) => {
  console.log('New link:', payload.data.url);
});
```

#### Biometric Enrolled
```javascript
socket.on('attendance:biometricEnrolled', (payload) => {
  console.log('Biometric enrolled:', payload.data);
});
```

#### Errors
```javascript
socket.on('attendance:error', (payload) => {
  console.error('Error:', payload.data.error);
});
```

---

## ⚠️ Error Handling

### Error Response Format
```json
{
  "error": "Error message description",
  "details": "Additional error details (optional)"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error, duplicate, etc.) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate biometric) |
| 500 | Internal Server Error |

### Common Errors

#### Validation Error (400)
```json
{
  "error": [
    {
      "path": ["courseCode"],
      "message": "Course code is required"
    }
  ]
}
```

#### Duplicate Attendance (400)
```json
{
  "error": "Student 2021001 has already been recorded for this session"
}
```

#### Session Not Active (400)
```json
{
  "error": "Attendance session is not active",
  "currentStatus": "COMPLETED"
}
```

#### Unauthorized Access (403)
```json
{
  "error": "Unauthorized. Only the record creator or admin can end this session"
}
```

---

## 🧪 Testing Examples

### Using cURL

**Start Session:**
```bash
curl -X POST http://localhost:5000/api/class-attendance/sessions/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-123",
    "courseCode": "CS201",
    "courseName": "Data Structures"
  }'
```

**Record QR Attendance:**
```bash
curl -X POST http://localhost:5000/api/class-attendance/record/qr \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recordId": "record-uuid",
    "qrCode": "QR-2021001-abc"
  }'
```

**Get History:**
```bash
curl -X GET "http://localhost:5000/api/class-attendance/history?courseCode=CS201&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Notes

1. **Session Management**: Only one active session per device at a time
2. **Duplicate Prevention**: Students cannot be recorded twice in the same session
3. **Biometric Security**: Biometric hashes are unique and cannot be enrolled for multiple students
4. **Real-Time Updates**: Use Socket.IO for live attendance tracking
5. **Link Expiration**: Self-service links automatically deactivate when session ends
6. **Geofencing**: Optional location validation for self-service attendance
7. **Role-Based Access**: Lecturers can only access their own sessions (admins see all)

---

**Created:** January 2, 2026  
**Last Updated:** January 2, 2026  
**API Version:** 1.0.0
