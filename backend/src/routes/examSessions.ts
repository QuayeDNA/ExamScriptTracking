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
import { createArchive } from "../controllers/archiveController";
import {
  addExpectedStudents,
  addExpectedStudentsByIndex,
  getExpectedStudents,
  removeExpectedStudent,
  getAttendanceSummary,
} from "../controllers/examSessionStudentController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { preventArchivedSessionOperations } from "../middleware/archivedSessionProtection";
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
router.get("/:id/qr-code", preventArchivedSessionOperations, generateBatchQRCodeEndpoint);

// Export exam session as PDF (accessible to all authenticated users)
router.get("/:id/export-pdf", preventArchivedSessionOperations, exportExamSessionPDF);

// Get exam session manifest (accessible to all authenticated users)
router.get("/:id/manifest", preventArchivedSessionOperations, getExamSessionManifest);

// Get attendance summary with expected vs actual (accessible to all)
router.get("/:id/attendance-summary", preventArchivedSessionOperations, getAttendanceSummary);

// Expected Students Management
// Get expected students for an exam session
router.get("/:id/students", preventArchivedSessionOperations, getExpectedStudents);

// Add expected students (by student IDs) - admin and lecturer only
router.post(
  "/:id/students",
  authorize(Role.ADMIN, Role.LECTURER),
  preventArchivedSessionOperations,
  addExpectedStudents
);

// Add expected students by index numbers (bulk) - admin and lecturer only
router.post(
  "/:id/students/bulk",
  authorize(Role.ADMIN, Role.LECTURER),
  preventArchivedSessionOperations,
  addExpectedStudentsByIndex
);

// Remove student from expected list - admin and lecturer only
router.delete(
  "/:id/students/:studentId",
  authorize(Role.ADMIN, Role.LECTURER),
  preventArchivedSessionOperations,
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

// Archive multiple exam sessions (admin only)
router.post(
  "/archive",
  authorize(Role.ADMIN),
  createArchive
);

// Update exam session (admin and lecturer only)
router.put("/:id", authorize(Role.ADMIN, Role.LECTURER), preventArchivedSessionOperations, updateExamSession);

// Update exam session status (admin, invigilator, and lecturer)
router.patch(
  "/:id/status",
  authorize(Role.ADMIN, Role.INVIGILATOR, Role.LECTURER),
  preventArchivedSessionOperations,
  updateExamSessionStatus
);

// End exam session (invigilator and lecturer) - auto-updates status to SUBMITTED
router.post(
  "/:id/end",
  authorize(Role.ADMIN, Role.INVIGILATOR, Role.LECTURER),
  preventArchivedSessionOperations,
  endExamSession
);

// Delete exam session (admin only)
router.delete("/:id", authorize(Role.ADMIN), preventArchivedSessionOperations, deleteExamSession);

export default router;
