import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import {
  exportBatchManifest,
  exportAttendanceReport,
  exportHandlerPerformance,
  exportDiscrepancyReport,
  exportAnalyticsOverview,
} from "../controllers/exportController";

const router = Router();

// All export routes require authentication
router.use(authenticate);

/**
 * Export batch manifest PDF
 * Accessible by: ADMIN, INVIGILATOR, FACULTY_OFFICER, DEPARTMENT_HEAD
 */
router.get(
  "/batch-manifest/:id",
  authorize(
    Role.ADMIN,
    Role.INVIGILATOR,
    Role.FACULTY_OFFICER,
    Role.DEPARTMENT_HEAD
  ),
  exportBatchManifest
);

/**
 * Export attendance report PDF
 * Accessible by: ADMIN, INVIGILATOR, FACULTY_OFFICER, DEPARTMENT_HEAD, LECTURER
 */
router.get(
  "/attendance/:id",
  authorize(
    Role.ADMIN,
    Role.INVIGILATOR,
    Role.FACULTY_OFFICER,
    Role.DEPARTMENT_HEAD,
    Role.LECTURER
  ),
  exportAttendanceReport
);

/**
 * Export handler performance Excel
 * Accessible by: ADMIN only
 */
router.get(
  "/handler-performance",
  authorize(Role.ADMIN),
  exportHandlerPerformance
);

/**
 * Export discrepancy report PDF
 * Accessible by: ADMIN, DEPARTMENT_HEAD, FACULTY_OFFICER
 */
router.get(
  "/discrepancies",
  authorize(Role.ADMIN, Role.DEPARTMENT_HEAD, Role.FACULTY_OFFICER),
  exportDiscrepancyReport
);

/**
 * Export analytics overview Excel
 * Accessible by: ADMIN only
 */
router.get(
  "/analytics-overview",
  authorize(Role.ADMIN),
  exportAnalyticsOverview
);

export default router;
