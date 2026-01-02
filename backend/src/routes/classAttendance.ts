import { Router } from "express";
import {
  startSession,
  endSession,
  recordAttendanceByQR,
  recordAttendanceByIndex,
  recordAttendanceByBiometric,
  getActiveSessions,
  getSession,
  getAttendanceHistory,
  generateAttendanceLink,
  enrollBiometric,
  getAttendanceStats,
} from "../controllers/classAttendanceController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { Role } from "@prisma/client";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Start a new attendance recording session
 * POST /api/class-attendance/sessions/start
 * Access: LECTURER, ADMIN, CLASS_REP
 */
router.post(
  "/sessions/start",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  startSession
);

/**
 * End an attendance recording session
 * POST /api/class-attendance/sessions/end
 * Access: LECTURER, ADMIN, CLASS_REP (must be session owner or admin)
 */
router.post(
  "/sessions/end",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  endSession
);

/**
 * Get all active sessions
 * GET /api/class-attendance/sessions/active
 * Access: LECTURER, ADMIN, CLASS_REP
 * Returns: Active sessions for current user (or all if admin)
 */
router.get(
  "/sessions/active",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  getActiveSessions
);

/**
 * Get specific session details
 * GET /api/class-attendance/sessions/:id
 * Access: LECTURER, ADMIN, CLASS_REP (must be session owner or admin)
 */
router.get(
  "/sessions/:id",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  getSession
);

// ============================================================================
// ATTENDANCE RECORDING
// ============================================================================

/**
 * Record attendance by scanning student QR code
 * POST /api/class-attendance/record/qr
 * Access: LECTURER, ADMIN, CLASS_REP
 * Body: { recordId, qrCode, status?, deviceId? }
 */
router.post(
  "/record/qr",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  recordAttendanceByQR
);

/**
 * Record attendance by manually entering index number
 * POST /api/class-attendance/record/index
 * Access: LECTURER, ADMIN, CLASS_REP
 * Body: { recordId, indexNumber, status? }
 */
router.post(
  "/record/index",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  recordAttendanceByIndex
);

/**
 * Record attendance using biometric verification
 * POST /api/class-attendance/record/biometric
 * Access: LECTURER, ADMIN, CLASS_REP
 * Body: { recordId, biometricHash, deviceId, biometricConfidence, status? }
 */
router.post(
  "/record/biometric",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  recordAttendanceByBiometric
);

// ============================================================================
// QUERIES & HISTORY
// ============================================================================

/**
 * Get attendance history
 * GET /api/class-attendance/history
 * Access: LECTURER, ADMIN, CLASS_REP
 * Query params: courseCode?, startDate?, endDate?, status?, limit?, offset?
 */
router.get(
  "/history",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  getAttendanceHistory
);

// ============================================================================
// SELF-SERVICE LINKS
// ============================================================================

/**
 * Generate self-service attendance link for students
 * POST /api/class-attendance/links/generate
 * Access: LECTURER, ADMIN
 * Body: { recordId, expiresInMinutes?, maxUses?, geolocation? }
 */
router.post(
  "/links/generate",
  authorize(Role.ADMIN, Role.LECTURER),
  generateAttendanceLink
);

// ============================================================================
// BIOMETRIC ENROLLMENT
// ============================================================================

/**
 * Enroll biometric data for a student
 * POST /api/class-attendance/biometric/enroll
 * Access: LECTURER, ADMIN
 * Body: { studentId, biometricHash, deviceId, provider }
 */
router.post(
  "/biometric/enroll",
  authorize(Role.ADMIN, Role.LECTURER),
  enrollBiometric
);

// ============================================================================
// ANALYTICS & STATISTICS
// ============================================================================

/**
 * Get attendance statistics
 * GET /api/class-attendance/analytics/stats
 * Access: LECTURER, ADMIN
 * Query params: courseCode?, startDate?, endDate?
 */
router.get(
  "/analytics/stats",
  authorize(Role.ADMIN, Role.LECTURER),
  getAttendanceStats
);

export default router;
