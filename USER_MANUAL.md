# Exam Script Tracking System - User Manual

**Version:** 1.0.0  
**Last Updated:** December 9, 2025  
**Status:** Production Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Web Dashboard Guide (Admin)](#web-dashboard-guide-admin)
4. [Mobile App Guide (Handlers)](#mobile-app-guide-handlers)
5. [Incident Management](#incident-management)
6. [Workflows & Processes](#workflows--processes)
7. [Class Attendance System](#class-attendance-system)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [Glossary](#glossary)

---

## System Overview

### What is the Exam Script Tracking System?

The Exam Script Tracking System is a comprehensive solution for tracking examination scripts from the moment students submit them until they reach the final destination (e.g., marking center, faculty office). It provides:

- **Real-time tracking** of script custody
- **QR code-based** identification
- **Handshake-based transfer** protocol
- **Complete audit trail** of all movements
- **Analytics and reporting** capabilities
- **Multi-platform access** (Web dashboard + Mobile app)

### Key Features

#### Core Exam Tracking

- ✅ Student attendance tracking (entry, exit, submission)
- ✅ QR code scanning for batches and students
- ✅ Custody chain management
- ✅ Transfer handshake protocol
- ✅ Real-time notifications
- ✅ Analytics dashboard
- ✅ PDF/Excel report exports

#### Class Attendance System

- ✅ Session-based attendance recording
- ✅ Multi-device support
- ✅ Real-time student scanning
- ✅ Recording history and reports
- ✅ Admin oversight

#### Incident Management System

- ✅ Real-time incident reporting and tracking
- ✅ 8 incident types (Academic Dishonesty, Security Breach, etc.)
- ✅ 4 severity levels (Low, Medium, High, Critical)
- ✅ Comment system with internal notes
- ✅ File attachments (photos, documents)
- ✅ GPS location tracking
- ✅ Real-time notifications
- ✅ Admin oversight and status management

### User Roles

| Role                | Access Level | Primary Functions                                   |
| ------------------- | ------------ | --------------------------------------------------- |
| **ADMIN**           | Full access  | User management, system configuration, all features |
| **INVIGILATOR**     | Handler      | Exam supervision, attendance recording, QR scanning |
| **LECTURER**        | Handler      | Transfer management, custody tracking               |
| **FACULTY_OFFICER** | Handler      | Transfer management, custody tracking               |
| **DEPARTMENT_HEAD** | Handler      | Transfer management, custody tracking, approvals    |
| **CLASS_REP**       | Limited      | Class attendance recording only                     |

---

## Getting Started

### System Requirements

#### Web Dashboard

- **Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Internet:** Stable broadband connection
- **Screen:** Minimum 1280x720 resolution (1920x1080 recommended)

#### Mobile App

- **iOS:** iOS 13.0 or later
- **Android:** Android 6.0 (API 23) or later
- **Permissions:** Camera, Storage, Notifications
- **Internet:** Wi-Fi or 4G/5G mobile data

### First-Time Setup

#### 1. Receive Your Credentials

Your system administrator will provide:

- Email address
- Temporary password
- Role assignment
- Access instructions

#### 2. First Login

**Web Dashboard:**

1. Navigate to the dashboard URL (e.g., `https://examtrack.yourdomain.com`)
2. Enter your email and temporary password
3. Click **Login**
4. You'll be prompted to change your password

**Mobile App:**

1. Download the app from TestFlight (iOS) or Play Store (Android)
2. Open the app
3. Enter your email and temporary password
4. Tap **Login**
5. Complete the password change process

#### 3. Change Your Password

**Password Requirements:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&\*)

**Example:** `ExamTrack2025!`

---

## Web Dashboard Guide (Admin)

The web dashboard is the command center for administrators and managers. It provides full visibility and control over the entire system.

### Dashboard Home

Upon login, you'll see the main dashboard with key statistics:

#### Statistics Overview

- **Total Users** - All registered users in the system
- **Active Users** - Users currently logged in or active within 24 hours
- **Inactive Users** - Users who haven't logged in for 30+ days
- **Total Students** - All registered students
- **Total Exam Sessions** - All exam sessions (past and upcoming)
- **Active Sessions** - Currently ongoing exams
- **Completed Sessions** - Finished exams
- **Pending Transfers** - Transfers awaiting confirmation

#### Quick Actions

- View recent activity
- Access pending transfers
- Generate reports
- Navigate to key sections

---

### User Management

**Access:** Admin only  
**Path:** Dashboard → Users

#### View All Users

1. Click **Users** in the sidebar
2. See list of all users with:
   - Name
   - Email
   - Role
   - Department
   - Status (Active/Inactive)
   - Last login

#### Create New User

1. Click **Create User** button
2. Fill in the form:
   - **Email:** Valid email address (must be unique)
   - **Name:** Full name (e.g., "John Doe")
   - **Department:** User's department
   - **Role:** Select from dropdown (ADMIN, INVIGILATOR, etc.)
3. Click **Create User**
4. System generates a random password
5. Share credentials with the new user securely

**Note:** The user will be required to change their password on first login.

#### Edit User

1. Click the **Edit** icon next to a user
2. Modify any field:
   - Name
   - Department
   - Role
3. Click **Save Changes**
4. Changes take effect immediately

#### Deactivate User

1. Click the **Deactivate** icon next to a user
2. Confirm the action
3. User will be logged out and cannot log back in
4. All their sessions are revoked

**To Reactivate:**

1. Click the **Reactivate** icon next to an inactive user
2. User can log in again with their existing password

#### Reset User Password (Admin)

1. Click on a user
2. Click **Reset Password**
3. System generates a new random password
4. Copy and share the password securely
5. User must change it on next login

---

### Student Management

**Access:** Admin only  
**Path:** Dashboard → Students

#### View All Students

1. Click **Students** in the sidebar
2. See list with:
   - Index Number
   - Name
   - Program
   - Level
   - QR Code status

#### Add Single Student

1. Click **Add Student** button
2. Fill in the form:
   - **Index Number:** Unique student ID (e.g., "STU001")
   - **Name:** Full name
   - **Programme:** Study program (e.g., "Computer Science")
   - **Level:** Academic level (e.g., "300")
   - **Contact:** Phone/email (optional)
3. Click **Create Student**
4. System automatically generates QR code

#### Bulk Import Students (CSV)

1. Click **Import Students** button
2. Download the CSV template
3. Fill in student data:
   ```csv
   indexNumber,name,programme,level,contact
   STU001,John Doe,Computer Science,300,john@example.com
   STU002,Jane Smith,Information Technology,300,jane@example.com
   ```
4. Upload the completed CSV file
5. Review the preview
6. Click **Import**
7. System processes all students and generates QR codes

**CSV Rules:**

- Header row is required
- Index numbers must be unique
- Name and programme are required
- Level should be numeric (100, 200, 300, 400)
- Contact is optional

#### View Student Details

1. Click on a student
2. View full profile:
   - Personal information
   - QR code (downloadable)
   - Exam attendance history
   - Submission records

#### Download Student QR Code

1. Click on a student
2. Click **Download QR Code**
3. PNG file downloads to your computer
4. Print or display as needed

---

### Exam Session Management

**Access:** Admin, Department Head  
**Path:** Dashboard → Exam Sessions

#### Create Exam Session

1. Click **Exam Sessions** in sidebar
2. Click **Create Session** button
3. Fill in the exam details:

   **Basic Information:**

   - **Course Code:** e.g., "CS301"
   - **Course Name:** e.g., "Data Structures and Algorithms"
   - **Exam Date:** Select from calendar
   - **Start Time:** e.g., "09:00"
   - **Duration:** In minutes (e.g., "180" for 3 hours)
   - **Venue:** e.g., "Main Hall"

   **Batch Information:**

   - **Batch Number:** Auto-generated or manual (e.g., "BATCH-001-2025")
   - **Department:** e.g., "Computer Science"
   - **Faculty:** e.g., "Engineering"
   - **Academic Year:** e.g., "2024/2025"
   - **Semester:** e.g., "First Semester"

   **Expected Attendance:**

   - **Expected Scripts:** Estimated number of submissions

4. Click **Create Session**
5. System generates unique batch QR code

#### Import Expected Students

After creating a session, you can specify which students are expected to sit the exam:

1. Open the exam session
2. Click **Import Expected Students**
3. Upload CSV with index numbers:
   ```csv
   indexNumber
   STU001
   STU002
   STU003
   ```
4. Click **Import**
5. Students are now associated with this exam

**Benefits:**

- Verify attendance against pre-registered list
- Identify absent students
- Generate attendance reports

#### Download Batch QR Code

1. Open exam session
2. Click **Download QR Code**
3. QR code contains all batch information
4. Print and display at exam venue
5. Invigilators scan this to load the exam session

**QR Code Contents:**

```json
{
  "type": "BATCH",
  "batchId": "cm4s...",
  "batchNumber": "BATCH-001-2025",
  "courseCode": "CS301",
  "courseName": "Data Structures"
}
```

#### View Batch Details

1. Click on an exam session
2. View comprehensive information:
   - Exam details
   - Attendance statistics
   - Expected vs actual students
   - Submission count
   - Transfer history
   - Custody chain

---

### Batch Tracking

**Access:** All users  
**Path:** Dashboard → Batch Tracking

#### Track Batch Status

View all exam batches and their current status:

1. Click **Batch Tracking** in sidebar
2. See batches organized by status:

   **NOT_STARTED** (Gray)

   - Exam not yet begun
   - No attendance recorded

   **IN_PROGRESS** (Blue)

   - Exam currently running
   - Students being tracked

   **SUBMITTED** (Yellow)

   - Exam finished, scripts collected
   - Ready for first transfer

   **IN_TRANSIT** (Orange)

   - Currently being transferred
   - Awaiting handshake confirmation

   **IN_CUSTODY** (Green)

   - Safely in handler's custody
   - Can initiate next transfer

   **VERIFICATION** (Purple)

   - Under review/verification
   - Checking for discrepancies

   **COMPLETED** (Green)

   - Reached final destination
   - No further action needed

   **DISCREPANCY** (Red)

   - Issue detected
   - Requires investigation

#### Filter Batches

Use filters to find specific batches:

- **Status:** Select status from dropdown
- **Date Range:** Filter by exam date
- **Department:** Filter by department
- **Search:** Search by batch number or course code

#### View Custody Chain

1. Click on a batch
2. Scroll to **Custody History**
3. See complete transfer chain:
   - Timestamp
   - From handler
   - To handler
   - Transfer type
   - Status
   - Notes/discrepancies

---

### Analytics Dashboard

**Access:** Admin, Department Head  
**Path:** Dashboard → Analytics

#### Overview Metrics

View system-wide statistics:

**Exam Statistics**

- Total exams conducted
- Average attendance rate
- Average scripts per exam
- Completion rate

**Handler Performance**

- Transfer completion time (average)
- Successful transfers
- Pending transfers
- Discrepancies reported

**Custody Metrics**

- Average custody duration
- Transfer success rate
- Handshake completion rate

#### Interactive Charts

**1. Exam Sessions Over Time (Line Chart)**

- Shows exam volume trends
- Filter by date range
- Identify peak periods

**2. Attendance Rates (Bar Chart)**

- Compare attendance across exams
- Identify low-attendance sessions
- Department breakdown available

**3. Transfer Status Distribution (Pie Chart)**

- Visualize current batch statuses
- At-a-glance system health
- Click to drill down

**4. Handler Performance (Bar Chart)**

- Compare handler efficiency
- Average transfer times
- Success rates

#### Generate Reports

**Custom Date Range Reports:**

1. Select date range
2. Choose report type:
   - Analytics Overview
   - Handler Performance
   - Discrepancy Report
   - Attendance Report
3. Click **Generate Report**
4. Choose format:
   - **PDF** - Professional printable report
   - **Excel** - Data for further analysis

**Report Contents:**

- Executive summary
- Detailed statistics
- Charts and graphs
- Data tables
- Timestamp and audit info

---

### Audit Logs

**Access:** Admin only  
**Path:** Dashboard → Audit Logs

#### View Audit Trail

Complete system activity log:

1. Click **Audit Logs** in sidebar
2. See all actions with:
   - Timestamp
   - User who performed action
   - Action type (LOGIN, CREATE_USER, TRANSFER, etc.)
   - Entity affected (User, Student, Batch, etc.)
   - IP address
   - Details/changes

#### Filter Audit Logs

Narrow down to specific events:

- **Date Range:** Select start and end dates
- **User:** Filter by specific user
- **Action Type:** Select action (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.)
- **Entity:** Filter by entity type (User, Student, Batch, Transfer)
- **Search:** Free text search

#### Export Audit Logs

1. Apply filters (optional)
2. Click **Export**
3. Choose format (CSV/Excel)
4. Download contains all matching records

**Use Cases:**

- Security investigations
- Compliance audits
- Activity monitoring
- Troubleshooting issues

---

### Settings

**Access:** All users  
**Path:** Dashboard → Settings

#### Profile Settings

**View Profile:**

- Name
- Email
- Department
- Role
- Last login
- Account created date

**Change Password:**

1. Click **Change Password** tab
2. Enter current password
3. Enter new password (must meet requirements)
4. Confirm new password
5. Click **Change Password**

#### Notification Preferences

Configure which notifications you receive:

**Available Notifications:**

- Transfer requests
- Transfer confirmations
- Transfer rejections
- Batch status changes
- Discrepancy reports
- System alerts

**Notification Channels:**

- ✉️ Email notifications
- 🔔 In-app notifications
- 📱 Push notifications (if mobile)

**Configuration:**

1. Click **Notifications** tab
2. Toggle each notification type on/off
3. Changes save automatically

#### Active Sessions

View and manage your login sessions:

**Session Information:**

- Device type (Desktop, Mobile)
- Browser/App version
- Last active time
- IP address
- Location (if available)

**Actions:**

- **Revoke Session** - Log out from specific device
- **Logout All Sessions** - Security feature to logout everywhere

**When to Use:**

- Forgot to logout on public computer
- Suspect unauthorized access
- Lost/stolen device

---

### Class Attendance Page

**Access:** Admin only  
**Path:** Dashboard → Class Attendance

The unified admin interface for monitoring class attendance recording sessions and devices.

#### Overview Statistics

At the top of the page, see key metrics:

- **Total Sessions** - All registered attendance devices
- **Active Sessions** - Currently enabled devices
- **Inactive Sessions** - Disabled devices
- **Total Recordings** - All attendance records captured

#### Device Management

View all registered mobile devices used for attendance recording:

**Session Card Information:**

- Device ID (unique identifier)
- Device name (custom label)
- Status (Active/Inactive)
- Total recordings count
- Last used timestamp

**Actions Menu:**

- **Rename Device** - Change the display name
- **Activate** - Enable device for recording
- **Deactivate** - Disable device temporarily

#### View Device Recordings

Click on a session card to expand and see all recordings from that device:

**Recording Table:**

- Course code and name
- Lecturer name
- Recording date and time
- Number of students scanned
- Status (COMPLETED, CANCELLED, ONGOING)
- Actions (View details, Export)

#### Recording Details Modal

Click "View Details" on any recording to see:

**Recording Information:**

- Course details (code, name)
- Lecturer name
- Device information
- Recording period (start to end time)
- Status and notes

**Student List:**

- Index number
- Student name
- Scan timestamp
- Scrollable table for large classes

#### Search and Filter

Use the controls at the top:

- **Search** - Find by device name or recording course
- **Status Filter** - Show only active or inactive devices
- **Refresh** - Reload all data

---

## Mobile App Guide (Handlers)

The mobile app is designed for on-the-ground handlers who manage exam scripts and attendance recording.

### App Navigation

#### Tab Bar (Bottom)

**Home Tab** 🏠

- Dashboard overview
- Recent activity
- Quick actions

**Custody Tab** 📦

- Your current batches
- Transfer management
- Custody history

**Scanner Tab** 📷

- QR code scanner
- Batch loading
- Student scanning

**Profile Tab** 👤

- Your profile
- Settings
- Logout

---

### Login & Authentication

#### First Login

1. Open the app
2. Enter your email and password
3. Tap **Login**
4. If first-time, you'll be prompted to change password

#### Change Password

1. Enter current password
2. Enter new password
3. Confirm new password
4. Tap **Change Password**
5. Use new password on next login

#### Biometric Authentication (Optional)

If your device supports Face ID or Fingerprint:

1. Enable in device settings
2. App will prompt for biometric on subsequent logins
3. Faster and more secure access

---

### QR Code Scanning

#### Scan Batch QR Code

**Purpose:** Load exam session details before recording attendance

**Steps:**

1. Tap **Scanner** tab
2. Camera opens automatically
3. Point camera at batch QR code (printed at exam venue)
4. Camera autofocus and scan
5. Batch loads automatically
6. See batch details: Course code, name, venue, expected students

**What Happens:**

- Batch becomes your active session
- You can now scan student IDs
- Attendance is recorded to this batch

#### Scan Student QR Code

**Purpose:** Record student entry, exit, or submission

**Steps:**

1. Ensure batch is loaded (scan batch QR first)
2. Select mode:
   - **Entry** - Student enters exam hall
   - **Exit** - Student leaves (temporary)
   - **Submission** - Student submits scripts
3. Student shows their QR code
4. Point camera at student QR
5. Scan completes automatically
6. Success message shows student name
7. Repeat for next student

**Entry Mode:**

- Records timestamp of entry
- Verifies student is expected in this exam
- Prevents duplicate entries

**Exit Mode:**

- Records temporary exit
- Useful for bathroom breaks
- Student can re-enter

**Submission Mode:**

- Records final submission
- Increments script count
- Student completes exam attendance

**Auto-Reset:**

- Scanner resets after 2 seconds
- Ready for next student immediately
- No manual intervention needed

---

### Student Attendance Screen

**Access:** After scanning batch QR code  
**Purpose:** Detailed attendance management

#### View Attendance Statistics

**Present Students**

- List of students who entered
- Entry timestamp
- Status (In hall, Exited, Submitted)

**Script Submissions**

- Count of submitted scripts
- Verification against entries
- Discrepancy detection

**Absentees**

- Expected students who didn't attend
- Only visible if expected students were imported

#### End Exam Session

When exam is finished:

1. Open batch details
2. Tap **End Session** button
3. Confirm action
4. Batch status changes to SUBMITTED
5. Initial custody automatically created in your name
6. Ready for first transfer

---

### Custody Management

**Access:** Custody tab

#### View Your Batches

See all batches currently in your custody:

**Card Information:**

- Batch number
- Course code and name
- Script count
- Custody status
- Time in your custody

**Status Indicators:**

- 🟢 **IN_CUSTODY** - You have the scripts
- 🟡 **PENDING_RECEIPT** - Waiting for receiver to confirm
- 🔵 **TRANSFER_INITIATED** - You initiated, awaiting handshake
- ⚪ **TRANSFERRED** - Successfully handed over

#### Initiate Transfer

**Purpose:** Hand over scripts to next handler

**Steps:**

1. Tap on a batch in custody
2. Tap **Initiate Transfer** button
3. Select transfer details:

   **To Handler:**

   - Select from dropdown (list of active handlers)
   - Can filter by role or department

   **Transfer Type:**

   - **TO_MARKING** - To marking center
   - **TO_FACULTY** - To faculty office
   - **TO_DEPARTMENT** - To department office
   - **TO_STORAGE** - To secure storage
   - **TO_EXAM_OFFICE** - To exam office
   - **RETURN** - Returning scripts

   **Notes (Optional):**

   - Add any special instructions
   - Mention discrepancies if any
   - Example: "Missing 2 scripts, reported separately"

4. Tap **Confirm Transfer**
5. Transfer request is sent
6. Status changes to PENDING_RECEIPT

**What Happens Next:**

- Receiver gets notification
- Receiver must confirm or reject
- If confirmed, scripts move to receiver's custody
- If rejected, scripts return to your custody

#### Confirm Transfer Receipt

When someone transfers scripts to you:

**Steps:**

1. You receive notification
2. Go to **Custody** tab
3. See pending transfer (yellow badge)
4. Tap on the transfer
5. Verify script count
6. Two options:

   **Confirm Receipt:**

   - Scripts are correct
   - Tap **Confirm**
   - Custody transfers to you
   - Batch appears in your custody list

   **Reject Transfer:**

   - Scripts count mismatch
   - Issues detected
   - Tap **Reject**
   - Add reason for rejection
   - Scripts return to sender
   - Issue is logged for investigation

**Handshake Protocol:**

- Both parties must agree
- Ensures accountability
- Creates audit trail
- Prevents lost scripts

---

### Transfer History

**Access:** Custody tab → Select batch → View History

#### View Custody Chain

See complete journey of a batch:

**Timeline View:**

- Chronological order (newest first)
- Each transfer shows:
  - From handler (name, role)
  - To handler (name, role)
  - Transfer type
  - Timestamp
  - Status (Confirmed, Rejected, Pending)
  - Notes

**Example Timeline:**

```
1. John Doe (INVIGILATOR) → Created initial custody
   • 2025-12-09 09:00 AM
   • Status: SUBMITTED

2. John Doe → Jane Smith (LECTURER)
   • 2025-12-09 11:30 AM
   • Type: TO_MARKING
   • Status: CONFIRMED
   • Note: "All scripts present"

3. Jane Smith → Bob Johnson (DEPARTMENT_HEAD)
   • 2025-12-09 02:15 PM
   • Type: TO_DEPARTMENT
   • Status: CONFIRMED

4. Bob Johnson → Alice Wong (FACULTY_OFFICER)
   • 2025-12-09 04:00 PM
   • Type: TO_FACULTY
   • Status: PENDING
```

---

### Push Notifications

The mobile app sends real-time notifications for important events.

#### Notification Types

**Transfer Requests**

- Someone wants to transfer scripts to you
- Includes batch info and script count
- Tap to open confirm screen

**Transfer Confirmations**

- Your transfer was confirmed
- Scripts successfully handed over
- Custody updated

**Transfer Rejections**

- Your transfer was rejected
- Includes reason
- Scripts remain in your custody

**Batch Updates**

- Status changes
- Discrepancies detected
- System alerts

#### Notification Actions

**When notification arrives:**

1. Banner appears at top of screen
2. Notification sound/vibration
3. Two options:
   - **Dismiss** - Mark as read, take no action
   - **Tap** - Open relevant screen immediately

**Notification History:**

- Not currently stored in app
- All events logged in audit trail (web dashboard)

#### Manage Permissions

**iOS:**

1. Settings → ExamTrack → Notifications
2. Toggle Allow Notifications
3. Choose style (Banners, Alerts)

**Android:**

1. Settings → Apps → ExamTrack → Notifications
2. Toggle Show notifications
3. Choose importance

---

## Workflows & Processes

### Complete Exam Workflow

#### Phase 1: Exam Setup (Admin)

**Timeline:** 1-2 weeks before exam

1. **Create Exam Session**

   - Enter course details
   - Set date, time, venue
   - Generate batch QR code

2. **Import Expected Students**

   - Upload CSV of registered students
   - System validates data
   - Students associated with exam

3. **Prepare Materials**

   - Print batch QR code (large poster)
   - Display at exam venue entrance
   - Print student QR codes (if needed)

4. **Assign Invigilators**
   - Ensure invigilators have app access
   - Brief them on scanning process
   - Test QR codes before exam day

#### Phase 2: Exam Day (Invigilator)

**Timeline:** Exam duration (2-3 hours typical)

1. **Setup (30 mins before exam)**

   - Open mobile app
   - Scan batch QR code at venue
   - Verify exam details loaded
   - Switch scanner to ENTRY mode

2. **Student Entry**

   - Students arrive at venue
   - Scan each student's QR code
   - Verify identity visually
   - Check entry timestamp recorded
   - Duplicate entries blocked automatically

3. **During Exam**

   - Monitor for exits (bathroom breaks)
   - Switch to EXIT mode if student leaves
   - Log re-entry when student returns
   - Track time outside exam hall

4. **Script Submission**

   - Switch scanner to SUBMISSION mode
   - Student submits script to supervisor
   - Scan student QR code
   - Count physical scripts
   - Verify count matches scans

5. **End Session**
   - All submissions recorded
   - Count total scripts
   - Tap **End Session** in app
   - Batch status → SUBMITTED
   - Initial custody created automatically

#### Phase 3: First Transfer (Invigilator → Lecturer)

**Timeline:** Within 2 hours of exam end

1. **Prepare Scripts**

   - Bundle all scripts securely
   - Attach batch cover sheet
   - Include batch number prominently

2. **Initiate Transfer (Invigilator)**

   - Open batch in Custody tab
   - Tap **Initiate Transfer**
   - Select receiving lecturer
   - Transfer type: TO_MARKING
   - Add note: Script count
   - Tap **Confirm Transfer**

3. **Handover Meeting**

   - Physical meeting between handlers
   - Hand over script bundle
   - Verify script count together
   - Note any discrepancies

4. **Confirm Receipt (Lecturer)**

   - Lecturer receives notification
   - Opens app → Custody tab
   - Sees pending transfer
   - Counts scripts
   - If correct: Tap **Confirm**
   - If incorrect: Tap **Reject** + reason

5. **Custody Transfer Complete**
   - Batch moves to lecturer's custody
   - Invigilator no longer has custody
   - Audit trail updated
   - Notifications sent to both parties

#### Phase 4: Subsequent Transfers

**Timeline:** As needed (within 24 hours recommended)

Repeat transfer process:

- Lecturer → Department Head
- Department Head → Faculty Officer
- Faculty Officer → Final destination

Each transfer follows same handshake protocol.

#### Phase 5: Marking & Return

**Timeline:** Varies by institution

1. **During Marking**

   - Scripts remain in custody of marking team
   - Status: IN_CUSTODY
   - No transfers during marking period

2. **After Marking**

   - Return to exam office
   - Final transfer: TO_EXAM_OFFICE
   - Batch status → COMPLETED
   - Custody chain complete

3. **Storage/Archival**
   - Long-term storage
   - Status: COMPLETED
   - Available for review/appeals

#### Phase 6: Reporting & Analytics

**Timeline:** After exam completion

1. **Generate Reports**

   - Attendance report (who attended)
   - Discrepancy report (missing scripts)
   - Custody timeline report
   - Handler performance metrics

2. **Review & Analysis**
   - Identify bottlenecks
   - Check transfer times
   - Verify all scripts accounted for
   - Note improvements for next exam

---

### Transfer Discrepancy Handling

#### When Script Counts Don't Match

**Scenario:** Receiver counts fewer scripts than sender claimed

**Steps:**

1. **Receiver Rejects Transfer**

   - Don't confirm receipt
   - Tap **Reject Transfer**
   - Select reason: "Script count mismatch"
   - Add note: "Expected 45, received 43"

2. **Sender Gets Notification**

   - Transfer rejected
   - Scripts remain in sender's custody
   - Review rejection reason

3. **Investigation**

   - Both parties communicate directly
   - Recount scripts together
   - Check for:
     - Miscounting error
     - Scripts left at venue
     - Scripts in wrong batch
     - Genuinely missing scripts

4. **Resolution Options**

   **If Miscounting:**

   - Recount confirms correct number
   - Retry transfer with correct count
   - Add note explaining resolution

   **If Scripts Missing:**

   - Report to admin immediately
   - Admin updates batch status to DISCREPANCY
   - Investigation launched
   - Incident logged in audit trail
   - Batch locked from further transfers until resolved

5. **Admin Actions**
   - Review custody history
   - Check attendance records
   - Interview handlers
   - Determine cause:
     - Student didn't submit (check EXIT without SUBMISSION)
     - Script lost during transfer
     - Script in wrong batch
   - Document findings
   - Update batch notes
   - Resolve discrepancy status
   - Allow transfers to resume if scripts found

#### When Student Claims Script Was Submitted

**Scenario:** Student says they submitted but script is missing

**Steps:**

1. **Check Attendance Records**

   - Web dashboard → Batch Details
   - View attendance table
   - Look for student's index number
   - Check timestamps:
     - ENTRY time
     - EXIT time (if any)
     - SUBMISSION time

2. **Possible Situations**

   **A. No Submission Record:**

   - Student did NOT scan QR on submission
   - Explains missing script
   - Resolution: Student must resit exam (per policy)

   **B. Submission Recorded:**

   - Student scanned QR
   - Script should be in batch
   - Recount all scripts carefully
   - Check if script misfiled

   **C. Exit Without Return:**

   - Student scanned EXIT
   - No re-ENTRY or SUBMISSION
   - Student left and didn't return
   - Resolution: Per institution policy

3. **Documentation**

   - Take statement from student
   - Note invigilator who was on duty
   - Check camera footage if available
   - Document in batch notes

4. **Final Decision**
   - Admin makes ruling based on evidence
   - Audit trail provides proof
   - Consistent application of policy

---

## Class Attendance System

The Class Attendance System is a separate feature for recording lecture attendance using mobile devices.

### System Overview

**Purpose:** Enable lecturers/class reps to record class attendance by scanning student QR codes during lectures.

**Key Features:**

- Session-based recording (one device = one session)
- Multi-device support (share credentials across tablets/phones)
- Real-time student scanning with live count
- Recording history and reports
- Admin oversight via web dashboard

**Who Uses It:**

- **CLASS_REP role** - Records attendance during lectures
- **ADMIN role** - Monitors sessions and views reports

---

### Mobile App: Recording Attendance

#### Initial Setup

1. **Login with CLASS_REP credentials**

   - Email: `attendance@examtrack.com` (example)
   - Password: Provided by admin
   - All devices share same credentials

2. **First Launch**
   - App auto-navigates to **Attendance** tab
   - Device ID auto-generated
   - Give device a name:
     - Example: "Lecture Hall A - iPad"
     - Example: "Main Building - Tab 1"
   - Tap **Save Device Name**

#### Attendance Dashboard

**Three Tabs:**

**1. Record Tab**

- Start new recording
- Fill in optional details
- Launch scanner

**2. Active Tab**

- See ongoing recordings
- Resume if interrupted
- Live student count

**3. History Tab**

- Past recordings
- Tap to view details
- See student lists

#### Start Recording Attendance

**Steps:**

1. **Open Attendance Tab → Record**

2. **Fill in Details (Optional):**

   - **Lecturer Name:** e.g., "Dr. Jane Doe"
   - **Course Code:** e.g., "CS301"
   - **Course Name:** e.g., "Data Structures"
   - **Notes:** e.g., "Morning lecture"

3. **Tap "Start Recording"**
   - Camera opens
   - Scanner ready
   - Details saved to recording

#### Scan Students

**During Lecture:**

1. **Students Show QR Codes**

   - Each student has unique QR code
   - Can be on phone or printed card

2. **Scan Each Student**

   - Point camera at QR code
   - Auto-scan when focused
   - Success toast shows student name
   - Student count increments
   - Last scanned student displayed

3. **Real-time Updates**

   - Socket connection updates count live
   - Multiple devices can scan same recording
   - No duplicate scans allowed

4. **Scanner Auto-Reset**
   - After 2 seconds, ready for next scan
   - No manual reset needed

#### End Recording

**After Lecture:**

1. **Tap "End Recording" Button**
2. **Confirm in Dialog**
3. **Recording Saved**
   - Status: COMPLETED
   - Final student count
   - Timestamp recorded
4. **Return to Dashboard**
5. **Recording appears in History tab**

#### View Recording History

**Access:** Attendance Tab → History

**See All Recordings:**

- Course code and name
- Lecturer name
- Recording date
- Number of students
- Status

**Tap to View Details:**

- Recording metadata
- Full student list
- Scan timestamps
- Export option (future)

---

### Web Dashboard: Admin Oversight

**Access:** Dashboard → Class Attendance (Admin only)

#### Monitor All Devices

**Overview Cards:**

- Total registered devices
- Active devices
- Inactive devices
- Total recordings captured

**Device List:**

- Device ID
- Custom device name
- Status (Active/Inactive)
- Number of recordings
- Last used date

#### Manage Devices

**Rename Device:**

1. Click dropdown on device card
2. Select "Rename"
3. Enter new name
4. Save

**Activate/Deactivate:**

1. Click dropdown
2. Select "Activate" or "Deactivate"
3. Disabled devices cannot record

#### View Device Recordings

**Expand Device Card:**

- Click on device card to expand
- See table of all recordings
- Columns:
  - Course code and name
  - Lecturer
  - Date and time
  - Students scanned
  - Status

**View Recording Details:**

1. Click "View Details" on recording
2. Modal opens with:
   - Recording information
   - Device details
   - Full student list (scrollable)
   - Individual scan timestamps

#### Search and Filter

- **Search:** Device name or course code
- **Status Filter:** Active or Inactive devices
- **Refresh:** Reload all data

---

### Use Cases

#### Use Case 1: Regular Lecture Attendance

**Setup:**

- Class rep has tablet assigned to class
- Device named "CS301 - Hall A"
- Device kept in secure location

**Process:**

1. Before lecture, class rep retrieves device
2. Opens app (already logged in)
3. Taps "Start Recording"
4. Enters lecturer and course details
5. Starts recording

6. During lecture:

   - Students enter and show QR codes
   - Class rep scans each student
   - Live count visible on screen

7. After lecture:

   - Tap "End Recording"
   - Confirm
   - Return device to storage

8. Admin reviews:
   - Web dashboard shows recording
   - Can see who attended
   - Can export for grading

#### Use Case 2: Multiple Lecture Halls

**Setup:**

- University has 5 lecture halls
- Each hall has dedicated tablet
- All tablets use same CLASS_REP login
- Each tablet named by location

**Benefit:**

- Simultaneous attendance recording
- All recordings saved to same account
- Admin sees all recordings in one place
- No confusion about which device is which

#### Use Case 3: Emergency Substitute

**Setup:**

- Regular tablet unavailable (broken/missing)
- Lecturer needs to take attendance urgently

**Process:**

1. Borrow any mobile phone
2. Install ExamTrack app
3. Login with CLASS_REP credentials
4. Device auto-registers with new ID
5. Give device temporary name: "Emergency - Phone"
6. Proceed with recording normally

**Cleanup:**

1. Admin sees new device in web dashboard
2. Can rename or deactivate after use
3. Prevents clutter from temporary devices

---

## Troubleshooting

### Common Issues

#### "Cannot connect to server"

**Possible Causes:**

- No internet connection
- Server maintenance
- Firewall blocking

**Solutions:**

1. Check internet connection (Wi-Fi/mobile data)
2. Try switching networks
3. Check server status with admin
4. Wait 5 minutes and retry

#### "Invalid credentials"

**Possible Causes:**

- Wrong email or password
- Account deactivated
- Caps Lock enabled
- Password recently changed

**Solutions:**

1. Verify email address (check for typos)
2. Check Caps Lock
3. Try "Forgot Password" flow
4. Contact admin to verify account status

#### "Camera not working"

**Possible Causes:**

- Permissions not granted
- Camera used by another app
- Hardware issue

**Solutions:**

**iOS:**

1. Settings → Privacy → Camera
2. Find ExamTrack
3. Enable camera access
4. Restart app

**Android:**

1. Settings → Apps → ExamTrack → Permissions
2. Enable Camera permission
3. Restart app

**If still not working:**

- Close other apps using camera
- Restart device
- Update app to latest version

#### "QR code not scanning"

**Possible Causes:**

- QR code damaged/printed poorly
- Insufficient lighting
- Camera not focused
- Wrong QR code type

**Solutions:**

1. Ensure good lighting
2. Hold device steady (autofocus needs time)
3. Move closer or farther
4. Clean camera lens
5. Verify it's the correct QR code (batch or student)
6. Regenerate QR code if damaged

#### "Student already scanned"

**Meaning:** Duplicate scan detected

**System Behavior:**

- Prevents duplicate entries
- Shows error message
- Does not increment count

**If Legitimate:**

- Student scanned earlier
- Check attendance list to confirm
- No action needed (system working correctly)

**If Error:**

- Rare case of QR code collision
- Report to admin
- Admin can manually adjust records

#### "Transfer stuck in Pending"

**Possible Causes:**

- Receiver hasn't opened app
- Receiver not aware of transfer
- Notification not received

**Solutions:**

1. Contact receiver directly (call/SMS)
2. Ask them to open app and check Custody tab
3. Receiver should see yellow badge on pending transfer
4. If urgent, have admin intervene

**Admin Action:**

- View transfer in web dashboard
- Contact both parties
- Manually resolve if needed (rare)

#### "Sync failed / Data not updated"

**Possible Causes:**

- Network interruption
- Server timeout
- Cache issue

**Solutions:**

1. Pull down to refresh (mobile)
2. Click refresh button (web)
3. Logout and login again
4. Clear app cache:

   **iOS:**

   - Uninstall and reinstall app

   **Android:**

   - Settings → Apps → ExamTrack → Storage → Clear Cache

5. If persists, contact support

---

## Best Practices

### For Administrators

#### User Management

- Create users well in advance of their first duty
- Use descriptive names and departments
- Regularly review inactive users
- Deactivate users who leave institution promptly
- Use strong random passwords for new users

#### Student Data

- Import students early in semester
- Verify data accuracy before exams
- Keep student records up to date
- Regularly backup student database
- Print QR codes on durable materials

#### Exam Sessions

- Create sessions at least 1 week before exam
- Import expected students to enable verification
- Print batch QR codes large and clear (A4 size minimum)
- Laminate QR codes for durability
- Keep digital copies of all QR codes

#### Monitoring

- Check dashboard daily during exam periods
- Review pending transfers regularly
- Investigate discrepancies immediately
- Generate reports weekly for audits
- Keep audit logs for at least 1 year

### For Handlers (Invigilators, Lecturers, Officers)

#### Before Exam

- Charge mobile device fully
- Update app to latest version
- Test camera and scanner
- Ensure good lighting at exam venue
- Have backup device ready

#### During Exam

- Scan batch QR code as first action
- Verify exam details before accepting students
- Ensure each student scans only once
- Count scripts manually as backup
- Note any discrepancies immediately

#### Transfers

- Initiate transfers promptly (within 2 hours)
- Count scripts before initiating
- Meet receiver in person for handover
- Verify count together before confirming
- Add notes to explain anything unusual

#### Security

- Never share login credentials
- Logout when leaving device unattended
- Report lost devices immediately
- Don't screenshot sensitive data
- Keep batch QR codes secure

### For Class Reps

#### Device Management

- Keep device charged and updated
- Store device securely when not in use
- Report any damage or malfunction immediately
- Don't use device for personal activities

#### Recording Attendance

- Arrive early to set up
- Fill in all details completely
- Scan systematically (row by row)
- Double-check final count
- End recording promptly after lecture

---

## Glossary

**Batch** - A group of examination scripts from one exam session, identified by a unique batch number and QR code.

**Batch QR Code** - A QR code containing exam session information, scanned by invigilators to load the exam context.

**Class Attendance** - A separate system for recording lecture attendance using QR code scanning.

**Custody** - The state of being responsible for physical possession of examination scripts.

**Custody Chain** - The complete history of handlers who have possessed a batch, with timestamps.

**Discrepancy** - A mismatch between expected and actual script counts, or any other anomaly requiring investigation.

**Exam Session** - A scheduled examination event, including course details, date, time, venue, and expected students.

**Handler** - A user with a role that involves physical handling of examination scripts (Invigilator, Lecturer, Faculty Officer, Department Head).

**Handshake Protocol** - The two-step transfer process requiring both sender and receiver to confirm before custody changes.

**Expected Students** - A pre-registered list of students who are supposed to sit a particular exam.

**Index Number** - A unique identifier for each student (e.g., "STU001").

**Invigilator** - A staff member who supervises examinations, records attendance, and creates initial custody.

**QR Code** - Quick Response code, a 2D barcode used to encode student IDs and batch information.

**Script** - An examination answer booklet submitted by a student.

**Session** - In the context of class attendance, a registered device used for recording lecture attendance.

**Status** - The current state of a batch (NOT_STARTED, IN_PROGRESS, SUBMITTED, IN_TRANSIT, IN_CUSTODY, VERIFICATION, COMPLETED, DISCREPANCY).

**Student QR Code** - A QR code unique to each student, containing their index number and personal information.

**Transfer** - The process of handing over custody of scripts from one handler to another.

**Transfer Type** - The purpose/destination of a transfer (TO_MARKING, TO_FACULTY, TO_DEPARTMENT, TO_STORAGE, TO_EXAM_OFFICE, RETURN).

---

## Appendix

### Quick Reference: Batch Status Flow

```
NOT_STARTED (Gray)
    ↓ (Invigilator starts recording attendance)
IN_PROGRESS (Blue)
    ↓ (Invigilator ends session)
SUBMITTED (Yellow)
    ↓ (Invigilator initiates transfer)
IN_TRANSIT (Orange)
    ↓ (Receiver confirms)
IN_CUSTODY (Green)
    ↓ (Handler initiates transfer OR flags issue)
    ├─→ VERIFICATION (Purple) [If issues detected]
    └─→ IN_TRANSIT (Orange) [Continue transfers]
         ↓ (Final destination reached)
COMPLETED (Green)

[If issues at any point]
→ DISCREPANCY (Red)
   ↓ (Admin investigates and resolves)
→ Return to previous status
```

### Quick Reference: User Roles & Permissions

| Feature              | ADMIN | INVIGILATOR | LECTURER | FACULTY_OFFICER | DEPT_HEAD | CLASS_REP |
| -------------------- | ----- | ----------- | -------- | --------------- | --------- | --------- |
| Create Users         | ✅    | ❌          | ❌       | ❌              | ❌        | ❌        |
| Manage Students      | ✅    | ❌          | ❌       | ❌              | ❌        | ❌        |
| Create Exam Sessions | ✅    | ❌          | ❌       | ❌              | ✅        | ❌        |
| Record Attendance    | ✅    | ✅          | ❌       | ❌              | ❌        | ❌        |
| Scan QR Codes        | ✅    | ✅          | ✅       | ✅              | ✅        | ❌        |
| Initiate Transfers   | ✅    | ✅          | ✅       | ✅              | ✅        | ❌        |
| Confirm Transfers    | ✅    | ✅          | ✅       | ✅              | ✅        | ❌        |
| View Analytics       | ✅    | ❌          | ❌       | ❌              | ✅        | ❌        |
| Generate Reports     | ✅    | ❌          | ❌       | ❌              | ✅        | ❌        |
| View Audit Logs      | ✅    | ❌          | ❌       | ❌              | ❌        | ❌        |
| Class Attendance     | ✅    | ❌          | ❌       | ❌              | ❌        | ✅        |

### Support Contacts

**Technical Support**

- Email: support@examtrack.yourorg.edu
- Phone: +1-234-567-8900
- Hours: Monday-Friday, 8 AM - 5 PM

**After-Hours Emergency**

- Phone: +1-234-567-8911
- Only for critical issues during exams

**Admin Contact**

- Email: admin@examtrack.yourorg.edu
- For account issues, access problems

**Training & Onboarding**

- Email: training@examtrack.yourorg.edu
- Schedule group training sessions

---

**Document Version:** 1.0.0  
**Last Updated:** December 9, 2025  
**Prepared by:** ExamTrack Development Team  
**For:** All System Users

_This manual is subject to updates. Check for the latest version regularly._
