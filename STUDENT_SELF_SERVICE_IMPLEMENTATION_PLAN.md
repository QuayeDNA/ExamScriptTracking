# 📱 Student Self-Service Attendance - Implementation Plan

**Date:** January 3, 2026  
**Version:** 1.0  
**Status:** Planning Phase

---

## 🎯 **SYSTEM OVERVIEW**

This document outlines the complete implementation plan for the **Student Self-Service Attendance Portal** - the web-based system that allows students to mark their own attendance using their personal devices.

### **What Is Self-Service Attendance?**

Students use their own smartphones/devices to mark attendance independently, without queuing at the lecturer's desk. The lecturer generates a session link/QR code, students scan it, choose their verification method, and mark themselves present.

### **Three Verification Methods**

| Method | Speed | Security | Requirements |
|--------|-------|----------|--------------|
| **👆 Biometric** | ⚡ 3 sec | ⭐⭐⭐ Very High | Enrolled device with fingerprint/face |
| **📷 QR Self-Scan** | ⚡ 2-3 sec | ⭐⭐ High | Student ID card with QR code |
| **🔢 Manual Index** | 🐢 10-15 sec | ⭐ Medium | Just index number |

### **Key Benefits**

✅ **Scalable:** Handles 200+ students efficiently  
✅ **Fast:** No queuing at lecturer's desk  
✅ **Contactless:** COVID-safe  
✅ **Real-time:** Lecturer sees live updates  
✅ **Flexible:** Multiple verification methods  
✅ **Secure:** Geofencing + cryptographic signatures

---

## 📊 **CURRENT STATE**

### **What's Already Built:**

✅ **Backend APIs (100%)**
- `POST /api/class-attendance/record/biometric` - Record via biometric
- `POST /api/class-attendance/biometric/enroll` - Enroll biometric
- `POST /api/class-attendance/record/index` - Record via index number
- `POST /api/class-attendance/record/qr` - Record via QR scan
- Database schema with biometric fields in Student model

✅ **Lecturer Mobile App (85%)**
- Generate student link with QR code
- Real-time attendance dashboard
- Session management
- Socket.IO live updates

❌ **Student Portal (0%)**
- Not yet implemented
- This is what we're building!

---

## 🏗️ **ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LECTURER SIDE (Mobile App) ✅ DONE                         │
│  ├─ Start recording session                                 │
│  ├─ Generate student link: attend.app/ABC123               │
│  ├─ Display QR on projector                                 │
│  └─ View live attendance updates                            │
│                                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│  STUDENT SIDE (Web Portal) ⚠️ TO BUILD                     │
│  ├─ Scan QR or type URL                                     │
│  ├─ Choose verification method                              │
│  │   ├─ Biometric (fingerprint/face)                        │
│  │   ├─ QR Self-Scan (camera)                              │
│  │   └─ Manual Index Entry                                  │
│  ├─ Submit attendance                                       │
│  ├─ See confirmation                                        │
│  └─ 💾 LOCAL STORAGE (Privacy-First)                       │
│      ├─ Save attendance record to device                    │
│      ├─ Cache profile picture (base64)                      │
│      ├─ View personal history anytime                       │
│      └─ Export to CSV for backup/proof                      │
│                                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│  BACKEND (Node.js + Prisma) ✅ MOSTLY DONE                 │
│  ├─ Session validation                                      │
│  ├─ Attendance recording                                    │
│  ├─ Geofencing validation                                   │
│  ├─ Duplicate prevention                                    │
│  └─ Real-time Socket.IO updates                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 **BIOMETRIC SYSTEM - DETAILED FLOW**

### **How Biometric Data Works**

#### **Data Storage (Already in Database):**

```typescript
model Student {
  // ... other fields
  
  // Biometric Fields ✅ Already in schema
  biometricTemplateHash String?  @unique  // Hash of biometric (NOT raw data)
  biometricEnrolledAt   DateTime?         // When enrolled
  biometricDeviceId     String?           // Device used
  biometricProvider     String?           // 'TOUCHID', 'FACEID', 'FINGERPRINT'
}
```

**Security Principles:**
- ✅ **NO RAW BIOMETRIC DATA** is ever stored on server
- ✅ Only **cryptographic hash** stored (SHA-256)
- ✅ Hash is **unique** per student (database constraint)
- ✅ Raw biometric **never leaves device**
- ✅ Uses industry-standard **WebAuthn** protocol

---

### **PHASE 1: BIOMETRIC ENROLLMENT**

Students enroll their fingerprint/face **once** during initial setup.

```
┌─────────────────────────────────────────────────────────────┐
│  ENROLLMENT FLOW (One-Time Setup)                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ STEP 1: Student Opens Enrollment Portal                     │
│ ─────────────────────────────────────                      │
│   URL: enroll.myuni.edu/biometric                          │
│                                                              │
│   Interface:                                                 │
│   ┌──────────────────────────────────┐                     │
│   │  🎓 Biometric Enrollment          │                     │
│   │                                   │                     │
│   │  Enter Your Index Number:        │                     │
│   │  [20230001____________]          │                     │
│   │                                   │                     │
│   │  [Continue]                       │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│   Validations:                                              │
│   ✓ Student exists in database                              │
│   ✓ Not already enrolled                                    │
│   ✓ Index number format valid                               │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│ STEP 2: Device Capability Check                             │
│ ──────────────────────────────                             │
│   JavaScript API Call:                                      │
│   ```javascript                                             │
│   const supported = await PublicKeyCredential               │
│     .isUserVerifyingPlatformAuthenticatorAvailable();      │
│   ```                                                        │
│                                                              │
│   SCENARIO A: Device SUPPORTS Biometric                     │
│   ┌──────────────────────────────────┐                     │
│   │  ✓ Device Compatible              │                     │
│   │                                   │                     │
│   │  Your device supports:            │                     │
│   │  👆 Touch ID / Face ID            │                     │
│   │                                   │                     │
│   │  Benefits:                        │                     │
│   │  • Mark attendance in 3 seconds   │                     │
│   │  • No need to remember passwords  │                     │
│   │  • Most secure method             │                     │
│   │                                   │                     │
│   │  [Enroll Now]                     │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│   SCENARIO B: Device DOES NOT Support Biometric            │
│   ┌──────────────────────────────────┐                     │
│   │  ⚠️ Biometric Not Supported       │                     │
│   │                                   │                     │
│   │  Your device doesn't have         │                     │
│   │  fingerprint or face recognition. │                     │
│   │                                   │                     │
│   │  Don't worry! You can use:        │                     │
│   │  • QR Code self-scan              │                     │
│   │  • Manual index entry             │                     │
│   │                                   │                     │
│   │  [OK, I Understand]               │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│ STEP 3: Biometric Capture (If Supported)                    │
│ ──────────────────────────────────────                     │
│   System calls WebAuthn API:                                │
│   ┌──────────────────────────────────┐                     │
│   │  👆 Scan Your Fingerprint         │                     │
│   │                                   │                     │
│   │  Place your finger on the sensor  │                     │
│   │  to enroll your biometric.        │                     │
│   │                                   │                     │
│   │  [Scanning...]                    │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│   Process (Client-Side Only):                               │
│   1. Device captures fingerprint/face                       │
│   2. Device creates cryptographic hash                      │
│   3. Device generates public/private key pair               │
│   4. Private key stays on device (never sent!)             │
│   5. Public key + hash sent to server                       │
│                                                              │
│   ⚠️ CRITICAL: Raw biometric NEVER leaves device!          │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│ STEP 4: Server-Side Enrollment                              │
│ ──────────────────────────────                             │
│   API Call:                                                 │
│   POST /api/class-attendance/biometric/enroll              │
│   {                                                          │
│     studentId: "uuid-from-index-lookup",                   │
│     biometricHash: "SHA256_HASH_FROM_DEVICE",              │
│     deviceId: "iPhone_14_Pro_XYZ",                         │
│     provider: "FACEID"  // or TOUCHID/FINGERPRINT         │
│   }                                                          │
│                                                              │
│   Server Validations:                                       │
│   ✓ Student exists                                          │
│   ✓ Not already enrolled                                    │
│   ✓ Hash is unique (no collision with other students)      │
│   ✓ Hash meets security standards (SHA-256)                │
│                                                              │
│   Database Update:                                          │
│   UPDATE students SET                                        │
│     biometricTemplateHash = "HASH...",                      │
│     biometricEnrolledAt = NOW(),                            │
│     biometricDeviceId = "iPhone_14_Pro_XYZ",               │
│     biometricProvider = "FACEID"                            │
│   WHERE id = "student-uuid";                                │
│                                                              │
│   Response:                                                  │
│   {                                                          │
│     success: true,                                          │
│     student: { id, indexNumber, firstName, lastName },     │
│     biometric: { enrolledAt, provider }                    │
│   }                                                          │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│ STEP 5: Success Confirmation                                │
│ ─────────────────────────                                  │
│   ┌──────────────────────────────────┐                     │
│   │  ✓ Enrollment Successful!         │                     │
│   │                                   │                     │
│   │  John Doe (20230001)              │                     │
│   │  Face ID enrolled                 │                     │
│   │                                   │                     │
│   │  You can now mark attendance      │                     │
│   │  instantly using Face ID!         │                     │
│   │                                   │                     │
│   │  Next Steps:                      │                     │
│   │  1. Go to class                   │                     │
│   │  2. Scan session QR               │                     │
│   │  3. Tap "Fingerprint"             │                     │
│   │  4. Done in 3 seconds! ⚡         │                     │
│   │                                   │                     │
│   │  [Got It!]                        │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### **PHASE 2: ATTENDANCE MARKING**

After enrollment, students mark attendance during each class.

```
┌─────────────────────────────────────────────────────────────┐
│  ATTENDANCE MARKING FLOW (Every Class)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ STEP 1: Access Session Link                                 │
│ ────────────────────────                                    │
│   METHOD A: Scan QR Code                                    │
│   - Lecturer displays QR on projector                       │
│   - Student scans with phone camera                         │
│   - Redirects to: attend.app/ABC123                        │
│                                                              │
│   METHOD B: Type Short URL                                  │
│   - Lecturer shares: "attend.app/ABC123"                   │
│   - Student types in browser                                │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│ STEP 2: Session Validation                                  │
│ ───────────────────────                                    │
│   API Call:                                                 │
│   GET /api/class-attendance/links/validate?token=ABC123    │
│                                                              │
│   Server Checks:                                            │
│   ✓ Link exists                                             │
│   ✓ Session is active (IN_PROGRESS)                        │
│   ✓ Link not expired (within time window)                  │
│   ✓ Not exceeded max uses                                   │
│                                                              │
│   Response:                                                  │
│   {                                                          │
│     valid: true,                                            │
│     session: {                                              │
│       id: "uuid",                                           │
│       courseCode: "CS101",                                  │
│       courseName: "Data Structures",                        │
│       lecturerName: "Dr. Smith",                            │
│       venue: "LT 5",                                        │
│       startTime: "2026-01-03T10:00:00Z"                    │
│     }                                                        │
│   }                                                          │
│                                                              │
│   IF INVALID:                                               │
│   ┌──────────────────────────────────┐                     │
│   │  ❌ Invalid Link                  │                     │
│   │                                   │                     │
│   │  This session has expired or      │                     │
│   │  is no longer active.             │                     │
│   │                                   │                     │
│   │  Please get a new link from       │                     │
│   │  your lecturer.                   │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│ STEP 3: Display Session Info                                │
│ ─────────────────────────                                  │
│   ┌──────────────────────────────────┐                     │
│   │  📚 Mark Attendance                │                     │
│   │                                   │                     │
│   │  CS101 - Data Structures          │                     │
│   │  Dr. Smith │ LT 5 │ 10:00 AM     │                     │
│   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │                     │
│   │                                   │                     │
│   │  Choose verification method:      │                     │
│   │                                   │                     │
│   │  [Continues below...]             │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│ STEP 4: Check Student Enrollment Status                     │
│ ────────────────────────────────────                       │
│   API Call:                                                 │
│   GET /api/students/me/biometric-status                    │
│   (Uses student ID from login/index entry)                 │
│                                                              │
│   Response Scenarios:                                       │
│                                                              │
│   A) ENROLLED + DEVICE SUPPORTS:                           │
│      Show biometric option prominently (recommended)        │
│                                                              │
│   B) NOT ENROLLED + DEVICE SUPPORTS:                       │
│      Show enrollment prompt + alternative methods           │
│                                                              │
│   C) NOT ENROLLED + DEVICE DOESN'T SUPPORT:                │
│      Show alternative methods only (QR + Manual)            │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│ STEP 5: Method Selection Interface                          │
│ ───────────────────────────────                            │
│                                                              │
│   OPTION A: Biometric (If Enrolled)                        │
│   ┌──────────────────────────────────┐                     │
│   │  👆 Fingerprint                   │                     │
│   │  ⚡ Fastest & most secure         │                     │
│   │  [Use Fingerprint]                │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│   OPTION B: QR Self-Scan                                   │
│   ┌──────────────────────────────────┐                     │
│   │  📷 Scan My Student ID            │                     │
│   │  Show your ID card QR code        │                     │
│   │  [Open Camera]                    │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│   OPTION C: Manual Entry                                   │
│   ┌──────────────────────────────────┐                     │
│   │  🔢 Enter Index Number            │                     │
│   │  Manual verification              │                     │
│   │  [20230001____________]          │                     │
│   │  [Submit]                         │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│   IF NOT ENROLLED (Show Prompt):                           │
│   ┌──────────────────────────────────┐                     │
│   │  👆 Fingerprint [LOCKED]          │                     │
│   │  Not enrolled yet                 │                     │
│   │                                   │                     │
│   │  💡 Enroll now for 3-second       │                     │
│   │  attendance marking!              │                     │
│   │                                   │                     │
│   │  [Enroll Now] [Maybe Later]       │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│ STEP 6A: Biometric Verification                             │
│ ────────────────────────────                               │
│   Student taps "Use Fingerprint"                           │
│                                                              │
│   Device Prompts:                                           │
│   ┌──────────────────────────────────┐                     │
│   │  👆 Verify Your Identity          │                     │
│   │                                   │                     │
│   │  Place your finger on the sensor  │                     │
│   │  to mark attendance               │                     │
│   │                                   │                     │
│   │  [Scanning...]                    │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│   Client-Side Process:                                      │
│   1. Device captures biometric                              │
│   2. Verifies against stored template                       │
│   3. Generates authentication signature                     │
│   4. Calculates confidence score (0.0-1.0)                 │
│   5. Creates same hash from enrollment                      │
│                                                              │
│   API Call:                                                 │
│   POST /api/class-attendance/record/biometric              │
│   {                                                          │
│     recordId: "session-uuid",                               │
│     biometricHash: "SAME_HASH_FROM_ENROLLMENT",            │
│     biometricConfidence: 0.95,  // 95% match               │
│     deviceId: "iPhone_14_Pro_XYZ",                         │
│     location: { lat: 5.6037, lng: -0.1870 }  // Geofencing│
│   }                                                          │
│                                                              │
│   Server Validations:                                       │
│   ✓ Session is active                                       │
│   ✓ Hash matches enrolled student                           │
│   ✓ Confidence >= 0.8 (80% threshold)                       │
│   ✓ Student not already marked present                      │
│   ✓ Location within 50m of venue (geofencing)              │
│   ✓ Within class time window                                │
│                                                              │
│   Database Actions:                                          │
│   1. Query: SELECT * FROM students                          │
│      WHERE biometricTemplateHash = "HASH"                   │
│      → Returns: John Doe (20230001)                         │
│                                                              │
│   2. Check duplicate:                                       │
│      SELECT * FROM class_attendances                        │
│      WHERE recordId = "session-uuid"                        │
│      AND studentId = "john-uuid"                            │
│      → Should be empty                                      │
│                                                              │
│   3. Insert attendance:                                     │
│      INSERT INTO class_attendances (...)                    │
│      VALUES (                                               │
│        recordId: "session-uuid",                            │
│        studentId: "john-uuid",                              │
│        verificationMethod: "BIOMETRIC_FACE",                │
│        biometricConfidence: 0.95,                           │
│        status: "PRESENT",                                   │
│        scanTime: NOW()                                      │
│      )                                                       │
│                                                              │
│   4. Socket.IO broadcast:                                   │
│      io.to(sessionId).emit("attendance:recorded", {        │
│        student: { id, indexNumber, firstName, lastName },  │
│        method: "BIOMETRIC_FACE",                            │
│        confidence: 0.95                                     │
│      })                                                      │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│ STEP 6B: QR Self-Scan (Alternative)                        │
│ ────────────────────────────                               │
│   Student taps "Open Camera"                                │
│   Camera opens in selfie mode                               │
│   Student holds ID card to camera                           │
│   QR code automatically detected                            │
│   Extracts student ID from QR                               │
│                                                              │
│   API Call:                                                 │
│   POST /api/class-attendance/record/qr                     │
│   { recordId, qrData, location }                           │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│ STEP 6C: Manual Index Entry (Alternative)                  │
│ ──────────────────────────────────                         │
│   Student types index number: 20230001                      │
│   (Optional: PIN verification)                              │
│                                                              │
│   API Call:                                                 │
│   POST /api/class-attendance/record/index                  │
│   { recordId, indexNumber, location }                      │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│ STEP 7: Success Confirmation                                │
│ ─────────────────────────                                  │
│   ┌──────────────────────────────────┐                     │
│   │  ✓ Attendance Marked!             │                     │
│   │                                   │                     │
│   │  John Doe                         │                     │
│   │  20230001                         │                     │
│   │                                   │                     │
│   │  CS101 - Data Structures          │                     │
│   │  Time: 10:05 AM                   │                     │
│   │  Method: Face ID                  │                     │
│   │  Confidence: 95%                  │                     │
│   │                                   │                     │
│   │  You may now close this page.     │                     │
│   │                                   │                     │
│   │  [Done]                           │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│   Lecturer's Dashboard Updates:                             │
│   - Live counter increases: 47 → 48 students               │
│   - Student name appears in recent list                     │
│   - Toast notification: "✓ John Doe marked present"        │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                              │
│ ERROR HANDLING                                              │
│ ──────────────                                             │
│                                                              │
│   Low Confidence (< 80%):                                   │
│   ┌──────────────────────────────────┐                     │
│   │  ⚠️ Verification Failed            │                     │
│   │                                   │                     │
│   │  Biometric match too low (75%).   │                     │
│   │  Please try again or use          │                     │
│   │  alternative method.              │                     │
│   │                                   │                     │
│   │  [Try Again] [Use QR]             │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│   Already Recorded:                                         │
│   ┌──────────────────────────────────┐                     │
│   │  ℹ️ Already Marked                 │                     │
│   │                                   │                     │
│   │  You've already marked attendance │                     │
│   │  for this session.                │                     │
│   │                                   │                     │
│   │  Marked at: 10:05 AM              │                     │
│   │  Method: Face ID                  │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
│   Outside Geofence:                                         │
│   ┌──────────────────────────────────┐                     │
│   │  📍 Location Error                │                     │
│   │                                   │                     │
│   │  You must be in the classroom     │                     │
│   │  to mark attendance.              │                     │
│   │                                   │                     │
│   │  Current location is too far      │                     │
│   │  from LT 5.                       │                     │
│   └──────────────────────────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 **IMPLEMENTATION PHASES**

### **⚠️ IMPORTANT: Admin-Generated Links Removed**

The old admin-generated biometric enrollment link feature has been **removed** from both frontend and backend. This ensures a clean, scalable self-service approach where students enroll themselves without admin intervention.

**Removed:**
- ❌ `POST /api/students/:id/biometric-enrollment-link` backend endpoint
- ❌ "Generate Biometric Link" button in StudentsPage
- ❌ Biometric Link Modal in frontend
- ❌ `generateBiometricEnrollmentLink` API function

**Why:** The self-service portal is superior because it scales infinitely, requires zero admin work, and is always available to students.

---

### **Phase 1: Foundation (Week 1) - 5 Days**

#### **1.1 Project Setup**
- [ ] Create `web/src/pages/attendance/` directory structure
- [ ] Set up React Router routes:
  - `/attendance/:token` - Main attendance portal
  - `/enroll/biometric` - Biometric enrollment
- [ ] Install dependencies:
  - WebAuthn library (@simplewebauthn/browser)
  - QR scanner library (html5-qrcode)
  - Geolocation API wrapper
- [ ] Configure API client for attendance endpoints

#### **1.2 Link Validation Screen**
**File:** `web/src/pages/attendance/AttendancePortal.tsx`

Features:
- [ ] Accept session token from URL parameter
- [ ] Call `/api/class-attendance/links/validate` endpoint
- [ ] Display loading spinner during validation
- [ ] Show session info: course code, name, lecturer, venue, time
- [ ] Handle invalid/expired links with error message
- [ ] Redirect to method selection if valid

#### **1.3 Session Info Display Component**
**File:** `web/src/components/attendance/SessionHeader.tsx`

Display:
- [ ] Course code and name (large, bold)
- [ ] Lecturer name with icon
- [ ] Venue with location icon
- [ ] Time with clock icon
- [ ] Status indicator (Active/Ended)

#### **1.4 Device Support Detection Utility**
**File:** `web/src/utils/biometric.ts`

Functions:
```typescript
- checkDeviceSupport(): Promise<DeviceSupport>
- getBiometricType(): 'touchid' | 'faceid' | 'fingerprint' | 'none'
- isWebAuthnAvailable(): boolean
```

---

### **Phase 2: Biometric System (Week 2) - 7 Days**

#### **2.1 Biometric Enrollment Portal**
**File:** `web/src/pages/enroll/BiometricEnrollment.tsx`

Features:
- [ ] Index number input form
- [ ] Student validation (check if exists, not enrolled)
- [ ] Device capability check with clear messaging
- [ ] "Device not supported" fallback screen
- [ ] WebAuthn registration flow
- [ ] Progress indicator during enrollment
- [ ] Success confirmation with next steps
- [ ] Error handling (already enrolled, hash collision, etc.)

#### **2.2 WebAuthn Integration**
**File:** `web/src/services/webauthn.ts`

Implement:
- [ ] `registerBiometric(studentId)` - Enrollment
- [ ] `verifyBiometric()` - Authentication
- [ ] `createCredential()` - WebAuthn credential creation
- [ ] `getAssertion()` - WebAuthn assertion
- [ ] Hash generation (SHA-256)
- [ ] Confidence score calculation

#### **2.3 Biometric Enrollment Status Check**
**File:** `web/src/hooks/useBiometricStatus.ts`

Custom hook:
```typescript
const { enrolled, provider, deviceSupported, loading } = useBiometricStatus(studentId);
```

- [ ] Fetch student biometric enrollment status
- [ ] Check device capability
- [ ] Cache result for session
- [ ] Return combined state

#### **2.4 Enrollment Prompt Component**
**File:** `web/src/components/attendance/EnrollmentPrompt.tsx`

Displays when:
- Student not enrolled
- Device supports biometric
- First time on attendance portal

Features:
- [ ] Benefits list (fast, secure, convenient)
- [ ] "Enroll Now" button → enrollment portal
- [ ] "Maybe Later" button → continue with alternatives
- [ ] Don't show again checkbox

---

### **Phase 3: Attendance Methods (Week 3) - 7 Days**

#### **3.1 Method Selection Screen**
**File:** `web/src/pages/attendance/MethodSelection.tsx`

Features:
- [ ] Three method cards (Biometric, QR, Manual)
- [ ] Biometric card: Prominent, recommended badge
- [ ] QR card: Camera icon, "Self-scan" label
- [ ] Manual card: Keyboard icon, "Fallback" label
- [ ] Disabled state for biometric if not enrolled
- [ ] Enrollment prompt for unenrolled users
- [ ] Device not supported message if applicable

#### **3.2 Biometric Verification Screen**
**File:** `web/src/pages/attendance/BiometricVerification.tsx`

Features:
- [ ] "Scan Fingerprint" prompt
- [ ] WebAuthn authentication flow
- [ ] Loading spinner during verification
- [ ] Confidence score calculation
- [ ] API call to record attendance
- [ ] Success/error feedback
- [ ] Retry button on failure
- [ ] Alternative method suggestion on low confidence

#### **3.3 QR Self-Scan Screen**
**File:** `web/src/pages/attendance/QRSelfScan.tsx`

Features:
- [ ] Camera permission request
- [ ] Live camera preview
- [ ] QR code detection (html5-qrcode)
- [ ] Visual feedback on successful scan
- [ ] Extract student ID from QR data
- [ ] API call to record attendance
- [ ] Error handling (invalid QR, wrong format)
- [ ] Manual entry fallback button

#### **3.4 Manual Index Entry Screen**
**File:** `web/src/pages/attendance/ManualEntry.tsx`

Features:
- [ ] Index number input field
- [ ] Format validation (matches pattern)
- [ ] Student lookup on submit
- [ ] Display student details (photo, name, program)
- [ ] Visual confirmation interface
- [ ] API call to record attendance
- [ ] Error handling (student not found, already recorded)

---

### **Phase 4: Integration & Security (Week 4) - 7 Days**

#### **4.1 Geofencing Validation**
**File:** `web/src/utils/geolocation.ts`

Features:
- [ ] Request location permission
- [ ] Get current coordinates
- [ ] Calculate distance from venue
- [ ] 50m radius validation
- [ ] Handle location errors/denied permission
- [ ] Fallback behavior (lecturer approval?)

#### **4.2 Attendance Recording Service**
**File:** `web/src/services/attendance.ts`

Functions:
```typescript
- recordBiometric(sessionId, hash, confidence, location)
- recordQR(sessionId, qrData, location)
- recordManual(sessionId, indexNumber, location)
- validateSession(token)
- checkDuplicate(sessionId, studentId)
```

#### **4.3 Real-Time Updates (Socket.IO)**
**File:** `web/src/hooks/useAttendanceSocket.ts`

Features:
- [ ] Connect to Socket.IO server
- [ ] Listen for session:ended event
- [ ] Listen for attendance:recorded event (for confirmation)
- [ ] Auto-refresh on session status change
- [ ] Show "Session ended" message if detected

#### **4.4 Error Handling & Feedback**
**File:** `web/src/components/attendance/ErrorBoundary.tsx`

Handle:
- [ ] Low confidence (< 80%) → Retry or alternative
- [ ] Already recorded → Show existing record time
- [ ] Outside geofence → Clear error message
- [ ] Session expired → Redirect with message
- [ ] Network errors → Offline detection
- [ ] Invalid token → 404 page

#### **4.5 Success Confirmation Screen**
**File:** `web/src/pages/attendance/Success.tsx`

Display:
- [ ] Checkmark animation
- [ ] Student details (name, index)
- [ ] Course info
- [ ] Timestamp
- [ ] Verification method used
- [ ] Confidence score (if biometric)
- [ ] "Done" button to close
- [ ] Auto-close after 5 seconds

---

### **Phase 5: Testing & Polish (Week 5) - 5 Days**

#### **5.1 Cross-Browser Testing**
Test on:
- [ ] Chrome (Android)
- [ ] Safari (iOS)
- [ ] Firefox (Desktop)
- [ ] Edge (Desktop)
- [ ] Samsung Internet (Android)

#### **5.2 Device Testing**
Test on:
- [ ] iPhone with Touch ID
- [ ] iPhone with Face ID
- [ ] Android with Fingerprint
- [ ] Android without biometric
- [ ] iPad/Tablet
- [ ] Desktop (manual entry only)

#### **5.3 Security Audit**
Verify:
- [ ] No raw biometric data stored
- [ ] Hashes properly generated (SHA-256)
- [ ] HTTPS enforced
- [ ] Geofencing working correctly
- [ ] Rate limiting on endpoints
- [ ] No SQL injection vulnerabilities
- [ ] XSS protection
- [ ] CORS properly configured

#### **5.4 Performance Optimization**
- [ ] Lazy load camera component
- [ ] Optimize QR detection speed
- [ ] Minimize bundle size
- [ ] Add service worker for offline detection
- [ ] Cache session data
- [ ] Optimize API calls

#### **5.5 UX Polish**
- [ ] Add loading skeletons
- [ ] Smooth transitions between screens
- [ ] Haptic feedback on success (mobile)
- [ ] Sound effects (optional)
- [ ] Dark mode support
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Progressive Web App (PWA) setup

---

## 🛠️ **TECHNICAL REQUIREMENTS**

### **Frontend Dependencies**

```json
{
  "dependencies": {
    "@simplewebauthn/browser": "^9.0.0",  // WebAuthn
    "html5-qrcode": "^2.3.8",             // QR Scanner
    "socket.io-client": "^4.6.0",         // Real-time
    "react-router-dom": "^6.20.0",        // Routing
    "axios": "^1.6.0"                     // HTTP
  }
}
```

### **Backend APIs Needed**

#### **Already Implemented ✅**
- `POST /api/class-attendance/record/biometric`
- `POST /api/class-attendance/biometric/enroll`
- `POST /api/class-attendance/record/index`
- `POST /api/class-attendance/record/qr`

#### **New APIs Needed ❌**
```typescript
// Session link validation
GET /api/class-attendance/links/validate?token=ABC123
Response: {
  valid: boolean,
  session: SessionInfo | null,
  error?: string
}

// Student biometric status
GET /api/students/:id/biometric-status
Response: {
  enrolled: boolean,
  provider?: string,
  enrolledAt?: Date
}

// Student lookup by index
GET /api/students/lookup?indexNumber=20230001
Response: {
  id: string,
  indexNumber: string,
  firstName: string,
  lastName: string,
  profilePicture: string,
  program: string,
  level: number
}
```

### **Database Schema (Already Done ✅)**

```prisma
model Student {
  biometricTemplateHash String?  @unique
  biometricEnrolledAt   DateTime?
  biometricDeviceId     String?
  biometricProvider     String?
  // ... other fields
}

model ClassAttendance {
  verificationMethod   String  // 'BIOMETRIC_FINGERPRINT', 'BIOMETRIC_FACE', etc.
  biometricConfidence  Float?  // 0.0 - 1.0
  // ... other fields
}
```

---

## 📊 **PROGRESS TRACKING**

### **Pre-Phase 1: Cleanup** ✅ **COMPLETED**
- [x] Remove admin-generated biometric link feature from backend (100%)
- [x] Remove "Generate Biometric Link" button from StudentsPage (100%)
- [x] Remove Biometric Link Modal from frontend (100%)
- [x] Remove `generateBiometricEnrollmentLink` API function (100%)
- [x] Remove `BiometricEnrollmentLinkResponse` interface (100%)
- [x] Remove unused `Fingerprint` icon import (100%)

**Result:** Clean slate ready for self-service implementation

---

### **Phase 1: Foundation** ✅ **COMPLETED (Week 1)**
- [x] Project setup (100%)
  - Created `web/src/pages/attendance/` directory
  - Created `web/src/pages/enroll/` directory
  - Installed `@simplewebauthn/browser` v9.0.0
  - Installed `html5-qrcode` v2.3.8
- [x] Link validation screen (100%)
  - Created `AttendancePortal.tsx` with token validation
  - Session info display component
  - Loading, error, and success states
  - Responsive mobile-first design
- [x] Session info display (100%)
  - Course code and name display
  - Lecturer name, venue, time
  - Active recording badge
- [x] Device detection utility (100%)
  - Created `web/src/utils/biometric.ts`
  - WebAuthn API detection
  - Biometric type detection (Face ID, Touch ID, Fingerprint)
  - Device ID generation
- [x] Attendance API client (100%)
  - Created `web/src/api/classAttendancePortal.ts`
  - All endpoints typed and documented
- [x] React Router routes (100%)
  - `/attendance/:token` for attendance portal
  - `/enroll/biometric` for enrollment portal

**Completed:** January 3, 2026

---

### **Phase 1.5: Student Personal Attendance Ledger** ✅ **COMPLETED (Week 1 - Day 6)**

**NEW FEATURE: Privacy-First Local Storage**

Students maintain their own attendance history on their device (not server). This provides:
- Personal proof of attendance
- Dispute resolution evidence
- Offline access to history
- CSV export capability

#### **1.5.1 Local Storage System** ✅
- [x] Create `localStorage` utility for attendance records
  - Save attendance record after successful marking
  - Retrieve all records
  - Filter by date, course, method
  - Clear specific/all records
  - Export to CSV
- [x] Created `attendanceStorage.ts` utility with complete API

#### **1.5.2 Profile Picture Caching** ✅
- [x] Create profile picture caching utility
  - Download profile picture on first attendance
  - Convert to base64
  - Store in localStorage with indexNumber key
  - Reuse cached picture for future attendances
  - Size limits (max 100KB per image, 10MB total cache)
  - Auto-cleanup when exceeding limits

#### **1.5.3 Attendance History Component** ✅
- [x] Created `AttendanceHistory.tsx` component
  - List view grouped by date
  - Show: Course, Date/Time, Method, Confidence, Profile picture
  - Filter controls (date range, course, method)
  - Empty state when no history
  - "Export CSV" button with filename generation
  - "Clear History" button with confirmation dialog
  - Stats overview (total sessions, courses, methods)
  - Compact mode for embedded use

#### **1.5.4 CSV Export Utility** ✅
- [x] CSV export function in attendanceStorage.ts
  - Headers: Date, Time, Index, Name, Course, Venue, Method, Confidence
  - Filename: `attendance_history_YYYYMMDD.csv`
  - Download via blob URL

#### **1.5.5 Integration** ✅
- [x] Updated `AttendancePortal.tsx`
  - Shows history below valid session (recent 3 records)
  - Shows history even when link invalid (5 records)
  - "View All" link to /my-attendance page
  - Max-width responsive layout
- [x] Created `/my-attendance` route
  - Standalone full history page
  - Student info header with profile picture
  - Stats cards (total, courses, biometric, latest)
  - Complete AttendanceHistory component
  - Works without active session
- [x] Invalid link page enhanced
  - Shows history section
  - Message: "View your past attendance below"
  - Full export/filter capabilities

#### **1.5.6 Data Privacy Notice** ✅
- [x] Added privacy notice to /my-attendance page
  - "Your Data, Your Device" card
  - Explains local-only storage
  - Warning about clearing browser data
  - Export backup reminder

**Completed:** January 3, 2026

**Features Delivered:**
- ✅ Local storage system (500 record limit)
- ✅ Profile picture caching (auto-cleanup)
- ✅ Attendance history UI (filters, export, stats)
- ✅ Integration into AttendancePortal
- ✅ Standalone /my-attendance page
- ✅ Privacy-first architecture
- ✅ CSV export for backup
- ✅ Offline-capable

---

### **Phase 2: Biometric System** ✅ **PHASE 2.1 COMPLETED (Week 2 - Days 1-3)**

Self-service biometric enrollment + attendance verification system using WebAuthn.

#### **2.1 Biometric Enrollment Portal** ✅
- [x] Create multi-step enrollment flow
  - Step 1: Index number validation (student lookup)
  - Step 2: Device capability check (WebAuthn support)
  - Step 3: Unsupported device handler (alternative methods)
  - Step 4: WebAuthn registration (biometric capture)
  - Step 5: Backend enrollment (save to database)
  - Step 6: Success confirmation (enrollment details)
- [x] Created `webauthn.ts` service utility
  - `registerBiometric()` - Enrollment flow with credential creation
  - `verifyBiometric()` - Authentication flow for attendance
  - `calculateConfidenceScore()` - 70-100% confidence calculation
  - `generateBiometricHash()` - SHA-256 hashing of credential ID
  - Error handling with user-friendly messages
- [x] Complete `BiometricEnrollment.tsx` component (580+ lines)
  - Progress indicator (5 steps)
  - Student card display with profile picture
  - Device capability detection
  - Biometric capture with WebAuthn
  - Backend enrollment with API integration
  - Success screen with enrollment summary
  - Back navigation and error recovery
- [x] Profile picture caching integration
- [x] Device support detection integration
- [x] API client integration (lookupStudent, enrollBiometric)

**Completed:** January 3, 2026

**Features Delivered:**
- ✅ Complete 6-step enrollment wizard
- ✅ WebAuthn integration with credential creation
- ✅ SHA-256 biometric hash generation
- ✅ Confidence score calculation (70-100%)
- ✅ Device capability detection
- ✅ Student verification with profile display
- ✅ Error handling and user cancellation
- ✅ Backend enrollment storage
- ✅ Success confirmation with next steps

#### **2.2 WebAuthn Integration Service** ✅
(Completed as part of 2.1)

#### **2.3 Enrollment Status Hook** ✅ **COMPLETED (Week 2 - Day 6)**
- [x] Create `useBiometricStatus.ts` custom hook
  - Fetch enrollment status from API
  - Check device capability in parallel
  - Cache result in sessionStorage (24h)
  - Return combined state object
  - Refetch function for manual refresh
- [x] Enrollment status caching
  - Key by student index number
  - 24-hour expiration
  - Session-scoped (cleared on browser close)
- [x] Created `useBiometricStatus()` hook
  - Returns: {enrolled, provider, enrolledAt, deviceSupported, deviceType, loading, error, refetch}
  - Parallel API + device checks for performance
  - Automatic cache management

**Completed:** January 3, 2026

**Features Delivered:**
- ✅ Enrollment status fetching with caching
- ✅ Device capability detection
- ✅ Combined status object
- ✅ Performance optimized with parallel checks
- ✅ 24-hour cache duration
- ✅ Manual refetch support

#### **2.4 Enrollment Prompt Component** ✅ **COMPLETED (Week 2 - Day 7)**
- [x] Create `EnrollmentPrompt.tsx` component
  - Display when: not enrolled + device supported + not dismissed
  - Benefits grid (3 cards: speed, security, offline)
  - "Enroll Now" CTA button → `/enroll/biometric`
  - "Maybe Later" dismiss button
  - "Don't show again" checkbox
  - Trust badge about data security
- [x] Create dismissal utility functions
  - `enrollmentPromptStorage.ts` utilities
  - `isEnrollmentPromptDismissed()` - check status
  - `setEnrollmentPromptDismissed()` - mark as dismissed
  - `clearEnrollmentPromptDismissal()` - reset (testing)
- [x] Integrate into AttendancePortal
  - Show after successful session validation
  - Conditional rendering based on status
  - Smooth dismissal animation

**Completed:** January 3, 2026

**Features Delivered:**
- ✅ Attractive enrollment prompt UI
- ✅ Benefits grid with icons
- ✅ Dismissal preference storage
- ✅ Integrated into AttendancePortal
- ✅ Conditional visibility logic
- ✅ Device-specific messaging

---

### **Phase 3: Attendance Verification Methods** ⏳ **NEXT (Week 3)**
- [ ] Enrollment portal (0%)
- [ ] WebAuthn integration (0%)
- [ ] Status check hook (0%)
- [ ] Enrollment prompt (0%)

**Target:** Week 2 (7 days)

### **Phase 3: Attendance Methods** ⏳ **NOT STARTED**
- [ ] Method selection (0%)
- [ ] Biometric verification (0%)
- [ ] QR self-scan (0%)
- [ ] Manual entry (0%)

**Target:** Week 3 (7 days)

### **Phase 4: Integration & Security** ⏳ **NOT STARTED**
- [ ] Geofencing (0%)
- [ ] Attendance service (0%)
- [ ] Socket.IO updates (0%)
- [ ] Error handling (0%)
- [ ] Success screen (0%)

**Target:** Week 4 (7 days)

### **Phase 5: Testing & Polish** ⏳ **NOT STARTED**
- [ ] Cross-browser testing (0%)
- [ ] Device testing (0%)
- [ ] Security audit (0%)
- [ ] Performance optimization (0%)
- [ ] UX polish (0%)

**Target:** Week 5 (5 days)

---

## 🎯 **SUCCESS CRITERIA**

### **Functional Requirements**
✅ Students can enroll biometric in < 30 seconds  
✅ Biometric attendance takes < 3 seconds  
✅ QR self-scan takes < 3 seconds  
✅ Manual entry takes < 15 seconds  
✅ Geofencing validates 50m radius  
✅ Confidence threshold enforced (>= 80%)  
✅ Duplicate prevention works  
✅ Real-time updates to lecturer dashboard  
✅ Error messages are clear and actionable  

### **Security Requirements**
✅ No raw biometric data stored  
✅ SHA-256 hashing implemented  
✅ HTTPS enforced  
✅ Rate limiting on endpoints  
✅ SQL injection prevented  
✅ XSS protection enabled  
✅ CORS properly configured  

### **Performance Requirements**
✅ Page load < 2 seconds  
✅ Biometric verification < 3 seconds  
✅ QR scan detection < 1 second  
✅ API response time < 500ms  
✅ Works on 3G networks  

### **UX Requirements**
✅ Mobile-first responsive design  
✅ Works on iOS Safari and Chrome Android  
✅ Clear instructions at each step  
✅ Accessible (WCAG 2.1 AA)  
✅ Dark mode support  
✅ Offline detection with helpful message  

---

## 🚀 **GETTING STARTED**

### **Step 1: Review This Document**
Ensure you understand:
- Biometric enrollment flow
- Attendance marking flow
- Three verification methods
- Security principles

### **Step 2: Set Up Development Environment**
```bash
# Navigate to web directory
cd web

# Install dependencies
npm install @simplewebauthn/browser html5-qrcode

# Create directory structure
mkdir -p src/pages/attendance
mkdir -p src/pages/enroll
mkdir -p src/components/attendance
mkdir -p src/services
mkdir -p src/utils
mkdir -p src/hooks
```

### **Step 3: Start with Phase 1.1**
Begin with project setup and link validation screen.

### **Step 4: Test Early and Often**
Test each feature immediately after implementation.

---

## 📝 **NOTES**

### **Design Decisions**

1. **WebAuthn over Proprietary Biometric APIs**
   - Standard protocol, widely supported
   - Better security, no vendor lock-in
   - Works across iOS and Android

2. **Three Methods (Not Just One)**
   - Biometric: Best UX, highest security
   - QR: Fallback for unenrolled
   - Manual: Universal fallback

3. **Client-Side Biometric Processing**
   - Raw biometric never sent to server
   - Reduces privacy concerns
   - Complies with biometric data laws

4. **50m Geofencing Radius**
   - Accounts for GPS accuracy (±10m)
   - Covers typical classroom + nearby areas
   - Not too strict to cause false negatives

5. **80% Confidence Threshold**
   - Balances security and usability
   - Industry standard for biometric auth
   - Low enough to handle minor variations

### **Future Enhancements (Post-Launch)**

- [ ] Facial recognition (if WebAuthn supports)
- [ ] Voice recognition option
- [ ] NFC tap-to-mark (if devices support)
- [ ] Bluetooth beacon proximity detection
- [ ] Attendance history for students
- [ ] Push notifications (session started)
- [ ] Progressive Web App (PWA) with offline support
- [ ] QR code generation for students without ID cards

---

**Last Updated:** January 3, 2026  
**Next Review:** After Phase 1 completion  
**Document Owner:** Development Team
