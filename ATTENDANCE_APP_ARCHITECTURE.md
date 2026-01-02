# Attendance App Architecture - Dual-App Structure

**Date:** January 2, 2026  
**Project:** Exam Script Tracking System + Class Attendance System  
**Architecture:** Unified Mobile Codebase with Dual-App Navigation

---

## 🎯 Core Concept

We have **TWO SEPARATE APPS** living in the **SAME mobile codebase**:

```
┌─────────────────────────────────────────────────────────────┐
│                 MOBILE APP CONTAINER                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              LOGIN SCREEN                            │  │
│  │  → Shared authentication for both apps               │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           APP SELECTOR SCREEN                        │  │
│  │                                                       │  │
│  │  ┌──────────────────┐  ┌──────────────────┐         │  │
│  │  │  📝 Exam Script  │  │  ✓ Attendance    │         │  │
│  │  │     Tracking     │  │     System       │         │  │
│  │  └──────────────────┘  └──────────────────┘         │  │
│  └──────────────────────────────────────────────────────┘  │
│           ↓                         ↓                        │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │   EXAM APP       │      │  ATTENDANCE APP  │           │
│  │   (Existing)     │      │     (New)        │           │
│  │                  │      │                  │           │
│  │  Tabs:           │      │  Tabs:           │           │
│  │  • Dashboard     │      │  • Dashboard     │           │
│  │  • Scanner       │      │  • Sessions      │           │
│  │  • Custody       │      │  • QR Scan       │           │
│  │  • Incidents     │      │  • History       │           │
│  │  • Profile       │      │  • Profile       │           │
│  └──────────────────┘      └──────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ File Structure

### Current Structure (Exam App)
```
mobile/
├── app/
│   ├── (tabs)/              ← EXAM APP TABS (existing)
│   │   ├── index.tsx        # Dashboard
│   │   ├── scanner.tsx      # QR Scanner for exams
│   │   ├── custody.tsx      # Batch transfers
│   │   ├── incidents.tsx    # Incident reports
│   │   └── profile.tsx      # User profile
│   ├── login.tsx            # Shared login
│   ├── index.tsx            # Entry point
│   └── [other exam screens]
```

### New Structure (Both Apps)
```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx            # Redirect to login or app selector
│   ├── login.tsx            # SHARED: Authentication
│   ├── app-selector.tsx     # NEW: Choose which app to use
│   │
│   ├── (exam-tabs)/         # EXAM APP NAVIGATION
│   │   ├── _layout.tsx      # Exam app tab navigator
│   │   ├── index.tsx        # Exam dashboard
│   │   ├── scanner.tsx      # Exam QR scanner
│   │   ├── custody.tsx      # Batch custody
│   │   ├── incidents.tsx    # Exam incidents
│   │   └── profile.tsx      # Shared profile
│   │
│   ├── (attendance-tabs)/   # ATTENDANCE APP NAVIGATION (NEW)
│   │   ├── _layout.tsx      # Attendance tab navigator
│   │   ├── index.tsx        # Attendance dashboard
│   │   ├── sessions.tsx     # Active sessions
│   │   ├── scanner.tsx      # Attendance QR scanner
│   │   ├── history.tsx      # Attendance history
│   │   └── profile.tsx      # Shared profile
│   │
│   ├── [exam screens]/      # Existing exam screens
│   │   ├── batch-details.tsx
│   │   ├── initiate-transfer.tsx
│   │   └── ...
│   │
│   └── [attendance screens]/ # NEW attendance screens
│       ├── attendance-start.tsx
│       ├── attendance-live.tsx
│       ├── attendance-student-link.tsx
│       ├── mark-attendance.tsx
│       └── biometric-enrollment.tsx
```

---

## 🔄 Navigation Flow

### **CONFIRMED APPROACH: Remember Last App + Switch Button** ✅

Users' last app selection is saved and they're automatically routed there on subsequent logins. A "Switch App" button in the profile allows easy toggling between apps.

### 1. **App Entry**
```typescript
// app/index.tsx
export default function Index() {
  const { user, isLoading } = useAuth();
  const { lastUsedApp, canAccessExamApp, canAccessAttendanceApp } = useAppContext();
  
  if (isLoading) return <SplashScreen />;
  
  if (!user) {
    return <Redirect href="/login" />;
  }
  
  // Check if user has a remembered app preference
  if (lastUsedApp) {
    // Verify user still has access to that app
    if (lastUsedApp === 'exam' && canAccessExamApp) {
      return <Redirect href="/(exam-tabs)" />;
    } else if (lastUsedApp === 'attendance' && canAccessAttendanceApp) {
      return <Redirect href="/(attendance-tabs)" />;
    }
  }
  
  // First time or no valid preference - show selector
  return <Redirect href="/app-selector" />;
}
```

### 2. **App Selector**
```typescript
// app/app-selector.tsx
export default function AppSelector() {
  const router = useRouter();
  const { setCurrentApp, canAccessExamApp, canAccessAttendanceApp } = useAppContext();
  
  const selectApp = async (app: 'exam' | 'attendance') => {
    // Save preference to AsyncStorage
    await setCurrentApp(app);
    
    // Navigate to selected app
    if (app === 'exam') {
      router.replace('/(exam-tabs)');
    } else {
      router.replace('/(attendance-tabs)');
    }
  };
  
  return (
    <View>
      <Text>Select Application</Text>
      
      {/* Only show apps user has access to */}
      {canAccessExamApp && (
        <TouchableOpacity onPress={() => selectApp('exam')}>
          <Text>📝 Exam Script Tracking</Text>
          <Text>Manage exam scripts, custody, and transfers</Text>
        </TouchableOpacity>
      )}
      
      {canAccessAttendanceApp && (
        <TouchableOpacity onPress={() => selectApp('attendance')}>
          <Text>✓ Class Attendance</Text>
          <Text>Recor (Profile Screen)** ✅
Users can switch between apps from the profile screen. This is shown only if they have access to multiple apps:

```typescript
// In profile screen (shared by both apps)
const { currentApp, switchApp, canAccessBothApps } = useAppContext();

{canAccessBothApps && (
  <Button 
    onPress={() => {
      const targetApp = currentApp === 'exam' ? 'attendance' : 'exam';
      switchApp(targetApp);
    }}
  >
    <Icon name="swap-horizontal" />
    Switch to {currentApp === 'exam' ? 'Attendance' : 'Exam Tracking'}
  </Button>
)}
### 3. **App Switcher**
Users can switch between apps from the profile screen:

```typescript
// S**CONFIRMED: What's Shared vs Separate** ✅

### Shared Components (Both Apps)
```
components/
├── ui/                    # SHARED: UI library
├── AuthLayout.tsx         # SHARED: Authentication wrapper
├── themed-text.tsx        # SHARED: Theme components
└── themed-view.tsx        # SHARED: Theme components
```

### Shared Services & Data
```
api/
├── auth.ts               # SHARED: Authentication
├── users.ts              # SHARED: User management
└── students.ts           # SHARED: Student database (both apps use)

store/
├── auth.ts               # SHARED: Auth state
└── appContext.ts         # NEW: Track current app selection

screens/
└── profile.tsx           # SHARED: User profile (shows in both apps)
```

### App-Specific APIs & Features
```
api/
├── examSessions.ts       # EXAM APP ONLY
├── batchTransfers.ts     # EXAM APP ONLY
├── examIncidents.ts      # EXAM APP ONLY (incident reporting for exams)
├── classAttendance.ts    # ATTENDANCE APP ONLY (NEW)
└── attendanceIncidents.ts # ATTENDANCE APP ONLY (separate for now, may merge later)

Note: Incidents will likely share the same backend logic/models, 
but kept separate in mobile UI for now. Can be unified later.
```

### App-Specific APIs
```
api/
├── examSessions.ts       # EXAM APP ONLY
├── batchTransfers.ts     # EXAM APP ONLY
├── incidents.ts          # SHARED (both apps have incidents)
├── students.ts           # SHARED (both apps use students)
└── classAttendance.ts    # ATTENDANCE APP ONLY (NEW)
```

### App-Specific Components
```
components/
├── exam/                 # EXAM APP ONLY
│   ├── BatchScanner.tsx
│   ├── TransferDialog.tsx
│   └── CustodyChain.tsx
│
└── attendance/           # ATTENDANCE APP ONLY (NEW)
    ├── AttendanceQRScanner.tsx
    ├── BiometricScanner.tsx
    ├── LiveAttendanceList.tsx
    └── SessionLinkDisplay.tsx
```

---

## 👥 User Experience

### Scenario 1: Lecturer Using Both Apps

```
1. Login with crLecturer Switching Between Roles

```
Dr. Smith is a LECTURER who:
1. Teaches CS101 (needs Attendance App)
2. Also assigned as invigilator for final exams (needs Exam App)

Flow:
1. Login
2. Auto-route to last used app (e.g., Attendance)
3. Record attendance for CS101 class
4. Later that day: Switch to Exam App via profile
5. Scan exam scripts as invigilator
6. Next day: Auto-route back to Attendance (remembered preference)`typescript
const EXAM_APP_ROLES = [
  'ADMIN',              // Full access to everything
  'INVIGILATOR',        // Can scan scripts, manage exam sessions
  'DEPARTMENT_HEAD',    // Department oversight
  'FACULTY_OFFICER',    // Faculty-level management
  'LECTURER'            // Can also be assigned as invigilator
];
```

### Attendance App Access
```typescript
const ATTENDANCE_APP_ROLES = [
  'ADMIN',         // Full access to everything
  'LECTURER',      // Primary user - record attendance for their classes
  'CLASS_REP'      // Can help record attendance on behalf of lecturer
];
```

### Access Control Implementation
```typescript
// store/appContext.ts
export const useAppContext = create<AppContextState>((set, get) => {
  const { user } = useAuthStore.getState();
  
  const canAccessExamApp = user ? EXAM_APP_ROLES.includes(user.role) : false;
  const canAccessAttendanceApp = user ? ATTENDANCE_APP_ROLES.includes(user.role) : false;
  const canAccessBothApps = canAccessExamApp && canAccessAttendanceApp;
  
  return {
    canAccessExamApp,
    canAccessAttendanceApp,
    canAccessBothApps,
    // ... other state
  };
});

// In app selector - only show accessible apps
{canAccessExamApp && <ExamAppCard />}
{canAccessAttendanceApp && <AttendanceAppCard />}

// In profile - only show switcher if user has multiple apps
{canAccessBothApps && <AppSwitcherButton />}
```

### Special Case: LECTURER Role
Lecturers can access **BOTH** apps because:
- They need **Exam App** when assigned as invigilators
- They need **Attendance App** to record class attendance
- App switcher in profile makes it easy to toggle between roles
### Attendance App Access
```typescript
const ATTENDANCE_APP_ROLES = [
  'ADMIN',
  'LECTURER',
  'CLASS_REP'
];
```

### Access Control
```typescript
// In app selector
const canAccessExamApp = EXAM_APP_ROLES.includes(user.role);
const canAccessAttendanceApp = ATTENDANCE_APP_ROLES.includes(user.role);

// Show only apps user has access to
{canAccessExamApp && <ExamAppCard />}
{canAccessAttendanceApp && <AttendanceAppCard />}
```

---

## 📱 Deep Linking

### URL Structure
```
// Exam app
myapp://exam-tabs/dashboard
myapp://exam-tabs/scanner
myapp://batch-details/123

// Attendance app  
myapp://attendance-tabs/dashboard
myapp://attendance-tabs/sessions
myapp://attendance-live/456

// Universal
myapp://app-selector
myapp://login
```

---

## 🎯 Benefits of This Architecture

### ✅ Advantages
1. **Separation of Concerns** - Each app is independent
2. **Shared Authentication** - One login for both
3. **Code Reuse** - Shared components, API client, utilities
4. **Easy Switching** - Users can switch between apps
5. **Role-Based Access** - Control who sees what
6. **Maintainability** - Clear boundaries between features
7. **Scalability** - Easy to add more apps (e.g., Library System)

### ✅ No Mixing
- Exam app tabs only show exam features
- Attendance app tabs only show attendance features
- No confusion about which feature set you're using
- Clear mental model for users

---

## 🚀 Implementation Steps

### Phase 1: Restructure Navigation ✓
1. Create `app-selector.tsx`
2. Rename `(tabs)` → `(exam-tabs)`
3. Create `(attendance-tabs)` directory
4. Update root `_layout.tsx` and `index.tsx`
5. Create app context store

### Phase 2: Attendance Tab Navigator
1. Create `(attendance-tabs)/_layout.tsx`
2. Define attendance tabs
3. Create placeholder screens

### Phase 3: Attendance Screens
1. Dashboard
2. Start Recording
3. Live Tracking
4. Session History
5. Student Self-Service

### Phase 4: Shared Components
1. Profile screen (accessible from both apps)
2. Settings
3. App switcher functionality

### Phase 5: Backend Integration
1. Attendance API endpoints
2. Socket.IO for real-time
3. Biometric integration

---

## 💾 State Management

### App Context
```typescript
// store/appContext.ts
type AppType = 'exam' | 'attendance';

interface AppContextState {
  currentApp: AppType | null;
  setCurrentApp: (app: AppType) => void;
  switchApp: (app: AppType) => void;
}

export const useAppContext = create<AppContextState>((set) => ({
  currentApp: null,
  setCurrentApp: (app) => {
    set({ currentApp: app });
    AsyncStorage.setItem('selectedApp', app);
  },
  switchApp: async (app) => {
    set({ currentApp: app });
    await AsyncStorage.setItem('selectedApp', app);
    router.replace(app === 'exam' ? '/(exam-tabs)' : '/(attendance-tabs)');
  }
}));
```

---

## 🎨 Visual Design

### App Selector Screen Design
```
┌─────────────────────────────────────────┐
│                                         │
│          Welcome, Dr. Smith             │
│       Select an application             │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  📝 Exam Script Tracking         │  │
│  │                                  │  │
│  │  Manage exam scripts, custody    │  │
│  │  transfers, and incidents        │  │
│  │                                  │  │
│  │           [Open →]               │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  ✓ Class Attendance System       │  │
│  │                                  │  │
│  │  Record student attendance       │  │
│  │  using QR codes & biometrics     │  │
│  │                                  │  │
│  │           [Open →]               │  │
│  └──────────────────────────────────┘  │
│                                         │
│            [Logout]                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔄 Migration Strategy

### Existing Users
1. Current `(tabs)` → rename to `(exam-tabs)`
2. All existing screens continue working
3. New users see app selector
4. Existing sessions remain in exam app

### No Breaking Changes
- All existing routes still work
- Deep links preserved
- User sessions maintained

---

## ✨ Summary

**Key Points:**
- ✅ TWO separate apps with separate tab navigations
- ✅ Shared authentication and user management
- ✅ App selector after login
- ✅ Easy switching between apps
- ✅ No mixing of features
- ✅ Clean separation of concerns
- ✅ Scalable for future apps

**Next Steps:**
1. Implement app selector screen
2. Restructure navigation (rename tabs)
3. Create attendance tab navigation
4. Build attendance features

Ready to implement! 🚀
