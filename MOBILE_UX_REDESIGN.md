# Mobile App UX Redesign - Scanner Flow

## New User Flow

### Scanner Screen (Always Visible)

```
┌─────────────────────────────┐
│  QR Scanner (Camera View)   │
│                             │
│  [Scanning Area]            │
│                             │
└─────────────────────────────┘
       ↓ Scan Batch QR
┌─────────────────────────────┐
│  Scanner stays open         │
│  + Bottom Drawer appears    │
└─────────────────────────────┘
```

### Bottom Drawer Content

```
┌─────────────────────────────┐
│ ┄┄┄┄┄┄┄┄ [Drag Handle] ┄┄┄┄┄┄│
│                             │
│ 📚 DAT101 - Data Analysis   │
│ Batch: BATCH-DAT101-...     │
│ 📍 Oduro Block (SF1)        │
│                             │
│ ✅ 5/20 Students Present    │
│ ├─ Status: In Progress      │
│ └─ [Update Status ▼]        │
│                             │
│ Recent Attendees:           │
│ ┌─────────────────────────┐ │
│ │ John Doe - 2024001      │ │
│ │ ⏰ Entry: 09:05 AM      │ │
│ │ Status: PRESENT         │ │
│ ├─────────────────────────┤ │
│ │ Jane Smith - 2024002    │ │
│ │ ⏰ Entry: 09:07 AM      │ │
│ │ ⏰ Exit: 11:30 AM       │ │
│ │ Status: SUBMITTED       │ │
│ └─────────────────────────┘ │
│                             │
│ [View Full Details →]       │
│ [End Session]               │
└─────────────────────────────┘
```

### Workflow

1. User opens Scanner tab
2. Scans Batch QR → Drawer slides up (camera still visible at top)
3. Active batch is set → Can now scan student QR codes
4. Scan Student QR → Drawer shows update, adds to list
5. Student scans again → Updates exit time/submission
6. Swipe down drawer → Goes back to full camera view
7. Tap "View Full Details" → Opens full-screen batch details

## Backend Changes Needed

### 1. Add Expected Students to ExamSession

```prisma
model ExamSession {
  // ... existing fields
  expectedStudents  ExamSessionStudent[]
}

model ExamSessionStudent {
  id            String      @id @default(uuid())
  examSessionId String
  studentId     String
  registered    Boolean     @default(true)
  createdAt     DateTime    @default(now())

  examSession ExamSession @relation(fields: [examSessionId], references: [id])
  student     Student     @relation(fields: [studentId], references: [id])

  @@unique([examSessionId, studentId])
}
```

### 2. New API Endpoints

- `POST /api/exam-sessions/:id/students` - Add expected students (bulk)
- `GET /api/exam-sessions/:id/students` - Get expected students
- `DELETE /api/exam-sessions/:id/students/:studentId` - Remove student
- `GET /api/exam-sessions/:id/attendance-summary` - Get attendance stats

## Web App Changes Needed

### New Page: Batch Details

Route: `/exam-sessions/:id/details`

Features:

- View batch information
- Import expected students (CSV)
- See attendance list (real-time via WebSocket)
- Compare expected vs actual attendance
- Export attendance report
- Update batch status
- View transfer history

Layout:

```
┌────────────────────────────────────────┐
│  Batch Details: DAT101                 │
├────────────────────────────────────────┤
│  ┌────────────┐  ┌─────────────────┐  │
│  │ Batch Info │  │ Upload Students │  │
│  │            │  │ [Import CSV]    │  │
│  └────────────┘  └─────────────────┘  │
│                                        │
│  Expected Students (20)                │
│  ┌──────────────────────────────────┐ │
│  │ Index    Name      Status        │ │
│  │ 2024001  John Doe  ✅ SUBMITTED  │ │
│  │ 2024002  Jane S.   ✅ SUBMITTED  │ │
│  │ 2024003  Mike J.   ❌ ABSENT     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Attendance: 18/20 (90%)               │
│  Submitted: 15/18 (83%)                │
└────────────────────────────────────────┘
```
