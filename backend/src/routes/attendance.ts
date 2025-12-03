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

// Record entry - INVIGILATOR, ADMIN
router.post("/entry", authorize(Role.ADMIN, Role.INVIGILATOR), recordEntry);

// Record exit - INVIGILATOR, ADMIN
router.post("/exit", authorize(Role.ADMIN, Role.INVIGILATOR), recordExit);

// Record submission - INVIGILATOR, ADMIN
router.post(
  "/submission",
  authorize(Role.ADMIN, Role.INVIGILATOR),
  recordSubmission
);

// Update discrepancy note - INVIGILATOR, ADMIN
router.patch(
  "/discrepancy",
  authorize(Role.ADMIN, Role.INVIGILATOR),
  updateDiscrepancy
);

export default router;
