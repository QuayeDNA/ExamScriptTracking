import express from "express";
import {
  createArchive,
  getArchives,
  getArchive,
  updateArchive,
  deleteArchive,
  addSessionsToArchive,
  removeSessionFromArchive,
} from "../controllers/archiveController";
import { authenticate } from "../middleware/auth";
import { Role } from "@prisma/client";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// ARCHIVE MANAGEMENT ROUTES
// ============================================================================

// Create new archive with sessions (admin only)
router.post("/", createArchive);

// Get all archives (paginated)
router.get("/", getArchives);

// Get single archive with details
router.get("/:id", getArchive);

// Update archive (name/description) - admin only
router.put("/:id", updateArchive);

// Delete archive - admin only
router.delete("/:id", deleteArchive);

// Add sessions to existing archive - admin only
router.post("/:id/sessions", addSessionsToArchive);

// Remove session from archive - admin only
router.delete("/:id/sessions/:sessionId", removeSessionFromArchive);

export default router;