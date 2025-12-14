import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import * as analyticsController from "../controllers/analyticsController";

const router = Router();

/**
 * Analytics Routes
 *
 * All analytics endpoints require authentication and ADMIN role.
 * These endpoints provide data insights for the Exam Script Tracking System.
 */

// GET /api/analytics/overview - System overview statistics
router.get(
  "/overview",
  authenticate,
  authorize("ADMIN"),
  analyticsController.getOverview
);

// GET /api/analytics/handler-performance - Handler performance metrics
router.get(
  "/handler-performance",
  authenticate,
  authorize("ADMIN"),
  analyticsController.getHandlerPerformance
);

// GET /api/analytics/discrepancies - Discrepancy reports and analytics
router.get(
  "/discrepancies",
  authenticate,
  authorize("ADMIN"),
  analyticsController.getDiscrepancies
);

// GET /api/analytics/exam-stats - Exam statistics and completion metrics
router.get(
  "/exam-stats",
  authenticate,
  authorize("ADMIN"),
  analyticsController.getExamStats
);

// GET /api/analytics/user-activity - Recent activity for logged-in user
router.get("/user-activity", authenticate, analyticsController.getUserActivity);

export default router;
