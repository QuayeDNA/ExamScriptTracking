import { Router } from "express";
import {
  createRegistrationSession,
  registerWithQR,
  getRegistrationSessions,
  bulkCreateSessions,
  deactivateSession,
  extendSessionExpiration,
  getSessionAnalytics,
  cleanupExpiredSessions,
} from "../controllers/registrationController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { Role } from "@prisma/client";

const router = Router();

/**
 * @route   POST /api/registration/create-session
 * @desc    Create a new registration session (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/create-session",
  authenticate,
  authorize(Role.ADMIN),
  createRegistrationSession
);

/**
 * @route   POST /api/registration/bulk-create
 * @desc    Create multiple registration sessions at once (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/bulk-create",
  authenticate,
  authorize(Role.ADMIN),
  bulkCreateSessions
);

/**
 * @route   POST /api/registration/register
 * @desc    Register user using QR code token
 * @access  Public
 */
router.post("/register", registerWithQR);

/**
 * @route   GET /api/registration/sessions
 * @desc    Get registration sessions created by admin
 * @access  Private (Admin)
 */
router.get(
  "/sessions",
  authenticate,
  authorize(Role.ADMIN),
  getRegistrationSessions
);

/**
 * @route   PATCH /api/registration/sessions/:id/deactivate
 * @desc    Deactivate a registration session (Admin only)
 * @access  Private (Admin)
 */
router.patch(
  "/sessions/:id/deactivate",
  authenticate,
  authorize(Role.ADMIN),
  deactivateSession
);

/**
 * @route   PATCH /api/registration/sessions/:id/extend
 * @desc    Extend expiration of a registration session (Admin only)
 * @access  Private (Admin)
 */
router.patch(
  "/sessions/:id/extend",
  authenticate,
  authorize(Role.ADMIN),
  extendSessionExpiration
);

/**
 * @route   GET /api/registration/analytics
 * @desc    Get registration analytics and statistics (Admin only)
 * @access  Private (Admin)
 */
router.get(
  "/analytics",
  authenticate,
  authorize(Role.ADMIN),
  getSessionAnalytics
);

/**
 * @route   DELETE /api/registration/cleanup
 * @desc    Clean up expired and unused registration sessions (Admin only)
 * @access  Private (Admin)
 */
router.delete(
  "/cleanup",
  authenticate,
  authorize(Role.ADMIN),
  cleanupExpiredSessions
);

export default router;
