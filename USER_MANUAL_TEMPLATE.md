# Exam Logisitcs System - User Manual Template

**Version:** 1.0.0  
**Last Updated:** January 12, 2026  
**Status:** Template / Draft  

---

## Table of Contents

1. [System Overview](#system-overview)  
   1.1 [What is the Exam Script Tracking System?](#what-is-the-exam-script-tracking-system)  
   1.2 [Key Features](#key-features)  
       1.2.1 [Exams Logistics Module](#exams-logistics-module)  
       1.2.2 [Class Attendance System](#class-attendance-system)  
   1.3 [User Roles and Permissions](#user-roles-and-permissions)  
   1.4 [Technology Stack](#technology-stack)  
       1.4.1 [Web Dashboard (Admin)](#web-dashboard-admin)  
       1.4.2 [Mobile Application (Handler)](#mobile-application-handler)  
       1.4.3 [Backend (API & Real-time Server)](#backend-api--real-time-server)  
       1.4.4 [Database](#database)  
       1.4.5 [DevOps & Deployment](#devops--deployment)  

2. [Getting Started](#getting-started)  
   2.1 [System Requirements](#system-requirements)  
       2.1.1 [Web Dashboard](#web-dashboard)  
       2.1.2 [Mobile Access](#mobile-access)  
   2.2 [Installation and Setup](#installation-and-setup)  
       2.2.1 [Backend Setup](#backend-setup)  
       2.2.2 [Web Dashboard Setup](#web-dashboard-setup)  
       2.2.3 [Mobile App Setup](#mobile-app-setup)  
   2.3 [Login and Authentication](#login-and-authentication)  

3. [Web Dashboard Guide (Admin)](#web-dashboard-guide-admin)  
   3.1 [Dashboard Home](#dashboard-home)  
       3.1.1 [Statistics Overview](#statistics-overview)  
       3.1.2 [Quick Actions](#quick-actions)  
   3.2 [User Management](#user-management)  
   3.3 [Student Management](#student-management)  
   3.4 [Exam Session Management](#exam-session-management)  
   3.5 [Reports and Analytics](#reports-and-analytics)  
   3.6 [Incident Management](#incident-management)  

4. [Mobile Access Guide](#mobile-access-guide)  
   4.1 [Mobile Navigation](#mobile-navigation)  
   4.2 [QR Code Scanning](#qr-code-scanning)  
   4.3 [Custody Management](#custody-management)  
   4.4 [Transfer History](#transfer-history)  
   4.5 [Push Notifications](#push-notifications)  

5. [Exams Logistics Module](#exams-logistics-module-detailed)  
   5.1 [Overview](#overview)  
   5.2 [Exam Setup](#exam-setup)  
   5.3 [Attendance Recording](#attendance-recording)  
   5.4 [Batch Tracking](#batch-tracking)  
   5.5 [Transfer Management](#transfer-management)  
   5.6 [Incident Reporting](#incident-reporting)  
   5.7 [Reports and Exports](#reports-and-exports)  

6. [Class Attendance System](#class-attendance-system-detailed)  
   6.1 [Overview](#overview-1)  
   6.2 [Mobile App: Recording Attendance](#mobile-app-recording-attendance)  
       6.2.1 [Initial Setup](#initial-setup)  
       6.2.2 [Attendance Dashboard](#attendance-dashboard)  
       6.2.3 [Start Recording Attendance](#start-recording-attendance)  
       6.2.4 [Scan Students](#scan-students)  
       6.2.5 [End Recording](#end-recording)  
       6.2.6 [View Recording History](#view-recording-history)  
   6.3 [Use Cases](#use-cases)  
       6.3.1 [Regular Lecture Attendance](#regular-lecture-attendance)  
       6.3.2 [Multiple Lecture Halls](#multiple-lecture-halls)  
       6.3.3 [Emergency Substitute](#emergency-substitute)  
   6.4 [Admin Oversight](#admin-oversight)  

7. [Workflows & Processes](#workflows--processes)  
   7.1 [Complete Exam Workflow](#complete-exam-workflow)  
       7.1.1 [Phase 1: Exam Setup (Admin)](#phase-1-exam-setup-admin)  
       7.1.2 [Phase 2: Exam Day (Invigilator)](#phase-2-exam-day-invigilator)  
       7.1.3 [Phase 3: First Transfer (Invigilator → Lecturer)](#phase-3-first-transfer-invigilator--lecturer)  
       7.1.4 [Phase 4: Subsequent Transfers](#phase-4-subsequent-transfers)  
       7.1.5 [Phase 5: Marking & Return](#phase-5-marking--return)  
       7.1.6 [Phase 6: Reporting & Analytics](#phase-6-reporting--analytics)  

8. [Troubleshooting](#troubleshooting)  
   8.1 [Common Issues](#common-issues)  
   8.2 [FAQs](#faqs)  

9. [Best Practices](#best-practices)  
   9.1 [Security Best Practices](#security-best-practices)  
   9.2 [Performance Tips](#performance-tips)  

10. [Glossary](#glossary)  

11. [Appendix](#appendix)  
    11.1 [Quick Reference: User Roles & Permissions](#quick-reference-user-roles--permissions)  
    11.2 [API Endpoints](#api-endpoints)  
    11.3 [Change Log](#change-log)  

---

## System Overview

### What is the Exam Script Tracking System?

[Insert brief description here. Explain the purpose: QR code-based solution to eliminate exam script loss and fraudulent claims by creating an auditable chain of custody from student submission through grading. Addresses genuine script loss and fraudulent attendance claims.]

### Key Features

#### Exams Logistics Module

[Outline features: Student attendance tracking, QR code scanning, custody chain management, transfer handshake protocol, real-time notifications, analytics dashboard, PDF/Excel exports.]

#### Class Attendance System

[Outline features: Session-based attendance recording, multi-device support, real-time student scanning, recording history and reports, admin oversight.]

### User Roles and Permissions

| Role                | Access Level | Primary Functions |
|---------------------|--------------|--------------------|
| **ADMIN**           | Full access  | [List functions: User management, system configuration, etc.] |
| **INVIGILATOR**     | Handler      | [List functions: Exam supervision, attendance recording, etc.] |
| **LECTURER**        | Handler      | [List functions: Transfer management, etc.] |
| **FACULTY_OFFICER** | Handler      | [List functions: Transfer management, etc.] |
| **DEPARTMENT_HEAD** | Handler      | [List functions: Approvals, etc.] |
| **CLASS_REP**       | Limited      | [List functions: Class attendance recording, etc.] |

[Insert table with permissions for key features.]

### Technology Stack

#### Web Dashboard (Admin)

- **Framework:** React 18+ with Vite  
- **Styling:** Tailwind CSS + shadcn/ui components  
- **State Management:** Zustand or TanStack Query (React Query) for server state  
- **Real-time:** Socket.io client  
- **Data Visualization:** Recharts for analytics/reports  
- **Tables:** TanStack Table for complex data views  
- **Forms:** React Hook Form + Zod validation  
- **Routing:** React Router v6  
- **HTTP Client:** Axios  

#### Mobile Application (Handler)

- **Framework:** React Native with Expo (TypeScript)  
- **Target Platform:** iOS and Android  
- **QR Scanning:** Expo Camera or react-native-qrcode-scanner  
- **State Management:** React Context or Redux Toolkit  
- **Real-time:** Socket.io client  
- **Navigation:** React Navigation  

#### Backend (API & Real-time Server)

- **Runtime:** Node.js 20+  
- **Framework:** Express.js  
- **Language:** TypeScript  
- **ORM:** Prisma  
- **Database:** PostgreSQL  
- **Real-time:** Socket.io  
- **Authentication:** JWT + bcrypt  
- **Validation:** Zod  
- **File Storage:** AWS S3 or local file system  
- **Email/SMS:** Nodemailer or Twilio  

#### Database

- **Type:** PostgreSQL 15+  
- **Schema Management:** Prisma ORM  
- **Migrations:** Prisma Migrate  
- **Studio:** Prisma Studio for visualization  

#### DevOps & Deployment

- **Containerization:** None  
- **Orchestration:** None  
- **CI/CD:** None  
- **Hosting:** Web Dashboard on Vercel, Backend on Render, Mobile App built with EAS, Database on Neon  
- **Monitoring:** Built-in monitoring tools provided by each hosting service (Vercel Analytics, Render Metrics, Neon Dashboard, EAS Build Logs)  

---

## Getting Started

### System Requirements

#### Development Requirements

- **Node.js:** Version 20+ (LTS recommended)
- **Git:** For cloning the repository
- **Code Editor:** VS Code, WebStorm, or any preferred editor with TypeScript support
- **Database:** Neon PostgreSQL account (for production database)

#### Web Dashboard

- **Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+  
- **Internet:** Stable broadband connection  
- **Screen:** Minimum 1280x720 resolution (1920x1080 recommended)  

#### Mobile Access

- **Unified Web App:** Single responsive application for all devices  
- **Browser Support:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+  
- **Mobile Browsers:** iOS Safari 14+, Chrome Mobile 90+  
- **Permissions:** Camera access for QR scanning, location for incident reporting  
- **Internet:** Wi-Fi or 4G/5G mobile data  
- **PWA Support:** Installable as a Progressive Web App on mobile devices  

### Installation and Setup

#### Backend Setup

1. **Install Node.js**: Ensure you have Node.js 20+ installed on your system. Download from [nodejs.org](https://nodejs.org/).

2. **Clone the Repository**: 
   ```
   git clone https://github.com/QuayeDNA/ExamScriptTracking.git
   cd ExamScriptTracking/backend
   ```

3. **Install Dependencies**:
   ```
   npm install
   ```

4. **Set Up Environment Variables**:
   - Copy the `.env.example` file to `.env`
   - Fill in the required values:
     - `DATABASE_URL`: Your Neon PostgreSQL connection string
     - `JWT_SECRET`: A secure random string for JWT tokens
     - `PORT`: Server port (default: 5000)
     - Other API keys as needed (e.g., for email/SMS services)

5. **Set Up the Database**:
   ```
   npx prisma generate
   npx prisma db push
   ```
   This will create the database schema and generate the Prisma client.

6. **Run the Development Server**:
   ```
   npm run dev
   ```
   The backend server will start on `http://localhost:5000` (or your configured port).

#### Web Dashboard Setup

1. **Install Node.js**: Ensure you have Node.js 20+ installed on your system.

2. **Clone the Repository**:
   ```
   git clone https://github.com/QuayeDNA/ExamScriptTracking.git
   cd ExamScriptTracking/web
   ```

3. **Install Dependencies**:
   ```
   npm install
   ```

4. **Set Up Environment Variables**:
   - Copy the `.env.example` file to `.env`
   - Configure the API endpoint:
     - `VITE_API_URL`: URL of your backend API (e.g., `http://localhost:5000` for development)

5. **Run the Development Server**:
   ```
   npm run dev
   ```
   The web dashboard will be available at `http://localhost:5173` (Vite default port).

#### Mobile App Setup

1. **Install Node.js**: Ensure you have Node.js 20+ installed on your system.

2. **Install Expo CLI**:
   ```
   npm install -g @expo/cli
   ```

3. **Clone the Repository**:
   ```
   git clone https://github.com/QuayeDNA/ExamScriptTracking.git
   cd ExamScriptTracking/mobile
   ```

4. **Install Dependencies**:
   ```
   npm install
   ```

5. **Set Up Environment Variables**:
   - Copy the `.env.example` file to `.env`
   - Configure API endpoint and other settings as needed

6. **Start the Expo Development Server**:
   ```
   npx expo start
   ```
   This will open the Expo Developer Tools. You can then:
   - Press `i` to open in iOS Simulator (macOS only)
   - Press `a` to open in Android Emulator
   - Scan the QR code with the Expo Go app on your physical device

### Login and Authentication

The ELMS system uses a role-based authentication system with separate login interfaces for administrators and handlers. The system is initialized with a super admin account that must be used to create additional users.

#### Initial System Setup

1. **Database Seeding**: After running the database setup, the system creates a default super admin account:
   - **Email**: `superadmin@elms.com`
   - **Password**: `SuperAdmin@123`
   - **Role**: Super Admin

2. **First Login**: The super admin must log in and change their password before creating other users.

#### Login Process

##### For Administrators (Web Dashboard)

1. **Access the Web Dashboard**: Open your browser and navigate to `http://localhost:5173` (development) or your production URL.

2. **Enter Credentials**: 
   - **Identifier**: Enter either your email address or phone number
   - **Password**: Enter your password

3. **First-Time Password Change**: If this is your first login (seeded account), you'll be redirected to change your password:
   - Password must be at least 8 characters long
   - Must contain uppercase, lowercase, number, and special character
   - Confirm password by entering it twice

4. **Dashboard Access**: After successful login, you'll be redirected to the admin dashboard.

##### For Handlers (Mobile App)

1. **Open the Mobile App**: Launch the ELMS mobile app on your device.

2. **Enter Credentials**:
   - **Identifier**: Enter either your email address or phone number
   - **Password**: Enter your password

3. **First-Time Password Change**: If this is your first login, you'll be prompted to change your password with the same requirements as above.

4. **App Access**: After successful login, you'll have access to handler-specific features based on your role.

#### User Creation Workflow

1. **Super Admin Login**: The super admin logs into the web dashboard.

2. **Create Users**: Navigate to User Management and create accounts for:
   - Invigilators
   - Lecturers
   - Faculty Officers
   - Department Heads
   - Class Representatives

3. **Role Assignment**: Assign appropriate roles and permissions to each user.

4. **Account Activation**: New users receive their login credentials and must complete first-time password setup.

#### Security Features

- **Account Locking**: Accounts are locked for 30 minutes after 5 consecutive failed login attempts
- **Password Requirements**: Strong password policy enforced
- **Session Management**: Active session tracking with ability to revoke sessions
- **Audit Logging**: All login attempts and password changes are logged
- **JWT Authentication**: Secure token-based authentication with refresh tokens

#### Password Management

- **First-Time Setup**: All seeded and newly created accounts require password change on first login
- **Regular Changes**: Users can change passwords through their profile settings
- **Admin Reset**: Administrators can reset user passwords if needed
- **Forgot Password**: Password reset functionality available (if implemented)

#### Platform-Specific Access

| User Role | Login Platform | Primary Functions |
|-----------|----------------|-------------------|
| **ADMIN** | Web Dashboard | User management, system configuration, reports |
| **INVIGILATOR** | Mobile App | Exam supervision, script custody |
| **LECTURER** | Mobile App | Script transfers, marking coordination |
| **FACULTY_OFFICER** | Mobile App | Department-level script management |
| **DEPARTMENT_HEAD** | Mobile App | Approval workflows, oversight |
| **CLASS_REP** | Mobile App | Class attendance recording |

#### Troubleshooting Login Issues

- **Invalid Credentials**: Verify email/phone and password are correct
- **Account Locked**: Wait 30 minutes or contact administrator for unlock
- **First-Time Login**: Ensure password meets complexity requirements
- **Network Issues**: Check internet connection for mobile app
- **Browser Issues**: Clear cache/cookies for web dashboard

---

## Web Dashboard Guide (Admin)

### Dashboard Home

The dashboard home page provides a comprehensive overview of system statistics and quick access to common administrative tasks. The dashboard content varies based on your user role.

#### Statistics Overview

The dashboard displays key system metrics in an easy-to-read card layout:

- **Total Users**: Total number of registered users in the system
- **Active Users**: Number of users currently marked as active
- **Inactive Users**: Number of deactivated user accounts
- **Recent Logins**: Number of user logins in the last 7 days
- **Locked Accounts**: Number of accounts currently locked due to failed login attempts
- **Users by Role**: Distribution of users across different roles (Admin, Invigilator, Lecturer, etc.)

#### Quick Actions

The dashboard provides quick access buttons for common administrative tasks:

- **Manage Users**: Navigate to the user management page to create, edit, and manage user accounts
- **Audit Logs**: Access the system audit logs to monitor security events and user activity
- **Analytics**: View detailed system analytics and reports

#### Role-Specific Dashboards

The dashboard adapts based on your user role:

##### Administrator Dashboard
- Full system statistics and metrics
- Complete quick actions panel
- Administrative badge display
- System overview and management tools

##### Lecturer Dashboard
- Personalized welcome message
- Access to assigned exam sessions
- Batch tracking capabilities
- Grading progress monitoring

##### Department Head Dashboard
- Department-level overview
- Approval workflow management
- Department exam operations monitoring

##### Other Roles
- Role-appropriate welcome message
- Access to relevant features based on permissions
- Streamlined interface for specific responsibilities

### User Management

[Content: Creating users, managing roles, etc.]

### Student Management

The Student Management page provides comprehensive tools for managing student records, QR codes, and related data. This page is accessible from the sidebar navigation under "Students".

#### Overview

The Students page displays all registered students in the system with advanced filtering, search, and management capabilities. Each student record includes personal information, academic details, and a unique QR code for attendance tracking.

#### Page Layout

##### Header Section
- **Page Title**: "Students" with description "Manage student records and QR codes"
- **View Toggle**: Switch between Table view and Card view
- **Action Buttons**:
  - **Export CSV**: Download student data as CSV file
  - **Export PDF**: Generate PDF with student photos and QR codes
  - **Bulk Import**: Import multiple students via CSV file (Admin only)
  - **Add Student**: Create new individual student record (Admin only)

##### Filters and Search
- **Search Bar**: Search by index number, first name, or last name
- **Program Filter**: Filter students by academic program
- **Level Filter**: Filter by academic level (100, 200, 300, 400)

#### Student Listing

##### Table View (Default)
Displays students in a tabular format with the following columns:
- **Profile Picture**: Student photo thumbnail
- **Index Number**: Unique student identifier
- **Name**: Full name (First Name + Last Name)
- **Program**: Academic program
- **Level**: Academic level
- **QR Code**: Quick access to view/download QR code
- **Actions**: Edit and Delete buttons (Admin only)

##### Card View
Displays students as individual cards showing:
- Profile picture
- Student name and index number
- Program and level
- QR code preview
- Action buttons

#### Managing Individual Students

##### Adding a New Student
1. Click the **"Add Student"** button
2. Fill in the required information:
   - **Index Number**: Unique student identifier (required)
   - **First Name**: Student's first name (required)
   - **Last Name**: Student's last name (required)
   - **Program**: Academic program (required)
   - **Option**: Program specialization (optional)
   - **Department**: Academic department (optional)
   - **Level**: Academic level (100, 200, 300, 400) (required)
3. Upload a **Profile Picture** (required, max 5MB, JPG/PNG/GIF)
4. Click **"Create Student"** to save

##### Editing a Student
1. Click the **Edit** button (pencil icon) next to the student
2. Modify any information as needed
3. Optionally upload a new profile picture
4. Click **"Update Student"** to save changes

##### Deleting a Student
1. Click the **Delete** button (trash icon) next to the student
2. Confirm the deletion in the dialog box
3. The student record will be permanently removed

#### QR Code Management

##### Viewing QR Codes
1. Click the **QR Code** button for any student
2. A modal will display the student's QR code
3. The QR code contains encoded student information for attendance scanning

##### Downloading QR Codes
1. Open the QR code modal for a student
2. Click **"Download QR Code"** to save as PNG file
3. File will be named `{indexNumber}_QR.png`

#### Bulk Operations

##### Bulk Import via CSV
1. Click **"Bulk Import"** button
2. Download the CSV template if needed
3. Prepare your CSV file with the following columns:
   - `indexNumber` (required)
   - `firstName` (required)
   - `lastName` (required)
   - `program` (required)
   - `level` (required)
   - `option` (optional)
   - `department` (optional)
4. Upload the CSV file
5. Review import results (success/failure counts)
6. **Note**: Profile pictures must be uploaded individually after bulk import

##### CSV Template
The system provides a downloadable CSV template with proper headers and sample data to ensure correct formatting.

##### Export Operations
- **CSV Export**: Downloads all filtered students as CSV with all fields
- **PDF Export**: Generates a formatted PDF with student photos and QR codes
- Both exports respect current filters (program, level, search)

#### Data Validation

##### Individual Student Creation
- Index Number: Must be unique
- Required Fields: Index Number, First Name, Last Name, Program, Level
- Profile Picture: Required, max 5MB, image formats only

##### Bulk Import Validation
- CSV must contain headers matching template
- Required fields must be present and valid
- Index numbers must be unique
- Level must be numeric (100, 200, 300, 400)
- Empty rows are skipped

#### Permissions

- **View Access**: All authenticated users can view student information
- **Management Access**: Only administrators can create, edit, delete students
- **Bulk Operations**: Admin-only feature
- **Export Access**: All users can export data

#### Best Practices

- **Profile Pictures**: Use clear, recent photos for accurate identification
- **Index Numbers**: Follow institutional numbering conventions
- **Bulk Import**: Validate CSV data before import to avoid errors
- **Regular Updates**: Keep student information current
- **QR Code Distribution**: Ensure students have access to their QR codes for attendance

### Exam Session Management

The Exam Sessions page provides comprehensive management of exam sessions, batch QR codes, and attendance tracking. This page is accessible from the sidebar navigation under "Exam Sessions" and is a critical component for organizing and tracking exam logistics.

#### Overview

Exam sessions represent individual exam events with associated batch QR codes that group student scripts together. Each session tracks attendance, manages script custody chains, and provides status updates throughout the exam lifecycle. The system supports multiple view modes and advanced filtering for efficient management.

#### Page Layout

##### Header Section
- **Page Title**: "Exam Sessions" with description "Manage exam sessions and batch QR codes"
- **View Toggle**: Switch between List view (table) and Card view
- **Action Buttons**:
  - **Export CSV**: Download session data as CSV file
  - **Download Template**: Get CSV template for bulk import
  - **Import CSV**: Bulk import sessions via CSV file
  - **Create Session**: Add new individual exam session
  - **Create Archive**: Archive multiple sessions (Admin only)

##### Filters and Search
- **Search Bar**: Search by course code, course name, or lecturer name
- **Status Filter**: Filter by batch status (Not Started, In Progress, Submitted, etc.)
- **Department Filter**: Filter by academic department
- **Faculty Filter**: Filter by faculty
- **Date Range**: Filter by exam date (From/To dates)

#### Batch Status Management

Exam sessions progress through defined status stages:

| Status | Description |
|--------|-------------|
| **Not Started** | Session created but exam hasn't begun |
| **In Progress** | Exam is currently taking place |
| **Submitted** | Scripts have been submitted by students |
| **In Transit** | Scripts are being transferred between handlers |
| **With Lecturer** | Scripts are with the course lecturer |
| **Under Grading** | Scripts are being graded |
| **Graded** | Grading is complete |
| **Returned** | Scripts have been returned to students |
| **Completed** | Exam session is fully closed |

#### Session Listing

##### List View (Table)
Displays sessions in a tabular format with columns:
- **Batch QR Code**: Unique identifier for the script batch
- **Course Code**: Course identifier (e.g., CS101)
- **Course Name**: Full course title
- **Venue**: Exam location
- **Exam Date**: Scheduled date and time
- **Status**: Current batch status with color coding
- **Archived**: Archive status indicator
- **Students**: Number of recorded attendances
- **Actions**: View, QR Code, Status Update, Edit, Delete buttons

##### Card View
Displays sessions as individual cards showing:
- Course code and name
- Lecturer information
- Venue and department/faculty
- Exam date and time
- Student count
- Status badges
- Action buttons

#### Managing Exam Sessions

##### Creating a New Session
1. Click **"Create Session"** button
2. Fill in session details:
   - **Course Code**: Unique course identifier (required)
   - **Course Name**: Full course title (required)
   - **Lecturer**: Select from registered lecturers or enter manually
   - **Department**: Academic department (required)
   - **Faculty**: Academic faculty (required)
   - **Venue**: Exam location (required)
   - **Exam Date & Time**: Scheduled date and time (required)
3. Click **"Create"** to save the session

##### Editing a Session
1. Click the **Edit** button (pencil icon) for the session
2. Modify session information as needed
3. Click **"Update"** to save changes
4. **Note**: Archived sessions cannot be edited

##### Updating Session Status
1. Click the **Status** button (calendar icon) for the session
2. Select new status from dropdown
3. Click **"Update Status"** to save
4. Status changes are tracked for audit purposes

##### Deleting a Session
1. Click the **Delete** button (trash icon) for the session
2. Confirm deletion in the dialog
3. **Note**: Sessions with attendance records cannot be deleted

#### QR Code Management

##### Viewing Batch QR Codes
1. Click the **QR Code** button for any session
2. A modal displays the batch QR code
3. The QR code contains encoded session information for script batch identification

##### Downloading QR Codes
1. Open the QR code modal for a session
2. Click **"Download QR Code"** to save as PNG file
3. File is named `{batchQrCode}_QR.png`

#### Bulk Operations

##### Bulk Import via CSV
1. Click **"Import CSV"** button or use the file upload
2. Select a CSV file with session data
3. System validates and imports sessions
4. Review import results (success/failure counts)
5. **CSV Format Requirements**:
   - `courseCode`, `courseName`, `lecturerId`, `lecturerName`
   - `department`, `faculty`, `venue`, `examDate`
   - Date format: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)

##### CSV Template
Download the provided template to ensure correct CSV formatting before bulk import.

##### Export Operations
- **CSV Export**: Downloads all filtered sessions with complete data
- Includes batch QR codes, course details, lecturer info, and status

#### Archive Management

##### Creating Archives (Admin Only)
1. Click **"Create Archive"** button
2. Enter archive name and description
3. Select multiple sessions to archive
4. Click **"Create Archive"** to finalize
5. **Note**: Archived sessions become read-only and cannot be modified

##### Archive Benefits
- Historical record keeping
- Performance optimization (removes from active queries)
- Compliance with data retention policies

#### Permissions and Access Control

- **View Access**: All authenticated users can view exam sessions
- **Create/Edit**: Administrators and Lecturers can create/manage sessions
- **Status Updates**: Session creators and administrators can update status
- **Delete Access**: Admin-only, with restrictions for sessions with attendance
- **Archive Access**: Admin-only feature
- **Bulk Operations**: Admin-only features

#### Best Practices

- **Pre-Exam Setup**: Create sessions well in advance of exam dates
- **Status Tracking**: Regularly update session status to maintain accurate tracking
- **QR Code Distribution**: Ensure invigilators have access to batch QR codes
- **Bulk Import**: Use CSV import for large-scale session creation
- **Archive Strategy**: Archive completed sessions periodically for performance
- **Data Validation**: Verify all required fields before saving sessions

#### Integration with Attendance System

Exam sessions serve as containers for student attendance records:
- Each session generates a unique batch QR code
- Student QR codes are scanned and associated with session batches
- Attendance data drives script custody chain management
- Status updates reflect progress through the exam logistics workflow

#### Batch Details Page

The Batch Details page provides a comprehensive view of an individual exam session, offering real-time monitoring, attendance management, and detailed session information. This page is accessed by clicking on any exam session from the main Exam Sessions list.

##### Overview

The Batch Details page serves as the central hub for managing and monitoring exam session activities, providing invigilators and administrators with complete visibility into attendance patterns, student check-ins, and session progress.

##### Page Layout

###### Header Section

**Navigation & Title**
- **Back Button**: Returns to the Exam Sessions list
- **Session Title**: Displays course code and name (e.g., "CS101 - Introduction to Programming")
- **Status Badges**: Current batch status and archive status indicators

**Action Buttons**
- **View QR**: Opens the batch QR code in a new window for student scanning
- **Export PDF**: Generates a comprehensive PDF report of the session
- **Status Dropdown**: Allows updating the batch status (Not Started → In Progress → Submitted, etc.)
- **End Session**: Marks the session as complete and updates status to SUBMITTED
- **Delete Session**: Permanently removes the session (with confirmation)
- **Refresh**: Manually syncs data and refreshes all information

###### QR Code Display Card

**Batch QR Code**
- Large, scannable QR code for student check-in
- Batch code identifier below the QR code
- Download button to save QR code as PNG file
- Direct link to student lookup page for testing

**Purpose**: Students scan this QR code during exam check-in to record their attendance and associate their scripts with the batch.

###### Session Details Card

Displays comprehensive session information organized in a grid layout:

**Course Information**
- Course Code and Name
- Lecturer name (if assigned)

**Schedule & Location**
- Exam date and time
- Venue/location

**Staff & Department**
- Department and Faculty
- Lecturer contact information

**Status & Batch**
- Current status with color coding
- Unique batch QR code identifier

###### Invigilators Card

Shows all users who have scanned students for this session:
- **Primary/Assistant Roles**: Distinguishes between primary and assistant invigilators
- **Student Count**: Number of students scanned by each invigilator
- **Last Activity**: Timestamp of last scan
- **Contact Info**: Email and full name

This section helps track which staff members are actively involved in the exam session.

##### Statistics Dashboard

Four key metric cards provide real-time session statistics:

- **Expected Students**: Total number of students expected to attend
- **Attended Students**: Number of students who have checked in
- **Submitted Scripts**: Number of students who have submitted their scripts
- **Attendance Rate**: Percentage of expected students who have attended

##### Expected Students Management

**Left Column - Student Roster**

**Upload Functionality**
- **CSV Template Download**: Provides properly formatted template
- **Bulk Upload**: Import expected students via CSV file
- **Validation**: Ensures required fields (indexNumber) are present

**Student List Table**
- **Index Number**: Unique student identifier
- **Name**: Full name with hover tooltip showing profile picture
- **Program & Level**: Academic information
- **Status**: Present/Not Arrived indicator
- **Actions**: Remove student from session

**CSV Format Requirements**
```
indexNumber,firstName,lastName,program,level
12345678,John,Doe,Computer Science,100
87654321,Jane,Smith,Mathematics,200
```

##### Attendance Records

**Right Column - Real-time Attendance**

**Attendance Table**
- **Student Information**: Name and index number
- **Entry Time**: When student checked in
- **Exit Time**: When student submitted/left (if applicable)
- **Status**: Submission status (Present, Submitted, Left Early)

**Real-time Updates**
- Socket.IO integration provides live attendance updates
- No page refresh required for new check-ins
- Toast notifications for new attendance records
- Automatic data synchronization

##### Session Management Operations

###### Status Updates
1. Use the status dropdown to change batch status
2. Status changes are tracked for audit purposes
3. Automatic notifications sent to relevant users

###### Ending a Session
1. Click "End Session" when exam is complete
2. Confirms all scripts have been collected
3. Updates status to SUBMITTED
4. Closes session for new attendance entries

###### Session Deletion
1. Click "Delete Session" (destructive action)
2. Confirmation dialog prevents accidental deletion
3. Cannot delete sessions with existing attendance records
4. Permanently removes all associated data

##### Export and Reporting

###### PDF Export
- Comprehensive session report including:
  - Session details and QR code
  - Complete attendance list
  - Statistics and metrics
  - Invigilator information
- Automatically named with batch code and date

###### Data Integration
- All attendance data feeds into broader analytics
- Real-time updates reflected in dashboard statistics
- Audit trail maintained for compliance

##### Real-time Features

###### Socket.IO Integration
- **Live Attendance Updates**: New check-ins appear instantly
- **Status Change Notifications**: Immediate updates when status changes
- **Multi-user Synchronization**: Changes visible across all connected clients
- **Connection Management**: Automatic reconnection on network issues

###### Notification System
- Toast notifications for important events
- Visual indicators for new attendance records
- Status change confirmations
- Error handling with user feedback

##### Permissions and Access Control

- **View Access**: All authenticated users can view session details
- **Edit Access**: Session creators and administrators can modify details
- **Status Management**: Restricted to authorized personnel
- **Student Management**: Admin-level access for roster modifications
- **Archive Restrictions**: Archived sessions are read-only

##### Best Practices

- **Pre-Exam Setup**: Upload expected student list before exam starts
- **Real-time Monitoring**: Keep page open during exam for live updates
- **Status Tracking**: Update status promptly to reflect current state
- **QR Code Access**: Ensure students can easily scan the batch QR code
- **Data Backup**: Export PDF reports regularly for record keeping
- **Session Closure**: End sessions immediately after exam completion

##### Troubleshooting

- **No Real-time Updates**: Check internet connection and refresh page
- **QR Code Issues**: Ensure camera permissions and clear QR display
- **Upload Failures**: Verify CSV format matches template requirements
- **Status Update Errors**: Confirm user has appropriate permissions
- **Missing Attendance**: Check student QR codes and scanning process

#### Batch Tracking Page

The Batch Tracking page provides comprehensive visibility into the chain of custody for exam script batches, allowing administrators and authorized personnel to monitor the movement and status of script batches throughout the entire logistics workflow. This page is accessed from the sidebar navigation under "Batch Tracking" and serves as a critical audit and monitoring tool.

##### Overview

The Batch Tracking page enables real-time monitoring of script batch transfers between handlers, providing complete transparency into the custody chain. Users can track batch locations, verify script counts at each transfer point, identify discrepancies, and ensure compliance with exam logistics protocols. The system maintains an immutable audit trail of all transfers for regulatory compliance and incident investigation.

##### Page Layout

###### Header Section

**Page Title & Description**
- **Title**: "Batch Tracking" with subtitle "Track exam script batches and their chain of custody in real-time"
- **Purpose**: Clear indication that this is for monitoring batch movement and custody

**Action Buttons**
- **Export CSV**: Download tracking data for selected batches
- **Clear Filters**: Reset all applied filters to show all batches

###### Filters and Search

**Search Functionality**
- **Global Search Bar**: Search across batch QR codes, course codes, course names, and lecturer names
- **Real-time Filtering**: Results update instantly as you type

**Status Filter**
- Dropdown selection for batch status filtering
- Available statuses: Not Started, In Progress, Submitted, In Transit, With Lecturer, Under Grading, Graded, Returned, Completed
- Multiple selection support for viewing batches in specific states

**Department Filter**
- Filter batches by academic department
- Dropdown populated from available departments in the system
- Helps focus on department-specific tracking needs

###### Two-Column Layout

**Left Column - Batch List**

**Batch Cards Display**
- **Scrollable List**: Vertical scrolling for large numbers of batches
- **Card Format**: Each batch displayed as an interactive card
- **Selection Indicator**: Visual highlighting (ring border) for currently selected batch

**Batch Card Content**
- **Batch QR Code**: Monospace font display of unique batch identifier
- **Course Information**: Course code and abbreviated course name
- **Status Badge**: Color-coded status indicator with archive status if applicable
- **Script Count**: Number of scripts in the batch (from attendance records)
- **Archive Indicator**: Special badge for archived batches

**Empty State**
- Clear messaging when no batches match current filters
- Encourages filter adjustment or batch creation

**Right Column - Batch Details & Timeline**

**Batch Information Card**

**Header Section**
- **Course Title**: Full course code and name
- **Batch QR**: Prominent display of batch QR code
- **Status Badge**: Current batch status with appropriate color coding

**Session Details Grid**
- **Lecturer**: Name of the course lecturer
- **Department**: Academic department
- **Venue**: Exam location
- **Exam Date**: Scheduled date and time
- **Scripts Count**: Total number of scripts with package icon

**Current Location Card**

**Purpose**: Highlights where the batch currently resides in the custody chain

**Handler Information**
- **Profile Avatar**: User avatar with initials fallback
- **Handler Details**: Full name, role, and email
- **Script Count**: Number of scripts received by current handler
- **Location**: Physical or logical location of the handler

**Visual Styling**
- Primary color border and background tint
- Map pin icon for location emphasis

##### Chain of Custody Timeline

**Timeline Overview**
- **Vertical Timeline**: Chronological display of all transfers
- **Connector Line**: Visual line connecting all transfer events
- **Reverse Chronological**: Most recent transfers appear at the top

**Transfer Event Cards**

**Transfer Participants**
- **From Handler**: Originating handler with avatar and details
- **Arrow Indicator**: Right-pointing arrow showing transfer direction
- **To Handler**: Receiving handler with avatar and details

**Transfer Status**
- **Status Badge**: Color-coded status (Pending, Confirmed, Discrepancy Reported, Resolved)
- **Status Colors**: Yellow (Pending), Green (Confirmed), Red (Discrepancy), Blue (Resolved)

**Script Verification**
- **Expected Count**: Number of scripts expected in transfer
- **Received Count**: Actual number of scripts received
- **Match Indicator**: Green checkmark when counts match and transfer is confirmed

**Location & Timing**
- **Transfer Location**: Where the transfer occurred
- **Requested Timestamp**: When transfer was initiated
- **Confirmed Timestamp**: When transfer was completed (if applicable)

**Discrepancy Handling**

**Discrepancy Alert Card**
- **Visual Indicators**: Red border and background for unreported discrepancies
- **Alert Icon**: Warning triangle
- **Discrepancy Details**: Description of the reported issue
- **Status**: "Discrepancy Reported" badge

**Resolution Display**
- **Resolution Card**: Blue-themed card for resolved issues
- **Check Icon**: Confirmation indicator
- **Resolution Details**: Explanation of how the discrepancy was resolved

##### Data Management

###### Real-time Updates
- **Live Synchronization**: Automatic updates when transfer data changes
- **Multi-user Support**: Changes visible across all connected clients
- **Connection Recovery**: Automatic reconnection after network interruptions

###### Audit Trail
- **Immutable Records**: All transfers permanently recorded
- **Timestamp Tracking**: Precise timing for all custody changes
- **User Attribution**: Clear identification of all handlers involved

##### Permissions and Access

- **View Access**: All authenticated users can view batch tracking information
- **Export Access**: Restricted to administrators and authorized personnel
- **Discrepancy Reporting**: Limited to handlers directly involved in transfers
- **Resolution Access**: Admin-level permissions required for discrepancy resolution

##### Best Practices

- **Regular Monitoring**: Check batch locations during peak transfer times
- **Discrepancy Investigation**: Address reported discrepancies immediately
- **Status Verification**: Cross-reference batch status with actual location
- **Documentation**: Maintain detailed notes for complex transfers
- **Export Records**: Regularly export tracking data for compliance audits

##### Troubleshooting

- **Missing Transfers**: Check user permissions and network connectivity
- **Status Discrepancies**: Verify batch status matches timeline events
- **Avatar Loading**: Profile pictures may not load in offline mode
- **Timeline Gaps**: Ensure all transfers are properly recorded in sequence
- **Filter Issues**: Clear filters and refresh page if results seem incorrect

### Reports and Analytics

The Reports and Analytics page provides comprehensive system-wide analytics, performance metrics, and reporting capabilities for administrators and authorized personnel. This page is accessible from the sidebar navigation under "Analytics" and serves as a critical tool for monitoring system performance, identifying trends, and generating detailed reports for compliance and decision-making purposes.

#### Overview

The Analytics Dashboard offers multi-dimensional insights into exam logistics operations, including exam session statistics, handler performance metrics, discrepancy tracking, and trend analysis. The system supports flexible date range filtering, real-time data updates, and multiple export formats for comprehensive reporting needs.

#### Page Layout

##### Header Section

**Page Title & Description**
- **Title**: "Analytics Dashboard" with subtitle "System-wide analytics and performance metrics"
- **Purpose**: Clear indication of comprehensive system monitoring and reporting capabilities

**Date Range Controls**

**Quick Select Options**
- **Last 7 days**: Focus on recent activity
- **Last 30 days**: Standard monthly view (default)
- **Last 90 days**: Quarterly analysis
- **This year**: Year-to-date performance

**Custom Date Range Picker**
- Calendar-based selection for precise date ranges
- Visual date picker with month/year navigation
- Automatic validation to prevent invalid ranges

**Action Controls**

**Refresh Button**
- Manual data refresh with loading indicator
- Updates all analytics data for current date range
- Toast notification on successful refresh

**Export Format Selection**
- **PDF**: Professional document format for reports
- **Excel**: Spreadsheet format for data analysis
- **Format Toggle**: Dropdown selector for export type

**Export Button**
- Generates comprehensive reports based on selected format
- Automatic filename generation with date range
- Progress indication during report generation

#### Overview Statistics Dashboard

The main dashboard displays key performance indicators in an organized grid layout:

##### Primary Metrics (4-Card Grid)

- **Total Exams**: Complete count of all exam sessions in the system
- **Exams This Month**: Current month exam session activity
- **Active Batches**: Number of batches currently in progress
- **Total Handlers**: Count of users actively handling transfers

##### Secondary Metrics (3-Card Grid)

- **Total Discrepancies**: Cumulative count of reported transfer issues
- **Discrepancy Rate**: Percentage of transfers with reported problems
- **Avg Transfer Time**: Average response time for transfer confirmations (displayed in minutes)

##### Trend Visualization

**Exams by Day Chart**
- **Bar Chart**: Daily exam session activity over selected period
- **Interactive Tooltips**: Detailed information on hover
- **Responsive Design**: Adapts to different screen sizes
- **Color Coding**: Consistent blue theme for exam data

#### Analytics Tabs

The dashboard organizes detailed analytics into three main tabs for focused analysis:

##### Handler Performance Tab

**Performance Comparison Chart**
- **Multi-Series Bar Chart**: Visual comparison of handler activities
- **Metrics Displayed**:
  - **Sent**: Transfers initiated by handler
  - **Received**: Transfers received by handler
  - **In Custody**: Current batches under handler's responsibility
- **Color Coding**: Blue (sent), Green (received), Orange (custody)

**Detailed Handler Metrics Table**

**Table Columns**
- **Handler**: Name and email contact information
- **Role**: User role with badge formatting
- **Total**: Combined sent and received transfers
- **Sent**: Number of transfers initiated
- **Received**: Number of transfers accepted
- **In Custody**: Current batch responsibility count
- **Avg Response**: Average response time in minutes
- **Discrepancies**: Number of transfers with issues
- **Discrepancy Rate**: Percentage with color-coded risk indicators

**Risk Level Indicators**
- **Low Risk** (≤5%): Outline badge
- **Medium Risk** (5-10%): Secondary badge
- **High Risk** (>10%): Destructive badge

##### Discrepancies Tab

**Discrepancy Summary Statistics**

**Summary Cards**
- **Total Discrepancies**: All reported issues in period
- **Resolved**: Successfully resolved discrepancies
- **Unresolved**: Outstanding issues requiring attention
- **Resolution Rate**: Percentage of resolved discrepancies

**Trend Analysis**

**Discrepancies Over Time Chart**
- **Bar Chart**: Daily discrepancy reporting patterns
- **Time Series**: Shows escalation or improvement trends
- **Red Color Theme**: Indicates issue-related data

**Breakdown Analysis**

**By Status Breakdown**
- **Status Distribution**: Visual breakdown of discrepancy states
- **Color Coding**: Matches transfer status color scheme
- **CONFIRMED**: Default (green)
- **PENDING**: Secondary (yellow)
- **DISCREPANCY_REPORTED**: Destructive (red)
- **RESOLVED**: Outline (blue)

**By Department Breakdown**
- **Department-wise Distribution**: Issues grouped by academic department
- **Badge Display**: Count indicators for each department

**Recent Discrepancy Reports Table**

**Table Structure**
- **Course**: Course code and name information
- **From**: Originating handler details
- **To**: Receiving handler details
- **Expected**: Number of scripts expected in transfer
- **Received**: Actual scripts received (shows discrepancy)
- **Status**: Current transfer status with color coding
- **Reported**: Date when discrepancy was reported

**Export Functionality**
- **Dedicated Export Button**: Generate discrepancy-specific reports
- **Filtered Data**: Only includes discrepancy-related information

##### Exam Statistics Tab

**Exam Summary Statistics**

**Summary Cards (5-Card Grid)**
- **Total Exams**: All exam sessions in selected period
- **Completed**: Successfully completed exam sessions
- **Completion Rate**: Percentage of exams reaching completion
- **Avg Processing Time**: Average days for exam processing
- **Avg Students/Exam**: Average student participation per exam

**Trend Visualization**

**Exams by Month Chart**
- **Bar Chart**: Monthly exam session distribution
- **Purple Theme**: Distinctive color for exam statistics
- **Time-based Grouping**: Aggregated by calendar months

**Detailed Breakdowns**

**Exams by Status Table**
- **Status Categories**: All batch status types
- **Count Display**: Number of exams in each status
- **Badge Formatting**: Consistent with system status indicators

**Exams by Department Table**
- **Department Listing**: Academic departments with exam counts
- **Sorted Display**: Organized by department name
- **Count Emphasis**: Right-aligned numeric values

**Exams by Faculty Table**
- **Faculty Grouping**: Higher-level academic organization
- **Count Aggregation**: Exams grouped by faculty affiliation
- **Consistent Formatting**: Matches department table structure

#### Data Management and Export

##### Date Range Filtering

**Global Application**
- **Consistent Filtering**: Date range applies to all analytics views
- **Real-time Updates**: Automatic data refresh on range changes
- **Validation**: Prevents future dates and invalid ranges

##### Export Capabilities

**Report Types**
- **Overview**: Complete system summary with all metrics
- **Handlers**: Detailed handler performance analysis
- **Discrepancies**: Comprehensive discrepancy reporting
- **Exams**: Exam statistics and completion analysis

**Export Formats**
- **PDF Reports**: Professional documents with charts and tables
- **Excel Spreadsheets**: Raw data for further analysis
- **Automatic Naming**: Descriptive filenames with date ranges

**Export Process**
- **Progress Indication**: Toast notifications during generation
- **Error Handling**: Clear error messages for failed exports
- **File Download**: Automatic browser download on completion

##### Data Refresh and Synchronization

**Manual Refresh**
- **Button-triggered**: User-initiated data updates
- **Loading States**: Visual feedback during refresh operations
- **Success Confirmation**: Toast notifications on completion

**Automatic Updates**
- **Real-time Data**: Live updates for active sessions
- **Background Sync**: Periodic data synchronization
- **Connection Recovery**: Automatic reconnection after network issues

#### Permissions and Access Control

- **View Access**: All authenticated users can view basic analytics
- **Detailed Metrics**: Restricted to administrators and supervisors
- **Export Permissions**: Limited to authorized personnel for data export
- **Date Range Limits**: Some users may have restricted historical access
- **Role-based Filtering**: Data visibility based on user roles and departments

#### Best Practices

- **Regular Monitoring**: Check analytics dashboard daily for system health
- **Trend Analysis**: Use date range filtering to identify performance patterns
- **Handler Performance**: Monitor discrepancy rates and response times
- **Export Scheduling**: Generate regular reports for compliance requirements
- **Data Validation**: Cross-reference analytics with operational data
- **Issue Escalation**: Address high discrepancy rates promptly

#### Troubleshooting

- **No Data Display**: Check date range selection and user permissions
- **Export Failures**: Verify network connectivity and file permissions
- **Chart Loading Issues**: Refresh page or check browser compatibility
- **Performance Lag**: Use shorter date ranges for better responsiveness
- **Missing Metrics**: Ensure backend services are running and accessible
- **Permission Errors**: Contact administrator for access level adjustments

### Incident Management

The Incident Management page provides comprehensive tracking and resolution of examination-related incidents, ensuring proper documentation, investigation, and follow-up for all issues that occur during the exam logistics process. This page is accessible from the sidebar navigation under "Incidents" and serves as a critical tool for maintaining exam integrity and compliance.

#### Overview

The Incident Management system enables users to report, track, and resolve various types of incidents that may occur during examinations, including missing scripts, student misconduct, venue issues, and administrative discrepancies. The system supports a complete workflow from initial reporting through investigation, resolution, and closure, with comprehensive audit trails and documentation.

#### Incident Types and Categories

The system supports the following incident types:

- **Missing Script**: Scripts that cannot be located in the expected custody chain
- **Damaged Script**: Physical damage to examination scripts
- **Malpractice**: Suspected cheating or unauthorized behavior
- **Student Illness**: Medical emergencies affecting exam participation
- **Venue Issue**: Problems with examination venues or facilities
- **Count Discrepancy**: Mismatches in script counts during transfers
- **Late Submission**: Scripts submitted after scheduled times
- **Other**: Miscellaneous incidents not covered by standard categories

#### Severity Levels

Incidents are categorized by severity to prioritize response and resources:

- **Critical**: Immediate threat to exam integrity or safety (red badge)
- **High**: Significant impact requiring urgent attention (orange badge)
- **Medium**: Moderate impact with standard response time (blue badge)
- **Low**: Minor issues with routine handling (gray badge)

#### Incident Status Workflow

Incidents progress through defined status stages:

| Status | Description | Color |
|--------|-------------|-------|
| **Reported** | Initial submission, awaiting review | Gray |
| **Investigating** | Active investigation in progress | Blue |
| **Resolved** | Issue resolved with documented solution | Green |
| **Closed** | Final closure with no further action | Green |
| **Escalated** | Elevated to higher authority | Red |

#### Page Layout

##### Header Section

**Page Title & Description**
- **Title**: "Incident Management" with subtitle "Track and manage examination incidents"
- **Purpose**: Clear indication of incident tracking and resolution capabilities

**Action Buttons**

**Bulk Export Controls**
- **Export Selected PDFs**: Generate individual PDF reports for selected incidents
- **Maximum Selection**: Limited to 50 incidents per bulk export
- **ZIP File Download**: All PDFs packaged in a single compressed file

**Export Excel Summary**
- **Complete Dataset**: Excel spreadsheet with all incident data
- **Filtered Results**: Respects current filter and search criteria
- **Automatic Naming**: Timestamped filename for easy identification

**Report New Incident**
- **Create Button**: Direct navigation to incident creation form
- **Plus Icon**: Standard add action indicator

##### Statistics Dashboard

**Key Metrics Cards (4-Card Grid)**
- **Total Incidents**: Cumulative count of all reported incidents
- **Open Incidents**: Currently active incidents requiring attention
- **Resolved Today**: Incidents completed in the current day
- **Avg Resolution Time**: Average hours to resolve incidents

**Trend Indicators**
- **Open Incidents**: Negative trend indicator when count > 0
- **Resolution Time**: Performance metric for response efficiency

##### Filters and Search Panel

**Search Functionality**
- **Global Search Bar**: Search across incident numbers, titles, descriptions, and reporter names
- **Real-time Filtering**: Instant results as you type
- **Case-insensitive**: Flexible text matching

**Advanced Filters**
- **Type Filter**: Dropdown selection of incident categories
- **Severity Filter**: Priority level filtering
- **Status Filter**: Current workflow status selection
- **Confidential Filter**: Toggle for sensitive incidents
- **Clear Filters**: Reset all applied filters

**Filter Toggle**
- **Show/Hide Controls**: Collapsible filter panel
- **Persistent State**: Maintains filter selections during session

##### Incidents Table

**Table Structure**

**Selection Column**
- **Checkbox Controls**: Individual and bulk selection
- **Select All**: Toggle all visible incidents
- **Bulk Actions**: Enable/disable based on selection count

**Core Data Columns**
- **Incident #**: Unique incident identifier with confidential badge overlay
- **Type**: Incident category with human-readable labels
- **Title**: Incident title with text truncation for long entries
- **Severity**: Color-coded severity badges
- **Status**: Current status with appropriate color coding
- **Reporter**: Full name of the reporting user
- **Reported Date**: Date of initial incident submission

**Action Column**
- **View Button**: Navigate to detailed incident view
- **Eye Icon**: Standard view action indicator

**Confidential Incident Styling**
- **Background Tint**: Subtle background color for confidential incidents
- **Italic Text**: Visual distinction for sensitive content
- **Badge Overlay**: Clear confidential status indicator

##### Pagination Controls

**Navigation Elements**
- **Page Information**: Current range and total count display
- **Previous/Next Buttons**: Standard pagination navigation
- **Page Size**: Fixed at 20 incidents per page

#### Incident Details View

**Navigation and Header**

**Back Navigation**
- **Arrow Button**: Return to incidents list
- **Breadcrumb Trail**: Clear navigation path indication

**Incident Header Card**
- **Incident Number**: Prominent display of unique identifier
- **Title**: Full incident title
- **Status Badge**: Current workflow status
- **Severity Badge**: Priority level indicator
- **Confidential Indicator**: Special handling notice

**Metadata Display**
- **Reporter Information**: Name, role, and contact details
- **Assignee**: Currently assigned investigator (if any)
- **Timestamps**: Created, reported, assigned, resolved dates
- **Location**: Incident location (if specified)

##### Incident Description

**Primary Details Card**
- **Full Description**: Complete incident narrative
- **Type and Severity**: Categorized information
- **Related Entities**: Links to associated students, sessions, or transfers

##### Status Management

**Status Update Modal**
- **Status Dropdown**: Available workflow transitions
- **Reason Field**: Required explanation for status changes
- **Resolution Notes**: Detailed solution documentation (for resolved status)

**Assignment Functionality**
- **Assignee Selection**: Dropdown of available investigators
- **Assignment Reason**: Documentation of assignment rationale
- **Reassignment**: Change assignee with audit trail

##### Comments and Communication

**Comment Thread**
- **Chronological Display**: Most recent comments first
- **User Attribution**: Author name, role, and timestamp
- **Internal Comments**: Marked for internal use only
- **Rich Formatting**: Support for detailed communication

**Add Comment Form**
- **Comment Textarea**: Multi-line input for detailed notes
- **Internal Toggle**: Mark comment as internal-only
- **Send Button**: Submit with validation

##### Attachments Management

**File Upload**
- **Drag & Drop**: Intuitive file upload interface
- **Multiple Files**: Support for batch uploads
- **File Types**: Images, documents, and media files
- **Size Limits**: Enforced file size restrictions

**Attachment Display**
- **File List**: Thumbnail and metadata view
- **Preview Support**: Image and video preview capabilities
- **Download Links**: Direct file access
- **Delete Controls**: Authorized removal with confirmation

##### Status History

**Audit Trail**
- **Complete Timeline**: All status changes and assignments
- **User Attribution**: Who made each change
- **Timestamp Tracking**: Precise change timing
- **Reason Documentation**: Explanations for each transition

#### Incident Creation Process

**Report Incident Form**

**Basic Information**
- **Incident Type**: Required category selection
- **Severity Level**: Required priority assessment
- **Title**: Concise incident summary
- **Description**: Detailed incident narrative

**Association Fields**
- **Student**: Link to affected student (optional)
- **Exam Session**: Associate with specific exam session (optional)
- **Transfer**: Link to related batch transfer (optional)
- **Location**: Incident location details

**Advanced Options**
- **Confidential Flag**: Mark as sensitive information
- **Assignee**: Pre-assign investigator (optional)
- **Metadata**: Additional custom fields

#### Export and Reporting

##### Individual Incident Export
- **PDF Generation**: Comprehensive incident report
- **Complete Documentation**: All details, comments, and attachments
- **Professional Format**: Suitable for official records

##### Bulk Export Operations
- **Multiple Selection**: Up to 50 incidents per export
- **ZIP Packaging**: Individual PDFs in compressed archive
- **Progress Tracking**: Real-time export status
- **Automatic Download**: Browser-initiated file download

##### Summary Export
- **Excel Format**: Tabular data for analysis
- **Filtered Data**: Respects current search and filter criteria
- **Complete Dataset**: All incident fields and metadata
- **Pivot Ready**: Suitable for spreadsheet analysis

#### Permissions and Access Control

- **View Access**: All authenticated users can view non-confidential incidents
- **Create Access**: All users can report incidents
- **Edit Access**: Reporters and administrators can modify incident details
- **Status Management**: Assigned investigators and administrators
- **Confidential Access**: Restricted to authorized personnel only
- **Delete Access**: Administrator-only destructive operations

#### Best Practices

- **Immediate Reporting**: Report incidents as soon as they occur
- **Detailed Descriptions**: Include all relevant context and observations
- **Evidence Collection**: Attach photos, documents, and supporting materials
- **Proper Classification**: Select appropriate type and severity levels
- **Regular Updates**: Keep incident status current during investigation
- **Clear Communication**: Use comments for all significant developments
- **Confidential Handling**: Respect sensitive information appropriately

#### Troubleshooting

- **Upload Failures**: Check file size limits and supported formats
- **Permission Errors**: Verify user roles and access levels
- **Missing Incidents**: Check filter settings and search criteria
- **Status Update Issues**: Ensure required fields are completed
- **Export Problems**: Verify network connectivity and browser settings
- **Assignment Failures**: Confirm selected user has appropriate permissions

---

## Mobile Access Guide

The ELMS mobile application provides field handlers and lecturers with powerful tools for managing exam logistics and class attendance on-the-go. Built with React Native and Expo, the app offers two specialized interfaces: the **Exam Logistics App** for script custody management and the **Class Attendance App** for lecture attendance tracking.

### Mobile App Overview

The mobile application serves as a companion to the web dashboard, enabling real-time operations in examination venues and classrooms. It supports offline functionality for critical operations and synchronizes data when connectivity is restored.

#### Supported Platforms
- **iOS**: iPhone and iPad (iOS 13.0+)
- **Android**: Android phones and tablets (Android 8.0+)
- **Expo Go**: Development and testing environment

#### Key Features
- **Real-time Synchronization**: Live updates via WebSocket connections
- **Offline Support**: Core functionality works without internet
- **Push Notifications**: Instant alerts for important events
- **QR Code Scanning**: Fast student and script identification
- **Biometric Support**: Fingerprint and facial recognition (device-dependent)
- **Multi-modal Attendance**: QR, manual entry, biometrics, and self-marking links

---

### Getting Started with Mobile Access

#### System Requirements

**Device Requirements**
- **iOS**: iPhone 6s or later, iPad 5th generation or later
- **Android**: Android 8.0 (API level 26) or higher
- **Storage**: Minimum 200MB free space
- **RAM**: 2GB minimum recommended

**Permissions Required**
- **Camera**: For QR code scanning and photo attachments
- **Location Services**: For venue verification (optional)
- **Push Notifications**: For real-time alerts
- **Biometric Authentication**: Fingerprint/Face ID (optional)

#### Installation Process

##### Option 1: Expo Go (Development/Testing)

1. **Install Expo Go**
   - **iOS**: Download from [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - **Android**: Download from [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Connect to Development Server**
   ```bash
   cd mobile
   npm install
   npx expo start
   ```

3. **Scan QR Code**
   - Use Expo Go camera to scan the displayed QR code
   - App will load and connect to development server

##### Option 2: Development Build

1. **Install EAS CLI**
   ```bash
   npm install -g @expo/cli
   eas login
   ```

2. **Build Development Version**
   ```bash
   eas build --platform ios    # For iOS
   eas build --platform android # For Android
   ```

3. **Install Build**
   - Download and install the generated APK/IPA file
   - Configure app for your environment

##### Option 3: Production Build

1. **Configure EAS Build**
   ```json
   // eas.json
   {
     "build": {
       "production": {
         "channel": "production"
       }
     }
   }
   ```

2. **Build Production Version**
   ```bash
   eas build --platform all --profile production
   ```

3. **Submit to App Stores**
   - **iOS**: Submit to App Store Connect
   - **Android**: Submit to Google Play Console

#### Initial Setup and Configuration

##### First Launch

1. **App Installation**
   - Install the app using one of the methods above
   - Grant requested permissions when prompted

2. **Authentication**
   - Launch the app
   - Enter your email/phone and password
   - App will verify credentials and load user profile

3. **Password Change (First Login)**
   - If required by administrator, change default password
   - Set strong password following organizational policies

4. **Device Naming**
   - Assign a unique name to your device for tracking
   - This helps identify which device performed specific actions

##### App Selection

The system supports two specialized applications based on user roles:

- **Exam Logistics App**: For script handlers and custodians
- **Class Attendance App**: For lecturers and course instructors

Users with appropriate permissions can access both applications and switch between them as needed.

---

### Exam Logistics App (Handler Interface)

The Exam Logistics App is designed for field handlers responsible for managing examination script custody, transfers, and incident reporting.

#### Navigation Structure

**Bottom Tab Navigation**
- **Home**: Dashboard and recent activity
- **Scanner**: QR code scanning for attendance and transfers
- **Custody**: Script batch management and transfers
- **Incidents**: Incident reporting and tracking
- **Profile**: User settings and account management

#### Home Dashboard

**Welcome Header**
- Personalized greeting based on time of day
- User name and role display
- Quick access to recent activities

**Activity Feed**
- **Recent Actions**: Last 10 activities performed
- **Activity Types**: Audit logs, transfers, incidents, attendance
- **Status Indicators**: Color-coded status for each activity
- **Timestamps**: When each activity occurred

**Quick Actions**
- **Scan QR Code**: Direct access to scanner
- **Report Incident**: Quick incident creation
- **View Custody**: Current script batches
- **Recent Activity**: Detailed activity history

#### QR Code Scanning

**Scanner Interface**

**Camera Setup**
- **Permission Request**: Automatic camera access request
- **Permission Persistence**: Remembers granted permissions
- **Fallback Handling**: Graceful degradation if camera unavailable

**Scan Modes**
- **Entry Mode**: Student check-in for examinations
- **Exit Mode**: Student check-out after exam completion
- **Toggle Control**: Easy switching between modes

**Scan Process**

1. **Position Camera**: Align QR code within scan area
2. **Automatic Detection**: App recognizes and processes QR codes
3. **Processing Feedback**: Visual and haptic feedback during processing
4. **Result Display**: Success/failure indicators with details

**Student Verification**

**Expected Students Check**
- Validates scanned student against expected attendees
- Real-time synchronization with exam session data
- Warning for unexpected students

**Attendance Recording**
- **Entry Scan**: Records student arrival time
- **Exit Scan**: Records student departure time
- **Duplicate Prevention**: Prevents multiple scans for same action
- **Offline Support**: Queues scans for later synchronization

**Profile Display**
- **Student Information**: Name, index number, program
- **Photo Display**: Student profile picture if available
- **Attendance Status**: Current session status
- **Action Confirmation**: Clear feedback for successful scans

#### Custody Management

**Batch Overview**
- **Current Custody**: Script batches currently under handler's control
- **Transfer History**: Recent transfer activities
- **Status Tracking**: Real-time batch status updates

**Transfer Operations**

**Initiate Transfer**
- **Recipient Selection**: Choose receiving handler
- **Batch Selection**: Select batches to transfer
- **Quantity Verification**: Confirm script counts
- **Location Details**: Specify transfer location

**Confirm Transfer**
- **Transfer Requests**: View incoming transfer requests
- **Quantity Verification**: Check received script counts
- **Discrepancy Reporting**: Report count mismatches
- **Confirmation**: Accept or reject transfers

**Transfer History**
- **Complete Timeline**: All custody transfers involving user
- **Status Tracking**: Current status of each transfer
- **Search/Filter**: Find specific transfers quickly

#### Incident Management

**Incident Reporting**
- **Quick Report**: Fast incident creation from any screen
- **Detailed Form**: Comprehensive incident documentation
- **Photo Attachments**: Visual evidence collection
- **Location Tagging**: Automatic location capture

**Incident Types**
- **Missing Script**: Lost or unaccounted examination scripts
- **Damaged Script**: Physical damage to scripts
- **Malpractice**: Suspected cheating or unauthorized behavior
- **Student Illness**: Medical emergencies during exams
- **Venue Issue**: Problems with examination facilities
- **Count Discrepancy**: Script count mismatches
- **Late Submission**: Scripts submitted after deadlines
- **Other**: Miscellaneous incidents

**Incident Tracking**
- **Status Monitoring**: Follow incident resolution progress
- **Communication**: Comment on incidents and receive updates
- **Attachment Viewing**: Access photos and documents
- **Resolution Tracking**: Monitor investigation progress

#### Profile and Settings

**User Information**
- **Profile Details**: Name, email, phone, role
- **Device Information**: Registered device details
- **Permissions**: Current access levels and capabilities

**Settings**
- **Notification Preferences**: Configure push notification settings
- **Offline Mode**: Configure offline behavior
- **Data Synchronization**: Manual sync controls
- **Security Settings**: Password change and biometric options

---

### Class Attendance App (Lecturer Interface)

The Class Attendance App enables lecturers to efficiently manage class attendance with multiple capture methods and real-time analytics.

#### Navigation Structure

**Bottom Tab Navigation**
- **Dashboard**: Overview and active sessions
- **Sessions**: Attendance session management
- **Scan**: QR code and biometric scanning
- **Analytics**: Attendance statistics and reports
- **Profile**: User settings and account management

#### Dashboard Overview

**Welcome and Time-based Greeting**
- Personalized welcome message
- Current time context (morning/afternoon/evening)

**Today's Statistics**
- **Total Sessions**: Number of sessions conducted today
- **Total Attendance**: Cumulative attendance recorded
- **Average Rate**: Overall attendance percentage
- **Active Sessions**: Currently running sessions

**Active Sessions Display**
- **Live Sessions**: Currently active attendance sessions
- **Real-time Stats**: Live attendance counts and rates
- **Quick Actions**: Stop, pause, or modify sessions

**Recent Sessions**
- **Last 5 Sessions**: Most recent completed sessions
- **Quick Access**: View details or restart similar sessions

#### Session Management

**Create New Session**

**Session Details**
- **Course Information**: Course code, name, and section
- **Schedule**: Date, time, and duration
- **Venue**: Location details
- **Expected Students**: Total expected attendance

**Configuration Options**
- **Attendance Methods**: Enable/disable capture methods
- **QR Code Generation**: Automatic QR code creation
- **Self-marking Links**: Generate attendance links
- **Biometric Settings**: Configure fingerprint/face recognition

**Active Session Management**
- **Session Controls**: Start, pause, stop, and restart
- **Live Monitoring**: Real-time attendance updates
- **Student List**: View current attendees
- **Export Options**: Generate attendance reports

**Session History**
- **Past Sessions**: Complete attendance history
- **Search/Filter**: Find specific sessions
- **Detailed Reports**: Comprehensive attendance data

#### Scanning and Attendance Capture

**Multi-modal Scanning**

**QR Code Scanning**
- **Camera Interface**: Optimized for QR code detection
- **Batch Processing**: Handle multiple scans quickly
- **Validation**: Verify student identity and prevent duplicates

**Biometric Authentication**
- **Fingerprint Scanning**: Device fingerprint recognition
- **Facial Recognition**: Camera-based face identification
- **Fallback Options**: Alternative methods if biometrics fail

**Manual Entry**
- **Student Search**: Find students by name or ID
- **Bulk Operations**: Mark multiple students at once
- **Reason Tracking**: Record attendance reasons

**Self-marking Links**
- **Link Generation**: Create unique attendance URLs
- **Time Limits**: Configure link validity periods
- **Access Tracking**: Monitor link usage

#### Analytics and Reporting

**Session Analytics**
- **Attendance Rates**: Individual session performance
- **Trend Analysis**: Attendance patterns over time
- **Method Breakdown**: Usage statistics by capture method

**Student Analytics**
- **Individual Performance**: Student attendance history
- **Risk Identification**: Students with low attendance
- **Notification Triggers**: Automated alerts for concerning patterns

**Export Capabilities**
- **Session Reports**: Detailed attendance sheets
- **Student Reports**: Individual attendance records
- **Bulk Exports**: Multiple sessions or students
- **Format Options**: PDF, Excel, CSV formats

#### Profile and Settings

**Lecturer Profile**
- **Personal Information**: Contact details and preferences
- **Course Assignments**: Associated courses and sections
- **Device Management**: Registered devices for attendance

**App Preferences**
- **Default Settings**: Session creation defaults
- **Notification Settings**: Alert preferences
- **Privacy Controls**: Data sharing preferences
- **Offline Configuration**: Offline operation settings

---

### Push Notifications

The mobile app provides comprehensive push notification support for real-time updates and critical alerts.

#### Notification Types

**Exam Logistics Notifications**
- **Transfer Requests**: Incoming custody transfer requests
- **Transfer Confirmations**: Completed transfer notifications
- **Incident Alerts**: New incidents requiring attention
- **Status Updates**: Changes in batch or incident status
- **Assignment Notifications**: New incident assignments

**Attendance Notifications**
- **Session Reminders**: Upcoming attendance sessions
- **Low Attendance Alerts**: Sessions with concerning attendance rates
- **System Alerts**: Technical issues or maintenance notifications
- **Student Alerts**: Individual student attendance concerns

#### Notification Management

**Permission Settings**
- **Enable/Disable**: Global notification controls
- **Categories**: Configure by notification type
- **Quiet Hours**: Scheduled notification muting
- **Priority Levels**: Critical vs. informational alerts

**Interaction Handling**
- **Tap to Open**: Direct navigation to relevant screens
- **Action Buttons**: Quick actions from notification
- **Background Processing**: Handle notifications when app is closed

---

### Offline Functionality

The mobile app maintains critical functionality even without internet connectivity.

#### Offline Capabilities

**Exam Logistics (Offline)**
- **QR Scanning**: Continue scanning with local storage
- **Incident Reporting**: Create incidents with photo attachments
- **Transfer Initiation**: Start transfers (confirmation requires connection)
- **Data Queuing**: Automatic synchronization when connectivity returns

**Class Attendance (Offline)**
- **Session Creation**: Create and start sessions
- **QR Scanning**: Record attendance locally
- **Manual Entry**: Input attendance without network
- **Basic Analytics**: View cached statistics

#### Synchronization

**Automatic Sync**
- **Connection Detection**: Automatic sync when online
- **Conflict Resolution**: Handle data conflicts intelligently
- **Progress Indicators**: Show synchronization status
- **Error Recovery**: Retry failed synchronizations

**Manual Sync**
- **Force Refresh**: Manual data synchronization
- **Selective Sync**: Sync specific data types
- **Status Monitoring**: Track sync progress and errors

---

### Security and Privacy

#### Data Protection

**Authentication**
- **Secure Login**: Encrypted credential transmission
- **Session Management**: Automatic logout on inactivity
- **Biometric Options**: Device-level authentication support

**Data Encryption**
- **Local Storage**: Encrypted sensitive data storage
- **Transmission**: TLS encryption for all network communication
- **Photo Security**: Secure handling of incident photographs

#### Privacy Controls

**Data Minimization**
- **Purpose Limitation**: Data collected only for specific purposes
- **Retention Policies**: Automatic cleanup of old data
- **Access Controls**: Role-based data visibility

**User Consent**
- **Permission Requests**: Clear explanations for required permissions
- **Opt-out Options**: User control over optional features
- **Transparency**: Clear data usage explanations

---

### Troubleshooting Mobile Access

#### Common Issues and Solutions

**Camera Problems**
- **Permission Denied**: Check app permissions in device settings
- **Camera Not Working**: Restart app and grant camera access
- **QR Not Scanning**: Ensure good lighting and stable camera position

**Connectivity Issues**
- **Offline Mode**: App functions without internet for core features
- **Sync Failures**: Check network connection and retry synchronization
- **Slow Performance**: Clear app cache or restart device

**Notification Problems**
- **Not Receiving**: Check notification permissions and settings
- **Delayed Delivery**: Verify device notification settings
- **Background Issues**: Ensure app is not restricted from background activity

**Authentication Issues**
- **Login Failures**: Verify credentials and network connection
- **Session Expiry**: Re-login when session expires
- **Password Reset**: Use web dashboard for password recovery

#### Performance Optimization

**App Performance**
- **Clear Cache**: Regularly clear app cache for better performance
- **Update App**: Keep app updated to latest version
- **Restart Device**: Occasional device restart can resolve issues

**Battery and Resource Management**
- **Background Activity**: Minimize background app activity
- **Location Services**: Disable when not needed
- **Auto-sync**: Configure sync frequency based on usage

#### Support and Help

**In-App Help**
- **Help Screens**: Context-sensitive help in each section
- **User Guide**: Access to mobile-specific documentation
- **FAQ Section**: Common questions and answers

**Technical Support**
- **Error Reporting**: Automatic error reporting for debugging
- **Support Contact**: Direct access to technical support
- **Community Forums**: User community for peer support

---

### Best Practices for Mobile Use

#### Exam Logistics Best Practices

- **Regular Synchronization**: Sync data frequently when connected
- **Photo Documentation**: Always include photos for incidents
- **Location Accuracy**: Enable location services for venue verification
- **Battery Management**: Keep device charged during long exam sessions
- **Backup Procedures**: Regularly backup important data

#### Class Attendance Best Practices

- **Session Planning**: Pre-configure sessions before class
- **Multiple Methods**: Enable various attendance methods for flexibility
- **Real-time Monitoring**: Monitor attendance rates during sessions
- **Student Communication**: Inform students of attendance requirements
- **Data Validation**: Review attendance data after sessions

#### General Mobile Usage

- **Security Awareness**: Protect device and app credentials
- **Regular Updates**: Keep app and device software current
- **Permission Management**: Grant only necessary permissions
- **Data Privacy**: Respect student privacy and data protection rules
- **Professional Use**: Maintain professional appearance and behavior

---

## Exams Logistics Module (Detailed)

The Exams Logistics Module is the core component of the ELMS system, providing end-to-end management of examination script custody from student submission through grading and return. This module eliminates script loss claims and ensures complete audit trails for regulatory compliance.

### Overview

The Exams Logistics Module transforms traditional exam management by implementing QR code-based script tracking, real-time custody chain monitoring, and automated discrepancy detection. The system creates an immutable digital trail for every examination script, enabling institutions to:

- **Eliminate Fraudulent Claims**: QR codes and custody chains prevent false script loss allegations
- **Ensure Regulatory Compliance**: Complete audit trails meet accreditation requirements
- **Enable Real-time Monitoring**: Live tracking of script locations and status
- **Automate Incident Response**: Intelligent discrepancy detection and notification systems
- **Generate Comprehensive Reports**: Detailed analytics for process improvement

#### Key Components

- **Student Attendance System**: QR code-based check-in with real-time validation
- **Script Custody Chain**: Multi-handler transfer protocol with confirmation requirements
- **Batch Management**: Grouped script tracking with status progression
- **Incident Management**: Automated discrepancy detection and resolution workflows
- **Real-time Monitoring**: Live updates via WebSocket connections
- **Audit Trail**: Immutable record of all custody changes

#### Module Architecture

The module operates across three integrated platforms:

- **Web Dashboard**: Administrative oversight and reporting
- **Mobile Handler App**: Field operations and custody management
- **Backend API**: Data processing and real-time synchronization

### Exam Setup

The exam setup process establishes the foundation for script tracking throughout the examination lifecycle.

#### Pre-Exam Preparation

##### 1. Student Registration
- **Bulk Import**: CSV upload of student information
- **Individual Creation**: Manual student record creation
- **QR Code Generation**: Automatic QR code assignment for each student
- **Profile Management**: Student photos and academic information

##### 2. Course and Lecturer Setup
- **Course Database**: Maintain comprehensive course catalog
- **Lecturer Assignment**: Link courses to responsible faculty members
- **Department Mapping**: Associate courses with academic departments
- **Venue Management**: Define examination locations and capacities

##### 3. Exam Session Creation
- **Session Planning**: Define exam schedules and parameters
- **Batch Configuration**: Set up script batch groupings
- **Staff Assignment**: Designate invigilators and support staff
- **Resource Allocation**: Assign venues and equipment

#### Session Configuration

##### Basic Session Information
- **Course Details**: Code, name, and academic information
- **Schedule**: Date, time, and duration
- **Venue**: Location and room assignments
- **Staff**: Primary and assistant invigilators

##### Advanced Settings
- **Expected Attendance**: Upload student roster
- **Batch Parameters**: Script grouping rules
- **Notification Settings**: Alert preferences
- **Special Accommodations**: Accessibility requirements

##### QR Code Preparation
- **Batch QR Generation**: Unique identifiers for script batches
- **Student QR Distribution**: Ensure students have access to QR codes
- **Testing**: Validate QR code readability and data encoding

### Attendance Recording

The attendance recording system captures student participation with multiple verification methods and real-time validation.

#### Check-in Process

##### QR Code Scanning
- **Student Authentication**: QR code validation against expected attendees
- **Real-time Verification**: Instant confirmation of student identity
- **Duplicate Prevention**: Block multiple check-ins for same student
- **Offline Capability**: Queue scans for later synchronization

##### Manual Entry Options
- **Fallback Method**: Manual student lookup when QR fails
- **Search Functionality**: Find students by name or ID number
- **Verification**: Photo and information confirmation
- **Audit Trail**: Record manual entry reasons

##### Biometric Integration
- **Fingerprint Scanning**: Device-supported biometric authentication
- **Facial Recognition**: Camera-based identity verification
- **Multi-modal Support**: Combine methods for enhanced security
- **Privacy Compliance**: Secure biometric data handling

#### Real-time Monitoring

##### Live Dashboard
- **Attendance Counter**: Running total of checked-in students
- **Progress Tracking**: Percentage of expected attendance
- **Time-based Analytics**: Check-in patterns and rates
- **Staff Activity**: Monitor invigilator scanning activity

##### Status Updates
- **Automatic Notifications**: Alerts for important milestones
- **Progress Indicators**: Visual feedback on attendance completion
- **Issue Detection**: Identify attendance anomalies
- **Communication**: Real-time updates to all stakeholders

#### Session Management

##### During Exam
- **Continuous Monitoring**: Live attendance tracking
- **Status Updates**: Record student submissions and departures
- **Incident Logging**: Capture examination irregularities
- **Communication**: Coordinate with support staff

##### Session Closure
- **Final Count**: Complete attendance verification
- **Script Collection**: Confirm all scripts gathered
- **Status Update**: Mark session as submitted
- **Data Export**: Generate attendance reports

### Batch Tracking

The batch tracking system provides comprehensive visibility into script movement throughout the custody chain.

#### Batch Creation

##### Automatic Grouping
- **Session-based Batches**: Scripts grouped by exam session
- **QR Code Assignment**: Unique identifiers for each batch
- **Metadata Attachment**: Link batches to course and student information
- **Status Initialization**: Set initial batch status and location

##### Manual Overrides
- **Custom Grouping**: Override automatic batch creation
- **Split Batches**: Divide large sessions into multiple batches
- **Merge Operations**: Combine related batches when appropriate
- **Reassignment**: Change batch compositions as needed

#### Custody Chain Management

##### Transfer Protocol
- **Initiation**: Originating handler requests transfer
- **Notification**: Receiving handler alerted of pending transfer
- **Verification**: Script count confirmation at both ends
- **Confirmation**: Mutual agreement on transfer completion

##### Handler Responsibilities
- **Custody Acceptance**: Formal acknowledgment of batch receipt
- **Count Verification**: Physical verification of script quantities
- **Condition Assessment**: Document script condition and any issues
- **Secure Storage**: Maintain appropriate storage conditions

##### Transfer Documentation
- **Digital Records**: Automatic logging of all transfer activities
- **Photo Evidence**: Optional photographic documentation
- **Witness Signatures**: Additional verification for high-value transfers
- **Chain of Custody**: Complete historical record

#### Real-time Tracking

##### Location Monitoring
- **Current Handler**: Identify who currently holds each batch
- **Location Updates**: Track physical or logical locations
- **Movement History**: Complete timeline of batch movements
- **Status Progression**: Monitor advancement through workflow stages

##### Status Management
- **Workflow States**: Track batches through processing stages
- **Automatic Updates**: Status changes based on system events
- **Manual Overrides**: Administrative status modifications
- **Progress Tracking**: Visual indicators of completion status

### Transfer Management

The transfer management system ensures secure and accountable movement of script batches between authorized handlers.

#### Transfer Initiation

##### Request Creation
- **Recipient Selection**: Choose authorized receiving handler
- **Batch Specification**: Identify batches to be transferred
- **Quantity Declaration**: State expected script counts
- **Location Details**: Specify transfer location and timing

##### Authorization Checks
- **Permission Validation**: Verify user transfer rights
- **Role Verification**: Confirm appropriate handler roles
- **Batch Ownership**: Ensure originating handler has custody
- **Schedule Compliance**: Check transfer timing restrictions

#### Transfer Execution

##### Handshake Protocol
- **Request Notification**: Receiving handler notified of transfer request
- **Acceptance Window**: Configurable response time limits
- **Verification Process**: Mutual confirmation of transfer details
- **Completion Recording**: Final transfer acknowledgment

##### Quality Assurance
- **Count Verification**: Physical script counting at transfer
- **Condition Inspection**: Document script condition
- **Discrepancy Reporting**: Immediate issue identification
- **Photo Documentation**: Visual evidence of transfer

#### Transfer Monitoring

##### Real-time Updates
- **Status Tracking**: Live transfer progress monitoring
- **Notification System**: Automated alerts for all parties
- **Escalation Procedures**: Automatic follow-up for delayed transfers
- **Audit Logging**: Complete transfer history recording

##### Issue Resolution
- **Discrepancy Handling**: Structured process for count mismatches
- **Investigation Workflow**: Systematic issue investigation
- **Resolution Tracking**: Document problem solutions
- **Preventive Measures**: Learning from transfer issues

### Incident Reporting

The incident reporting system captures, investigates, and resolves examination-related issues with comprehensive documentation.

#### Incident Types

##### Script-Related Incidents
- **Missing Scripts**: Undocumented script disappearance
- **Damaged Scripts**: Physical damage requiring documentation
- **Count Discrepancies**: Quantity mismatches during transfers
- **Late Submissions**: Scripts submitted after deadlines

##### Student-Related Incidents
- **Malpractice**: Suspected cheating or unauthorized behavior
- **Illness**: Medical emergencies affecting exam participation
- **Attendance Issues**: Check-in or submission problems
- **Identification Problems**: Student verification difficulties

##### Operational Incidents
- **Venue Issues**: Problems with examination facilities
- **Equipment Failures**: Technical problems during exams
- **Staff Issues**: Invigilator or handler problems
- **Procedural Violations**: Process or policy breaches

#### Reporting Process

##### Incident Creation
- **Multiple Channels**: Web dashboard, mobile app, or direct reporting
- **Template Selection**: Choose appropriate incident category
- **Severity Assessment**: Rate incident impact and urgency
- **Detailed Description**: Comprehensive incident narrative

##### Evidence Collection
- **Photo Attachments**: Visual documentation of issues
- **Witness Statements**: Supporting statements from involved parties
- **Document Upload**: Relevant files and supporting materials
- **Location Data**: Automatic location tagging

#### Investigation Workflow

##### Initial Assessment
- **Severity Evaluation**: Determine response priority
- **Assignment**: Route to appropriate investigator
- **Timeline Setting**: Establish investigation deadlines
- **Communication**: Notify affected parties

##### Investigation Process
- **Evidence Review**: Examine all collected information
- **Witness Interviews**: Gather statements from involved parties
- **Document Analysis**: Review relevant records and logs
- **Root Cause Analysis**: Determine underlying causes

##### Resolution Process
- **Solution Development**: Create appropriate resolution plan
- **Implementation**: Execute corrective actions
- **Documentation**: Record all resolution steps
- **Follow-up**: Monitor effectiveness of solutions

#### Status Management

##### Workflow States
- **Reported**: Initial submission, awaiting review
- **Investigating**: Active investigation in progress
- **Resolved**: Issue resolved with documented solution
- **Closed**: Final closure with no further action
- **Escalated**: Elevated to higher authority for resolution

##### Progress Tracking
- **Status Updates**: Regular progress documentation
- **Timeline Monitoring**: Track investigation deadlines
- **Stakeholder Communication**: Keep all parties informed
- **Audit Trail**: Complete record of all status changes

### Reports and Exports

The reporting system provides comprehensive analytics and documentation for examination logistics operations.

#### Standard Reports

##### Session Reports
- **Attendance Summary**: Complete student participation data
- **Script Tracking**: Batch movement and custody history
- **Incident Summary**: Issues encountered during session
- **Performance Metrics**: Key performance indicators

##### Batch Reports
- **Custody Timeline**: Complete chain of custody documentation
- **Transfer History**: All batch movements and handlers
- **Discrepancy Log**: Issues and resolutions for the batch
- **Status Progression**: Workflow advancement tracking

##### Handler Reports
- **Transfer Activity**: Individual handler performance metrics
- **Custody Duration**: Time batches spend with each handler
- **Incident Involvement**: Issues where handler was involved
- **Performance Analytics**: Efficiency and accuracy metrics

#### Custom Analytics

##### Trend Analysis
- **Historical Patterns**: Long-term performance trends
- **Seasonal Variations**: Peak period performance analysis
- **Department Comparison**: Performance across academic units
- **Process Optimization**: Identify improvement opportunities

##### Compliance Reporting
- **Regulatory Requirements**: Accreditation and audit documentation
- **Policy Adherence**: Compliance with institutional policies
- **Quality Assurance**: Process effectiveness measurement
- **Risk Assessment**: Identification of potential issues

#### Export Formats

##### PDF Reports
- **Professional Documents**: Formatted reports for official use
- **Complete Documentation**: All relevant data and evidence
- **Signature Ready**: Prepared for formal approvals
- **Archival Quality**: Long-term storage appropriate

##### Excel Spreadsheets
- **Data Analysis**: Raw data for custom analysis
- **Pivot Tables**: Built-in analysis capabilities
- **Chart Generation**: Visual representation options
- **Formula Support**: Custom calculations and metrics

##### Bulk Exports
- **Multiple Records**: Export multiple reports simultaneously
- **ZIP Packaging**: Compressed delivery of large datasets
- **Automated Naming**: Consistent file naming conventions
- **Progress Tracking**: Large export operation monitoring

#### Automated Reporting

##### Scheduled Reports
- **Regular Generation**: Automatic report creation on schedules
- **Distribution Lists**: Automated delivery to stakeholders
- **Custom Templates**: Organization-specific report formats
- **Historical Archives**: Long-term report storage

##### Alert-based Reporting
- **Threshold Triggers**: Automatic reports when metrics exceed limits
- **Incident Escalation**: Immediate reporting for critical issues
- **Performance Alerts**: Notifications for performance deviations
- **Compliance Monitoring**: Automated compliance status reports

---

## Class Attendance System (Detailed)

The Class Attendance System provides efficient, technology-enabled attendance tracking for regular academic lectures and classes. This module complements the Exams Logistics Module by offering streamlined attendance management for daily academic activities.

### Overview

The Class Attendance System transforms traditional attendance methods by implementing QR code-based check-in, real-time monitoring, and automated reporting. The system creates digital attendance records that integrate with institutional systems while providing immediate feedback to both students and lecturers.

#### Key Features

- **QR Code Integration**: Seamless student check-in using existing QR codes
- **Real-time Monitoring**: Live attendance tracking and progress updates
- **Flexible Recording**: Support for various class formats and schedules
- **Automated Reporting**: Instant generation of attendance reports
- **Multi-device Support**: Cross-platform compatibility for different devices
- **Offline Capability**: Continue recording when network connectivity is limited

#### System Architecture

The Class Attendance System operates through:

- **Mobile Application**: Primary interface for lecturers and attendance takers
- **Web Dashboard**: Administrative oversight and report generation
- **Backend Integration**: Data synchronization with central database
- **Real-time Updates**: Live synchronization across all connected devices

### Mobile App: Recording Attendance

The mobile application serves as the primary tool for recording class attendance in real-time.

#### Initial Setup

##### First Launch Configuration
- **App Installation**: Download from app store or install via EAS build
- **Device Registration**: Register device with unique identifier
- **Permission Setup**: Grant camera and location permissions
- **Profile Configuration**: Set user preferences and default settings

##### Login Process
- **Authentication**: Secure login using institutional credentials
- **Role Verification**: Confirm lecturer or attendance taker permissions
- **Device Linking**: Associate device with user account
- **Security Setup**: Configure biometric or PIN authentication

##### Device Naming and Management
- **Device Identification**: Assign meaningful names to devices
- **Multi-device Support**: Manage multiple devices per user
- **Device Groups**: Organize devices by department or location
- **Status Monitoring**: Track device connectivity and battery status

#### Attendance Dashboard

The main dashboard provides centralized access to all attendance functions.

##### Navigation Tabs
- **Record Tab**: Active attendance recording interface
- **Active Tab**: View currently running attendance sessions
- **History Tab**: Access past attendance records

##### Dashboard Features
- **Quick Actions**: Fast access to frequently used functions
- **Status Indicators**: Real-time connection and battery status
- **Notifications**: Alerts for important updates and reminders
- **Recent Activity**: Quick access to recent attendance sessions

#### Start Recording Attendance

##### Session Setup
- **Course Selection**: Choose from assigned courses
- **Class Details**: Specify date, time, and location
- **Expected Attendance**: Set expected number of students
- **Duration Settings**: Configure session length and auto-end options

##### Advanced Configuration
- **Location Verification**: Enable GPS-based location validation
- **Time Restrictions**: Set check-in time windows
- **Custom Messages**: Configure welcome or instruction messages
- **Integration Settings**: Link with calendar or scheduling systems

##### Session Initiation
- **QR Code Display**: Generate session-specific QR code
- **Broadcast Mode**: Share attendance link via various channels
- **Manual Override**: Allow manual student entry as backup
- **Start Confirmation**: Verify all settings before beginning

#### Scan Students

##### QR Code Scanning
- **Camera Interface**: Optimized scanning interface
- **Auto-focus**: Automatic QR code detection and decoding
- **Validation**: Real-time verification against student database
- **Duplicate Prevention**: Block multiple check-ins from same student

##### Manual Entry Options
- **Student Search**: Find students by name, ID, or other identifiers
- **Photo Verification**: Visual confirmation of student identity
- **Reason Recording**: Document reasons for manual entry
- **Audit Trail**: Complete record of manual entries

##### Real-time Feedback
- **Check-in Confirmation**: Immediate visual and audio feedback
- **Progress Tracking**: Live attendance counter and percentage
- **Student List**: Dynamic display of checked-in students
- **Time Remaining**: Countdown for session duration

#### End Recording

##### Session Completion
- **Auto-end Triggers**: Automatic completion based on time or attendance
- **Manual Termination**: Lecturer-initiated session end
- **Final Verification**: Review attendance before finalizing
- **Data Synchronization**: Ensure all data is uploaded to server

##### Post-Session Actions
- **Report Generation**: Automatic creation of attendance report
- **Notification**: Alert students of attendance status
- **Data Export**: Generate reports in various formats
- **Session Archiving**: Store session data for future reference

#### View Recording History

##### History Navigation
- **Date Filtering**: Filter sessions by date range
- **Course Filtering**: View attendance by specific courses
- **Search Functionality**: Find specific sessions or students
- **Sort Options**: Organize by date, course, or attendance rate

##### Session Details
- **Attendance Summary**: Total present, absent, and percentage
- **Student List**: Complete list with check-in times
- **Session Information**: Course, date, time, and location details
- **Export Options**: Generate reports or share data

##### Analytics Integration
- **Trend Analysis**: View attendance patterns over time
- **Comparative Data**: Compare across different sessions
- **Performance Metrics**: Track individual student attendance
- **Reporting Tools**: Generate detailed analytics reports

### Use Cases

The Class Attendance System supports various academic scenarios and operational requirements.

#### Regular Lecture Attendance

##### Standard Lecture Setup
- **Scheduled Classes**: Pre-planned lecture sessions
- **Course Integration**: Link with course management systems
- **Student Roster**: Import expected attendees automatically
- **Recurring Sessions**: Set up weekly or periodic classes

##### Recording Process
- **Pre-class Setup**: Configure session 5-10 minutes before start
- **Student Check-in**: QR code scanning during class entry
- **Real-time Monitoring**: Track attendance throughout session
- **Post-class Review**: Verify and finalize attendance records

##### Integration Benefits
- **Automated Reporting**: Instant attendance reports for administrators
- **Student Notifications**: Real-time attendance confirmation
- **Grade Integration**: Feed attendance data into grading systems
- **Compliance Tracking**: Meet institutional attendance requirements

#### Multiple Lecture Halls

##### Venue Management
- **Multi-room Support**: Simultaneous sessions in different locations
- **Device Assignment**: Dedicated devices per lecture hall
- **Coordinator Oversight**: Central monitoring of all sessions
- **Synchronization**: Real-time data consolidation

##### Operational Workflow
- **Pre-session Coordination**: Assign staff and devices to venues
- **Independent Recording**: Each lecturer manages their session
- **Central Monitoring**: Administrative oversight of all activities
- **Consolidated Reporting**: Unified attendance data across venues

##### Advanced Features
- **Capacity Management**: Track venue utilization and capacity
- **Staff Scheduling**: Optimize staff assignment across multiple halls
- **Conflict Resolution**: Handle scheduling overlaps
- **Resource Allocation**: Manage equipment distribution

#### Emergency Substitute

##### Substitute Scenarios
- **Unplanned Absences**: Sudden lecturer unavailability
- **Emergency Coverage**: Medical or personal emergencies
- **Schedule Conflicts**: Last-minute changes requiring coverage
- **Staff Shortages**: Temporary reduction in available staff

##### Substitute Workflow
- **Quick Setup**: Rapid session configuration for substitutes
- **Access Provision**: Temporary permissions for substitute staff
- **Student Communication**: Notify students of substitute arrangements
- **Record Continuity**: Maintain attendance record integrity

##### Support Features
- **Template Sessions**: Pre-configured setups for common scenarios
- **Contact Lists**: Quick access to substitute staff contacts
- **Automated Notifications**: Alert relevant parties of changes
- **Documentation**: Record substitute arrangements and reasons

### Admin Oversight

Administrative tools provide comprehensive monitoring and management of the attendance system.

#### Web Dashboard Monitoring

##### Real-time Oversight
- **Live Sessions**: View all active attendance recording sessions
- **Progress Tracking**: Monitor attendance rates across all classes
- **Issue Detection**: Identify sessions with potential problems
- **Staff Activity**: Track lecturer and staff attendance recording

##### Session Management
- **Session Approval**: Review and approve attendance sessions
- **Data Validation**: Verify attendance data accuracy
- **Anomaly Detection**: Flag unusual attendance patterns
- **Quality Assurance**: Ensure recording standards are met

#### Reporting and Analytics

##### Attendance Analytics
- **Course Performance**: Analyze attendance by course and lecturer
- **Student Patterns**: Track individual student attendance trends
- **Department Metrics**: Aggregate data by academic departments
- **Institutional Overview**: Campus-wide attendance statistics

##### Compliance Monitoring
- **Policy Enforcement**: Ensure adherence to attendance policies
- **Regulatory Reporting**: Generate reports for accreditation bodies
- **Trend Analysis**: Identify patterns requiring intervention
- **Performance Metrics**: Measure system effectiveness

#### System Administration

##### User Management
- **Staff Permissions**: Manage lecturer and staff access rights
- **Device Management**: Register and monitor mobile devices
- **Course Assignment**: Link staff to their assigned courses
- **Access Control**: Configure role-based permissions

##### Configuration Management
- **System Settings**: Configure global attendance parameters
- **Integration Setup**: Connect with student information systems
- **Notification Rules**: Set up automated alerts and reminders
- **Backup Procedures**: Ensure data integrity and recovery

---

## Workflows & Processes

This section outlines the complete workflows for both examination logistics and class attendance systems, providing step-by-step guidance for all user roles throughout the examination lifecycle.

### Complete Exam Workflow

The examination workflow follows a structured process from initial setup through final reporting, ensuring complete audit trails and regulatory compliance.

#### Phase 1: Pre-Exam Setup (Administrator)

**Objective**: Establish the foundation for secure script tracking and attendance management.

**Steps**:

1. **Student Data Management**
   - Import student records via CSV or create individual profiles
   - Assign unique QR codes to each student
   - Upload student profile pictures for verification
   - Set up program, level, and department associations

2. **Course and Lecturer Configuration**
   - Create or update course records with codes and names
   - Assign lecturers to courses with appropriate permissions
   - Configure department and faculty associations
   - Set up venue information and capacities

3. **Exam Session Creation**
   - Define exam schedules with date, time, and duration
   - Upload expected student rosters for each session
   - Generate unique batch QR codes for script grouping
   - Assign invigilators and support staff
   - Configure session-specific security settings

4. **System Preparation**
   - Test QR code generation and scanning functionality
   - Verify mobile device registrations for handlers
   - Set up notification preferences and alert thresholds
   - Conduct system readiness checks

**Key Outputs**: Configured exam sessions, student QR codes, handler assignments, system readiness confirmation.

#### Phase 2: Exam Day Execution (Invigilator)

**Objective**: Conduct secure examination with real-time attendance tracking and initial script custody establishment.

**Steps**:

1. **Pre-Exam Preparation**
   - Arrive at venue 30-45 minutes before exam start
   - Launch mobile app and verify device connectivity
   - Load assigned exam session and verify details
   - Test QR code scanning functionality

2. **Student Check-in Process**
   - Display session QR code for student scanning
   - Scan student QR codes as they enter the venue
   - Verify student identity against expected roster
   - Record attendance with timestamp and location data
   - Handle manual entry for students with QR issues

3. **During Exam Monitoring**
   - Monitor real-time attendance progress
   - Track student submissions and departures
   - Maintain security protocols throughout exam
   - Document any irregularities or incidents
   - Coordinate with support staff as needed

4. **Post-Exam Collection**
   - Verify final attendance counts
   - Collect all examination scripts from students
   - Organize scripts by student and batch requirements
   - Perform initial count verification
   - Prepare scripts for transfer to next handler

**Key Outputs**: Complete attendance records, collected script batches, initial custody documentation.

#### Phase 3: First Transfer (Invigilator → Lecturer)

**Objective**: Establish the initial custody chain by transferring scripts from exam venue to course lecturer.

**Steps**:

1. **Transfer Preparation**
   - Verify script counts match attendance records
   - Organize scripts by batch and student identification
   - Document script condition and any visible issues
   - Prepare transfer request in mobile application

2. **Transfer Initiation**
   - Select receiving lecturer from assigned course faculty
   - Specify script batch details and quantities
   - Include location and timing information
   - Submit transfer request with notification to recipient

3. **Transfer Execution**
   - Coordinate meeting location and time with lecturer
   - Perform physical handover of script batches
   - Conduct joint count verification at transfer point
   - Document transfer with optional photographic evidence
   - Obtain mutual confirmation of transfer completion

4. **Transfer Completion**
   - Update custody status in mobile application
   - Receive confirmation from receiving lecturer
   - Generate transfer documentation for audit trail
   - Clear local custody responsibilities

**Key Outputs**: Completed transfer record, updated custody chain, confirmed script receipt by lecturer.

#### Phase 4: Subsequent Transfers (Lecturer → Faculty Officer → Department Head)

**Objective**: Continue the custody chain through academic hierarchy until final secure storage or grading completion.

**Steps**:

1. **Assessment of Transfer Needs**
   - Evaluate script processing requirements (grading, review, storage)
   - Determine appropriate next handler in academic chain
   - Consider security requirements and handler availability
   - Plan transfer timing and logistics

2. **Transfer Request Process**
   - Initiate transfer request to designated recipient
   - Provide detailed script batch information
   - Specify transfer conditions and security requirements
   - Set expected transfer timeline

3. **Quality Assurance Checks**
   - Verify script integrity and condition
   - Ensure proper organization and identification
   - Document any issues or special handling requirements
   - Prepare supporting documentation

4. **Transfer Completion and Documentation**
   - Execute physical transfer with count verification
   - Update custody records in real-time
   - Generate comprehensive transfer documentation
   - Maintain continuous audit trail

**Key Outputs**: Progressive custody chain documentation, verified script transfers, complete audit trail.

#### Phase 5: Marking & Return Process

**Objective**: Complete the examination lifecycle through grading and secure script return to students.

**Steps**:

1. **Grading Preparation**
   - Receive scripts in secure custody
   - Organize scripts for efficient grading workflow
   - Maintain custody chain during grading process
   - Document grading assignments and responsibilities

2. **Grading Execution**
   - Conduct marking according to institutional standards
   - Record grades and feedback in secure systems
   - Maintain script security throughout process
   - Handle any grading disputes or irregularities

3. **Script Return Preparation**
   - Organize graded scripts by student and course
   - Prepare return documentation and receipts
   - Coordinate return logistics with students
   - Update script status in tracking system

4. **Secure Return Process**
   - Implement controlled return procedures
   - Obtain student confirmation of script receipt
   - Document return completion in audit trail
   - Close examination session records

**Key Outputs**: Completed grading records, confirmed script returns, closed examination sessions.

#### Phase 6: Reporting & Analytics

**Objective**: Generate comprehensive reports and analytics for process improvement and regulatory compliance.

**Steps**:

1. **Data Compilation**
   - Aggregate attendance, transfer, and incident data
   - Compile custody chain documentation
   - Collect performance metrics and timelines
   - Prepare data for analysis and reporting

2. **Report Generation**
   - Create session-specific attendance reports
   - Generate custody chain audit trails
   - Produce performance analytics and trends
   - Develop compliance documentation

3. **Analytics Review**
   - Analyze process efficiency and bottlenecks
   - Identify improvement opportunities
   - Review handler performance metrics
   - Assess system effectiveness

4. **Compliance and Archiving**
   - Prepare regulatory compliance reports
   - Archive records according to retention policies
   - Generate audit documentation
   - Update institutional records

**Key Outputs**: Comprehensive reports, performance analytics, compliance documentation, archived records.

### Class Attendance Workflow

The class attendance system provides streamlined attendance tracking for regular academic sessions.

#### Standard Lecture Process

**Pre-Class Setup**:
- Lecturer creates attendance session with course details
- Generates QR code or self-service link
- Sets session parameters (duration, location validation)

**During Class**:
- Students check in using QR codes or self-service links
- Real-time attendance monitoring and progress tracking
- Multiple verification methods available (QR, manual, biometric)

**Post-Class**:
- Automatic report generation
- Attendance data integration with institutional systems
- Analytics and trend tracking

#### Emergency Substitute Process

**Substitute Activation**:
- Quick session creation with minimal configuration
- Template-based setup for rapid deployment
- Temporary permissions for substitute staff

**Attendance Continuity**:
- Maintain attendance tracking integrity
- Use existing student QR codes
- Generate substitute-specific access links

**Data Preservation**:
- Seamless integration with regular attendance records
- Complete audit trail maintenance
- Automatic reconciliation with course records

### Incident Management Workflow

**Incident Detection and Reporting**:
- Real-time identification through system monitoring
- Manual reporting by handlers and staff
- Multiple reporting channels (mobile app, web dashboard)

**Investigation Process**:
- Automated severity assessment and prioritization
- Assignment to appropriate investigators
- Systematic evidence collection and analysis

**Resolution and Documentation**:
- Structured resolution workflows
- Comprehensive documentation requirements
- Stakeholder communication and updates

**Follow-up and Prevention**:
- Root cause analysis and corrective actions
- Process improvements and training updates
- Trend analysis for preventive measures

### Transfer Management Workflow

**Transfer Initiation**:
- Handler identifies transfer requirements
- System validates permissions and custody rights
- Recipient selection and notification

**Transfer Execution**:
- Secure handover protocols
- Count verification and documentation
- Photographic evidence collection
- Real-time status updates

**Quality Assurance**:
- Automated discrepancy detection
- Manual verification processes
- Resolution workflow for issues

**Completion and Audit**:
- Mutual confirmation requirements
- Complete audit trail generation
- Integration with broader custody chain

---

## Troubleshooting

This section provides solutions to common issues encountered when using the ELMS system.

### Common Issues

#### Mobile App Issues

**QR Code Scanning Problems**
- **Issue**: QR codes not scanning properly
- **Solutions**:
  - Ensure good lighting and stable camera position
  - Clean camera lens and remove any obstructions
  - Hold device steady for 2-3 seconds while scanning
  - Restart the app if scanning is unresponsive
  - Check camera permissions in device settings

**App Crashing or Freezing**
- **Issue**: Application becomes unresponsive
- **Solutions**:
  - Force close and restart the app
  - Clear app cache and data (Settings → Apps → ELMS → Storage)
  - Update to the latest app version
  - Restart the device
  - Check available storage space

**Location Services Not Working**
- **Issue**: GPS location not detected for geofencing
- **Solutions**:
  - Enable location services in device settings
  - Grant location permission to the ELMS app
  - Ensure GPS is enabled and has clear sky view
  - Restart location services
  - Use manual entry as temporary workaround

**Offline Synchronization Issues**
- **Issue**: Data not syncing when coming back online
- **Solutions**:
  - Check internet connection stability
  - Manually trigger sync in app settings
  - Ensure sufficient storage space for queued data
  - Restart the app to reset sync processes
  - Contact support if sync fails repeatedly

#### Web Dashboard Issues

**Login Problems**
- **Issue**: Unable to log in to web dashboard
- **Solutions**:
  - Verify username/email and password are correct
  - Check if account is locked (contact administrator)
  - Clear browser cache and cookies
  - Try a different browser or incognito mode
  - Reset password if forgotten

**Slow Performance**
- **Issue**: Web dashboard loading slowly or freezing
- **Solutions**:
  - Clear browser cache and temporary files
  - Close unnecessary browser tabs
  - Use a modern browser (Chrome, Firefox, Edge)
  - Check internet connection speed
  - Disable browser extensions temporarily

**Data Not Loading**
- **Issue**: Tables or reports not displaying data
- **Solutions**:
  - Refresh the page (Ctrl+F5 for hard refresh)
  - Check date range filters and search criteria
  - Verify user permissions for the data
  - Clear browser cache
  - Contact administrator if issue persists

#### Attendance and Scanning Issues

**Duplicate Attendance Records**
- **Issue**: Same student marked multiple times
- **Solutions**:
  - Check QR code validity and uniqueness
  - Verify student has only scanned once
  - Use manual verification for suspected duplicates
  - Review attendance records and remove duplicates
  - Enable duplicate prevention settings

**Student Not Found**
- **Issue**: QR code scans but student not recognized
- **Solutions**:
  - Verify student is registered in the system
  - Check QR code is not damaged or corrupted
  - Use manual entry with correct index number
  - Update student records if information changed
  - Contact administrator for student data issues

**Transfer Rejections**
- **Issue**: Transfer requests being rejected
- **Solutions**:
  - Verify you have custody of the batch
  - Check recipient permissions and availability
  - Ensure all required fields are completed
  - Confirm batch details match expectations
  - Contact recipient to resolve permission issues

#### System and Connectivity Issues

**Real-time Updates Not Working**
- **Issue**: Live data not updating automatically
- **Solutions**:
  - Check internet connection stability
  - Refresh the page or restart the app
  - Verify WebSocket connections are enabled
  - Clear browser cache and cookies
  - Contact support for server connectivity issues

**File Upload Failures**
- **Issue**: Photos or documents not uploading
- **Solutions**:
  - Check file size limits (max 5MB for images)
  - Verify supported file formats (JPG, PNG, PDF)
  - Ensure stable internet connection
  - Try smaller files or compress images
  - Contact support for upload server issues

**Notification Problems**
- **Issue**: Push notifications not received
- **Solutions**:
  - Check notification permissions in device settings
  - Verify app notification settings are enabled
  - Ensure device is not in Do Not Disturb mode
  - Restart the device
  - Reinstall app if notifications consistently fail

### FAQs

#### General Questions

**Q: What is ELMS?**
A: ELMS (Exam Logistics Management System) is a comprehensive solution for managing examination script custody, student attendance tracking, and academic logistics with complete audit trails and real-time monitoring.

**Q: Who can use the ELMS system?**
A: The system supports multiple user roles including Administrators, Invigilators, Lecturers, Faculty Officers, Department Heads, and Class Representatives, each with role-specific permissions and functionalities.

**Q: Is the system available offline?**
A: Yes, the mobile apps support offline functionality for critical operations like attendance recording and incident reporting, with automatic synchronization when connectivity is restored.

**Q: How secure is the ELMS system?**
A: ELMS implements multiple security layers including JWT authentication, encrypted data transmission, role-based access control, audit trails, and biometric verification options.

#### Mobile App Questions

**Q: How do I scan QR codes for attendance?**
A: Open the scanner in the mobile app, point your camera at the student's QR code, and hold steady until the code is recognized. The app will automatically verify and record the attendance.

**Q: What should I do if a QR code won't scan?**
A: Try improving lighting, cleaning the camera lens, holding the device steady, or use the manual entry option with the student's index number as a fallback.

**Q: How do I transfer script custody?**
A: In the mobile app, navigate to the custody section, select the batch to transfer, choose the recipient, specify details, and complete the transfer handshake with count verification.

**Q: Can multiple people record attendance for the same session?**
A: Yes, sessions support multiple assistants with different roles (Assistant for recording, Observer for viewing). The system synchronizes all recordings in real-time.

#### Web Dashboard Questions

**Q: How do I create a new exam session?**
A: Navigate to Exam Sessions in the sidebar, click "Create Session", fill in course details, lecturer, venue, date/time, and upload the expected student roster.

**Q: How do I view batch tracking information?**
A: Go to Batch Tracking in the sidebar, select a batch from the list, and view the complete chain of custody, transfer history, and current location.

**Q: How do I generate reports?**
A: Use the Analytics section to create various reports. Set date ranges, apply filters, and export as PDF or Excel formats.

**Q: How do I manage user accounts?**
A: Administrators can access User Management in the sidebar to create, edit, deactivate, or reset passwords for user accounts.

#### Attendance and Logistics Questions

**Q: What happens if a script goes missing?**
A: Report an incident immediately through the mobile app or web dashboard. The system will track the incident, investigate the custody chain, and maintain documentation for resolution.

**Q: How are attendance disputes handled?**
A: Attendance records are timestamped and GPS-verified. Disputes can be raised through incidents, with photographic evidence and witness statements collected for resolution.

**Q: Can students mark their own attendance?**
A: Yes, lecturers can generate self-service links that allow students to mark their attendance via web browsers, with security features like geofencing and time restrictions.

**Q: How does the custody chain work?**
A: Scripts move through a verified chain of handlers (Invigilator → Lecturer → Faculty Officer → etc.) with each transfer requiring mutual confirmation, count verification, and documentation.

#### Technical Questions

**Q: What are the system requirements?**
A: Mobile apps require iOS 13+/Android 8+ with 2GB RAM. Web dashboard works on modern browsers. Backend requires Node.js 20+ and PostgreSQL 15+.

**Q: How do I update the mobile app?**
A: Apps update automatically through app stores, or you can manually check for updates in the App Store/Google Play Store.

**Q: What if I forget my password?**
A: Use the "Forgot Password" link on the login screen, or contact your administrator to reset your password.

**Q: How do I report technical issues?**
A: Use the incident reporting system for technical problems, or contact your system administrator with detailed information about the issue.

---

## Best Practices

This section outlines recommended practices for secure, efficient, and effective use of the ELMS system.

### Security Best Practices

#### Account Security

**Password Management**
- Use strong passwords with minimum 8 characters including uppercase, lowercase, numbers, and special characters
- Change default passwords immediately after account creation
- Never share passwords or login credentials
- Use password managers for secure credential storage
- Enable two-factor authentication when available

**Account Access Control**
- Log out when leaving devices unattended
- Use role-appropriate accounts (don't use admin accounts for routine tasks)
- Report lost or stolen devices immediately
- Regularly review account access logs for suspicious activity
- Contact administrators immediately if unauthorized access is suspected

#### Device Security

**Mobile Device Management**
- Keep mobile devices updated with latest OS versions
- Install security patches promptly
- Use device passcodes or biometric locks
- Enable remote wipe capabilities for lost devices
- Install reputable antivirus/anti-malware software

**App Permissions**
- Grant only necessary permissions to ELMS apps
- Regularly review and revoke unnecessary permissions
- Understand why permissions are requested (camera for QR scanning, location for geofencing)
- Be cautious with location and camera permissions

#### Data Protection

**Information Handling**
- Never photograph or share sensitive student information inappropriately
- Use secure channels for transmitting student data
- Follow data retention policies for exam records
- Report data breaches or security incidents immediately
- Maintain confidentiality of examination materials

**Incident Reporting Security**
- Include relevant details without exposing unnecessary sensitive information
- Use appropriate incident severity levels
- Attach supporting evidence securely
- Follow up on reported incidents appropriately

#### Network Security

**Connection Practices**
- Use secure Wi-Fi networks when possible
- Avoid public Wi-Fi for sensitive operations
- Be cautious of network interception risks
- Use VPNs for remote access when required
- Verify SSL/TLS connections (look for padlock icon)

**Data Transmission**
- Ensure encrypted connections for all data transfers
- Avoid transmitting sensitive data over unsecured networks
- Use official app channels for system access
- Verify recipient identities before sharing information

### Performance Tips

#### Mobile App Optimization

**Device Performance**
- Close background apps to free up memory
- Clear app cache regularly (monthly recommended)
- Keep sufficient free storage space (minimum 500MB)
- Restart devices weekly for optimal performance
- Update apps promptly when updates are available

**Battery Management**
- Close unused apps running in background
- Reduce screen brightness during extended use
- Disable unnecessary notifications during exams
- Use battery saver mode when battery is low
- Keep devices charged during long exam sessions

**Network Optimization**
- Use Wi-Fi instead of mobile data when available
- Pre-download necessary data before offline use
- Minimize app switching during active sessions
- Schedule large data operations during off-peak times
- Monitor data usage for cost control

#### Web Dashboard Optimization

**Browser Performance**
- Use modern browsers (Chrome, Firefox, Edge latest versions)
- Clear cache and cookies monthly
- Disable unnecessary browser extensions
- Close unused tabs to free memory
- Use incognito mode for troubleshooting

**Data Management**
- Use appropriate date ranges to limit data loading
- Apply filters before generating large reports
- Export data during off-peak hours
- Regularly archive old data
- Use pagination for large datasets

#### System Efficiency

**Workflow Optimization**
- Pre-configure sessions and templates before exam periods
- Train staff on efficient scanning techniques
- Use batch operations for bulk data management
- Plan transfers during optimal times
- Maintain organized script storage systems

**Maintenance Practices**
- Regularly update software and firmware
- Perform system backups according to schedule
- Monitor system performance metrics
- Clean up temporary files and logs
- Schedule maintenance during off-peak periods

#### Attendance Recording Best Practices

**Session Preparation**
- Test QR scanning functionality before sessions begin
- Ensure adequate lighting for camera operations
- Pre-charge all devices and have backup power
- Prepare backup manual entry procedures
- Verify student roster accuracy

**During Recording**
- Position devices for optimal scanning angles
- Maintain clear communication with students
- Monitor real-time progress and address issues promptly
- Use assistant roles effectively for large venues
- Document any technical issues immediately

**Quality Assurance**
- Verify attendance counts against expected numbers
- Cross-check recordings between multiple devices
- Review and correct any obvious errors promptly
- Maintain detailed records of any overrides
- Generate reports immediately after sessions

#### Transfer and Custody Best Practices

**Transfer Planning**
- Schedule transfers during business hours when possible
- Prepare all documentation in advance
- Coordinate with recipients for optimal timing
- Ensure secure transfer locations
- Have backup plans for transfer failures

**Transfer Execution**
- Perform joint count verifications
- Document script conditions thoroughly
- Use photographic evidence for high-value transfers
- Complete transfers promptly to avoid delays
- Maintain clear communication throughout process

**Custody Maintenance**
- Store scripts in secure, climate-controlled environments
- Maintain clear organization and labeling
- Track custody changes meticulously
- Report any custody issues immediately
- Follow established chain of custody protocols

#### Incident Management Best Practices

**Prevention**
- Maintain regular system monitoring
- Train staff on proper procedures
- Implement quality control checks
- Use preventive maintenance schedules
- Stay updated on security best practices

**Response**
- Report incidents immediately when detected
- Gather all relevant evidence and documentation
- Use appropriate severity classifications
- Maintain clear communication with stakeholders
- Follow established investigation procedures

**Resolution**
- Document all resolution steps thoroughly
- Implement corrective actions promptly
- Update procedures based on lessons learned
- Communicate resolutions to affected parties
- Maintain records for future reference

#### Reporting and Analytics Best Practices

**Data Collection**
- Ensure consistent data entry practices
- Validate data accuracy before submission
- Use standardized formats and procedures
- Maintain data integrity throughout processes
- Implement regular data quality checks

**Report Generation**
- Plan report generation during off-peak hours
- Use appropriate filters to limit data volume
- Schedule regular automated reports
- Archive reports according to retention policies
- Distribute reports through secure channels

**Analytics Usage**
- Establish baseline performance metrics
- Monitor trends and identify anomalies
- Use analytics for process improvement
- Share insights with relevant stakeholders
- Implement data-driven decision making

---

## Glossary

### Security Best Practices

[Tips.]

### Performance Tips

[Tips.]

---

---

## Glossary

This section defines key terms and concepts used throughout the ELMS system.

### A

**Administrator**: User role with full system access for configuration, user management, and system oversight.

**API (Application Programming Interface)**: Set of protocols and tools for building software applications that interact with the ELMS backend.

**Assistant**: Secondary role in attendance sessions that can record attendance alongside the primary lecturer.

**Attendance Rate**: Percentage of expected students who successfully check in for a session.

**Audit Trail**: Complete chronological record of all actions, transfers, and changes within the system for compliance and investigation purposes.

### B

**Batch**: Group of examination scripts identified by a unique QR code that moves through the custody chain together.

**Batch QR Code**: Unique identifier assigned to a group of scripts for tracking purposes.

**Biometric Verification**: Authentication method using fingerprint or facial recognition for secure attendance recording.

### C

**Chain of Custody**: Documented sequence of script transfers from collection through final disposition, ensuring accountability.

**Class Attendance System**: Module for recording attendance in regular lectures and classes using QR codes and mobile apps.

**Custody**: Responsibility for safeguarding examination scripts during transfer and storage.

### D

**Department Head**: User role responsible for departmental oversight and approval workflows.

**Discrepancy**: Difference between expected and actual script counts during transfers, requiring investigation.

### E

**ELMS (Exam Logistics Management System)**: Comprehensive platform for examination script tracking and attendance management.

**Exam Logistics Module**: Core system component for managing script custody chains and transfers.

**Exam Session**: Scheduled examination event with associated attendance tracking and script batch management.

### F

**Faculty Officer**: User role responsible for faculty-level script management and transfers.

**Fingerprint Verification**: Biometric authentication using device fingerprint sensors.

### G

**Geofencing**: GPS-based location validation that restricts attendance marking to specific geographic areas.

### H

**Handler**: Generic term for users responsible for script custody (Invigilators, Lecturers, Faculty Officers, etc.).

### I

**Incident**: Any irregularity or issue occurring during examination processes, requiring documentation and resolution.

**Index Number**: Unique student identifier used for registration and verification.

**Invigilator**: User role responsible for exam supervision, attendance recording, and initial script collection.

**Incident Management**: System for reporting, tracking, and resolving examination-related issues.

### J

**JWT (JSON Web Token)**: Secure authentication method using encrypted tokens for user sessions.

### L

**Lecturer**: User role responsible for course instruction, script grading, and custody transfers.

**Link Generation**: Process of creating secure URLs for student self-service attendance marking.

### M

**Manual Entry**: Alternative attendance recording method using student details instead of QR codes.

**Mobile App**: Native applications for iOS and Android devices used by handlers for field operations.

### O

**Observer**: Read-only role in attendance sessions that can view but not modify attendance records.

**Offline Mode**: System capability to function without internet connectivity, with later synchronization.

### P

**Permission**: Specific access rights granted to user roles for different system functions.

**Progressive Enhancement**: Design approach providing basic functionality that improves with additional capabilities.

### Q

**QR Code**: Two-dimensional barcode containing encoded information for quick scanning and verification.

### R

**Real-time Updates**: Immediate synchronization of data changes across all connected devices and users.

**Role-based Access Control (RBAC)**: Security model restricting system access based on user roles and permissions.

### S

**Script**: Physical examination paper or document being tracked through the custody chain.

**Self-service Attendance**: Student-initiated attendance marking using generated links or QR codes.

**Session**: Defined period for attendance recording, either for exams or regular classes.

**Socket.IO**: Real-time communication protocol enabling live updates between clients and servers.

**Student QR Code**: Unique identifier assigned to each student for attendance verification.

### T

**Template**: Pre-configured session setup that can be reused for similar events.

**Transfer**: Process of moving script custody from one handler to another with verification.

**Transfer Handshake**: Mutual confirmation protocol ensuring both parties agree on transfer completion.

### U

**User Role**: Defined set of permissions and responsibilities assigned to system users.

### V

**Verification Method**: Authentication approach used for attendance recording (QR, Manual, Biometric, Link).

**Venue**: Physical location where examinations or classes are conducted.

### W

**Web Dashboard**: Browser-based administrative interface for system management and reporting.

**WebSocket**: Communication protocol providing full-duplex communication channels over TCP.

---

## Appendix

### Quick Reference: User Roles & Permissions

| Role | Description | Primary Platform | Key Permissions |
|------|-------------|------------------|-----------------|
| **ADMIN** | System administrator with full access | Web Dashboard | User management, system configuration, all reports, incident management, batch tracking |
| **INVIGILATOR** | Exam supervisor and script collector | Mobile App | Exam attendance recording, initial script custody, incident reporting, transfer initiation |
| **LECTURER** | Course instructor and grader | Mobile App | Class attendance, script transfers, grading coordination, course management |
| **FACULTY_OFFICER** | Faculty-level administrator | Mobile App | Faculty script management, departmental transfers, approval workflows |
| **DEPARTMENT_HEAD** | Department overseer | Mobile App | Department approvals, oversight, policy enforcement, reporting |
| **CLASS_REP** | Student representative | Mobile App | Class attendance recording, basic incident reporting, student coordination |

### Detailed Permissions Matrix

| Feature | ADMIN | INVIGILATOR | LECTURER | FACULTY_OFFICER | DEPARTMENT_HEAD | CLASS_REP |
|---------|-------|-------------|----------|-----------------|-----------------|-----------|
| **User Management** | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Student Management** | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Exam Session Creation** | ✅ Full | ❌ | ✅ Limited | ✅ Limited | ✅ Limited | ❌ |
| **Exam Attendance Recording** | ✅ View | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Class Attendance Recording** | ✅ View | ❌ | ✅ Full | ❌ | ❌ | ✅ Limited |
| **Script Custody Transfers** | ✅ View | ✅ Initiate | ✅ Receive | ✅ Full | ✅ Approve | ❌ |
| **Incident Management** | ✅ Full | ✅ Report | ✅ Report | ✅ Investigate | ✅ Approve | ✅ Report |
| **Batch Tracking** | ✅ Full | ✅ View | ✅ View | ✅ View | ✅ View | ❌ |
| **Analytics & Reports** | ✅ Full | ✅ Limited | ✅ Course | ✅ Department | ✅ Department | ❌ |
| **System Configuration** | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ |

### API Endpoints

#### Authentication Endpoints

```
POST /api/auth/login
- User authentication with email/phone and password
- Returns JWT token and user profile

POST /api/auth/logout
- Invalidates current session token

POST /api/auth/refresh
- Refreshes JWT token before expiration

POST /api/auth/forgot-password
- Initiates password reset process

POST /api/auth/reset-password
- Completes password reset with token
```

#### User Management Endpoints

```
GET /api/users
- Retrieves paginated list of users (Admin only)

POST /api/users
- Creates new user account (Admin only)

GET /api/users/:id
- Retrieves specific user details

PUT /api/users/:id
- Updates user information (Admin only)

DELETE /api/users/:id
- Deactivates user account (Admin only)
```

#### Student Management Endpoints

```
GET /api/students
- Retrieves paginated list of students

POST /api/students
- Creates new student record

GET /api/students/:id
- Retrieves specific student details

PUT /api/students/:id
- Updates student information

DELETE /api/students/:id
- Removes student record

POST /api/students/bulk-import
- Imports multiple students via CSV

GET /api/students/:id/qr
- Generates student QR code
```

#### Exam Session Endpoints

```
GET /api/exam-sessions
- Retrieves paginated list of exam sessions

POST /api/exam-sessions
- Creates new exam session

GET /api/exam-sessions/:id
- Retrieves session details and attendance

PUT /api/exam-sessions/:id
- Updates session information

DELETE /api/exam-sessions/:id
- Removes exam session

GET /api/exam-sessions/:id/qr
- Generates batch QR code

POST /api/exam-sessions/:id/archive
- Archives completed session
```

#### Class Attendance Endpoints

```
GET /api/class-attendance/sessions
- Retrieves active attendance sessions

POST /api/class-attendance/sessions
- Creates new attendance session

GET /api/class-attendance/sessions/:id
- Retrieves session details

PUT /api/class-attendance/sessions/:id
- Updates session configuration

DELETE /api/class-attendance/sessions/:id
- Removes attendance session

POST /api/class-attendance/sessions/:id/record
- Records student attendance

POST /api/class-attendance/sessions/:id/links
- Generates self-service attendance links
```

#### Transfer Management Endpoints

```
GET /api/transfers
- Retrieves transfer history

POST /api/transfers
- Initiates new transfer request

GET /api/transfers/:id
- Retrieves transfer details

PUT /api/transfers/:id/confirm
- Confirms transfer receipt

PUT /api/transfers/:id/reject
- Rejects transfer with reason

POST /api/transfers/:id/discrepancy
- Reports count discrepancy
```

#### Incident Management Endpoints

```
GET /api/incidents
- Retrieves paginated incident list

POST /api/incidents
- Creates new incident report

GET /api/incidents/:id
- Retrieves incident details

PUT /api/incidents/:id
- Updates incident information

PUT /api/incidents/:id/status
- Changes incident status

POST /api/incidents/:id/comments
- Adds comment to incident

POST /api/incidents/:id/attachments
- Uploads incident attachments
```

#### Analytics Endpoints

```
GET /api/analytics/overview
- Retrieves system overview statistics

GET /api/analytics/attendance
- Gets attendance analytics by date range

GET /api/analytics/transfers
- Retrieves transfer performance metrics

GET /api/analytics/incidents
- Gets incident statistics and trends

POST /api/analytics/export
- Generates and downloads reports
```

#### Real-time WebSocket Events

```
attendance:recorded
- Fired when attendance is recorded

transfer:initiated
- Fired when transfer is requested

transfer:confirmed
- Fired when transfer is completed

incident:created
- Fired when new incident is reported

session:updated
- Fired when session status changes
```

### Change Log

#### Version 1.0.0 (January 2026)
- **Initial Release**: Complete ELMS system with exam logistics and class attendance modules
- **Core Features**: QR code tracking, real-time monitoring, mobile apps, web dashboard
- **Security**: JWT authentication, role-based access control, audit trails
- **Integration**: Socket.IO real-time updates, PostgreSQL database, comprehensive API

#### Key Features Implemented
- **Student Management**: QR code generation, bulk import, profile management
- **Exam Sessions**: Creation, attendance recording, batch tracking, status management
- **Class Attendance**: Session creation, multiple verification methods, real-time monitoring
- **Transfer System**: Custody chain management, discrepancy detection, confirmation protocols
- **Incident Management**: Reporting, investigation, resolution workflows
- **Analytics**: Comprehensive reporting, performance metrics, export capabilities
- **Mobile Apps**: Native iOS/Android applications with offline support
- **Web Dashboard**: Administrative interface with full system management

#### System Architecture
- **Frontend**: React 18+ with Vite, React Native with Expo
- **Backend**: Node.js 20+ with Express.js and TypeScript
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Real-time**: Socket.IO for live updates
- **Authentication**: JWT with bcrypt password hashing
- **Deployment**: Vercel (web), Render (backend), EAS (mobile), Neon (database)

#### Security Features
- **Authentication**: Secure login with role-based permissions
- **Data Protection**: Encrypted transmission, secure storage
- **Audit Trails**: Complete activity logging for compliance
- **Access Control**: Granular permissions by user role
- **Incident Response**: Structured security incident handling

#### Performance Optimizations
- **Real-time Updates**: Efficient WebSocket communication
- **Offline Support**: Local data storage with sync capabilities
- **Caching**: Optimized data loading and storage
- **Scalability**: Modular architecture for future expansion

---

[End of User Manual]