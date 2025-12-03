# Phase 2 Testing Guide - Exam Script Tracking System

## Prerequisites Setup

### 1. Start the Backend Server
```powershell
cd backend
npm run dev
```
**Expected**: Server running on `http://localhost:3000`

### 2. Start the Web Application
```powershell
cd web
npm run dev
```
**Expected**: Web app running on `http://localhost:5173`

### 3. Start the Mobile App
```powershell
cd mobile
npx expo start
```
**Expected**: Expo dev server running, scan QR code with Expo Go app

---

## Test Scenario 1: Student Management (Phase 2.1-2.2)

### Web Application Testing

1. **Login as Admin**
   - Navigate to `http://localhost:5173`
   - Login with admin credentials
   - ✅ Verify: Dashboard loads successfully

2. **Navigate to Students Page**
   - Click "Students" in navigation
   - ✅ Verify: Empty table or existing students displayed

3. **Add Individual Student**
   - Click "Add Student" button
   - Fill in form:
     - Index Number: `2024001`
     - First Name: `John`
     - Last Name: `Doe`
     - Program: `Computer Science`
     - Level: `300`
   - Click "Add Student"
   - ✅ Verify: Success message appears
   - ✅ Verify: Student appears in table

4. **View Student QR Code**
   - Click "View QR" button on the student row
   - ✅ Verify: Modal opens with QR code displayed
   - ✅ Verify: QR code contains student data
   - Click "Download QR Code"
   - ✅ Verify: PNG file downloads

5. **Bulk Import Students**
   - Click "Import CSV" button
   - Create a test CSV file with this content:
     ```csv
     indexNumber,firstName,lastName,program,level
     2024002,Jane,Smith,Engineering,200
     2024003,Mike,Johnson,Business,400
     2024004,Sarah,Williams,Medicine,100
     ```
   - Upload the file
   - ✅ Verify: Success message shows "3 students imported"
   - ✅ Verify: All 3 students appear in table

6. **Search and Filter**
   - Type "Jane" in search box
   - ✅ Verify: Only Jane Smith appears
   - Select "Engineering" in program filter
   - ✅ Verify: Only Engineering students shown
   - Select "200" in level filter
   - ✅ Verify: Only level 200 students shown

7. **Edit Student**
   - Click "Edit" on a student
   - Change program to "Computer Science"
   - Click "Update"
   - ✅ Verify: Changes saved successfully

8. **Export Students**
   - Click "Export CSV" button
   - ✅ Verify: CSV file downloads with all students

---

## Test Scenario 2: Exam Session Management (Phase 2.3-2.4)

### Web Application Testing

1. **Navigate to Exam Sessions**
   - Click "Exam Sessions" in navigation
   - ✅ Verify: Exam sessions page loads

2. **Create New Exam Session**
   - Click "Create Exam Session" button
   - Fill in form:
     - Course Code: `CS301`
     - Course Name: `Data Structures`
     - Lecturer: Select from dropdown OR manually enter:
       - Lecturer ID: `LEC001`
       - Lecturer Name: `Dr. Smith`
     - Department: `Computer Science`
     - Faculty: `Engineering`
     - Venue: `Hall A`
     - Exam Date/Time: Select today's date and time
   - Click "Create"
   - ✅ Verify: Success message
   - ✅ Verify: Session appears in table with "IN_PROGRESS" status

3. **View Batch QR Code**
   - Click "View QR" button on the exam session
   - ✅ Verify: Modal shows batch QR code
   - ✅ Verify: Batch QR contains: course code, batch ID, venue, date
   - Download QR code
   - ✅ Verify: PNG file downloads

4. **Create More Exam Sessions**
   - Create 2-3 more sessions with different courses:
     - `MAT202 - Calculus II`
     - `ENG101 - Technical Writing`
   - ✅ Verify: All sessions created successfully

---

## Test Scenario 3: Mobile - Batch QR Scanning (Phase 2.5-2.6)

### Mobile App Testing

1. **Login to Mobile App**
   - Open mobile app on device/simulator
   - Login with credentials
   - ✅ Verify: Home screen appears

2. **Access Scanner**
   - Tap "Scan QR Code" button
   - ✅ Verify: Camera permission requested
   - Grant camera permission
   - ✅ Verify: Camera view opens

3. **Scan Batch QR Code**
   - Display the batch QR code from web (from previous test)
   - Point camera at the QR code
   - ✅ Verify: "✓ Scanned Successfully" appears
   - ✅ Verify: "✓ Exam Session Active" indicator shows
   - ✅ Verify: Navigates to batch details screen

4. **View Batch Details**
   - ✅ Verify: Batch information displayed (course, venue, lecturer)
   - ✅ Verify: Current status badge shown
   - ✅ Verify: "Transfer Actions" card visible

5. **Update Batch Status**
   - Tap status buttons to change status:
     - Tap "Submitted" status
     - Confirm in dialog
   - ✅ Verify: Status updates successfully
   - ✅ Verify: Status badge color changes
   - Try more status changes: IN_TRANSIT → WITH_LECTURER

---

## Test Scenario 4: Mobile - Student Attendance (Phase 2.7)

### Mobile App Testing

1. **Prepare Student QR Codes**
   - From web, download QR codes for 3-4 students
   - Print or display on another device

2. **Scan Batch QR First**
   - In mobile app, go to scanner
   - Scan the batch QR code
   - ✅ Verify: "Exam Session Active" shows

3. **Record Student Entry**
   - Scan first student's QR code
   - ✅ Verify: Navigates to student attendance screen
   - ✅ Verify: Shows "New Student Entry" alert
   - Tap "Record Entry"
   - ✅ Verify: Success message appears
   - ✅ Verify: Entry time displayed
   - ✅ Verify: Status shows "PRESENT" (blue badge)

4. **Record More Student Entries**
   - Go back to scanner
   - Scan 2-3 more student QR codes
   - Record entry for each
   - ✅ Verify: All entries recorded successfully

5. **Record Student Exit**
   - Scan a student who already entered
   - ✅ Verify: Attendance details loaded
   - ✅ Verify: Entry time shown
   - Tap "Record Exit" button
   - Confirm in dialog
   - ✅ Verify: Exit time now displayed
   - ✅ Verify: Status changed to "LEFT_WITHOUT_SUBMITTING" (red badge)

6. **Record Script Submission**
   - Scan same student again
   - Tap "Record Submission" button
   - Confirm in dialog
   - ✅ Verify: Submission time displayed
   - ✅ Verify: Status changed to "SUBMITTED" (green badge)

7. **Add Discrepancy Note**
   - Scan any student
   - Tap "Add/Update Discrepancy" button
   - Enter note: "Index number mismatch on cover page"
   - Tap "Save"
   - ✅ Verify: Success message
   - ✅ Verify: Discrepancy note displayed on screen

---

## Test Scenario 5: Batch Transfer System (Phase 2.8-2.9)

### Mobile App Testing

1. **Initiate Transfer from Batch Details**
   - Navigate to batch details (scan batch QR)
   - Scroll to "Transfer Actions" card
   - Tap "📤 Initiate Transfer" button
   - ✅ Verify: Transfer screen opens with batch info

2. **Create Transfer Request**
   - Select receiving handler from list
   - Enter scripts expected: `25`
   - Enter location: `Main Office`
   - Tap "Initiate Transfer"
   - Confirm in dialog
   - ✅ Verify: Success message appears

3. **View Pending Transfers**
   - Go back to home screen
   - Tap "Pending Transfers" button
   - ✅ Verify: Shows "Incoming" and "Outgoing" tabs
   - Check "Outgoing" tab
   - ✅ Verify: Transfer you created appears with "PENDING" badge

4. **Login as Different User (Receiver)**
   - Logout from mobile app
   - Login with different account (the receiver's account)
   - Tap "Pending Transfers"
   - Check "Incoming" tab
   - ✅ Verify: Transfer appears in incoming list

5. **Confirm Transfer (Matching Count)**
   - Tap on the pending transfer
   - ✅ Verify: Transfer details screen opens
   - ✅ Verify: Shows sender info, batch info, scripts expected
   - Scripts received field shows: `25` (pre-filled)
   - Keep it as `25` (matching)
   - Tap "Confirm Receipt"
   - Confirm in dialog
   - ✅ Verify: Success message: "Transfer confirmed successfully"
   - ✅ Verify: Status changed to "CONFIRMED" (green badge)

6. **Create Another Transfer with Discrepancy**
   - Login back as original user
   - Initiate new transfer for same batch
   - Scripts expected: `25`
   - Logout and login as receiver again
   - Tap pending transfer
   - Change scripts received to: `23`
   - ✅ Verify: Red warning appears: "⚠️ Discrepancy: Expected 25, but received 23"
   - ✅ Verify: Discrepancy note field becomes required
   - Enter note: "2 scripts missing from batch"
   - Tap "Confirm Receipt"
   - Confirm in dialog
   - ✅ Verify: Status shows "DISCREPANCY_REPORTED" (red badge)

7. **Reject Transfer**
   - Create another transfer
   - Login as receiver
   - Tap pending transfer
   - Tap "Reject Transfer"
   - ✅ Verify: Reason prompt appears
   - Enter reason: "Unable to receive at this time"
   - Confirm
   - ✅ Verify: Transfer rejected and removed from list

8. **View Transfer History**
   - Go to batch details screen
   - Tap "📋 View Transfer History" button
   - ✅ Verify: Chain of custody screen opens
   - ✅ Verify: All transfers shown in timeline format
   - ✅ Verify: From → To handlers displayed
   - ✅ Verify: Status badges shown correctly
   - ✅ Verify: Discrepancy notes visible with red highlight

---

## Test Scenario 6: Web - Batch Tracking Dashboard (Phase 2.10)

### Web Application Testing

1. **Navigate to Batch Tracking**
   - In web app, click "Batch Tracking" in navigation
   - ✅ Verify: Batch tracking dashboard loads

2. **View Batch List**
   - ✅ Verify: Left panel shows all exam sessions
   - ✅ Verify: Each batch shows course code, name, venue, status
   - ✅ Verify: Status badges color-coded correctly

3. **Search Batches**
   - Type course code in search box (e.g., "CS301")
   - ✅ Verify: Only matching batches shown
   - Clear search
   - Type batch QR code
   - ✅ Verify: Specific batch filtered

4. **Filter by Status**
   - Select "IN_TRANSIT" from status dropdown
   - ✅ Verify: Only batches with IN_TRANSIT status shown
   - Select "All Statuses"
   - ✅ Verify: All batches visible again

5. **View Batch Details**
   - Click on a batch from the list
   - ✅ Verify: Right panel populates with batch details
   - ✅ Verify: Batch information card shows all details
   - ✅ Verify: Current location card shows handler name, role, email

6. **View Chain of Custody**
   - Scroll down in details panel
   - ✅ Verify: "Chain of Custody" section visible
   - ✅ Verify: Timeline with dots and connectors displayed
   - ✅ Verify: Each transfer shows:
     - From handler → To handler
     - Scripts expected and received
     - Timestamps (requested and confirmed)
     - Status badge
   - ✅ Verify: Transfers with discrepancies highlighted in red
   - ✅ Verify: Discrepancy notes shown in red boxes

7. **Check Multiple Batches**
   - Click different batches from list
   - ✅ Verify: Details update immediately
   - ✅ Verify: Current handler changes based on latest transfer
   - ✅ Verify: Transfer history specific to each batch

---

## Test Scenario 7: End-to-End Workflow

### Complete Exam Lifecycle

1. **Web: Create Exam Session**
   - Create new exam session: `PHY301 - Quantum Physics`
   - Download batch QR code

2. **Mobile: Start Exam**
   - Scan batch QR code
   - Update status to "IN_PROGRESS"

3. **Mobile: Record Attendance**
   - Scan 4-5 student QR codes
   - Record entry for all students

4. **Mobile: Record Submissions**
   - Scan 3 students and record submissions
   - Leave 1-2 students without submission (simulate walk-outs)

5. **Mobile: Close Exam**
   - Update batch status to "SUBMITTED"

6. **Mobile: Transfer to Handler**
   - Initiate transfer with scripts expected: `3`
   - Login as receiver and confirm with matching count

7. **Mobile: Transfer to Lecturer**
   - Login as handler, initiate transfer to lecturer
   - Login as lecturer, confirm receipt
   - Update status to "WITH_LECTURER"

8. **Web: Track Complete Journey**
   - Go to Batch Tracking dashboard
   - Search for PHY301 batch
   - ✅ Verify: Current location shows lecturer
   - ✅ Verify: Complete chain of custody visible:
     - Invigilator → Handler → Lecturer
   - ✅ Verify: All transfer timestamps recorded
   - ✅ Verify: Status shows "WITH_LECTURER"

9. **Continue Through Grading**
   - Update status: UNDER_GRADING → GRADED → RETURNED → COMPLETED
   - ✅ Verify: Status updates reflected in batch tracking

---

## Expected Issues to Test

### Error Scenarios

1. **Scan Student Without Active Batch**
   - Clear active session (restart app)
   - Try scanning student QR
   - ✅ Verify: Alert says "Please scan Batch QR Code first"

2. **Duplicate Entry**
   - Record student entry
   - Try recording entry again for same student
   - ✅ Verify: Error message about duplicate entry

3. **Invalid QR Code**
   - Scan random QR code (not from system)
   - ✅ Verify: Error message shown

4. **Transfer to Self**
   - Try creating transfer where sender = receiver
   - ✅ Verify: Error prevented

5. **Confirm Already Confirmed Transfer**
   - Try confirming same transfer twice
   - ✅ Verify: Error message shown

---

## Performance Checks

1. **Load Time**
   - ✅ Batch list loads in < 2 seconds
   - ✅ Transfer history loads in < 1 second
   - ✅ QR scanning responds immediately

2. **Refresh Behavior**
   - Pull to refresh on mobile lists
   - ✅ Verify: Data updates correctly

3. **Multiple Sessions**
   - Create 10+ exam sessions
   - ✅ Verify: Search and filters work efficiently
   - ✅ Verify: Pagination handles large datasets

---

## Summary Checklist

- [ ] All students can be created and managed
- [ ] Student QR codes generate and download correctly
- [ ] Bulk CSV import works
- [ ] Exam sessions create successfully
- [ ] Batch QR codes generate correctly
- [ ] Mobile scanner detects QR codes
- [ ] Batch status updates work
- [ ] Student attendance records correctly
- [ ] Entry/exit/submission tracking accurate
- [ ] Discrepancy notes save properly
- [ ] Transfer requests create successfully
- [ ] Transfer confirmations work
- [ ] Discrepancy detection triggers on count mismatch
- [ ] Transfer history displays complete chain
- [ ] Web batch tracking shows real-time data
- [ ] Current handler displays correctly
- [ ] Search and filters work properly
- [ ] All status color coding correct
- [ ] Error handling works for edge cases

**When all items checked, Phase 2 testing is complete!** ✅