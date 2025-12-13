# Incident Management System - Implementation Document

**Project:** ExamScriptTracking  
**Feature:** Incident Management System  
**Date:** December 13, 2025  
**Status:** In Progress

---

## Executive Summary

An integrated incident reporting and management system for handling exam-related issues including malpractice, health emergencies, script damage, equipment failures, and disruptions. This system enables handlers to report incidents with multimedia evidence (photos/videos), track resolution workflows, assign investigators, export reports, and maintain comprehensive audit trails.

---

## Design Decisions

### 1. File Storage Strategy: Local Filesystem ✅

- **Decision:** Store attachments (photos/videos) in local filesystem at `backend/uploads/incidents/`
- **Rationale:**
  - Supports large video files (profile pictures use base64, unsuitable for videos)
  - No cloud infrastructure costs
  - Simple implementation, no API keys needed
  - Organized directory structure: `uploads/incidents/{incidentId}/`
- **Implementation:** Multer middleware with file type validation, max 10MB per file, max 5 files per incident
- **File Types:** Images (jpg, png), Videos (mp4, mov), Documents (pdf)

### 2. Automation Flow: Simple Auto-Creation ✅

- **Auto-incident triggers:**
  1. **Attendance Discrepancy:** Entry recorded but no submission after exam ends → Auto-create LOW severity incident
  2. **Transfer Count Mismatch:** Scripts received ≠ scripts expected → Auto-create MEDIUM severity incident
- **Automation rules:**
  - Auto-created incidents flagged with `autoCreated: true`
  - Status starts as REPORTED, requires manual review
  - Linked to source entity (attendanceId or transferId)
  - Notification sent to ADMIN and DEPARTMENT_HEAD roles
- **Future:** SLA tracking, auto-escalation after 24h

### 3. Student Privacy & Confidentiality ✅

- **Confidential Flag:** `isConfidential: boolean` field on Incident model
- **Access Rules:**
  - **Confidential incidents:** Only reporter, assignee, and admin roles can view
  - **Public incidents:** All handlers can view based on department/faculty
  - **Auto-confidential:** MALPRACTICE type defaults to confidential
- **Export Redaction:** Confidential incidents show "[REDACTED]" for student details in non-admin exports
- **Audit Trail:** All access to confidential incidents logged

### 4. Integration with Existing Flows ✅

- **Attendance Integration:**
  - Add "Report Incident" button in attendance tracking screen
  - Auto-populate examSessionId, studentId from context
  - Suggest incident type based on discrepancy
- **Transfer Integration:**
  - Add "Report Discrepancy as Incident" in transfer confirmation flow
  - Link incident to transferId for custody chain reference
  - Show related incidents in batch details view
- **Cross-references:**
  - Incidents linked to Student (optional)
  - Incidents linked to ExamSession (required)
  - Incidents linked to BatchTransfer (optional)
  - Incidents linked to ExamAttendance (optional)

### 5. Mobile Offline Support ✅

- **Queue System:**
  - Failed incident submissions stored in AsyncStorage queue
  - Retry on network reconnection
  - Media files stored as base64 in queue, uploaded when online
- **Sync Strategy:**
  - Background sync every 30 seconds when online
  - Manual "Sync Now" button in UI
  - Sync status indicator (pending uploads count)
- **Conflict Resolution:**
  - Timestamp-based merge
  - User notified of sync failures
- **Implementation:** `utils/offlineQueue.ts` with event listeners

---

## Database Schema

### New Models

```prisma
// Incident Types
enum IncidentType {
  MALPRACTICE           // Cheating, unauthorized materials
  HEALTH_ISSUE          // Medical emergency, student unwell
  SCRIPT_DAMAGE         // Water damage, torn papers
  EQUIPMENT_FAILURE     // Scanner issues, printer problems
  DISRUPTION            // Fire alarm, power outage
  SECURITY_BREACH       // Unauthorized access
  PROCEDURAL_VIOLATION  // Protocol not followed
  OTHER                 // Miscellaneous
}

enum IncidentSeverity {
  LOW       // Minor issue, no immediate action needed
  MEDIUM    // Requires attention within 24h
  HIGH      // Urgent, requires immediate attention
  CRITICAL  // Emergency, escalate immediately
}

enum IncidentStatus {
  REPORTED              // Initial state, awaiting review
  UNDER_INVESTIGATION   // Assigned and being investigated
  RESOLVED              // Investigation complete, action taken
  CLOSED                // No further action needed
  ESCALATED             // Sent to higher authority
}

// Main Incident Model
model Incident {
  id                String            @id @default(uuid())
  incidentNumber    String            @unique // Auto-generated: INC-YYYYMMDD-XXXX

  // Classification
  type              IncidentType
  severity          IncidentSeverity
  status            IncidentStatus    @default(REPORTED)
  isConfidential    Boolean           @default(false)
  autoCreated       Boolean           @default(false)

  // Description
  title             String            // Brief summary
  description       String            @db.Text // Detailed description
  location          String?           // Venue/room where incident occurred

  // Relationships
  reporterId        String            // User who reported
  assigneeId        String?           // User assigned to investigate
  studentId         String?           // Involved student (optional)
  examSessionId     String?           // Related exam session (optional)
  attendanceId      String?           // Related attendance record (optional)
  transferId        String?           // Related batch transfer (optional)

  // Metadata
  incidentDate      DateTime          // When incident occurred
  reportedAt        DateTime          @default(now())
  assignedAt        DateTime?
  resolvedAt        DateTime?
  closedAt          DateTime?

  // Additional data
  metadata          Json?             // Flexible field for extra context
  resolutionNotes   String?           @db.Text

  // Relations
  reporter          User              @relation("IncidentReporter", fields: [reporterId], references: [id], onDelete: Restrict)
  assignee          User?             @relation("IncidentAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  student           Student?          @relation(fields: [studentId], references: [id], onDelete: SetNull)
  examSession       ExamSession?      @relation(fields: [examSessionId], references: [id], onDelete: SetNull)
  attendance        ExamAttendance?   @relation(fields: [attendanceId], references: [id], onDelete: SetNull)
  transfer          BatchTransfer?    @relation(fields: [transferId], references: [id], onDelete: SetNull)

  attachments       IncidentAttachment[]
  comments          IncidentComment[]
  statusHistory     IncidentStatusHistory[]

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([reporterId])
  @@index([assigneeId])
  @@index([studentId])
  @@index([examSessionId])
  @@index([status])
  @@index([severity])
  @@index([type])
  @@index([incidentDate])
  @@index([isConfidential])
}

// Incident Attachments (Photos, Videos, Documents)
model IncidentAttachment {
  id           String   @id @default(uuid())
  incidentId   String

  fileName     String   // Original filename
  filePath     String   // Relative path: uploads/incidents/{incidentId}/{filename}
  fileType     String   // MIME type: image/jpeg, video/mp4, application/pdf
  fileSize     Int      // Size in bytes

  uploadedBy   String   // User who uploaded
  uploadedAt   DateTime @default(now())

  incident     Incident @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  uploader     User     @relation(fields: [uploadedBy], references: [id], onDelete: Restrict)

  @@index([incidentId])
}

// Comments/Notes Thread
model IncidentComment {
  id          String   @id @default(uuid())
  incidentId  String
  userId      String

  comment     String   @db.Text
  isInternal  Boolean  @default(false) // Internal notes vs public comments

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  incident    Incident @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([incidentId])
  @@index([userId])
}

// Status Change History (Audit Trail)
model IncidentStatusHistory {
  id          String         @id @default(uuid())
  incidentId  String

  fromStatus  IncidentStatus?
  toStatus    IncidentStatus
  changedBy   String
  reason      String?        @db.Text

  changedAt   DateTime       @default(now())

  incident    Incident       @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  user        User           @relation(fields: [changedBy], references: [id], onDelete: Restrict)

  @@index([incidentId])
  @@index([changedAt])
}
```

### Model Updates (Add Relations)

```prisma
model User {
  // ... existing fields

  // Incident relations
  reportedIncidents      Incident[]              @relation("IncidentReporter")
  assignedIncidents      Incident[]              @relation("IncidentAssignee")
  incidentComments       IncidentComment[]
  incidentStatusChanges  IncidentStatusHistory[]
  incidentAttachments    IncidentAttachment[]
}

model Student {
  // ... existing fields

  incidents Incident[]
}

model ExamSession {
  // ... existing fields

  incidents Incident[]
}

model ExamAttendance {
  // ... existing fields

  incidents Incident[]
}

model BatchTransfer {
  // ... existing fields

  incidents Incident[]
}
```

---

## Backend Implementation

### File Structure

```
backend/
├── uploads/
│   └── incidents/          # NEW: Local file storage
│       └── {incidentId}/   # One folder per incident
├── src/
│   ├── controllers/
│   │   └── incidentController.ts  # NEW
│   ├── services/
│   │   ├── exportService.ts       # EXTEND: Add incident exports
│   │   └── incidentService.ts     # NEW: Business logic
│   ├── routes/
│   │   └── incident.ts            # NEW
│   ├── socket/
│   │   └── handlers/
│   │       └── incidentEvents.ts  # NEW
│   ├── middleware/
│   │   └── upload.ts              # NEW: Multer config
│   └── utils/
│       └── incidentNumberGenerator.ts  # NEW
```

### API Endpoints

#### Incident CRUD

```
POST   /api/incidents                    # Create incident (with file upload)
GET    /api/incidents                    # List incidents (filtered by role/confidentiality)
GET    /api/incidents/:id                # Get incident details
PATCH  /api/incidents/:id                # Update incident
DELETE /api/incidents/:id                # Delete incident (ADMIN only)
PATCH  /api/incidents/:id/status         # Update status
PATCH  /api/incidents/:id/assign         # Assign to user
```

#### Comments

```
POST   /api/incidents/:id/comments       # Add comment
GET    /api/incidents/:id/comments       # Get comments
PATCH  /api/incidents/:id/comments/:commentId  # Update comment
DELETE /api/incidents/:id/comments/:commentId  # Delete comment
```

#### Attachments

```
POST   /api/incidents/:id/attachments    # Upload additional files
GET    /api/incidents/:id/attachments/:attachmentId  # Download file
DELETE /api/incidents/:id/attachments/:attachmentId  # Delete attachment
```

#### Reports & Exports

```
GET    /api/reports/export/incident/:id                    # PDF: Single incident report
GET    /api/reports/export/incidents-summary               # Excel: Incidents summary
  ?startDate=YYYY-MM-DD
  &endDate=YYYY-MM-DD
  &type=MALPRACTICE
  &severity=HIGH
  &status=REPORTED
```

#### Statistics

```
GET    /api/incidents/statistics         # Dashboard stats
  ?startDate&endDate&type&severity
```

---

## Frontend Implementation

### Web Dashboard

#### File Structure

```
web/
├── src/
│   ├── pages/
│   │   ├── IncidentsPage.tsx           # NEW: Main incidents list
│   │   ├── IncidentDetailsPage.tsx     # NEW: Single incident view
│   │   └── CreateIncidentPage.tsx      # NEW: Report incident form
│   ├── components/
│   │   ├── IncidentCard.tsx            # NEW: Incident summary card
│   │   ├── IncidentFilters.tsx         # NEW: Filter sidebar
│   │   ├── IncidentTimeline.tsx        # NEW: Status history timeline
│   │   ├── IncidentComments.tsx        # NEW: Comments thread
│   │   ├── FileUploader.tsx            # NEW: Multi-file drag-drop
│   │   └── ConfidentialBadge.tsx       # NEW: Confidential indicator
│   ├── api/
│   │   └── incidents.ts                # NEW: API client
│   └── types/
│       └── incident.ts                 # NEW: TypeScript types
```

#### Routes (Add to App.tsx)

```tsx
// Protected routes - All authenticated users
<Route path="/dashboard/incidents" element={<IncidentsPage />} />
<Route path="/dashboard/incidents/:id" element={<IncidentDetailsPage />} />
<Route path="/dashboard/incidents/create" element={<CreateIncidentPage />} />

// Admin-only routes
<Route element={<ProtectedRoute allowedRoles={[Role.ADMIN]} />}>
  <Route path="/dashboard/incidents/analytics" element={<IncidentAnalyticsPage />} />
</Route>
```

#### Sidebar Navigation (Update Sidebar.tsx)

```tsx
{
  title: "Incidents",
  icon: AlertTriangle,
  href: "/dashboard/incidents",
  roles: ["ADMIN", "INVIGILATOR", "LECTURER", "DEPARTMENT_HEAD", "FACULTY_OFFICER"]
}
```

### Mobile App

#### File Structure

```
mobile/
├── app/
│   ├── (tabs)/
│   │   └── incidents.tsx              # NEW: Incidents tab
│   ├── report-incident.tsx            # NEW: Create incident screen
│   ├── incident-details.tsx           # NEW: View/update incident
│   └── incident-comments.tsx          # NEW: Comments screen
├── api/
│   └── incidents.ts                   # NEW: API client
├── components/
│   ├── IncidentCard.tsx               # NEW: List item
│   ├── MediaPicker.tsx                # NEW: Photo/video picker
│   └── IncidentStatusBadge.tsx        # NEW: Status indicator
└── utils/
    └── offlineQueue.ts                # NEW: Offline sync
```

#### Tab Navigation (Update (tabs)/\_layout.tsx)

```tsx
<Tabs.Screen
  name="incidents"
  options={{
    title: "Incidents",
    tabBarIcon: ({ color }) => <AlertTriangle size={24} color={color} />,
  }}
/>
```

---

## Real-Time Events (Socket.io)

### Event Types

```typescript
enum IncidentSocketEvents {
  INCIDENT_CREATED = "incident:created",
  INCIDENT_UPDATED = "incident:updated",
  INCIDENT_ASSIGNED = "incident:assigned",
  INCIDENT_STATUS_CHANGED = "incident:status_changed",
  INCIDENT_COMMENT_ADDED = "incident:comment_added",
  INCIDENT_ESCALATED = "incident:escalated",
  INCIDENT_RESOLVED = "incident:resolved",
}
```

### Emission Rules

- **INCIDENT_CREATED:** → Assignee (if assigned), ADMIN, DEPARTMENT_HEAD roles
- **INCIDENT_ASSIGNED:** → New assignee, reporter
- **INCIDENT_STATUS_CHANGED:** → Assignee, reporter, ADMIN
- **INCIDENT_COMMENT_ADDED:** → Assignee, reporter (if not commenter)
- **INCIDENT_ESCALATED:** → DEPARTMENT_HEAD, FACULTY_OFFICER, ADMIN

---

## Integration Points

### 1. Attendance Discrepancy Auto-Creation

**Location:** `backend/src/controllers/attendanceController.ts`

**Trigger:** When exam ends and student has `entryTime` but no `submissionTime`

```typescript
// After exam session ends (status = SUBMITTED)
const discrepancies = await prisma.examAttendance.findMany({
  where: {
    examSessionId,
    entryTime: { not: null },
    submissionTime: null,
  },
});

for (const attendance of discrepancies) {
  await incidentService.autoCreateIncident({
    type: "PROCEDURAL_VIOLATION",
    severity: "LOW",
    title: `Student left without submitting - ${attendance.student.indexNumber}`,
    description: `Student entered exam at ${attendance.entryTime} but did not submit script.`,
    examSessionId,
    studentId: attendance.studentId,
    attendanceId: attendance.id,
    reporterId: req.user.userId, // System or exam creator
    autoCreated: true,
  });
}
```

### 2. Transfer Count Mismatch Auto-Creation

**Location:** `backend/src/controllers/batchTransferController.ts`

**Trigger:** When `scriptsReceived !== scriptsExpected` during transfer confirmation

```typescript
// In confirmTransfer function
if (scriptsReceived !== scriptsExpected) {
  await incidentService.autoCreateIncident({
    type: "PROCEDURAL_VIOLATION",
    severity: scriptsReceived < scriptsExpected ? "HIGH" : "MEDIUM",
    title: `Transfer count mismatch - Batch ${examSession.batchQrCode}`,
    description: `Expected ${scriptsExpected} scripts, received ${scriptsReceived}. Difference: ${Math.abs(
      scriptsExpected - scriptsReceived
    )}`,
    examSessionId: transfer.examSessionId,
    transferId: transfer.id,
    reporterId: req.user.userId,
    autoCreated: true,
  });
}
```

### 3. Attendance Screen Integration (Mobile)

**Location:** `mobile/app/student-attendance.tsx`

**Add "Report Incident" button:**

```tsx
<Button
  onPress={() =>
    router.push({
      pathname: "/report-incident",
      params: {
        examSessionId: session.id,
        studentId: lastScannedStudent?.id,
        source: "attendance",
      },
    })
  }
>
  <AlertTriangle /> Report Incident
</Button>
```

### 4. Batch Details Integration (Web)

**Location:** `web/src/pages/BatchDetailsPage.tsx`

**Add "Related Incidents" section:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Related Incidents</CardTitle>
  </CardHeader>
  <CardContent>
    {incidents.map((incident) => (
      <IncidentCard key={incident.id} incident={incident} />
    ))}
    <Button
      onClick={() =>
        navigate(`/dashboard/incidents/create?examSessionId=${session.id}`)
      }
    >
      Report New Incident
    </Button>
  </CardContent>
</Card>
```

---

## Export Reports

### 1. Incident Report PDF

**Template:**

```
┌─────────────────────────────────────────────────────┐
│         INCIDENT REPORT - [CONFIDENTIAL]            │
│                                                      │
│  Incident Number: INC-20251213-0001                 │
│  Type: MALPRACTICE                                  │
│  Severity: HIGH                                     │
│  Status: UNDER_INVESTIGATION                        │
│                                                      │
│  Reported By: John Doe (INVIGILATOR)                │
│  Reported On: 2025-12-13 10:30 AM                   │
│  Assigned To: Jane Smith (DEPARTMENT_HEAD)          │
│                                                      │
├─────────────────────────────────────────────────────┤
│  INCIDENT DETAILS                                   │
├─────────────────────────────────────────────────────┤
│  Title: Student found with unauthorized materials   │
│                                                      │
│  Description:                                       │
│  During exam CS101 on 2025-12-13, student          │
│  [REDACTED] was found with notes hidden in pencil   │
│  case. Materials confiscated.                       │
│                                                      │
│  Location: Main Hall, Desk 42                       │
│  Incident Date: 2025-12-13 09:45 AM                 │
│                                                      │
├─────────────────────────────────────────────────────┤
│  RELATED ENTITIES                                   │
├─────────────────────────────────────────────────────┤
│  Student: [REDACTED] (if confidential)              │
│  Exam Session: CS101 - Introduction to Computing    │
│  Batch: BATCH-20251213-CS101                        │
│                                                      │
├─────────────────────────────────────────────────────┤
│  ATTACHMENTS                                        │
├─────────────────────────────────────────────────────┤
│  1. evidence_photo_1.jpg (245 KB)                   │
│  2. confiscated_notes.jpg (189 KB)                  │
│                                                      │
├─────────────────────────────────────────────────────┤
│  TIMELINE                                           │
├─────────────────────────────────────────────────────┤
│  2025-12-13 10:30  REPORTED      by John Doe        │
│  2025-12-13 11:00  ASSIGNED      to Jane Smith      │
│  2025-12-13 11:05  INVESTIGATING by Jane Smith      │
│                                                      │
├─────────────────────────────────────────────────────┤
│  COMMENTS (3)                                       │
├─────────────────────────────────────────────────────┤
│  [2025-12-13 11:10] Jane Smith:                     │
│  Initiated investigation, contacted student.        │
│                                                      │
│  [2025-12-13 14:30] John Doe:                       │
│  Student admits to violation, materials match.      │
│                                                      │
│  [2025-12-13 16:00] Jane Smith (INTERNAL):          │
│  Recommending disciplinary action.                  │
│                                                      │
├─────────────────────────────────────────────────────┤
│  RESOLUTION                                         │
├─────────────────────────────────────────────────────┤
│  Status: RESOLVED                                   │
│  Resolved On: 2025-12-13 17:00                      │
│                                                      │
│  Resolution Notes:                                  │
│  Student violation confirmed. Case forwarded to     │
│  disciplinary committee. Script marked for review.  │
│                                                      │
└─────────────────────────────────────────────────────┘

Generated on: 2025-12-13 18:00
Generated by: Exam Script Tracking System
```

### 2. Incidents Summary Excel

**Sheets:**

1. **Summary:** Total counts by type/severity/status, trends
2. **All Incidents:** Detailed list with filters
3. **By Type:** Breakdown by incident type
4. **By Department:** Departmental statistics
5. **Resolution Times:** Avg time to resolve by severity

---

## Security & Privacy

### Access Control Matrix

| Role            | Create | View Own | View All  | View Confidential | Assign | Update Status | Export | Delete |
| --------------- | ------ | -------- | --------- | ----------------- | ------ | ------------- | ------ | ------ |
| ADMIN           | ✅     | ✅       | ✅        | ✅                | ✅     | ✅            | ✅     | ✅     |
| DEPARTMENT_HEAD | ✅     | ✅       | ✅ (Dept) | ✅                | ✅     | ✅            | ✅     | ❌     |
| FACULTY_OFFICER | ✅     | ✅       | ✅ (Fac)  | ✅                | ✅     | ✅            | ✅     | ❌     |
| LECTURER        | ✅     | ✅       | ❌        | ❌                | ❌     | ❌            | ❌     | ❌     |
| INVIGILATOR     | ✅     | ✅       | ❌        | ❌                | ❌     | ❌            | ❌     | ❌     |

### Confidentiality Rules

1. MALPRACTICE incidents auto-marked as confidential
2. Reporter can toggle confidentiality when creating
3. Confidential incidents hidden from non-authorized users in lists
4. API returns 403 Forbidden for unauthorized confidential access
5. Exports redact student info for non-admin roles
6. Audit log tracks all confidential incident access

---

## Offline Support (Mobile)

### Queue Structure

```typescript
interface QueuedIncident {
  id: string; // Temp UUID
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  examSessionId?: string;
  studentId?: string;
  attachments: Array<{
    uri: string; // Local file URI
    base64?: string; // Base64 for small files
    fileName: string;
    fileType: string;
    fileSize: number;
  }>;
  metadata?: any;
  timestamp: number;
  retryCount: number;
  status: "pending" | "uploading" | "failed";
}
```

### Sync Flow

1. **Create Incident Offline:**

   - Save to AsyncStorage queue
   - Show toast: "Incident saved. Will upload when online."
   - Display "Pending Upload" badge

2. **Network Available:**

   - Background service checks queue every 30s
   - Upload queued incidents sequentially
   - On success: Remove from queue, show notification
   - On failure: Increment retry count, show error after 3 attempts

3. **Manual Sync:**

   - Pull-to-refresh on incidents list
   - "Sync Now" button in header
   - Shows progress indicator

4. **Conflict Handling:**
   - Check if incident already exists by temp ID
   - If duplicate, merge comments/attachments
   - Notify user of sync completion

---

## Testing Checklist

### Backend

- [ ] Incident CRUD operations
- [ ] File upload (images, videos, PDFs)
- [ ] File size validation (max 10MB)
- [ ] File type validation
- [ ] Auto-incident creation from attendance discrepancy
- [ ] Auto-incident creation from transfer mismatch
- [ ] Confidential access control
- [ ] Role-based visibility filtering
- [ ] PDF export generation
- [ ] Excel export generation
- [ ] Socket event emissions
- [ ] Audit logging for all actions

### Web Dashboard

- [ ] Incident list with filters (type, severity, status, date)
- [ ] Create incident form with file upload
- [ ] Incident details view
- [ ] Comments thread (add, edit, delete)
- [ ] Status update workflow
- [ ] Assignment to users
- [ ] Export button (PDF/Excel)
- [ ] Confidential badge display
- [ ] Real-time notifications
- [ ] Responsive design

### Mobile App

- [ ] Incidents list (own + assigned)
- [ ] Report incident form
- [ ] Camera integration for photos
- [ ] Video picker integration
- [ ] Offline queue functionality
- [ ] Sync status indicator
- [ ] Manual sync button
- [ ] Push notifications
- [ ] QR code linking (student/batch)
- [ ] Comment thread

---

## Implementation Phases

### Phase 1: Database & Backend Core (Steps 1-2)

**Estimated Time:** 6-8 hours

- [ ] Create Prisma schema
- [ ] Run migration
- [ ] Create incident controller
- [ ] Create incident service
- [ ] Setup multer middleware
- [ ] Implement CRUD endpoints
- [ ] Add file upload/download
- [ ] Implement access control

### Phase 2: Auto-Integration & Reports (Step 3)

**Estimated Time:** 4-6 hours

- [ ] Auto-incident from attendance
- [ ] Auto-incident from transfer
- [ ] Incident PDF export
- [ ] Incident Excel export
- [ ] Statistics endpoint

### Phase 3: Real-Time & Notifications (Step 4)

**Estimated Time:** 2-3 hours

- [ ] Socket event handlers
- [ ] Event emissions in controllers
- [ ] Web notification center integration
- [ ] Mobile push notification integration

### Phase 4: Web Dashboard UI (Step 5)

**Estimated Time:** 8-10 hours

- [ ] Incidents page with filters
- [ ] Create incident modal
- [ ] Incident details page
- [ ] Comments component
- [ ] File uploader component
- [ ] Timeline component
- [ ] Export buttons
- [ ] Integration with batch/attendance pages

### Phase 5: Mobile App UI (Step 6)

**Estimated Time:** 8-10 hours

- [ ] Incidents tab screen
- [ ] Report incident screen
- [ ] Incident details screen
- [ ] Comments screen
- [ ] Media picker component
- [ ] Offline queue implementation
- [ ] Sync indicator
- [ ] Integration with attendance/custody screens

### Phase 6: Testing & Polish (Step 7)

**Estimated Time:** 4-6 hours

- [ ] Unit tests for incident service
- [ ] Integration tests for API endpoints
- [ ] E2E tests for workflows
- [ ] Performance testing (file uploads)
- [ ] Security audit (confidential access)
- [ ] UX polish (loading states, error handling)
- [ ] Documentation

**Total Estimated Time:** 32-43 hours

---

## Success Metrics

1. **Adoption:** 80% of handlers report at least one incident within first month
2. **Response Time:** Average time from REPORTED to ASSIGNED < 2 hours
3. **Resolution Time:** Average time from ASSIGNED to RESOLVED < 24 hours for HIGH severity
4. **System Reliability:** 99% uptime, offline queue success rate > 95%
5. **User Satisfaction:** Average rating > 4/5 for incident reporting UX

---

## Future Enhancements (Post-MVP)

1. **Advanced Automation:**

   - SLA tracking with auto-escalation
   - Scheduled reminders for unresolved incidents
   - ML-based incident type prediction

2. **Enhanced Reporting:**

   - Custom report templates
   - Scheduled automated reports (weekly summaries)
   - Data visualization dashboard

3. **Integrations:**

   - Email notifications with SMTP
   - SMS alerts for CRITICAL incidents
   - Integration with external case management systems

4. **Mobile Features:**

   - Voice notes recording
   - Sketch/annotation tools for photos
   - Geolocation tagging

5. **Analytics:**
   - Incident trends analysis
   - Handler performance metrics
   - Predictive analytics for high-risk exams

---

**Document Version:** 1.0  
**Last Updated:** December 13, 2025  
**Status:** Ready for Implementation ✅
