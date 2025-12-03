import { Router } from "express";
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  generateStudentQRCode,
  getPrograms,
  getLevels,
} from "../controllers/studentController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { Role } from "@prisma/client";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/students/programs
 * @desc    Get list of distinct programs (for filters)
 * @access  Private
 */
router.get("/programs", getPrograms);

/**
 * @route   GET /api/students/levels
 * @desc    Get list of distinct levels (for filters)
 * @access  Private
 */
router.get("/levels", getLevels);

/**
 * @route   POST /api/students
 * @desc    Create new student
 * @access  Private (Admin only)
 */
router.post("/", authorize(Role.ADMIN), createStudent);

/**
 * @route   GET /api/students
 * @desc    Get all students with optional filters
 * @access  Private
 */
router.get("/", getStudents);

/**
 * @route   GET /api/students/:id
 * @desc    Get single student by ID
 * @access  Private
 */
router.get("/:id", getStudent);

/**
 * @route   GET /api/students/:id/qr-code
 * @desc    Generate QR code for student
 * @access  Private
 */
router.get("/:id/qr-code", generateStudentQRCode);

/**
 * @route   PUT /api/students/:id
 * @desc    Update student
 * @access  Private (Admin only)
 */
router.put("/:id", authorize(Role.ADMIN), updateStudent);

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete student
 * @access  Private (Admin only)
 */
router.delete("/:id", authorize(Role.ADMIN), deleteStudent);

/**
 * @route   POST /api/students/bulk
 * @desc    Bulk create students
 * @access  Private (Admin only)
 */
router.post("/bulk", authorize(Role.ADMIN), bulkCreateStudents);

export default router;
