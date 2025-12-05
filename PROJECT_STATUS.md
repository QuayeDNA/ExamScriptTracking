# Exam Script Tracking System - Project Status & Roadmap

**Last Updated:** December 5, 2025  
**Version:** 1.0.0  
**Status:** Active Development

---

## 🎉 Recent Updates

### December 5, 2025 - Phase 2: Real-time Features Complete ✅

**All real-time notification features are now fully implemented for both web and mobile:**

**Web:**

- ✅ Socket.io server with JWT authentication
- ✅ Event handlers for transfers, batches, and attendance
- ✅ Controller emissions for all real-time events
- ✅ Web socket client service with auto-reconnection
- ✅ Notification center with badge and popover UI
- ✅ Toast notifications for immediate feedback
- ✅ Event handling for 8 different notification types

**Mobile:**

- ✅ Expo Notifications integration
- ✅ Mobile socket service with event handlers
- ✅ Push notification configuration
- ✅ Permission management
- ✅ Local notification scheduling
- ✅ Foreground and background notification support
- ✅ Auto-reconnection and health checks

**Impact:** Project completion increased from 90% to 95%

### December 5, 2025 - Phase 1: Analytics Dashboard Complete ✅

**All analytics and reporting features are now fully implemented:**

- ✅ Backend analytics endpoints (overview, handler performance, discrepancies, exam stats)
- ✅ Export service (PDF & Excel generation with pdfkit and exceljs)
- ✅ Role-based export routes with proper authorization
- ✅ Frontend analytics dashboard with charts and tables
- ✅ Handler performance metrics with detailed breakdown
- ✅ Discrepancy tracking and reporting
- ✅ Exam statistics summaries and breakdowns
- ✅ Dynamic date range filtering
- ✅ Export functionality for all report types

### December 4, 2025 - QR Code & Camera System Complete ✅

**All QR code and camera features are now fully implemented:**

- ✅ Backend QR code generation (batch & student)
- ✅ Web dashboard QR display and download
- ✅ Mobile camera integration with expo-camera
- ✅ Full QR scanning (batch & student IDs)
- ✅ One-time camera permissions (persistent)
- ✅ Entry/Exit mode with session management

---

## Table of Contents

- [Implementation Status Overview](#implementation-status-overview)
- [Module-by-Module Status](#module-by-module-status)
  - [Backend (API Server)](#backend-api-server)
  - [Web Dashboard (Admin)](#web-dashboard-admin)
  - [Mobile Application](#mobile-application)
- [Database & Schema Status](#database--schema-status)
- [What's Done ✅](#whats-done-)
- [What's Missing ⚠️](#whats-missing-️)
- [Future Implementation: Class Attendance System](#future-implementation-class-attendance-system)
- [Design System & UI/UX Guidelines](#design-system--uiux-guidelines)

---

## Implementation Status Overview

### Overall Progress: ~95%

| Module                 | Status      | Completion | Notes                                                 |
| ---------------------- | ----------- | ---------- | ----------------------------------------------------- |
| **Backend API**        | ✅ Complete | 98%        | All features + analytics/exports + Socket.io          |
| **Web Dashboard**      | ✅ Complete | 90%        | Core + analytics + real-time notifications complete   |
| **Mobile App**         | ✅ Complete | 95%        | Core + QR + custody + push notifications complete     |
| **Database**           | ✅ Complete | 100%       | Schema fully implemented with migrations              |
| **Authentication**     | ✅ Complete | 100%       | JWT + refresh tokens + password reset                 |
| **QR & Camera System** | ✅ Complete | 100%       | Full implementation complete                          |
| **Transfer System**    | ✅ Complete | 100%       | Handshake custody chain implemented                   |
| **Reports/Analytics**  | ✅ Complete | 100%       | Full analytics dashboard + PDF/Excel exports          |
| **Real-time (Web)**    | ✅ Complete | 100%       | Socket.io + notification center fully implemented     |
| **Real-time (Mobile)** | ✅ Complete | 100%       | Socket.io + Expo push notifications fully implemented |

| Module                 | Status           | Completion | Notes                                                |
| ---------------------- | ---------------- | ---------- | ---------------------------------------------------- |
| **Backend API**        | ✅ Core Complete | 98%        | All core + analytics/exports + Socket.io implemented |
| **Web Dashboard**      | ✅ Core Complete | 85%        | Core + analytics + real-time notifications complete  |
| **Mobile App**         | ✅ Core Complete | 90%        | Exam tracking, custody & QR scanning complete        |
| **Database**           | ✅ Complete      | 100%       | Schema fully implemented with migrations             |
| **Authentication**     | ✅ Complete      | 100%       | JWT + refresh tokens + password reset                |
| **QR & Camera System** | ✅ Complete      | 100%       | Full implementation complete                         |
| **Transfer System**    | ✅ Complete      | 100%       | Handshake custody chain implemented                  |
| **Reports/Analytics**  | ✅ Complete      | 100%       | Full analytics dashboard + PDF/Excel exports         |
| **Real-time (Web)**    | ✅ Complete      | 100%       | Socket.io + notification center fully implemented    |
| **Real-time (Mobile)** | ❌ Not Started   | 0%         | Push notifications planned but not implemented       |

---

## Module-by-Module Status

### Backend (API Server)

**Tech Stack:** Node.js + Express + TypeScript + Prisma + PostgreSQL

#### ✅ Completed Features

##### Authentication & Security

- ✅ User registration & login (JWT-based)
- ✅ Password hashing with bcrypt
- ✅ Refresh token system
- ✅ Password reset flow with email tokens
- ✅ Token blacklisting for logout
- ✅ Profile picture upload
- ✅ Role-based access control (RBAC)
- ✅ Authorization middleware for all handler roles

##### User Management

- ✅ Create/edit/delete users
- ✅ Role assignment (ADMIN, INVIGILATOR, LECTURER, FACULTY_OFFICER, DEPARTMENT_HEAD)
- ✅ User profile management
- ✅ List handlers for transfers
- ✅ Password change enforcement

##### Student Management

- ✅ Create/import students (CSV)
- ✅ Student profile with QR code
- ✅ Generate student QR code images (PNG data URL)
- ✅ Student search and listing
- ✅ Student QR code API endpoint
- ✅ Expected student pre-registration for exams

##### Exam Session Management

- ✅ Create exam sessions
- ✅ Generate unique batch QR codes (auto-generated)
- ✅ Generate batch QR code images (PNG data URL)
- ✅ Batch QR code API endpoint
- ✅ Update batch status
- ✅ Fetch exam session details
- ✅ List all exam sessions
- ✅ Expected students import via CSV
- ✅ Get expected students for verification

##### Attendance Tracking

- ✅ Record student entry (scan QR)
- ✅ Record student exit
- ✅ Record script submission
- ✅ Track discrepancies (entry without submission)
- ✅ Attendance status management
- ✅ Fetch attendance by exam session
- ✅ Real attendance count for transfers

##### Batch Transfer & Custody

- ✅ Create transfer requests
- ✅ Confirm/reject transfers
- ✅ Transfer history by handler
- ✅ Transfer status tracking
- ✅ Discrepancy reporting
- ✅ Auto-create initial custody on batch submission
- ✅ Complete custody chain tracking
- ✅ Script count validation

##### Audit & Logging

- ✅ Comprehensive audit trail
- ✅ Action logging with user context
- ✅ Entity-based audit queries
- ✅ Timestamp tracking

##### Analytics & Reporting

- ✅ Analytics overview endpoint
- ✅ Handler performance metrics
- ✅ Discrepancy reports
- ✅ Exam statistics
- ✅ PDF export (batch manifests, attendance reports, discrepancy reports)
- ✅ Excel export (handler performance, analytics overview)
- ✅ Role-based export authorization

##### Real-time Communication

- ✅ Socket.io server with JWT authentication
- ✅ User-specific and role-specific rooms
- ✅ Transfer event emitters (requested, confirmed, rejected, updated)
- ✅ Batch event emitters (created, status updated)
- ✅ Attendance event emitters (recorded)
- ✅ Controller integration for all events
- ✅ Auto-reconnection support
- ✅ Health check ping/pong system

#### ⚠️ Missing/Incomplete Features

##### Real-time Communication

- ❌ Mobile push notifications not implemented
- ❌ Notification preferences/settings
- ❌ Read receipts for notifications

##### Advanced Features

- ❌ Email notifications (SMTP not configured)
- ❌ Batch search with advanced filters
- ❌ QR code encryption
- ❌ Performance metrics tracking
- ❌ Automated scheduled reports

##### Data Management

- ❌ Bulk operations (delete multiple, etc.)
- ❌ Data archiving for old exams
- ❌ Backup/restore utilities
- ❌ Database cleanup scripts

#### 📂 Backend Structure

```text
backend/
├── prisma/
│   ├── schema.prisma           ✅ Complete schema
│   ├── migrations/             ✅ 3 migrations applied
│   └── seed.ts                 ✅ Seed script
├── src/
│   ├── server.ts               ✅ Express server setup
│   ├── controllers/            ✅ All controllers complete
│   │   ├── authController.ts           ✅ Auth & password reset
│   │   ├── userController.ts           ✅ User CRUD
│   │   ├── studentController.ts        ✅ Student CRUD
│   │   ├── examSessionController.ts    ✅ Exam sessions
│   │   ├── attendanceController.ts     ✅ Attendance tracking
│   │   ├── batchTransferController.ts  ✅ Transfer handshake
│   │   ├── analyticsController.ts      ✅ Analytics (NEW)
│   │   └── exportController.ts         ✅ PDF/Excel exports (NEW)
│   ├── services/               ✅ Business logic
│   │   └── exportService.ts            ✅ Export generation (NEW)
│   ├── socket/                 ✅ Real-time (NEW)
│   │   ├── socketServer.ts             ✅ Socket.io with JWT auth (NEW)
│   │   └── handlers/
│   │       ├── transferEvents.ts       ✅ Transfer events (NEW)
│   │       ├── batchEvents.ts          ✅ Batch events (NEW)
│   │       └── attendanceEvents.ts     ✅ Attendance events (NEW)
│   ├── middleware/             ✅ Security middleware
│   │   ├── auth.ts                     ✅ JWT verification
│   │   └── rbac.ts                     ✅ Role-based access
│   ├── routes/                 ✅ All routes configured
│   │   ├── auth.ts                     ✅ Auth routes
│   │   ├── users.ts                    ✅ User routes
│   │   ├── students.ts                 ✅ Student routes
│   │   ├── examSessions.ts             ✅ Exam routes
│   │   ├── attendance.ts               ✅ Attendance routes
│   │   ├── batchTransfer.ts            ✅ Transfer routes
│   │   ├── analytics.ts                ✅ Analytics routes (NEW)
│   │   └── export.ts                   ✅ Export routes (NEW)
│   └── utils/                  ✅ Complete
│       ├── jwt.ts                      ✅ JWT utilities
│       └── cleanupBlacklistedTokens.ts ✅ Token cleanup
└── package.json                ✅ Dependencies configured
```

---

### Web Dashboard (Admin)

**Tech Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Zustand

#### ✅ Completed Features

##### Authentication

- ✅ Login page with form validation
- ✅ Logout functionality
- ✅ Password change required flow
- ✅ Forgot password page
- ✅ Protected routes
- ✅ Persistent auth state (Zustand)
- ✅ Profile picture display

##### Dashboard

- ✅ Main dashboard with navigation
- ✅ Dashboard stats overview
- ✅ Sidebar navigation
- ✅ User profile dropdown

##### User Management

- ✅ Users list page
- ✅ Create/edit user forms
- ✅ Role assignment
- ✅ User activation/deactivation
- ✅ Profile picture upload

##### Student Management

- ✅ Students list page
- ✅ Student details view
- ✅ Student creation form
- ✅ CSV import functionality

##### Exam Session Management

- ✅ Exam sessions list
- ✅ Create exam session form
- ✅ Batch details page
- ✅ Expected students import
- ✅ Status update

##### Batch Tracking

- ✅ Batch tracking page
- ✅ Batch status filters
- ✅ View batch details
- ✅ Custody chain display (partial)

##### Audit Logs

- ✅ Audit logs page
- ✅ Filter by entity/action
- ✅ Timestamp tracking

#### ⚠️ Missing/Incomplete Features

##### Real-time Features

- ❌ Real-time notifications (Socket.io)
- ❌ Live transfer request notifications
- ❌ Real-time batch status updates
- ❌ Live dashboard updates

##### Advanced Features

- ❌ Dark mode toggle
- ❌ Multi-language support (i18n)
- ❌ PWA offline support
- ❌ Batch search with filters
- ❌ Timeline visualization for custody
- ❌ Automated alerts display

##### UI/UX Enhancements

- ❌ Loading skeletons
- ❌ Toast notifications system (partial - using sonner)
- ❌ Confirmation dialogs
- ❌ Error boundaries
- ❌ Accessibility features (WCAG 2.1 AA)

#### 📂 Web Structure

```text
web/
├── src/
│   ├── pages/                  ✅ All core pages complete
│   │   ├── LoginPage.tsx               ✅ Complete
│   │   ├── DashboardPage.tsx           ✅ Basic layout
│   │   ├── DashboardStatsPage.tsx      ✅ Stats overview
│   │   ├── AnalyticsDashboardPage.tsx  ✅ Complete (NEW)
│   │   ├── UsersPage.tsx               ✅ Complete
│   │   ├── StudentsPage.tsx            ✅ Complete
│   │   ├── ExamSessionsPage.tsx        ✅ Complete
│   │   ├── BatchTrackingPage.tsx       ✅ Basic tracking
│   │   ├── BatchDetailsPage.tsx        ✅ Complete
│   │   ├── SessionsPage.tsx            ✅ Complete
│   │   ├── AuditLogsPage.tsx           ✅ Complete
│   │   ├── ChangePasswordRequiredPage.tsx ✅ Complete
│   │   ├── ForgotPasswordPage.tsx      ✅ Complete
│   │   └── UnauthorizedPage.tsx        ✅ Complete
│   ├── components/             ✅ Core components
│   │   ├── ProtectedRoute.tsx          ✅ Complete
│   │   ├── ProfilePictureUpload.tsx    ✅ Complete
│   │   ├── StatCard.tsx                ✅ Complete (NEW)
│   │   ├── BarChartCard.tsx            ✅ Complete (NEW)
│   │   ├── LineChartCard.tsx           ✅ Complete (NEW)
│   │   └── NotificationCenter.tsx      ✅ Complete (NEW)
│   ├── store/                  ✅ State management
│   │   ├── auth.ts                     ✅ Auth store (Zustand)
│   │   └── notifications.ts            ✅ Notification store (NEW)
│   ├── api/                    ✅ API client
│   │   └── (API modules)               ✅ All endpoints covered
│   ├── lib/                    ✅ Utilities
│   │   ├── utils.ts                    ✅ Helper functions
│   │   └── socket.ts                   ✅ Socket.io client (NEW)
│   ├── hooks/                  ✅ Custom hooks
│   │   └── useSocket.ts                ✅ Socket connection hook (NEW)
│   ├── layouts/                ✅ Layout components
│   └── types/                  ✅ TypeScript types
└── package.json                ✅ Dependencies configured
```

---

### Mobile Application

**Tech Stack:** React Native + Expo + TypeScript + NativeWind (Tailwind)

#### ✅ Completed Features

##### Authentication

- ✅ Login screen
- ✅ Password change screen
- ✅ Auth state management (Zustand)
- ✅ Cross-platform storage (SecureStore/localStorage)
- ✅ Auto-login with stored credentials

##### Navigation

- ✅ Tab navigation
- ✅ Stack navigation
- ✅ Protected routes
- ✅ Modal screens

##### Exam Session Management

- ✅ Student attendance tracking
- ✅ Entry/exit/submission recording
- ✅ QR code scanning
- ✅ Batch details view
- ✅ Attendance statistics
- ✅ Absentee information display

##### Batch Transfer & Custody

- ✅ Custody tab (replaces transfers)
- ✅ Initiate transfer screen
- ✅ Confirm transfer screen
- ✅ Handler selection
- ✅ Transfer request notifications (UI only)
- ✅ Custody status tracking (4 states)
- ✅ Custody history visibility
- ✅ Custody validation (prevent invalid transfers)
- ✅ Script count based on attendance

##### UI Components

- ✅ Custom drawer
- ✅ Attendance drawer
- ✅ Themed components
- ✅ Tab bar icons
- ✅ Loading states
- ✅ Error handling

##### Real-time Features

- ✅ Push notifications (Expo Notifications)
- ✅ Socket.io client with JWT authentication
- ✅ Real-time transfer notifications (8 event types)
- ✅ Local notification scheduling
- ✅ Permission management
- ✅ Foreground and background notifications
- ✅ Auto-reconnection and health checks

#### ⚠️ Missing/Incomplete Features

##### Real-time Enhancements

- ❌ Notification navigation (tap to open relevant screen)
- ❌ Notification history/persistence
- ❌ Notification preferences/settings
- ❌ Remote push notifications (FCM/APNs)

##### Offline Support

- ❌ Local database (WatermelonDB/Realm)
- ❌ Offline queue for scans
- ❌ Sync when online
- ❌ Conflict resolution

##### Additional Features (Nice to Have)

- ❌ Dark mode
- ❌ Profile picture display
- ❌ Search functionality
- ⚠️ Batch history view (partial - available in custody tab)
- ❌ Discrepancy reporting with photos
- ⚠️ Transfer request rejection (confirm/reject flow exists, needs polish)

#### 📂 Mobile Structure

```
mobile/
├── app/                        ✅ Core screens complete
│   ├── (tabs)/                 ✅ Tab navigation
│   │   ├── index.tsx                   ✅ Home/Dashboard
│   │   ├── custody.tsx                 ✅ Custody tracking
│   │   ├── scanner.tsx                 ✅ QR Scanner (Camera)
│   │   └── explore.tsx                 ✅ Settings
│   ├── login.tsx                       ✅ Login screen
│   ├── change-password.tsx             ✅ Password change
│   ├── student-attendance.tsx          ✅ Attendance tracking
│   ├── batch-details.tsx               ✅ Batch details
│   ├── initiate-transfer.tsx           ✅ Transfer initiation
│   ├── confirm-transfer.tsx            ✅ Transfer confirmation
│   ├── modal.tsx                       ✅ Modal screen
│   └── _layout.tsx                     ✅ Root layout
├── components/                 ⚠️ Basic components
│   ├── AttendanceDrawer.tsx            ✅ Attendance drawer
│   ├── CustomDrawer.tsx                ✅ Drawer navigation
│   └── ui/                             ⚠️ UI components needed
├── api/                        ✅ API client
│   ├── auth.ts                         ✅ Auth API
│   ├── examSessions.ts                 ✅ Sessions API
│   ├── attendance.ts                   ✅ Attendance API
│   └── batchTransfers.ts               ✅ Transfer API
├── store/                      ✅ State management
│   └── auth.ts                         ✅ Auth store
├── utils/                      ✅ Utilities
│   └── storage.ts                      ✅ Cross-platform storage
└── types/                      ✅ TypeScript types
```

---

## Database & Schema Status

### ✅ Fully Implemented

**Database:** PostgreSQL 15+  
**ORM:** Prisma

#### Models (All Complete)

1. **User** ✅

   - Authentication fields
   - Role-based access
   - Profile picture
   - Password reset
   - Refresh tokens
   - Account locking

2. **Student** ✅

   - Student information
   - QR code
   - Attendance records

3. **ExamSession** ✅

   - Batch information
   - QR code
   - Status tracking
   - Expected students

4. **ExamSessionStudent** ✅

   - Expected student pre-registration
   - CSV import support
   - No user account required

5. **ExamAttendance** ✅

   - Entry/exit/submission tracking
   - Discrepancy notes
   - Status management

6. **BatchTransfer** ✅

   - Transfer handshake
   - Custody chain
   - Discrepancy tracking
   - Script count validation

7. **AuditLog** ✅

   - Complete audit trail
   - User actions
   - Entity tracking

8. **RefreshToken** ✅

   - Token management
   - Expiry tracking

9. **PasswordResetToken** ✅

   - Password reset flow
   - Token expiry

10. **BlacklistedToken** ✅
    - Logout/session revocation
    - Token blacklisting

#### Migrations: 3 Applied ✅

1. ✅ `20251202024757_init` - Initial schema
2. ✅ `20251202220537_add_profile_picture_and_password_reset` - Profile & reset
3. ✅ `20251202235458_add_token_blacklist` - Token blacklist

---

## What's Done ✅

### Core Functionality (MVP Complete)

#### ✅ Authentication & Authorization

- User registration, login, logout
- JWT access tokens + refresh tokens
- Password reset via email tokens
- Role-based access control (5 roles)
- Token blacklisting for immediate logout
- Password change enforcement
- Profile picture upload

#### ✅ User Management

- Create/edit/delete users
- Role assignment
- Handler listing for transfers
- User activation/deactivation

#### ✅ Student Management

- Create/import students (CSV)
- Student profiles with QR codes
- Expected student pre-registration
- Student search and listing

#### ✅ Exam Session Management

- Create exam sessions
- Generate unique batch QR codes (auto-generated)
- Generate batch QR code images (PNG data URL)
- Update batch status (8 statuses)
- View exam details
- Import expected students via CSV
- Batch QR code API endpoint with download

#### ✅ QR Code & Camera System (COMPLETE)

**Backend:**

- Generate student QR codes (JSON data with student info)
- Generate batch QR codes (JSON data with exam info)
- QR code API endpoints (PNG data URLs)
- QRCode library integration (`qrcode` npm package)

**Web Dashboard:**

- Display QR codes in modal
- Download QR codes as PNG files
- QR code viewer for batches and students

**Mobile App:**

- Full camera integration with `expo-camera`
- One-time camera permission (persistent until uninstall)
- QR scanner screen with visual overlay
- Batch QR scanning with auto session loading
- Student ID QR scanning for entry/exit
- Entry/Exit mode toggle
- Session switching via QR codes
- Auto-validation and processing
- Duplicate scan prevention
- Success/error feedback alerts
- ⚠️ **Minor polish needed:** Edge case handling, error messages, performance optimization

#### ✅ Attendance Tracking

- Scan student QR for entry
- Scan for exit
- Scan for submission
- Track discrepancies
- Attendance statistics
- Real attendance count for transfers

#### ✅ Batch Transfer & Custody System

- Initiate transfer requests
- Accept/reject transfers (handshake)
- Complete custody chain tracking
- Transfer history
- Auto-create initial custody on submission
- Custody validation (prevent invalid transfers)
- 4 custody states (IN_CUSTODY, PENDING_RECEIPT, TRANSFER_INITIATED, TRANSFERRED)
- View custody history for all handlers in chain
- Script count based on actual attendance

#### ✅ Web Dashboard

- Admin login
- Dashboard with stats
- User management pages
- Student management pages
- Exam session pages
- Batch tracking page
- Audit logs page

#### ✅ Mobile App

- Handler login
- Custody tracking tab
- Student attendance screen
- Batch details screen
- Transfer initiation screen
- Transfer confirmation screen
- Cross-platform support (iOS/Android/Web)
- Platform-specific storage (SecureStore/localStorage)

#### ✅ Audit & Logging

- Comprehensive audit trail
- Action logging
- Entity tracking
- Timestamp tracking

---

## What's Missing ⚠️

### High Priority (Required for Production)

#### 🔴 Real-time Communication

- Socket.io server implementation
- Push notifications (Expo Notifications)
- Live transfer request notifications
- Real-time batch status updates
- Live dashboard updates

#### 🔴 Reports & Analytics

- Analytics dashboard with charts
- Discrepancy reports
- Handler performance metrics
- Exam completion statistics
- Export to PDF/Excel
- Custom date range reports
- Automated report generation

#### 🔴 Notifications System

- Email notifications (SMTP)
- Push notifications (mobile)
- SMS notifications (optional)
- In-app notification center
- Notification preferences

### Medium Priority (Enhanced Features)

#### 🟡 Offline Support (Mobile)

- Local database (WatermelonDB/Realm)
- Offline queue for scans
- Background sync
- Conflict resolution

#### 🟡 Advanced Search & Filters

- Batch search with multiple filters
- Student search
- Advanced audit log filters
- Date range selectors

#### 🟡 UI/UX Enhancements

- Dark mode (web + mobile)
- Loading skeletons
- Toast notifications
- Confirmation dialogs
- Error boundaries
- Accessibility features (WCAG 2.1 AA)
- Multi-language support (i18n)

#### 🟡 Data Management

- Bulk operations
- Data archiving
- Backup/restore utilities
- Database cleanup scripts
- Old exam data archiving

### Low Priority (Nice to Have)

#### 🟢 Security Enhancements

- QR code encryption
- Two-factor authentication (2FA)
- Digital signatures for transfers
- Blockchain-inspired custody chain

#### 🟢 Advanced Features

- Timeline visualization for custody
- Batch lifecycle diagram
- Predictive analytics
- Performance optimization
- Load testing results
- PWA offline support (web)

---

## Future Implementation: Class Attendance System

### Overview

A session-based class attendance system for lecture recording that operates independently from the exam script tracking system but shares the same infrastructure.

### Key Concept

**Single Shared Account with Device-Based Sessions**

Instead of individual user accounts, the system uses:

- 1 shared credential (email + password)
- Device-specific sessions (isolated per device)
- Session persistence across logins
- Attendance history tied to device sessions

### User Role

**Generic Role:** `CLASS_REP` or `ATTENDANCE_RECORDER`

- No specific user identity required
- Role used for authentication only
- All actions tied to device session, not user

---

### Technical Architecture

#### Session Management System

##### 1. Device Identification

Multiple strategies for device identification (in order of preference):

1. **Device UUID** (Primary)

   - Use Expo's `expo-application` API
   - Get unique device ID: `Application.androidId` (Android) or `Application.getIosIdForVendorAsync()` (iOS)
   - Store in secure storage

2. **Device Fingerprint** (Fallback)

   - Combination of:
     - Device model
     - OS version
     - Screen dimensions
     - Time zone
   - Hash to create pseudo-unique ID

3. **Manual Session Registration** (Backup)
   - User enters device name on first login
   - Creates labeled session
   - Stored in backend with device identifier

##### 2. Database Schema

```prisma
// Class Attendance Session
model AttendanceSession {
  id              String   @id @default(uuid())
  deviceId        String   @unique // Device UUID or fingerprint
  deviceName      String?  // User-provided device label
  sessionToken    String   @unique // Unique session token
  isActive        Boolean  @default(true)
  lastActivity    DateTime @updatedAt
  createdAt       DateTime @default(now())

  attendanceRecords ClassAttendanceRecord[]
}

// Class Attendance Recording
model ClassAttendanceRecord {
  id               String            @id @default(uuid())
  sessionId        String
  lecturerName     String?           // Optional label
  courseName       String?           // Optional label
  courseCode       String?           // Optional label
  startTime        DateTime          @default(now())
  endTime          DateTime?
  status           RecordingStatus   @default(IN_PROGRESS)
  totalStudents    Int               @default(0)
  notes            String?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  session          AttendanceSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  students         ClassAttendance[]

  @@index([sessionId])
  @@index([startTime])
}

enum RecordingStatus {
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// Individual Student Attendance
model ClassAttendance {
  id               String                  @id @default(uuid())
  recordId         String
  studentId        String                  // From Student model
  scanTime         DateTime                @default(now())
  status           ClassAttendanceStatus   @default(PRESENT)

  record           ClassAttendanceRecord   @relation(fields: [recordId], references: [id], onDelete: Cascade)
  student          Student                 @relation(fields: [studentId], references: [id])

  @@unique([recordId, studentId])
  @@index([recordId])
}

enum ClassAttendanceStatus {
  PRESENT
  LATE
  EXCUSED
}
```

##### 3. Session Lifecycle

**A. First Login (New Device)**

```typescript
// Mobile app: First login flow
1. User enters shared email + password
2. App generates/retrieves device ID
3. Check if session exists for device ID
4. If not:
   - Prompt user for device name (optional)
   - Create new session in backend
   - Store session token in secure storage
5. Navigate to Class Attendance Dashboard
```

**B. Subsequent Logins (Existing Device)**

```typescript
// Mobile app: Returning user flow
1. User enters shared email + password
2. App retrieves device ID from storage
3. Backend finds existing session by device ID
4. Restore session with attendance history
5. Navigate to Class Attendance Dashboard
```

**C. Session Activity Tracking**

```typescript
// Backend: Auto-revoke inactive sessions
- Track lastActivity on every API call
- Sessions inactive > 90 days → auto-revoke
- Sessions with no attendance history + inactive > 30 days → auto-revoke
```

---

### Features & Workflows

#### 1. Attendance Recording Dashboard

**Mobile App Screen: `ClassAttendanceDashboard.tsx`**

```typescript
Features:
- Start New Attendance Recording button
- List of ongoing recordings
- Attendance history (past recordings)
- Session statistics (total recordings, students scanned)
- Logout button
```

#### 2. Start Attendance Recording

**Workflow:**

1. Tap "Start New Recording"
2. Optional: Add labels
   - Lecturer name
   - Course code
   - Course name
   - Notes
3. System creates new `ClassAttendanceRecord` (status: IN_PROGRESS)
4. Navigate to QR Scanning Screen

#### 3. QR Scanning (During Lecture)

**Mobile App Screen: `RecordAttendanceScreen.tsx`**

```typescript
Features:
- Camera QR scanner (full screen)
- Real-time student count
- Last scanned student info (name, index)
- "End Recording" button
- Visual/audio feedback on successful scan
```

**Scan Workflow:**

1. Student shows ID QR code
2. Camera scans QR
3. Extract student ID from QR
4. Check if student already scanned (prevent duplicates)
5. Create `ClassAttendance` record
6. Show success feedback
7. Update student count
8. Continue scanning

#### 4. End Recording

**Workflow:**

1. Tap "End Recording"
2. Confirm dialog
3. Update `ClassAttendanceRecord`:
   - endTime = now()
   - status = COMPLETED
   - totalStudents = count
4. Navigate to Recording Summary

#### 5. Recording Summary

**Mobile App Screen: `AttendanceSummaryScreen.tsx`**

```typescript
Display:
- Recording details (lecturer, course, date/time)
- Total students scanned
- Duration
- Student list (scrollable)
- Export options:
  - Download PDF
  - Download CSV
  - Share via email
```

#### 6. Attendance History

**Mobile App Screen: `AttendanceHistoryScreen.tsx`**

```typescript
Features:
- List all past recordings for this device session
- Filter by date range
- Search by course/lecturer
- Tap to view summary
- Export individual or batch recordings
```

#### 7. Export Formats

**PDF Format:**

```
------------------------------------------
CLASS ATTENDANCE REPORT
------------------------------------------
Lecturer:    [Name]
Course:      [Code] - [Name]
Date:        [Date]
Start Time:  [Time]
End Time:    [Time]
Duration:    [X minutes]
Total:       [N] students
------------------------------------------
#  | Index Number | Name              | Time
------------------------------------------
1  | 12345678     | John Doe          | 10:05 AM
2  | 87654321     | Jane Smith        | 10:06 AM
...
------------------------------------------
Generated by Exam Script Tracking System
Session ID: [Session ID]
------------------------------------------
```

**CSV Format:**

```csv
Index Number,First Name,Last Name,Program,Level,Scan Time
12345678,John,Doe,Computer Science,300,2025-12-04 10:05:23
87654321,Jane,Smith,Information Technology,200,2025-12-04 10:06:15
```

---

### Admin Panel Features (Web Dashboard)

#### 1. Session Management Page

**Web Page: `AttendanceSessionsPage.tsx`**

```typescript
Features:
- View all active sessions
- Session details:
  - Device name
  - Device ID (masked)
  - Total recordings
  - Last activity
  - Created date
- Revoke session button (with confirmation)
- Flag suspicious sessions
- Export session data
```

#### 2. Session Revocation

**Workflow:**

1. Admin views suspicious session
2. Click "Revoke Session"
3. Confirm dialog
4. Backend:
   - Set session.isActive = false
   - Add to audit log
5. Next time device tries to use session:
   - Return 401 Unauthorized
   - Force re-login
   - Create new session (if device is legitimate)

#### 3. Auto-Revocation Rules

**Backend Cron Job: `cleanupInactiveSessions.ts`**

```typescript
Rules:
1. No attendance history + inactive > 30 days → revoke
2. Inactive > 90 days → revoke
3. Flagged as suspicious → manual review

Run: Daily at 2:00 AM
```

#### 4. Reports & Analytics

**Features:**

- Total sessions active
- Total recordings across all sessions
- Most active sessions
- Session activity timeline
- Attendance trends by course/lecturer

---

### Session Recovery (Lost/Damaged Device)

#### Problem Scenario

Device is lost, damaged, or replaced. User needs to access old attendance data on a new device.

#### Solution: Session Transfer System

##### Option 1: Admin-Assisted Recovery (Recommended)

**Workflow:**

1. User contacts admin
2. Admin logs into web dashboard
3. Navigate to Session Management
4. Find user's old session by device name or recent activity
5. Click "Generate Recovery Code"
6. System generates 6-digit code (valid 24 hours)
7. Admin shares code with user
8. User logs in on new device
9. App prompts: "Recover existing session?"
10. User enters recovery code
11. Backend validates code
12. Transfer session to new device ID
13. Old session marked as "transferred"

##### Option 2: Device Name Matching (Semi-Automatic)

**Workflow:**

1. User logs in on new device
2. App detects new device ID
3. Prompt: "Is this a new device or replacing an old one?"
4. User selects "Replacing old device"
5. Show list of sessions with similar device names
6. User selects correct session
7. System sends verification code to admin email
8. User enters code
9. Session transferred

##### Option 3: Manual Recovery (Self-Service)

**Workflow:**

1. User logs in on new device
2. Manually create new session
3. Note: Old data not accessible
4. Later, admin can manually merge sessions if needed

---

### Mobile App Implementation Plan

#### New Screens Required

1. **Class Attendance Dashboard** (`ClassAttendanceDashboard.tsx`)

   - Entry point after login
   - Toggle between "Exam Tracking" and "Class Attendance"
   - Show ongoing recordings
   - Show history

2. **Start Recording Form** (`StartRecordingScreen.tsx`)

   - Form to add labels (lecturer, course, notes)
   - Start button

3. **QR Scanning Screen** (`RecordAttendanceScreen.tsx`)

   - Camera view
   - Real-time count
   - End button

4. **Attendance Summary** (`AttendanceSummaryScreen.tsx`)

   - Recording details
   - Student list
   - Export options

5. **Attendance History** (`AttendanceHistoryScreen.tsx`)

   - List past recordings
   - Filter/search
   - Tap to view summary

6. **Session Recovery Screen** (`RecoverSessionScreen.tsx`)
   - Enter recovery code
   - Validate and transfer

#### Navigation Structure

```typescript
App Navigator:
├── Auth Stack (if not logged in)
│   └── Login Screen
└── Main Stack (if logged in)
    ├── Tab Navigator
    │   ├── Exam Tracking Tab (existing)
    │   │   ├── Custody Screen
    │   │   ├── Batch Details
    │   │   └── Transfer Screens
    │   └── Class Attendance Tab (NEW)
    │       ├── Class Attendance Dashboard
    │       ├── Start Recording
    │       ├── Record Attendance
    │       ├── Attendance Summary
    │       └── Attendance History
    └── Settings (existing)
```

---

### Backend API Endpoints

#### Session Management

```typescript
// Create or retrieve session
POST /api/attendance/session
Body: {
  deviceId: string;
  deviceName?: string;
  deviceInfo?: object; // Device model, OS, etc.
}
Response: {
  session: AttendanceSession;
  isNewSession: boolean;
}

// Get session by device ID
GET /api/attendance/session/:deviceId
Response: {
  session: AttendanceSession;
  recordingsCount: number;
  lastRecording?: ClassAttendanceRecord;
}

// Admin: List all sessions
GET /api/admin/attendance/sessions
Query: { active?: boolean; flagged?: boolean }
Response: {
  sessions: AttendanceSession[];
}

// Admin: Revoke session
POST /api/admin/attendance/sessions/:sessionId/revoke
Response: { success: boolean }

// Admin: Generate recovery code
POST /api/admin/attendance/sessions/:sessionId/recovery-code
Response: { recoveryCode: string; expiresAt: DateTime }

// User: Recover session with code
POST /api/attendance/session/recover
Body: { recoveryCode: string; newDeviceId: string }
Response: { session: AttendanceSession }
```

#### Attendance Recording

```typescript
// Start new recording
POST /api/attendance/recordings
Body: {
  sessionId: string;
  lecturerName?: string;
  courseName?: string;
  courseCode?: string;
  notes?: string;
}
Response: { recording: ClassAttendanceRecord }

// Get ongoing recordings for session
GET /api/attendance/recordings/ongoing/:sessionId
Response: { recordings: ClassAttendanceRecord[] }

// Scan student attendance
POST /api/attendance/recordings/:recordId/scan
Body: { studentId: string }
Response: {
  attendance: ClassAttendance;
  student: Student;
  totalScanned: number;
}

// End recording
PATCH /api/attendance/recordings/:recordId/end
Response: {
  recording: ClassAttendanceRecord;
  summary: {
    totalStudents: number;
    duration: number; // minutes
  }
}

// Get recording summary
GET /api/attendance/recordings/:recordId
Response: {
  recording: ClassAttendanceRecord;
  students: ClassAttendance[];
}

// Get attendance history for session
GET /api/attendance/recordings/history/:sessionId
Query: { startDate?: string; endDate?: string; courseCode?: string }
Response: { recordings: ClassAttendanceRecord[] }

// Export recording (PDF or CSV)
GET /api/attendance/recordings/:recordId/export/:format
Params: { format: "pdf" | "csv" }
Response: File download
```

---

### Security Considerations

#### 1. Session Security

- **Session Token:** Generate cryptographically secure token
- **Token Storage:** Store in secure storage (Keychain/Keystore)
- **Token Expiry:** Sessions expire after 90 days inactivity
- **Device Binding:** Token tied to specific device ID

#### 2. Preventing Abuse

- **Rate Limiting:** Max 5 login attempts per device per hour
- **Device Limit:** Max 20 active sessions per shared account
- **Admin Alerts:** Alert when >15 sessions active (suspicious)
- **Duplicate Scan Prevention:** Same student can't be scanned twice in same recording

#### 3. Data Privacy

- **Student Data:** Only index number and name exposed
- **Session Isolation:** Sessions can't see each other's data
- **Audit Trail:** All session actions logged
- **GDPR Compliance:** Allow session deletion with data

---

### Implementation Timeline

#### Phase 1: Backend (2 weeks)

- [ ] Create database models (AttendanceSession, ClassAttendanceRecord, ClassAttendance)
- [ ] Implement session management API
- [ ] Implement recording API
- [ ] Add export functionality (PDF/CSV)
- [ ] Create cleanup cron job
- [ ] Write API tests

#### Phase 2: Mobile App (3 weeks)

- [ ] Add tab navigation for Class Attendance
- [ ] Implement Class Attendance Dashboard
- [ ] Create Start Recording screen
- [ ] Implement QR scanning for attendance
- [ ] Build Attendance Summary screen
- [ ] Add Attendance History screen
- [ ] Implement export functionality
- [ ] Add session recovery flow

#### Phase 3: Web Dashboard (1 week)

- [ ] Create Attendance Sessions page
- [ ] Add session management features
- [ ] Implement session revocation
- [ ] Add recovery code generation
- [ ] Create analytics for attendance

#### Phase 4: Testing & Polish (1 week)

- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] User documentation

**Total Estimated Time: 7 weeks**

---

## Design System & UI/UX Guidelines

### Overview

Create a cohesive design system across all platforms (Backend Console, Web Dashboard, Mobile App) using consistent tokens, components, and patterns.

---

### Design System Recommendation

#### Core Design System: **Tailwind CSS + shadcn/ui**

**Rationale:**

- ✅ Tailwind CSS already used across web and mobile (NativeWind)
- ✅ shadcn/ui provides high-quality, accessible components
- ✅ Consistent design tokens across platforms
- ✅ Fully customizable with Tailwind config
- ✅ TypeScript support out of the box

---

### Platform-Specific Implementation

#### 1. Web Dashboard (Admin)

**Tech Stack:**

- **Base:** Tailwind CSS 4.1
- **Component Library:** shadcn/ui
- **Icons:** Lucide React
- **Charts:** Recharts (with Tailwind theming)
- **Tables:** TanStack Table (styled with Tailwind)
- **Forms:** React Hook Form + shadcn/ui form components

**shadcn/ui Components to Install:**

```bash
# Essential components
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add toast
npx shadcn@latest add alert
npx shadcn@latest add skeleton
npx shadcn@latest add tabs
npx shadcn@latest add form
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add textarea
npx shadcn@latest add calendar
npx shadcn@latest add popover
npx shadcn@latest add command
npx shadcn@latest add sheet
npx shadcn@latest add separator
```

#### 2. Mobile App (Handler)

**Tech Stack:**

- **Base:** NativeWind (Tailwind for React Native)
- **Component Library:** Custom components matching shadcn/ui design
- **Icons:** Lucide React Native (or Expo Vector Icons)
- **Charts:** Victory Native (styled to match Recharts)
- **Navigation:** React Navigation with Tailwind styling

**Custom Component Library Structure:**

```
mobile/components/ui/
├── button.tsx              // Match shadcn/ui button variants
├── input.tsx               // Match shadcn/ui input
├── card.tsx                // Match shadcn/ui card
├── badge.tsx               // Match shadcn/ui badge
├── avatar.tsx              // Match shadcn/ui avatar
├── dialog.tsx              // React Native modal styled as dialog
├── select.tsx              // React Native picker styled as select
├── toast.tsx               // React Native toast
├── skeleton.tsx            // Loading skeletons
└── typography.tsx          // Text components
```

#### 3. Backend Console (Optional Admin Terminal)

If building a backend console/terminal for admin operations:

**Tech Stack:**

- **Framework:** Next.js (Server-side rendered)
- **Styling:** Same as Web Dashboard (Tailwind + shadcn/ui)
- **Purpose:** Advanced admin tools, database management, system monitoring

---

### Design Tokens (Shared Across Platforms)

#### Colors

**Tailwind Config (`tailwind.config.js`):**

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Brand Colors
        brand: {
          primary: "#3b82f6", // Blue-500
          secondary: "#8b5cf6", // Violet-500
          accent: "#10b981", // Green-500
        },

        // Status Colors
        status: {
          progress: "#3b82f6", // In Progress - Blue
          submitted: "#10b981", // Submitted - Green
          transit: "#f59e0b", // In Transit - Amber
          lecturer: "#8b5cf6", // With Lecturer - Violet
          grading: "#6366f1", // Under Grading - Indigo
          graded: "#14b8a6", // Graded - Teal
          returned: "#f97316", // Returned - Orange
          completed: "#6b7280", // Completed - Gray
        },

        // Custody Status Colors
        custody: {
          inCustody: "#10b981", // Green
          pendingReceipt: "#f59e0b", // Amber
          initiated: "#8b5cf6", // Violet
          transferred: "#6b7280", // Gray
        },

        // Semantic Colors
        success: "#10b981", // Green-500
        warning: "#f59e0b", // Amber-500
        error: "#ef4444", // Red-500
        info: "#3b82f6", // Blue-500
      },

      // Typography
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },

      // Spacing (additional)
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },

      // Border Radius
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },

      // Box Shadow
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.1)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  plugins: [],
};
```

#### Typography Scale

```typescript
// Shared typography tokens
export const typography = {
  // Headings
  h1: "text-4xl font-bold",
  h2: "text-3xl font-bold",
  h3: "text-2xl font-semibold",
  h4: "text-xl font-semibold",
  h5: "text-lg font-medium",
  h6: "text-base font-medium",

  // Body
  body: "text-base",
  bodyLarge: "text-lg",
  bodySmall: "text-sm",

  // Special
  caption: "text-xs text-gray-600",
  label: "text-sm font-medium",
  code: "font-mono text-sm",
};
```

#### Spacing Scale

```typescript
// Shared spacing tokens
export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
};
```

---

### Component Patterns

#### 1. Buttons

**Variants (consistent across platforms):**

```typescript
// Web (shadcn/ui default)
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Outline Action</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost Action</Button>

// Mobile (custom component matching shadcn/ui)
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Outline Action</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost Action</Button>
```

**Sizes:**

- `sm` - Small (mobile: compact, web: compact)
- `md` - Medium (default)
- `lg` - Large (mobile: touch-friendly, web: prominent)

#### 2. Cards

**Standard Card Pattern:**

```typescript
// Web
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>

// Mobile (matching structure)
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

#### 3. Forms

**Form Field Pattern:**

```typescript
// Web (shadcn/ui)
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input placeholder="email@example.com" {...field} />
      </FormControl>
      <FormDescription>Your institutional email</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>

// Mobile (custom component)
<FormField
  label="Email"
  description="Your institutional email"
  error={errors.email?.message}
>
  <Input
    placeholder="email@example.com"
    value={email}
    onChangeText={setEmail}
  />
</FormField>
```

#### 4. Status Badges

**Consistent Status Display:**

```typescript
// Badge component (web & mobile)
<Badge variant="success">Submitted</Badge>
<Badge variant="warning">In Transit</Badge>
<Badge variant="error">Discrepancy</Badge>
<Badge variant="info">In Progress</Badge>
<Badge variant="default">Completed</Badge>

// Color mapping (from design tokens)
success → custody.inCustody (#10b981)
warning → custody.pendingReceipt (#f59e0b)
error → error (#ef4444)
info → info (#3b82f6)
default → status.completed (#6b7280)
```

#### 5. Navigation

**Web Dashboard:**

```typescript
// Sidebar navigation with shadcn/ui
<nav className="space-y-2">
  <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
    <HomeIcon />
    <span>Dashboard</span>
  </Link>
  {/* More items */}
</nav>
```

**Mobile App:**

```typescript
// Tab navigation with icons
<Tab.Navigator>
  <Tab.Screen
    name="Home"
    component={HomeScreen}
    options={{
      tabBarIcon: ({ color }) => <HomeIcon color={color} />,
    }}
  />
  {/* More tabs */}
</Tab.Navigator>
```

---

### Accessibility Guidelines

#### WCAG 2.1 AA Compliance

1. **Color Contrast**

   - Text: Minimum 4.5:1 ratio
   - Large text: Minimum 3:1 ratio
   - Interactive elements: Minimum 3:1 ratio

2. **Focus Indicators**

   - Visible focus ring on all interactive elements
   - Web: Use `focus-visible:ring-2 focus-visible:ring-brand-primary`
   - Mobile: Use appropriate platform focus indicators

3. **Touch Targets (Mobile)**

   - Minimum 44x44 pts (iOS) / 48x48 dp (Android)
   - Use `min-h-12` and `min-w-12` for buttons

4. **Semantic HTML (Web)**

   - Use proper heading hierarchy
   - Use semantic elements (`<nav>`, `<main>`, `<article>`)
   - Add ARIA labels where needed

5. **Screen Reader Support**
   - Web: Add `aria-label` to icon-only buttons
   - Mobile: Add `accessibilityLabel` to all touchable elements

---

### Dark Mode Support

#### Implementation Strategy

**1. Tailwind Dark Mode (Web & Mobile):**

```javascript
// tailwind.config.js
module.exports = {
  darkMode: "class", // or 'media' for system preference
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // More color variables
      },
    },
  },
};
```

**2. CSS Variables (Web):**

```css
/* index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* More variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* More dark mode variables */
}
```

**3. React Native (Mobile):**

```typescript
// Use useColorScheme hook
import { useColorScheme } from "react-native";

function MyComponent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className={isDark ? "bg-gray-900" : "bg-white"}>{/* Content */}</View>
  );
}
```

---

### Responsive Design

#### Breakpoints (Web)

```typescript
// Tailwind default breakpoints
sm: '640px',   // Mobile landscape
md: '768px',   // Tablet portrait
lg: '1024px',  // Tablet landscape / Small desktop
xl: '1280px',  // Desktop
2xl: '1536px', // Large desktop
```

#### Mobile Considerations

- **Touch Targets:** Minimum 44x44 pts
- **Font Sizes:** Minimum 16px for inputs (prevents zoom on iOS)
- **Safe Areas:** Use `SafeAreaView` on iOS
- **Gestures:** Support swipe gestures for navigation

---

### Animation Guidelines

#### Web Animations

```typescript
// Tailwind transition utilities
transition-all
transition-colors
transition-transform

// Duration
duration-150  // Fast (150ms)
duration-300  // Normal (300ms)
duration-500  // Slow (500ms)

// Easing
ease-in-out
ease-out
```

#### Mobile Animations

```typescript
// React Native Animated API
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  easing: Easing.ease,
  useNativeDriver: true,
});
```

**Animation Principles:**

- Keep animations subtle (200-300ms)
- Use native driver for performance (mobile)
- Reduce motion for accessibility (`prefers-reduced-motion`)

---

### Icon System

#### Web: Lucide React

```bash
npm install lucide-react
```

```typescript
import { Home, Users, FileText, Settings } from "lucide-react";

<Home className="w-5 h-5" />;
```

#### Mobile: Lucide React Native

```bash
npm install lucide-react-native
```

```typescript
import { Home, Users, FileText, Settings } from "lucide-react-native";

<Home color="#3b82f6" size={20} />;
```

**Consistent Icon Sizes:**

- Small: 16px / w-4 h-4
- Medium: 20px / w-5 h-5
- Large: 24px / w-6 h-6

---

### Layout Patterns

#### Web Dashboard Layout

```typescript
<div className="flex h-screen">
  {/* Sidebar */}
  <aside className="w-64 bg-gray-900 text-white">{/* Navigation */}</aside>

  {/* Main Content */}
  <main className="flex-1 overflow-auto">
    {/* Header */}
    <header className="sticky top-0 z-10 bg-white border-b">
      {/* Page title, actions */}
    </header>

    {/* Content */}
    <div className="p-6">{/* Page content */}</div>
  </main>
</div>
```

#### Mobile App Layout

```typescript
<SafeAreaView className="flex-1 bg-gray-50">
  {/* Header */}
  <View className="bg-white border-b border-gray-200 p-4">
    {/* Title, actions */}
  </View>

  {/* Content */}
  <ScrollView className="flex-1 p-4">{/* Page content */}</ScrollView>
</SafeAreaView>
```

---

### Component Documentation

#### Required Documentation for Each Component

1. **Purpose:** What the component does
2. **Props:** TypeScript interface with descriptions
3. **Variants:** Available style variants
4. **Examples:** Code examples for common use cases
5. **Accessibility:** ARIA labels, keyboard support
6. **Platform Notes:** Platform-specific behaviors

**Example:**

```typescript
/**
 * Button Component
 *
 * A clickable button component with multiple variants and sizes.
 * Matches shadcn/ui button design on web and provides native feel on mobile.
 *
 * @example
 * <Button variant="default" size="md" onPress={handlePress}>
 *   Click Me
 * </Button>
 *
 * @props
 * - variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost'
 * - size: 'sm' | 'md' | 'lg'
 * - disabled: boolean
 * - loading: boolean
 *
 * @accessibility
 * - Includes `accessibilityRole="button"`
 * - Supports keyboard navigation (web)
 * - Shows loading state to screen readers
 */
```

---

### Testing & Quality Assurance

#### Visual Regression Testing

**Tools:**

- **Web:** Storybook + Chromatic
- **Mobile:** Detox + Appium

#### Accessibility Testing

**Tools:**

- **Web:** axe DevTools, Lighthouse
- **Mobile:** React Native Accessibility Inspector

#### Cross-Platform Consistency

**Checklist:**

- [ ] Colors match design tokens
- [ ] Typography scales match
- [ ] Spacing is consistent
- [ ] Icons are same size
- [ ] Components have same variants
- [ ] Animations feel similar

---

### Style Guide Document Structure

Create a living style guide document:

```
STYLE_GUIDE.md
├── 1. Design Principles
├── 2. Color System
├── 3. Typography
├── 4. Spacing & Layout
├── 5. Components
│   ├── Buttons
│   ├── Forms
│   ├── Cards
│   ├── Badges
│   └── Navigation
├── 6. Icons
├── 7. Animations
├── 8. Accessibility
├── 9. Dark Mode
└── 10. Platform-Specific Guidelines
```

---

## Summary

### Current State

✅ **Core functionality complete** (75% overall)

- Backend API fully functional
- Mobile app has working custody tracking
- Web dashboard has basic admin features
- Database schema complete

⚠️ **Missing critical features for production:**

- Real-time notifications
- QR scanning (mobile)
- Reports & analytics
- Offline support

### Next Steps

1. **Immediate Priority:**

   - Implement real-time communication (Socket.io)
   - Complete QR scanning on mobile
   - Add reports & analytics dashboard

2. **Short-term:**

   - Class Attendance System (7 weeks)
   - UI/UX polish with design system
   - Offline support

3. **Long-term:**
   - Dark mode
   - Multi-language support
   - Advanced security features

---

**Document Version:** 1.0  
**Last Updated:** December 4, 2025  
**Maintainer:** Development Team
