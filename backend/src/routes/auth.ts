import { Router } from "express";
import {
  login,
  changePassword,
  firstTimePasswordChange,
  getProfile,
  logout,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";

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

export default router;
