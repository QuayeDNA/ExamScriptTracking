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
  getStudentByIndexNumber,
  lookupStudentForIncident,
  exportStudentsPDF,
  uploadStudentPicture,
  enrollStudentBiometric,
} from "../controllers/studentController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { Role } from "@prisma/client";

const router = Router();

// Public route for QR lookup (no authentication required)
/**
 * @route   GET /api/students/qr
 * @desc    Get student data for QR lookup (public)
 * @access  Public
 */
router.get("/qr", getStudentByIndexNumber);

/**
 * @route   POST /api/students/biometric/enroll
 * @desc    Public biometric enrollment for students
 * @access  Public
 */
router.post("/biometric/enroll", enrollStudentBiometric);

// All other routes require authentication
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
router.post(
  "/",
  authorize(Role.ADMIN),
  uploadStudentPicture.single("profilePicture"),
  createStudent
);

/**
 * @route   GET /api/students
 * @desc    Get all students with optional filters
 * @access  Private
 */
router.get("/", getStudents);

/**
 * @route   GET /api/students/lookup
 * @desc    Lookup student for incident reporting (includes expected students)
 * @access  Private
 */
router.get("/lookup", lookupStudentForIncident);

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
router.put(
  "/:id",
  authorize(Role.ADMIN),
  uploadStudentPicture.single("profilePicture"),
  updateStudent
);

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

/**
 * @route   GET /api/students/export/pdf
 * @desc    Export students to PDF with images and QR codes
 * @access  Private (Admin only)
 */
router.get("/export/pdf", authorize(Role.ADMIN), exportStudentsPDF);

export default router;
