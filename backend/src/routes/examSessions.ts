import express from "express";
import {
  createExamSession,
  getExamSessions,
  getExamSession,
  updateExamSession,
  updateExamSessionStatus,
  deleteExamSession,
  generateBatchQRCodeEndpoint,
  getExamSessionManifest,
  getDepartments,
  getFaculties,
} from "../controllers/examSessionController";
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

// Get exam session manifest (accessible to all authenticated users)
router.get("/:id/manifest", getExamSessionManifest);

// Create exam session (admin and lecturer only)
router.post("/", authorize(Role.ADMIN, Role.LECTURER), createExamSession);

// Update exam session (admin and lecturer only)
router.put("/:id", authorize(Role.ADMIN, Role.LECTURER), updateExamSession);

// Update exam session status (admin and invigilator only)
router.patch(
  "/:id/status",
  authorize(Role.ADMIN, Role.INVIGILATOR),
  updateExamSessionStatus
);

// Delete exam session (admin only)
router.delete("/:id", authorize(Role.ADMIN), deleteExamSession);

export default router;
