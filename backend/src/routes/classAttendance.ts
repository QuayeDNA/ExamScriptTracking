import { Router } from "express";
import {
  createSession,
  endSession,
  pauseSession,
  resumeSession,
  deleteSession,
  recordAttendance,
  recordBulkAttendance,
  validateLink,
  selfMarkAttendance,
  generateLink,
  getActiveLinks,
  revokeLink,
  getActiveSessions,
  getSession,
  getAttendanceHistory,
  exportSession,
  addAssistant,
  removeAssistant,
  bulkConfirmAttendance,
  updateAttendanceStatus,
  deleteAttendance,
  searchStudents,
  saveTemplate,
  getTemplates,
  createFromTemplate,
  getAttendanceAnalytics,
} from "../controllers/classAttendanceController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { Role } from "@prisma/client";

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * Validate attendance link
 * GET /api/attendance/links/:token/validate
 */
router.get("/links/:token/validate", validateLink);

/**
 * Self-mark attendance using link
 * POST /api/attendance/self-mark
 */
router.post("/self-mark", selfMarkAttendance);

// All other routes require authentication
router.use(authenticate);

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create a new attendance session
 * POST /api/attendance/sessions
 */
router.post(
  "/sessions",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  createSession
);

/**
 * Create session from template
 * POST /api/attendance/sessions/from-template
 */
router.post(
  "/sessions/from-template",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  createFromTemplate
);

/**
 * Pause attendance session
 * POST /api/attendance/sessions/:id/pause
 */
router.post(
  "/sessions/:id/pause",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  pauseSession
);

/**
 * Resume paused attendance session
 * POST /api/attendance/sessions/:id/resume
 */
router.post(
  "/sessions/:id/resume",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  resumeSession
);

/**
 * Get active sessions
 * GET /api/attendance/sessions/active
 */
router.get(
  "/sessions/active",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  getActiveSessions
);

/**
 * Get attendance analytics (must be before :id route)
 * GET /api/attendance/sessions/analytics
 */
router.get(
  "/sessions/analytics",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  getAttendanceAnalytics
);

/**
 * Get session details
 * GET /api/attendance/sessions/:id
 */
router.get(
  "/sessions/:id",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  getSession
);

/**
 * End session
 * POST /api/attendance/sessions/:id/end
 */
router.post(
  "/sessions/:id/end",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  endSession
);

/**
 * Delete session
 * DELETE /api/attendance/sessions/:id
 */
router.delete(
  "/sessions/:id",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  deleteSession
);

/**
 * Export session to CSV
 * GET /api/attendance/sessions/:id/export
 */
router.get(
  "/sessions/:id/export",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  exportSession
);

// ============================================================================
// ASSISTANT MANAGEMENT
// ============================================================================

/**
 * Add assistant to session
 * POST /api/attendance/sessions/:id/assistants
 */
router.post(
  "/sessions/:id/assistants",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  addAssistant
);

/**
 * Remove assistant from session
 * DELETE /api/attendance/sessions/:id/assistants/:userId
 */
router.delete(
  "/sessions/:id/assistants/:userId",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  removeAssistant
);

// ============================================================================
// ATTENDANCE RECORDING
// ============================================================================

/**
 * Record attendance (unified endpoint for all methods)
 * POST /api/attendance/sessions/:id/record
 */
router.post(
  "/sessions/:id/record",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  recordAttendance
);

/**
 * Bulk record attendance
 * POST /api/attendance/sessions/:id/record/bulk
 */
router.post(
  "/sessions/:id/record/bulk",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  recordBulkAttendance
);

/**
 * Bulk confirm/reject attendance
 * POST /api/attendance/sessions/:id/confirm-bulk
 */
router.post(
  "/sessions/:id/confirm-bulk",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  bulkConfirmAttendance
);

/**
 * Update attendance status
 * PATCH /api/attendance/:attendanceId
 */
router.patch(
  "/:attendanceId",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  updateAttendanceStatus
);

/**
 * Delete attendance record
 * DELETE /api/attendance/:attendanceId
 */
router.delete(
  "/:attendanceId",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  deleteAttendance
);

// ============================================================================
// LINK MANAGEMENT
// ============================================================================

/**
 * Generate attendance link
 * POST /api/attendance/sessions/:id/links
 */
router.post(
  "/sessions/:id/links",
  authorize(Role.ADMIN, Role.LECTURER),
  generateLink
);

/**
 * Get active links for session
 * GET /api/attendance/sessions/:id/links
 */
router.get(
  "/sessions/:id/links",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  getActiveLinks
);

/**
 * Revoke attendance link
 * DELETE /api/attendance/links/:token
 */
router.delete(
  "/links/:token",
  authorize(Role.ADMIN, Role.LECTURER),
  revokeLink
);

// ============================================================================
// QUERIES & ANALYTICS
// ============================================================================

/**
 * Get attendance history
 * GET /api/attendance/history
 */
router.get(
  "/history",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  getAttendanceHistory
);

/**
 * Search students
 * GET /api/attendance/students/search
 */
router.get("/students/search", searchStudents);

// ============================================================================
// SESSION TEMPLATES
// ============================================================================

/**
 * Get session templates
 * GET /api/attendance/templates
 */
router.get(
  "/templates",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  getTemplates
);

/**
 * Save session as template
 * POST /api/attendance/templates
 */
router.post(
  "/templates",
  authorize(Role.ADMIN, Role.LECTURER, Role.CLASS_REP),
  saveTemplate
);

export default router;
