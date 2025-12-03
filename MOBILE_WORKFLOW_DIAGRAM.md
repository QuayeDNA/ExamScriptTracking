# Mobile Scanner Workflow

## New UX Flow with Bottom Drawer

```
┌─────────────────────────────────────┐
│         QR Scanner Screen           │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │    [Camera View Active]     │   │
│  │                             │   │
│  │    ┌─────────────────┐      │   │
│  │    │   QR SCAN AREA  │      │   │
│  │    └─────────────────┘      │   │
│  │                             │   │
│  │  Instructions: Scan Batch   │   │
│  │       QR Code First         │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

            ⬇️  User scans batch QR

┌─────────────────────────────────────┐
│         QR Scanner Screen           │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │    [Camera Still Active]    │   │
│  │                             │   │
│  │    ┌─────────────────┐      │   │
│  │    │   QR SCAN AREA  │      │   │
│  │    └─────────────────┘      │   │
│  │                             │   │
│  │  ✓ Session Active           │   │
├─────────────────────────────────────┤
│  ╔═══════════════════════════╗     │ ⬅️ Drawer @ 50%
│  ║  📚 DAT101 - Data Analysis ║     │
│  ║  📍 Exam Hall A            ║     │
│  ║  Batch: B2024-DAT101-001   ║     │
│  ╠═══════════════════════════╣     │
│  ║  ┌─────┬─────┬─────────┐  ║     │
│  ║  │ 5/20│  3  │   2     │  ║     │
│  ║  │Present Subm  InProg │  ║     │
│  ║  └─────┴─────┴─────────┘  ║     │
│  ║  Attendance: 25%          ║     │
│  ╠═══════════════════════════╣     │
│  ║  Recent Attendees:        ║     │
│  ║  • John Doe (2023001)     ║     │
│  ║    ⏰ 09:15 ✅ Submitted   ║     │
│  ║  • Jane Smith (2023002)   ║     │
│  ║    ⏰ 09:18 🔵 Present     ║     │
│  ╚═══════════════════════════╝     │
└─────────────────────────────────────┘

       ⬇️  User continues scanning student IDs

┌─────────────────────────────────────┐
│         QR Scanner Screen           │
│  ┌─────────────────────────────┐   │
│  │    [Camera Still Active]    │   │
│  │    ┌─────────────────┐      │   │
│  │    │   QR SCAN AREA  │      │   │
│  │    └─────────────────┘      │   │
│  │  ✓ Scanned Successfully     │   │
├─────────────────────────────────────┤
│  ╔═══════════════════════════╗     │
│  ║  📚 DAT101 - Data Analysis ║     │
│  ║  📍 Exam Hall A            ║     │
│  ╠═══════════════════════════╣     │
│  ║  ┌─────┬─────┬─────────┐  ║     │
│  ║  │ 6/20│  3  │   3     │  ║  ⬅️ Auto-updated!
│  ║  │Present Subm  InProg │  ║     │
│  ║  └─────┴─────┴─────────┘  ║     │
│  ║  Attendance: 30%          ║     │
│  ╠═══════════════════════════╣     │
│  ║  Recent Attendees:        ║     │
│  ║  • Alice Wong (2023003)   ║  ⬅️ New!
│  ║    ⏰ 09:22 🔵 Present     ║     │
│  ║  • John Doe (2023001)     ║     │
│  ║    ⏰ 09:15 ✅ Submitted   ║     │
│  ║  • Jane Smith (2023002)   ║     │
│  ║    ⏰ 09:18 🔵 Present     ║     │
│  ╚═══════════════════════════╝     │
└─────────────────────────────────────┘

       ⬆️  Swipe up to expand drawer

┌─────────────────────────────────────┐
│  ╔═══════════════════════════╗     │
│  ║  📚 DAT101 - Data Analysis ║     │ ⬅️ Drawer @ 90%
│  ║  📍 Exam Hall A            ║     │
│  ║  Batch: B2024-DAT101-001   ║     │
│  ╠═══════════════════════════╣     │
│  ║  ┌─────┬─────┬─────────┐  ║     │
│  ║  │ 6/20│  3  │   3     │  ║     │
│  ║  │Present Subm  InProg │  ║     │
│  ║  └─────┴─────┴─────────┘  ║     │
│  ║  Attendance: 30%          ║     │
│  ╠═══════════════════════════╣     │
│  ║  Recent Attendees (6):    ║     │
│  ║  ┌───────────────────────┐║     │
│  ║  │ • Alice Wong          │║     │
│  ║  │   2023003             │║     │
│  ║  │   ⏰ 09:22 🔵 Present  │║     │
│  ║  ├───────────────────────┤║     │
│  ║  │ • John Doe            │║     │
│  ║  │   2023001             │║     │
│  ║  │   ⏰ 09:15 ✅ Submitted│║     │
│  ║  ├───────────────────────┤║     │
│  ║  │ [More students...]    │║     │
│  ║  └───────────────────────┘║     │
│  ╠═══════════════════════════╣     │
│  ║  [View Full Details →]    ║     │
│  ║  [End Session]            ║     │
│  ╚═══════════════════════════╝     │
└─────────────────────────────────────┘
```

## Key Benefits

### 1. **Camera Always Visible**

- Invigilator can continuously scan without navigation
- No context switching between screens
- Faster workflow during busy exam entry period

### 2. **Real-time Feedback**

- Stats update immediately after each scan
- Visual confirmation with updated count
- No need to refresh or navigate away

### 3. **Flexible Information Display**

- 25% snap: Minimal info while focusing on camera
- 50% snap: Balanced view with recent attendees
- 90% snap: Full list when needed

### 4. **Quick Actions**

- Pull to refresh attendance data
- Swipe down to minimize
- Tap "View Full Details" for complete data
- Tap "End Session" to clear and start fresh

### 5. **Progressive Disclosure**

- Start with essential info (course, batch, stats)
- Expand to see more details when needed
- Full page available via button if deep analysis required

## Comparison: Old vs New

### Old Flow

```
1. Scan batch QR → Navigate to Batch Details page
2. Page loads with all data
3. Back button → Return to scanner
4. Scan student → Navigate to Student Attendance page
5. Confirm → Navigate back to scanner
6. Repeat...
```

**Problems**: Too much navigation, context loss, camera inactive

### New Flow

```
1. Scan batch QR → Drawer slides up (camera stays on)
2. See minimal info + stats
3. Scan student → Drawer updates (camera stays on)
4. Continue scanning (drawer updates in real-time)
5. Swipe drawer to adjust view as needed
```

**Benefits**: Minimal navigation, camera always active, real-time updates

## Mobile Architecture

```
┌─────────────────────────────────────┐
│        Scanner Screen (Tab)         │
│  - Manages camera permission        │
│  - Handles QR code scanning         │
│  - Maintains activeExamSession state│
│  - Controls bottomSheetRef          │
└────────────┬────────────────────────┘
             │
             │ Uses
             ▼
┌─────────────────────────────────────┐
│      AttendanceDrawer Component     │
│  - Receives session via props       │
│  - Polls API every 10s              │
│  - Renders stats & attendance list  │
│  - Provides "View Details" button   │
│  - Provides "End Session" button    │
└────────────┬────────────────────────┘
             │
             │ Fetches from
             ▼
┌─────────────────────────────────────┐
│     examSessionsApi.getExamSession  │
│  Returns:                           │
│  - Session details                  │
│  - stats object                     │
│  - attendances array                │
└─────────────────────────────────────┘
```

## State Management

### Scanner Screen State

```typescript
const [activeExamSession, setActiveExamSession] = useState<ExamSession | null>(
  null
);
const bottomSheetRef = useRef<BottomSheet>(null);
```

### Drawer Component State

```typescript
const [attendances, setAttendances] = useState<ExamAttendance[]>([]);
const [stats, setStats] = useState<any>(null);
const [loading, setLoading] = useState(false);
```

### Real-time Updates

```typescript
useEffect(() => {
  if (session) {
    loadAttendanceData();
    const interval = setInterval(loadAttendanceData, 10000);
    return () => clearInterval(interval);
  }
}, [session, loadAttendanceData]);
```

## Gesture Handling

- **Swipe Up**: Expand drawer to next snap point
- **Swipe Down**: Minimize drawer to previous snap point
- **Pan Down from Top**: Close drawer (disabled by default)
- **Tap Outside**: No action (drawer stays open)
- **Pull-to-Refresh**: Refresh attendance data

## Error Handling

### Scenarios Handled

1. **No Active Session**: Alert user to scan batch QR first
2. **API Failure**: Display error message with retry button
3. **Empty Attendance**: Show "No students scanned yet" message
4. **Network Timeout**: Auto-retry with exponential backoff

### User Feedback

- Loading spinner during data fetch
- Success message after scan
- Error alerts with clear instructions
- Status badges with color coding
