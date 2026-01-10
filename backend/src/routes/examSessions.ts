import express from "express";
import {
  createExamSession,
  bulkCreateExamSessions,
  getExamSessions,
  getExamSession,
  updateExamSession,
  updateExamSessionStatus,
  endExamSession,
  deleteExamSession,
  generateBatchQRCodeEndpoint,
  getExamSessionManifest,
  getDepartments,
  getFaculties,
  exportExamSessionPDF,
} from "../controllers/examSessionController";
import {
  addExpectedStudents,
  addExpectedStudentsByIndex,
  getExpectedStudents,
  removeExpectedStudent,
  getAttendanceSummary,
} from "../controllers/examSessionStudentController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { Role } from "@prisma/client";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Filter options (accessible to all authenticated users)
router.get("/departments", getDepartments);
router.get("/faculties", getFaculties);

// Get all exam sessions (accessible to all authenticated users)
router.get("/", getExamSessions);

// Get single exam session (accessible to all authenticated users)
router.get("/:id", getExamSession);

// Get batch QR code (accessible to all authenticated users)
router.get("/:id/qr-code", generateBatchQRCodeEndpoint);

// Export exam session as PDF (accessible to all authenticated users)
router.get("/:id/export-pdf", exportExamSessionPDF);

// Get exam session manifest (accessible to all authenticated users)
router.get("/:id/manifest", getExamSessionManifest);

// Get attendance summary with expected vs actual (accessible to all)
router.get("/:id/attendance-summary", getAttendanceSummary);

// Expected Students Management
// Get expected students for an exam session
router.get("/:id/students", getExpectedStudents);

// Add expected students (by student IDs) - admin and lecturer only
router.post(
  "/:id/students",
  authorize(Role.ADMIN, Role.LECTURER),
  addExpectedStudents
);

// Add expected students by index numbers (bulk) - admin and lecturer only
router.post(
  "/:id/students/bulk",
  authorize(Role.ADMIN, Role.LECTURER),
  addExpectedStudentsByIndex
);

// Remove student from expected list - admin and lecturer only
router.delete(
  "/:id/students/:studentId",
  authorize(Role.ADMIN, Role.LECTURER),
  removeExpectedStudent
);

// Create exam session (admin and lecturer only)
router.post("/", authorize(Role.ADMIN, Role.LECTURER), createExamSession);

// Bulk create exam sessions (admin and lecturer only)
router.post(
  "/bulk",
  authorize(Role.ADMIN, Role.LECTURER),
  bulkCreateExamSessions
);

// Update exam session (admin and lecturer only)
router.put("/:id", authorize(Role.ADMIN, Role.LECTURER), updateExamSession);

// Update exam session status (admin, invigilator, and lecturer)
router.patch(
  "/:id/status",
  authorize(Role.ADMIN, Role.INVIGILATOR, Role.LECTURER),
  updateExamSessionStatus
);

// End exam session (invigilator and lecturer) - auto-updates status to SUBMITTED
router.post(
  "/:id/end",
  authorize(Role.ADMIN, Role.INVIGILATOR, Role.LECTURER),
  endExamSession
);

// Delete exam session (admin only)
router.delete("/:id", authorize(Role.ADMIN), deleteExamSession);

export default router;
