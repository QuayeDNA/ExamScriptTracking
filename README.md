# Exam Logistics System (ELMS) - Project Specification

## Executive Summary

A comprehensive QR code-based solution to eliminate exam script loss and fraudulent claims by creating an auditable chain of custody from student submission through grading. The system addresses two critical problems:

1. Genuine script loss during the transfer process
2. Fraudulent claims from students who never wrote exams but manipulated attendance records

---

## Table of Contents

- [System Overview](#system-overview)
- [Detailed Workflow](#detailed-workflow)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Key Features by Platform](#key-features-by-platform)
- [Additional Features](#additional-features--refinements)
- [Implementation Phases](#implementation-phases)
- [Potential Challenges](#potential-challenges--solutions)
- [Success Metrics](#success-metrics)
- [Cost Estimate](#cost-estimate-initial-development)

---

## System Overview

### Core Concept

A dual QR code system tracking both **students** (via ID cards) and **script batches** (groups of scripts per course) through a complete custody chain with cryptographic handshakes between handlers.

### Key Innovation

The "handshake system" creates an unbreakable chain of custody where each transfer requires mutual confirmation, making it impossible for scripts to "disappear" without identifying the responsible party.

---

## Detailed Workflow

### Phase 1: Pre-Exam Setup

1. **Admin** creates exam session in web dashboard:

   - Course code, name, date/time
   - Assigned lecturer
   - Venue
   - Expected student list (optional for verification)

2. **System generates** unique batch QR code containing:
   - Batch ID (UUID)
   - Course code & name
   - Lecturer name & ID
   - Department & Faculty
   - Exam date & venue
   - Timestamp created

### Phase 2: During Exam (Invigilator Actions)

#### Step 1: Session Initialization

- Invigilator scans batch QR code on mobile app
- System creates active exam session
- Status: "In Progress"

#### Step 2: Student Entry

- Student scans their ID QR code (contains: name, index number, program, level)
- System records:
  - Entry timestamp
  - Associates student with active batch
  - Marks attendance as "Present"

#### Step 3: Student Exit & Submission

- Student scans ID QR again when submitting script
- System records:
  - Exit timestamp
  - Submission status: "Submitted"
  - Updates batch script count

#### Step 4: Session Closure

- Invigilator closes exam session
- System generates batch manifest:
  - Total scripts expected vs submitted
  - List of all students (entry/exit times)
  - Discrepancy report (students who entered but didn't submit)
  - Status changes to "Submitted - Awaiting Transfer"

### Phase 3: Script Transfer (Handshake System)

#### Initiating Transfer:

1. Current handler (e.g., invigilator) scans batch QR
2. Selects "Transfer Batch" and chooses receiving handler from list
3. System generates transfer request with:
   - Current handler info
   - Receiving handler info
   - Batch details & manifest
   - Timestamp

#### Completing Transfer:

4. Receiving handler receives push notification
5. Physically receives batch and scans QR code
6. Reviews manifest (can view all student data)
7. Confirms receipt in app
8. System records:
   - Transfer timestamp
   - Both handlers' digital signatures
   - Updates custody status

**Security Feature:** Transfer only completes when both parties confirm. If receiving handler reports discrepancy (e.g., manifest says 50 scripts, only 49 present), system flags batch and notifies admin.

### Phase 4: Grading & Closure

1. Lecturer receives batch, confirms custody
2. Marks batch status as "Under Grading"
3. After grading, marks as "Graded - Ready for Return"
4. Final transfer back through chain (optional, based on institution policy)

---

## System Architecture

### Technology Stack

#### Web Application (Admin Dashboard)

- **Framework:** React 18+ with Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand or TanStack Query (React Query) for server state
- **Real-time:** Socket.io client
- **Data Visualization:** Recharts for analytics/reports
- **Tables:** TanStack Table for complex data views
- **Forms:** React Hook Form + Zod validation
- **Routing:** React Router v6
- **HTTP Client:** Axios

#### Mobile Application (Handler App)

- **Framework:** React Native with Expo (for easier deployment)
- **Styling:** NativeWind (Tailwind for React Native)
- **Camera/QR:** expo-camera or react-native-vision-camera + vision-camera-qr-scanner
- **State Management:** Zustand
- **Real-time:** Socket.io client
- **Navigation:** React Navigation
- **Offline Support:** WatermelonDB or Realm for local database sync
- **Push Notifications:** Expo Notifications or Firebase Cloud Messaging

#### Backend (API & Real-time Server)

- **Runtime:** Node.js 20+ LTS
- **Framework:** Express.js
- **Real-time:** Socket.io server
- **ORM:** Prisma
- **Database:** PostgreSQL 15+
- **Authentication:** JSON Web Tokens (JWT) + bcrypt
- **Validation:** Zod (shared with frontend)
- **QR Generation:** qrcode library
- **File Storage:** AWS S3 or local storage with multer (for reports)
- **Logging:** Winston or Pino
- **API Documentation:** Swagger/OpenAPI

#### DevOps & Deployment

- **Web Hosting:** Vercel, Netlify, or AWS Amplify
- **Mobile:** Expo EAS Build for iOS/Android deployment
- **Backend:** Railway, Render, AWS EC2, or DigitalOcean
- **Database:** Supabase, Neon, or self-hosted PostgreSQL
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry for error tracking

---

## Database Schema

### Prisma Models

```prisma
// Users & Roles
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role
  firstName String
  lastName  String
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  handledBatches BatchTransfer[] @relation("Handler")
  receivedBatches BatchTransfer[] @relation("Receiver")
  createdExams   ExamSession[]
}

enum Role {
  ADMIN
  INVIGILATOR
  DEPARTMENT_HEAD
  FACULTY_OFFICER
  LECTURER
}

// Students
model Student {
  id          String   @id @default(uuid())
  indexNumber String   @unique
  firstName   String
  lastName    String
  program     String
  level       Int
  qrCode      String   @unique
  createdAt   DateTime @default(now())

  attendances ExamAttendance[]
}

// Exam Sessions
model ExamSession {
  id           String   @id @default(uuid())
  batchQrCode  String   @unique
  courseCode   String
  courseName   String
  lecturerId   String
  lecturerName String
  department   String
  faculty      String
  venue        String
  examDate     DateTime
  status       BatchStatus @default(IN_PROGRESS)
  createdById  String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  createdBy   User @relation(fields: [createdById], references: [id])
  attendances ExamAttendance[]
  transfers   BatchTransfer[]
}

enum BatchStatus {
  IN_PROGRESS
  SUBMITTED
  IN_TRANSIT
  WITH_LECTURER
  UNDER_GRADING
  GRADED
  RETURNED
  COMPLETED
}

// Student Attendance & Submission
model ExamAttendance {
  id              String    @id @default(uuid())
  studentId       String
  examSessionId   String
  entryTime       DateTime
  exitTime        DateTime?
  submissionTime  DateTime?
  status          AttendanceStatus @default(PRESENT)
  discrepancyNote String?

  student      Student      @relation(fields: [studentId], references: [id])
  examSession  ExamSession  @relation(fields: [examSessionId], references: [id])

  @@unique([studentId, examSessionId])
}

enum AttendanceStatus {
  PRESENT
  SUBMITTED
  LEFT_WITHOUT_SUBMITTING
  ABSENT
}

// Script Transfer Chain
model BatchTransfer {
  id              String   @id @default(uuid())
  examSessionId   String
  fromHandlerId   String
  toHandlerId     String
  requestedAt     DateTime @default(now())
  confirmedAt     DateTime?
  status          TransferStatus @default(PENDING)
  scriptsExpected Int
  scriptsReceived Int?
  discrepancyNote String?
  location        String?

  examSession ExamSession @relation(fields: [examSessionId], references: [id])
  fromHandler User        @relation("Handler", fields: [fromHandlerId], references: [id])
  toHandler   User        @relation("Receiver", fields: [toHandlerId], references: [id])

  @@index([examSessionId])
}

enum TransferStatus {
  PENDING
  CONFIRMED
  DISCREPANCY_REPORTED
  RESOLVED
}

// Audit Trail
model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String
  entity    String
  entityId  String
  details   Json?
  ipAddress String?
  timestamp DateTime @default(now())

  @@index([entityId])
  @@index([timestamp])
}
```

---

## Key Features by Platform

### Web Dashboard (Admin)

#### User Management

- Create/edit handlers with role assignment
- Deactivate users
- View handler activity logs

#### Exam Management

- Create exam sessions
- Generate batch QR codes (downloadable as PDF)
- Pre-register expected students for verification

#### Batch Tracking

- Real-time dashboard showing all active batches
- Filter by status, date, department, faculty
- View complete custody chain for any batch
- Timeline visualization of batch movement

#### Reports & Analytics

- Discrepancy reports (missing scripts, entry-only students)
- Handler performance metrics
- Exam completion rates
- Export to PDF/Excel

#### Alerts & Notifications

- Batches stuck in transit >24 hours
- Discrepancy reports requiring attention
- Failed transfer attempts

### Mobile App (Handler)

#### Session Management

- Scan batch QR to start/resume session
- View session details and manifest

#### Student Scanning

- Entry scan (shows student photo if available)
- Exit/submission scan
- Visual/audio confirmation feedback
- Offline mode with sync when connection restored

#### Batch Transfer

- Initiate transfer with handler selection
- Receive transfer requests with push notification
- Confirm receipt after physical verification
- Report discrepancies with photo evidence

#### Batch Tracking

- View all batches in current custody
- Historical transfers made/received
- Search by course code or batch ID

#### Offline Capability

- Queue scans and transfers when offline
- Auto-sync when connection restored
- Local storage of critical data

---

## Additional Features & Refinements

### Security Enhancements

1. **Two-Factor Authentication** for admin and sensitive operations
2. **Digital Signatures:** Each transfer creates a cryptographic hash of batch state
3. **QR Code Encryption:** Student and batch QR codes contain encrypted data with expiry
4. **Role-based Access Control:** Strict permissions per user role
5. **Audit Trail:** Every action logged with timestamp and user

### Data Integrity

1. **Blockchain-inspired Chain:** Each transfer references previous transfer hash (optional but impressive)
2. **Immutable Records:** Historical data cannot be edited, only appended with explanatory notes
3. **Discrepancy Protocol:**
   - Immediate flag when script count mismatch
   - Admin notification
   - Investigation mode locks batch
   - Resolution requires admin approval

### User Experience

1. **Progressive Web App (PWA):** Web dashboard works offline with service workers
2. **Dark Mode:** Both web and mobile
3. **Multi-language Support:** For international institutions (i18n)
4. **Accessibility:** WCAG 2.1 AA compliance
5. **Batch Search:** Quick search by any parameter (course, student index, date)

### Notifications

- **Push Notifications:** Transfer requests, discrepancies, batch approaching deadline
- **Email Notifications:** Daily digest for admins, critical alerts
- **SMS (Optional):** For high-priority alerts

### Reporting

#### Automated Reports:

- Daily exam completion summary
- Weekly discrepancy report
- Monthly handler performance

#### Custom Reports:

- Date range selection
- Filter by department/faculty/course
- Export formats: PDF, Excel, CSV

#### Analytics Dashboard:

- Average exam processing time
- Most common transfer points
- Peak exam periods
- Discrepancy trends

---

## Implementation Phases

### Phase 1: MVP (8-10 weeks)

- Core authentication & user management
- Basic exam session creation
- Student entry/exit scanning
- Simple batch transfer (no handshake)
- Admin dashboard with batch list
- Basic reporting

### Phase 2: Enhanced Transfer System (4-6 weeks)

- Handshake transfer system
- Transfer notifications
- Discrepancy reporting
- Chain of custody visualization
- Offline mode for mobile

### Phase 3: Advanced Features (4-6 weeks)

- Analytics dashboard
- Advanced reporting
- Automated alerts
- Role-based workflows
- QR code encryption

### Phase 4: Polish & Scale (2-4 weeks)

- Performance optimization
- Load testing
- Security audit
- User training materials
- Deployment & monitoring

---

## Potential Challenges & Solutions

| Challenge                              | Solution                                                        |
| -------------------------------------- | --------------------------------------------------------------- |
| **Network unreliability during exams** | Offline-first mobile app with queue-based sync                  |
| **QR code damage on scripts**          | Batch-level tracking + manual fallback with photo evidence      |
| **Handler resistance to new system**   | Intuitive UX + training + show time savings                     |
| **Concurrent transfers of same batch** | Optimistic locking in database + real-time conflict resolution  |
| **Scale for large institutions**       | Database indexing, caching layer (Redis), pagination            |
| **Printer availability for QR codes**  | Bulk QR generation, reusable batch containers with permanent QR |

---

## Success Metrics

- **Script loss rate:** Target <0.1%
- **Fraudulent claims:** Target reduction >95%
- **Average custody time:** Track and reduce by 30%
- **Handler adoption:** Target >90% active use within 3 months
- **System uptime:** Target 99.5%

---

## Cost Estimate (Initial Development)

- **Developer time:** ~6-8 months (1 full-stack developer)
- **Infrastructure:** ~$50-100/month (hosting, database, storage)
- **QR printing:** One-time cost for student ID cards + reusable batch containers
- **Maintenance:** ~20-40 hours/month

---

## Getting Started

### Prerequisites

- Node.js 20+ LTS
- PostgreSQL 15+
- npm or yarn
- Expo CLI (for mobile development)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd exam-script-tracking

# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev

# Start backend server
npm run dev

# Install web dashboard dependencies
cd ../web
npm install
npm run dev

# Install mobile app dependencies
cd ../mobile
npm install
npx expo start
```

### Environment Variables

```env
# Backend (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/exam_tracking"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"

# AWS S3 (optional)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="exam-tracking-reports"

# Socket.io
SOCKET_PORT=3001

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-password"
```

---

## API Documentation

Once the backend is running, access Swagger documentation at:

```
http://localhost:3000/api-docs
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Testing

```bash
# Backend tests
cd backend
npm run test

# Web tests
cd web
npm run test

# Mobile tests
cd mobile
npm run test
```

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For issues and questions:

- Create an issue on GitHub
- Email: support@examtracking.com
- Documentation: https://docs.examtracking.com

---

## Acknowledgments

- Institution stakeholders for requirements gathering
- Testing team for pilot program feedback
- Development team for implementation

---

## Web Accessibility

### Mobile App on Web

The React Native mobile app is fully accessible via web browsers using Expo's React Native Web integration. Users can access mobile functionality without downloading the app:

- **Access URL:** `/mobile/index.html` (when deployed with web app)
- **Login Page:** Green smartphone button on login page
- **Features Available:**
  - QR code scanning (camera access required)
  - Class attendance recording
  - Incident reporting
  - Batch custody transfers
  - Real-time notifications

### Building for Web

#### Automated Build (Recommended)

```bash
# Build both web and mobile web apps
./build-all.sh

# Or build mobile web only
./build-mobile-web.sh
```

#### Manual Build

```bash
# Build web app
cd web && npm run build

# Build mobile web app
cd mobile
npx expo export --platform web --output-dir ../web/public/mobile

# Fix asset paths for subdirectory serving
powershell -Command "(Get-Content ../web/public/mobile/index.html) -replace './_expo/', '/mobile/_expo/' -replace './favicon.ico', '/mobile/favicon.ico' | Set-Content ../web/public/mobile/index.html"
```

### Pre-push Automation

A git pre-push hook automatically builds all platforms before pushing:

```bash
# The hook runs automatically on 'git push'
# Builds: web app + mobile web app
# Aborts push if builds fail
```

### Deployment

The mobile web app is automatically included when deploying the main web application to Vercel, Render, or other hosting platforms.

---

## Next Steps

1. Validate with key stakeholders (registrar, exams office, lecturers)
2. Pilot with 1-2 courses in a semester
3. Iterate based on feedback
4. Scale institution-wide

---

**Version:** 1.0.0  
**Last Updated:** December 2, 2025  
**Status:** Planning Phase
