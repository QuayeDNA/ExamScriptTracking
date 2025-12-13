import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import { uploadMultipleIncidentFiles } from "../middleware/upload";
import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  updateIncidentStatus,
  assignIncident,
  addComment,
  getComments,
  uploadAttachments,
  deleteAttachment,
  deleteIncident,
  getStatistics,
  exportIncidentPDF,
  exportIncidentsSummaryExcel,
} from "../controllers/incidentController";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Statistics
 * GET /api/incidents/statistics
 */
router.get("/statistics", getStatistics);

/**
 * Export
 * GET /api/incidents/export/summary - Export filtered incidents summary as Excel
 * GET /api/incidents/:id/export/pdf - Export single incident report as PDF
 */
router.get("/export/summary", exportIncidentsSummaryExcel);
router.get("/:id/export/pdf", exportIncidentPDF);

/**
 * Incident CRUD
 */
// Create incident - All authenticated handlers can create
router.post("/", createIncident);

// Get all incidents with filters
router.get("/", getIncidents);

// Get single incident
router.get("/:id", getIncidentById);

// Update incident - Reporter, assignee, or admin
router.patch("/:id", updateIncident);

// Delete incident - Admin only
router.delete("/:id", authorize("ADMIN"), deleteIncident);

/**
 * Status management
 */
// Update status - Reporter, assignee, department head, faculty officer, or admin
router.patch(
  "/:id/status",
  authorize(
    "ADMIN",
    "DEPARTMENT_HEAD",
    "FACULTY_OFFICER",
    "INVIGILATOR",
    "LECTURER"
  ),
  updateIncidentStatus
);

// Assign incident - Department head, faculty officer, or admin
router.patch(
  "/:id/assign",
  authorize("ADMIN", "DEPARTMENT_HEAD", "FACULTY_OFFICER"),
  assignIncident
);

/**
 * Comments
 */
router.post("/:id/comments", addComment);
router.get("/:id/comments", getComments);

/**
 * Attachments
 */
// Upload attachments (with file upload middleware)
router.post("/:id/attachments", uploadMultipleIncidentFiles, uploadAttachments);

// Delete attachment - Reporter, assignee, or admin
router.delete("/:id/attachments/:attachmentId", deleteAttachment);

export default router;
