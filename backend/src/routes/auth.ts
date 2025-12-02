import { Router } from "express";
import {
  login,
  changePassword,
  firstTimePasswordChange,
  getProfile,
  logout,
  refreshToken,
  unlockUserAccount,
  adminResetPassword,
  getActiveSessions,
  revokeSession,
  logoutAllSessions,
  forceLogoutUser,
  getAuditLogs,
  requestPasswordReset,
  resetPasswordWithToken,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { authorize, requireSuperAdmin } from "../middleware/rbac";
import { Role } from "@prisma/client";

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user (Admin or Handler)
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", authenticate, logout);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (requires current password)
 * @access  Private
 */
router.post("/change-password", authenticate, changePassword);

/**
 * @route   POST /api/auth/first-time-password
 * @desc    Set password for first-time login (no current password required)
 * @access  Private
 */
router.post("/first-time-password", authenticate, firstTimePasswordChange);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", authenticate, getProfile);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post("/refresh-token", refreshToken);

/**
 * @route   POST /api/auth/unlock-account/:id
 * @desc    Admin unlock user account
 * @access  Private (Admin only)
 */
router.post(
  "/unlock-account/:id",
  authenticate,
  authorize(Role.ADMIN),
  unlockUserAccount
);

/**
 * @route   POST /api/auth/admin-reset-password/:id
 * @desc    Admin reset user password
 * @access  Private (Admin only)
 */
router.post(
  "/admin-reset-password/:id",
  authenticate,
  authorize(Role.ADMIN),
  adminResetPassword
);

/**
 * @route   GET /api/auth/sessions
 * @desc    Get active sessions for current user
 * @access  Private
 */
router.get("/sessions", authenticate, getActiveSessions);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke specific session
 * @access  Private
 */
router.delete("/sessions/:sessionId", authenticate, revokeSession);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout all sessions
 * @access  Private
 */
router.post("/logout-all", authenticate, logoutAllSessions);

/**
 * @route   POST /api/auth/force-logout/:id
 * @desc    Admin force logout user (all sessions)
 * @access  Private (Admin only)
 */
router.post(
  "/force-logout/:id",
  authenticate,
  authorize(Role.ADMIN),
  forceLogoutUser
);

/**
 * @route   GET /api/auth/audit-logs
 * @desc    Get audit logs with filters
 * @access  Private (Admin only)
 */
router.get("/audit-logs", authenticate, authorize(Role.ADMIN), getAuditLogs);

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request password reset token
 * @access  Public
 */
router.post("/request-password-reset", requestPasswordReset);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post("/reset-password", resetPasswordWithToken);

export default router;
