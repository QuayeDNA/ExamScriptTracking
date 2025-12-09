import express from "express";
import {
  createOrGetAttendanceSession,
  getAttendanceSessionByToken,
  getAttendanceSessions,
  updateAttendanceSession,
  createAttendanceRecord,
  recordStudentAttendance,
  endAttendanceRecord,
  getAttendanceRecords,
  getAttendanceRecord,
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

// End attendance record
router.post(
  "/records/:recordId/end",
  authorize(Role.ADMIN, Role.CLASS_REP),
  endAttendanceRecord
);

// Get attendance records for a session
router.get(
  "/sessions/:sessionId/records",
  authorize(Role.ADMIN, Role.CLASS_REP),
  getAttendanceRecords
);

// Get specific attendance record
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
