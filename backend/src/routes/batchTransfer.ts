import { Router } from "express";
import {
  createTransfer,
  confirmTransfer,
  rejectTransfer,
  updateTransferStatus,
  getTransfers,
  getTransferById,
  getTransferHistory,
} from "../controllers/batchTransferController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { Role } from "@prisma/client";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all transfers (filtered by user role)
// Query params: examSessionId, status, fromHandlerId, toHandlerId, handlerId
router.get("/", getTransfers);

// Get single transfer by ID
router.get("/:id", getTransferById);

// Get transfer history for an exam session (chain of custody)
router.get("/history/:examSessionId", getTransferHistory);

// Create transfer request
// Auth: ADMIN, INVIGILATOR, LECTURER, FACULTY_OFFICER, DEPARTMENT_HEAD
router.post(
  "/",
  authorize(
    Role.ADMIN,
    Role.INVIGILATOR,
    Role.LECTURER,
    Role.FACULTY_OFFICER,
    Role.DEPARTMENT_HEAD
  ),
  createTransfer
);

// Confirm transfer (receiver accepts)
// Auth: Receiver only (checked in controller)
router.patch(
  "/:id/confirm",
  authorize(
    Role.ADMIN,
    Role.INVIGILATOR,
    Role.LECTURER,
    Role.FACULTY_OFFICER,
    Role.DEPARTMENT_HEAD
  ),
  confirmTransfer
);

// Reject transfer
// Auth: Receiver only (checked in controller)
router.patch(
  "/:id/reject",
  authorize(
    Role.ADMIN,
    Role.INVIGILATOR,
    Role.LECTURER,
    Role.FACULTY_OFFICER,
    Role.DEPARTMENT_HEAD
  ),
  rejectTransfer
);

// Update transfer status (admin only - for resolving discrepancies)
router.patch("/:id/status", authorize(Role.ADMIN), updateTransferStatus);

export default router;
