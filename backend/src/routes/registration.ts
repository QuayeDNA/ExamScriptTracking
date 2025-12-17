import { Router } from "express";
import {
  createRegistrationSession,
  registerWithQR,
  getRegistrationSessions,
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

export default router;
