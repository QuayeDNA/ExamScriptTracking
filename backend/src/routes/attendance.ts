import { Router } from "express";
import {
  recordEntry,
  recordExit,
  recordSubmission,
  updateDiscrepancy,
  getAttendance,
} from "../controllers/attendanceController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { Role } from "@prisma/client";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get attendance record
router.get("/", getAttendance);

// Record entry - LECTURER, INVIGILATOR, ADMIN
router.post("/entry", authorize(Role.ADMIN, Role.INVIGILATOR, Role.LECTURER), recordEntry);

// Record exit - LECTURER, INVIGILATOR, ADMIN
router.post("/exit", authorize(Role.ADMIN, Role.INVIGILATOR, Role.LECTURER), recordExit);

// Record submission - LECTURER, INVIGILATOR, ADMIN
router.post(
  "/submission",
  authorize(Role.ADMIN, Role.INVIGILATOR, Role.LECTURER),
  recordSubmission
);

// Update discrepancy note - LECTURER, INVIGILATOR, ADMIN
router.patch(
  "/discrepancy",
  authorize(Role.ADMIN, Role.INVIGILATOR, Role.LECTURER),
  updateDiscrepancy
);

export default router;
