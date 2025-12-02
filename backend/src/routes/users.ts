import { Router } from "express";
import {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  getHandlers,
  bulkCreateUsers,
  bulkDeactivateUsers,
  bulkUpdateRoles,
  uploadProfilePicture,
  exportUsers,
  getUserStatistics,
} from "../controllers/userController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { Role } from "@prisma/client";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/handlers
 * @desc    Get all active handlers (for transfer selection)
 * @access  Private (All authenticated users)
 */
router.get("/handlers", getHandlers);

/**
 * @route   POST /api/users
 * @desc    Create new user (Admin only)
 * @access  Private (Admin)
 */
router.post("/", authorize(Role.ADMIN), createUser);

/**
 * @route   GET /api/users
 * @desc    Get all users with optional filters
 * @access  Private (Admin)
 */
router.get("/", authorize(Role.ADMIN), getUsers);

/**
 * @route   GET /api/users/statistics
 * @desc    Get user statistics for dashboard
 * @access  Private (Admin)
 */
router.get("/statistics", authorize(Role.ADMIN), getUserStatistics);

/**
 * @route   GET /api/users/export
 * @desc    Export users to CSV
 * @access  Private (Admin)
 */
router.get("/export", authorize(Role.ADMIN), exportUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (Admin)
 */
router.get("/:id", authorize(Role.ADMIN), getUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put("/:id", authorize(Role.ADMIN), updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user
 * @access  Private (Admin)
 */
router.delete("/:id", authorize(Role.ADMIN), deactivateUser);

/**
 * @route   PATCH /api/users/:id/reactivate
 * @desc    Reactivate user
 * @access  Private (Admin)
 */
router.patch("/:id/reactivate", authorize(Role.ADMIN), reactivateUser);

/**
 * @route   POST /api/users/bulk-create
 * @desc    Bulk create users
 * @access  Private (Admin)
 */
router.post("/bulk/create", authorize(Role.ADMIN), bulkCreateUsers);

/**
 * @route   POST /api/users/bulk-deactivate
 * @desc    Bulk deactivate users
 * @access  Private (Admin)
 */
router.post("/bulk/deactivate", authorize(Role.ADMIN), bulkDeactivateUsers);

/**
 * @route   POST /api/users/bulk-update-roles
 * @desc    Bulk update user roles
 * @access  Private (Admin)
 */
router.post("/bulk/update-roles", authorize(Role.ADMIN), bulkUpdateRoles);

/**
 * @route   POST /api/users/profile-picture
 * @desc    Upload/update profile picture
 * @access  Private
 */
router.post("/profile-picture", uploadProfilePicture);

/**
 * @route   GET /api/users/export
 * @desc    Export users to CSV
 * @access  Private (Admin)
 */
router.get("/export", authorize(Role.ADMIN), exportUsers);

/**
 * @route   GET /api/users/statistics
 * @desc    Get user statistics for dashboard
 * @access  Private (Admin)
 */
router.get("/statistics", authorize(Role.ADMIN), getUserStatistics);

export default router;
