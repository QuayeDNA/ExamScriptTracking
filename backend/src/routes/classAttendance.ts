import express from "express";
import {
  createOrGetAttendanceSession,
  getAttendanceSessionByToken,
  getAttendanceSessions,
  updateAttendanceSession,
  createAttendanceRecord,
  recordStudentAttendance,
  recordBiometricAttendance,
  confirmAttendance,
  endAttendanceRecord,
  getAttendanceRecords,
  getAttendanceRecord,
  getAttendanceRecordById,
  getAutocompleteValues,
  deleteAttendanceRecord,
} from "../controllers/classAttendanceController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { Role } from "@prisma/client";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Mobile App Routes (Class Attendance Recorder role)

// Create or get attendance session (for mobile app login)
router.post("/sessions", createOrGetAttendanceSession);

// Get session by token (mobile app authentication)
router.get("/sessions/token/:token", getAttendanceSessionByToken);

// Create new attendance record
router.post(
  "/records",
  authorize(Role.ADMIN, Role.CLASS_REP),
  createAttendanceRecord
);

// Record student attendance (QR scan)
router.post(
  "/records/attendance",
  authorize(Role.ADMIN, Role.CLASS_REP),
  recordStudentAttendance
);

// Record biometric attendance
router.post(
  "/records/attendance/biometric",
  authorize(Role.ADMIN, Role.CLASS_REP),
  recordBiometricAttendance
);

// Confirm manual attendance entry
router.post(
  "/records/attendance/confirm",
  authorize(Role.ADMIN, Role.CLASS_REP),
  confirmAttendance
);

// End attendance record
router.post(
  "/records/:recordId/end",
  authorize(Role.ADMIN, Role.CLASS_REP),
  endAttendanceRecord
);

// Delete attendance record (only if no students recorded)
router.delete(
  "/records/:recordId",
  authorize(Role.ADMIN, Role.CLASS_REP),
  deleteAttendanceRecord
);

// Get autocomplete values (lecturer names, course names, course codes)
router.get(
  "/autocomplete",
  authorize(Role.ADMIN, Role.CLASS_REP),
  getAutocompleteValues
);

// Get attendance records for a session
router.get(
  "/sessions/:sessionId/records",
  authorize(Role.ADMIN, Role.CLASS_REP),
  getAttendanceRecords
);

// Get specific attendance record with full details
router.get(
  "/records/:recordId",
  authorize(Role.ADMIN, Role.CLASS_REP),
  getAttendanceRecordById
);

// Get specific attendance record (legacy route)
router.get(
  "/records/:id",
  authorize(Role.ADMIN, Role.CLASS_REP),
  getAttendanceRecord
);

// Admin Routes (Admin only)

// Get all attendance sessions with pagination and search
router.get("/admin/sessions", authorize(Role.ADMIN), getAttendanceSessions);

// Update attendance session (revoke, update name, etc.)
router.patch(
  "/admin/sessions/:id",
  authorize(Role.ADMIN),
  updateAttendanceSession
);

export default router;
