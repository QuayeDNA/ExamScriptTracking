# Class Attendance Module - Testing Guide

## Shared Credentials

**Email:** `attendance@examtrack.com`  
**Password:** `Attendance@123`

These credentials are shared across all mobile devices used for class attendance recording.

## Test Flow

### 1. Login on Mobile Device

1. Open the mobile app
2. Enter the shared CLASS_REP credentials:
   - Email: `attendance@examtrack.com`
   - Password: `Attendance@123`
3. You should be automatically redirected to the **Attendance Dashboard** (not the scanner)

### 2. Set Up Device Session

1. On the Attendance Dashboard, you'll see your device ID
2. Give your device a name (e.g., "Lecture Hall A - iPad", "Main Building - Tab 1")
3. Click **Save Device Name**

### 3. Start Recording Attendance

1. Fill in optional details:
   - **Lecturer Name**: e.g., "Dr. Jane Doe"
   - **Course Code**: e.g., "CS301"
   - **Course Name**: e.g., "Data Structures"
   - **Notes**: e.g., "Morning lecture"
2. Click **Start Recording**
3. You'll be taken to the scanning screen

### 4. Scan Student QR Codes

1. Point the camera at a student's QR code
2. Upon successful scan:
   - You'll see a success toast with the student's name
   - The student count will increment
   - The last scanned student info will display
3. The scanner will auto-reset after 2 seconds for the next scan

### 5. End Recording

1. Click **End Recording** button at the bottom
2. Confirm in the alert dialog
3. You'll be taken back to the Attendance Dashboard
4. The completed recording will appear in the History section

### 6. View Recording History

- **Ongoing Recordings**: Shows active recording sessions you can resume
- **History**: Shows completed recordings with:
  - Course code and name
  - Number of students scanned
  - Status (COMPLETED, CANCELLED, etc.)

## Sample Students for Testing

The database has been seeded with 3 sample students:

1. **John Doe** (STU001) - Computer Science, Level 300
2. **Jane Smith** (STU002) - Information Technology, Level 300
3. **Bob Johnson** (STU003) - Software Engineering, Level 400

## Testing Multiple Devices

You can log in with the same credentials on multiple devices:

- Each device gets a unique session
- Each device can have its own name
- Recordings are tied to the device session
- All devices share the same user account

## API Endpoints Being Used

- `POST /class-attendance/sessions` - Create/get device session
- `POST /class-attendance/records` - Start new recording
- `POST /class-attendance/records/attendance` - Record student scan
- `POST /class-attendance/records/:id/end` - End recording
- `GET /class-attendance/sessions/:id/records` - Get recording history
- `GET /class-attendance/records/:id` - Get specific record details

## Troubleshooting

### Device ID Not Showing

- The app auto-generates a device ID on first launch
- Check device permissions for secure storage

### Camera Not Working

- Ensure camera permissions are granted
- Check that the device has a working camera

### Student Not Found Error

- Verify the student exists in the database
- Check QR code format matches expected structure

### Backend Connection Issues

- Ensure backend server is running
- Check mobile app's API endpoint configuration
- Verify network connectivity

## Next Steps

After testing, you can:

1. Generate real student QR codes from the student database
2. Print QR codes as student ID cards
3. Deploy on multiple tablets/devices in different lecture halls
4. Export attendance data for record-keeping
5. Integrate with existing student management systems
