import { Request, Response } from "express";
import { z } from "zod";
import { incidentService } from "../services/incidentService";
import {
  PrismaClient,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from "@prisma/client";
import { deleteIncidentFile, deleteIncidentFolder } from "../middleware/upload";
import {
  generateIncidentReportPDF,
  generateIncidentSummaryExcel,
} from "../services/exportService";

const prisma = new PrismaClient();

// Validation schemas
const createIncidentSchema = z.object({
  type: z.nativeEnum(IncidentType),
  severity: z.nativeEnum(IncidentSeverity),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  examSessionId: z.string().uuid().optional(),
  attendanceId: z.string().uuid().optional(),
  transferId: z.string().uuid().optional(),
  incidentDate: z.string().datetime().optional(),
  isConfidential: z.boolean().optional(),
  metadata: z.any().optional(),
});

const updateIncidentSchema = z.object({
  type: z.nativeEnum(IncidentType).optional(),
  severity: z.nativeEnum(IncidentSeverity).optional(),
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  location: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  isConfidential: z.boolean().optional(),
  metadata: z.any().optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(IncidentStatus),
  reason: z.string().optional(),
  resolutionNotes: z.string().optional(),
});

const assignIncidentSchema = z.object({
  assigneeId: z.string().uuid(),
  reason: z.string().optional(),
});

const addCommentSchema = z.object({
  comment: z.string().min(1, "Comment cannot be empty"),
  isInternal: z.boolean().optional().default(false),
});

/**
 * Create a new incident
 * POST /api/incidents
 */
export const createIncident = async (req: Request, res: Response) => {
  try {
    const validated = createIncidentSchema.parse(req.body);

    const incident = await incidentService.createIncident({
      ...validated,
      reporterId: req.user!.userId,
      incidentDate: validated.incidentDate
        ? new Date(validated.incidentDate)
        : undefined,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "CREATE_INCIDENT",
        entity: "Incident",
        entityId: incident.id,
        details: {
          incidentNumber: incident.incidentNumber,
          type: incident.type,
          severity: incident.severity,
        },
        ipAddress: req.ip,
      },
    });

    // Emit socket event (will be handled by socket handlers)
    const io = (req.app as any).get("io");
    if (io) {
      io.emit("incident:created", {
        incident: {
          id: incident.id,
          incidentNumber: incident.incidentNumber,
          type: incident.type,
          severity: incident.severity,
          title: incident.title,
          reporterId: incident.reporterId,
        },
      });

      // Notify assignee if assigned
      if (incident.assigneeId) {
        io.to(`user:${incident.assigneeId}`).emit("incident:assigned", {
          incident,
        });
      }
    }

    res.status(201).json({
      message: "Incident created successfully",
      incident,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.issues });
    }
    console.error("Error creating incident:", error);
    res.status(500).json({ error: "Failed to create incident" });
  }
};

/**
 * Get all incidents with filters
 * GET /api/incidents
 */
export const getIncidents = async (req: Request, res: Response) => {
  try {
    const {
      type,
      severity,
      status,
      reporterId,
      assigneeId,
      studentId,
      examSessionId,
      startDate,
      endDate,
      search,
      page = "1",
      limit = "20",
    } = req.query;

    const filters: any = {};
    if (type) filters.type = type as IncidentType;
    if (severity) filters.severity = severity as IncidentSeverity;
    if (status) filters.status = status as IncidentStatus;
    if (reporterId) filters.reporterId = reporterId as string;
    if (assigneeId) filters.assigneeId = assigneeId as string;
    if (studentId) filters.studentId = studentId as string;
    if (examSessionId) filters.examSessionId = examSessionId as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (search) filters.search = search as string;

    const userContext = {
      userId: req.user!.userId,
      role: req.user!.role,
      isSuperAdmin: req.user!.isSuperAdmin,
    };

    const result = await incidentService.getIncidents(
      filters,
      userContext,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json(result);
  } catch (error: any) {
    console.error("Error fetching incidents:", error);
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
};

/**
 * Get single incident by ID
 * GET /api/incidents/:id
 */
export const getIncidentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const userContext = {
      userId: req.user!.userId,
      role: req.user!.role,
      isSuperAdmin: req.user!.isSuperAdmin,
    };

    const incident = await incidentService.getIncidentById(id, userContext);

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    res.json({ incident });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return res.status(403).json({ error: error.message });
    }
    console.error("Error fetching incident:", error);
    res.status(500).json({ error: "Failed to fetch incident" });
  }
};

/**
 * Update incident
 * PATCH /api/incidents/:id
 */
export const updateIncident = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = updateIncidentSchema.parse(req.body);

    const userContext = {
      userId: req.user!.userId,
      role: req.user!.role,
      isSuperAdmin: req.user!.isSuperAdmin,
    };

    const incident = await incidentService.updateIncident(
      id,
      validated,
      userContext
    );

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "UPDATE_INCIDENT",
        entity: "Incident",
        entityId: incident.id,
        details: { updates: validated },
        ipAddress: req.ip,
      },
    });

    // Emit socket event
    const io = (req.app as any).get("io");
    if (io) {
      io.emit("incident:updated", { incident });
    }

    res.json({
      message: "Incident updated successfully",
      incident,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.issues });
    }
    if (
      error.message.includes("Forbidden") ||
      error.message.includes("not found")
    ) {
      return res
        .status(error.message.includes("Forbidden") ? 403 : 404)
        .json({ error: error.message });
    }
    console.error("Error updating incident:", error);
    res.status(500).json({ error: "Failed to update incident" });
  }
};

/**
 * Update incident status
 * PATCH /api/incidents/:id/status
 */
export const updateIncidentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = updateStatusSchema.parse(req.body);

    const incident = await incidentService.updateStatus(
      id,
      validated.status,
      req.user!.userId,
      validated.reason,
      validated.resolutionNotes
    );

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "UPDATE_INCIDENT_STATUS",
        entity: "Incident",
        entityId: incident.id,
        details: {
          newStatus: validated.status,
          reason: validated.reason,
        },
        ipAddress: req.ip,
      },
    });

    // Emit socket event
    const io = (req.app as any).get("io");
    if (io) {
      io.emit("incident:status_changed", {
        incident,
        oldStatus: req.body.oldStatus,
        newStatus: validated.status,
      });

      // Special notifications
      if (validated.status === "ESCALATED") {
        io.to("role:DEPARTMENT_HEAD").emit("incident:escalated", { incident });
        io.to("role:ADMIN").emit("incident:escalated", { incident });
      }

      if (validated.status === "RESOLVED") {
        io.to(`user:${incident.reporterId}`).emit("incident:resolved", {
          incident,
        });
      }
    }

    res.json({
      message: "Incident status updated successfully",
      incident,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.issues });
    }
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    console.error("Error updating incident status:", error);
    res.status(500).json({ error: "Failed to update incident status" });
  }
};

/**
 * Assign incident to user
 * PATCH /api/incidents/:id/assign
 */
export const assignIncident = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = assignIncidentSchema.parse(req.body);

    const incident = await incidentService.assignIncident(
      id,
      validated.assigneeId,
      req.user!.userId,
      validated.reason
    );

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "ASSIGN_INCIDENT",
        entity: "Incident",
        entityId: incident.id,
        details: {
          assigneeId: validated.assigneeId,
          reason: validated.reason,
        },
        ipAddress: req.ip,
      },
    });

    // Emit socket event
    const io = (req.app as any).get("io");
    if (io) {
      io.to(`user:${validated.assigneeId}`).emit("incident:assigned", {
        incident,
      });
      io.to(`user:${incident.reporterId}`).emit("incident:updated", {
        incident,
      });
    }

    res.json({
      message: "Incident assigned successfully",
      incident,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.issues });
    }
    console.error("Error assigning incident:", error);
    res.status(500).json({ error: "Failed to assign incident" });
  }
};

/**
 * Add comment to incident
 * POST /api/incidents/:id/comments
 */
export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = addCommentSchema.parse(req.body);

    const comment = await incidentService.addComment(
      id,
      req.user!.userId,
      validated.comment,
      validated.isInternal
    );

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "ADD_INCIDENT_COMMENT",
        entity: "Incident",
        entityId: id,
        details: { isInternal: validated.isInternal },
        ipAddress: req.ip,
      },
    });

    // Emit socket event
    const io = (req.app as any).get("io");
    if (io) {
      const incident = await prisma.incident.findUnique({
        where: { id },
        select: { reporterId: true, assigneeId: true },
      });

      if (incident) {
        // Notify reporter and assignee (except the commenter)
        if (incident.reporterId !== req.user!.userId) {
          io.to(`user:${incident.reporterId}`).emit("incident:comment_added", {
            incidentId: id,
            comment,
          });
        }
        if (incident.assigneeId && incident.assigneeId !== req.user!.userId) {
          io.to(`user:${incident.assigneeId}`).emit("incident:comment_added", {
            incidentId: id,
            comment,
          });
        }
      }
    }

    res.status(201).json({
      message: "Comment added successfully",
      comment,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.issues });
    }
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

/**
 * Get comments for incident
 * GET /api/incidents/:id/comments
 */
export const getComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comments = await prisma.incidentComment.findMany({
      where: { incidentId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ comments });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

/**
 * Upload attachments to incident
 * POST /api/incidents/:id/attachments
 */
export const uploadAttachments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const attachments = await Promise.all(
      files.map((file) =>
        prisma.incidentAttachment.create({
          data: {
            incidentId: id,
            fileName: file.originalname,
            filePath: `uploads/incidents/${id}/${file.filename}`,
            fileType: file.mimetype,
            fileSize: file.size,
            uploadedBy: req.user!.userId,
          },
          include: {
            uploader: {
              select: {
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        })
      )
    );

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "UPLOAD_INCIDENT_ATTACHMENTS",
        entity: "Incident",
        entityId: id,
        details: { fileCount: files.length },
        ipAddress: req.ip,
      },
    });

    res.status(201).json({
      message: "Attachments uploaded successfully",
      attachments,
    });
  } catch (error: any) {
    console.error("Error uploading attachments:", error);
    res.status(500).json({ error: "Failed to upload attachments" });
  }
};

/**
 * Delete attachment
 * DELETE /api/incidents/:id/attachments/:attachmentId
 */
export const deleteAttachment = async (req: Request, res: Response) => {
  try {
    const { id, attachmentId } = req.params;

    const attachment = await prisma.incidentAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.incidentId !== id) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // Delete file from filesystem
    deleteIncidentFile(attachment.filePath);

    // Delete from database
    await prisma.incidentAttachment.delete({
      where: { id: attachmentId },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "DELETE_INCIDENT_ATTACHMENT",
        entity: "Incident",
        entityId: id,
        details: { fileName: attachment.fileName },
        ipAddress: req.ip,
      },
    });

    res.json({ message: "Attachment deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({ error: "Failed to delete attachment" });
  }
};

/**
 * Delete incident
 * DELETE /api/incidents/:id
 */
export const deleteIncident = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const userContext = {
      userId: req.user!.userId,
      role: req.user!.role,
      isSuperAdmin: req.user!.isSuperAdmin,
    };

    // Delete files from filesystem
    deleteIncidentFolder(id);

    await incidentService.deleteIncident(id, userContext);

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "DELETE_INCIDENT",
        entity: "Incident",
        entityId: id,
        details: {},
        ipAddress: req.ip,
      },
    });

    res.json({ message: "Incident deleted successfully" });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return res.status(403).json({ error: error.message });
    }
    console.error("Error deleting incident:", error);
    res.status(500).json({ error: "Failed to delete incident" });
  }
};

/**
 * Get incident statistics
 * GET /api/incidents/statistics
 */
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const userContext = {
      userId: req.user!.userId,
      role: req.user!.role,
      isSuperAdmin: req.user!.isSuperAdmin,
    };

    const statistics = await incidentService.getStatistics(
      filters,
      userContext
    );

    res.json({ statistics });
  } catch (error: any) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};

/**
 * Export incident report as PDF
 */
export const exportIncidentPDF = async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.params;

    // Check access
    const userContext = {
      userId: req.user!.userId,
      role: req.user!.role,
      isSuperAdmin: req.user!.isSuperAdmin,
    };

    const hasAccess = await incidentService.hasAccessToIncident(
      incidentId,
      userContext
    );

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this incident" });
    }

    await generateIncidentReportPDF(incidentId, res);
  } catch (error: any) {
    console.error("Error exporting incident PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export incident report" });
    }
  }
};

/**
 * Export incident summary as Excel
 */
export const exportIncidentsSummaryExcel = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      type,
      severity,
      status,
      startDate,
      endDate,
      assignedToId,
      isConfidential,
    } = req.query;

    const filters: any = {};
    if (type) filters.type = type as string;
    if (severity) filters.severity = severity as string;
    if (status) filters.status = status as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (assignedToId) filters.assignedToId = assignedToId as string;
    if (isConfidential !== undefined)
      filters.isConfidential = isConfidential === "true";

    const buffer = await generateIncidentSummaryExcel(filters);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=incident-summary-${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );
    res.send(buffer);
  } catch (error: any) {
    console.error("Error exporting incidents Excel:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export incidents summary" });
    }
  }
};
