import { Request, Response } from "express";
import { PrismaClient, TransferStatus } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation Schemas
const createTransferSchema = z.object({
  examSessionId: z.string().uuid("Invalid exam session ID"),
  toHandlerId: z.string().min(1, "Receiver handler ID is required"),
  scriptsExpected: z
    .number()
    .int()
    .positive("Scripts expected must be a positive number"),
  location: z.string().optional(),
});

const confirmTransferSchema = z.object({
  scriptsReceived: z
    .number()
    .int()
    .positive("Scripts received must be a positive number"),
  discrepancyNote: z.string().optional(),
});

const updateTransferStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "DISCREPANCY_REPORTED", "RESOLVED"]),
});

/**
 * Initiate a batch transfer request
 * POST /api/transfers
 * Auth: Authenticated user with appropriate role
 */
export const createTransfer = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = createTransferSchema.parse(req.body);
    const fromHandlerId = req.user!.userId;

    // Verify exam session exists
    const examSession = await prisma.examSession.findUnique({
      where: { id: validatedData.examSessionId },
    });

    if (!examSession) {
      return res.status(404).json({
        error: "Exam session not found",
      });
    }

    // Verify sender is authorized (must be ADMIN, INVIGILATOR, or LECTURER)
    const fromHandler = await prisma.user.findUnique({
      where: { id: fromHandlerId },
      select: { role: true, firstName: true, lastName: true },
    });

    if (!fromHandler) {
      return res.status(404).json({
        error: "Sender handler not found",
      });
    }

    if (!["ADMIN", "INVIGILATOR", "LECTURER"].includes(fromHandler.role)) {
      return res.status(403).json({
        error: "Only admins, invigilators, or lecturers can initiate transfers",
      });
    }

    // Verify receiver exists
    const toHandler = await prisma.user.findUnique({
      where: { id: validatedData.toHandlerId },
      select: { role: true, firstName: true, lastName: true },
    });

    if (!toHandler) {
      return res.status(404).json({
        error: "Receiver handler not found",
      });
    }

    // Prevent transferring to self
    if (fromHandlerId === validatedData.toHandlerId) {
      return res.status(400).json({
        error: "Cannot transfer to yourself",
      });
    }

    // Create transfer request
    const transfer = await prisma.batchTransfer.create({
      data: {
        examSessionId: validatedData.examSessionId,
        fromHandlerId,
        toHandlerId: validatedData.toHandlerId,
        scriptsExpected: validatedData.scriptsExpected,
        location: validatedData.location,
        status: "PENDING",
      },
      include: {
        examSession: {
          select: {
            batchQrCode: true,
            courseCode: true,
            courseName: true,
            venue: true,
            status: true,
          },
        },
        fromHandler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        toHandler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: fromHandlerId,
        action: "INITIATE_TRANSFER",
        entity: "BatchTransfer",
        entityId: transfer.id,
        details: {
          examSessionId: validatedData.examSessionId,
          courseCode: examSession.courseCode,
          courseName: examSession.courseName,
          fromHandlerId,
          fromHandlerName: `${fromHandler.firstName} ${fromHandler.lastName}`,
          toHandlerId: validatedData.toHandlerId,
          toHandlerName: `${toHandler.firstName} ${toHandler.lastName}`,
          scriptsExpected: validatedData.scriptsExpected,
          location: validatedData.location,
          requestedAt: transfer.requestedAt,
        },
      },
    });

    return res.status(201).json({
      message: "Transfer request created successfully",
      transfer,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.issues,
      });
    }

    console.error("Error creating transfer:", error);
    return res.status(500).json({
      error: "Failed to create transfer request",
    });
  }
};

/**
 * Confirm a batch transfer (receiver accepts)
 * PATCH /api/transfers/:id/confirm
 * Auth: Receiver handler only
 */
export const confirmTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = confirmTransferSchema.parse(req.body);
    const receiverHandlerId = req.user!.userId;

    // Find transfer
    const transfer = await prisma.batchTransfer.findUnique({
      where: { id },
      include: {
        examSession: {
          select: {
            courseCode: true,
            courseName: true,
          },
        },
        fromHandler: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        toHandler: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!transfer) {
      return res.status(404).json({
        error: "Transfer not found",
      });
    }

    // Verify user is the receiver
    if (transfer.toHandlerId !== receiverHandlerId) {
      return res.status(403).json({
        error: "Only the designated receiver can confirm this transfer",
      });
    }

    // Check if already confirmed
    if (transfer.status !== "PENDING") {
      return res.status(400).json({
        error: `Transfer already ${transfer.status.toLowerCase()}`,
      });
    }

    // Determine status based on script count match
    const hasDiscrepancy =
      validatedData.scriptsReceived !== transfer.scriptsExpected;
    const newStatus: TransferStatus = hasDiscrepancy
      ? "DISCREPANCY_REPORTED"
      : "CONFIRMED";

    // Update transfer
    const updatedTransfer = await prisma.batchTransfer.update({
      where: { id },
      data: {
        scriptsReceived: validatedData.scriptsReceived,
        discrepancyNote: validatedData.discrepancyNote,
        confirmedAt: new Date(),
        status: newStatus,
      },
      include: {
        examSession: {
          select: {
            batchQrCode: true,
            courseCode: true,
            courseName: true,
            venue: true,
            status: true,
          },
        },
        fromHandler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        toHandler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: receiverHandlerId,
        action: hasDiscrepancy
          ? "CONFIRM_TRANSFER_WITH_DISCREPANCY"
          : "CONFIRM_TRANSFER",
        entity: "BatchTransfer",
        entityId: transfer.id,
        details: {
          examSessionId: transfer.examSessionId,
          courseCode: transfer.examSession.courseCode,
          courseName: transfer.examSession.courseName,
          fromHandlerId: transfer.fromHandlerId,
          fromHandlerName: `${transfer.fromHandler.firstName} ${transfer.fromHandler.lastName}`,
          toHandlerId: transfer.toHandlerId,
          toHandlerName: `${transfer.toHandler.firstName} ${transfer.toHandler.lastName}`,
          scriptsExpected: transfer.scriptsExpected,
          scriptsReceived: validatedData.scriptsReceived,
          discrepancy: hasDiscrepancy,
          discrepancyNote: validatedData.discrepancyNote,
          confirmedAt: updatedTransfer.confirmedAt,
        },
      },
    });

    return res.status(200).json({
      message: hasDiscrepancy
        ? "Transfer confirmed with discrepancy reported"
        : "Transfer confirmed successfully",
      transfer: updatedTransfer,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.issues,
      });
    }

    console.error("Error confirming transfer:", error);
    return res.status(500).json({
      error: "Failed to confirm transfer",
    });
  }
};

/**
 * Reject a batch transfer
 * PATCH /api/transfers/:id/reject
 * Auth: Receiver handler only
 */
export const rejectTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const receiverHandlerId = req.user!.userId;

    // Find transfer
    const transfer = await prisma.batchTransfer.findUnique({
      where: { id },
      include: {
        examSession: {
          select: {
            courseCode: true,
            courseName: true,
          },
        },
        fromHandler: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        toHandler: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!transfer) {
      return res.status(404).json({
        error: "Transfer not found",
      });
    }

    // Verify user is the receiver
    if (transfer.toHandlerId !== receiverHandlerId) {
      return res.status(403).json({
        error: "Only the designated receiver can reject this transfer",
      });
    }

    // Check if still pending
    if (transfer.status !== "PENDING") {
      return res.status(400).json({
        error: `Transfer already ${transfer.status.toLowerCase()}`,
      });
    }

    // Delete transfer (rejection means cancellation)
    await prisma.batchTransfer.delete({
      where: { id },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: receiverHandlerId,
        action: "REJECT_TRANSFER",
        entity: "BatchTransfer",
        entityId: transfer.id,
        details: {
          examSessionId: transfer.examSessionId,
          courseCode: transfer.examSession.courseCode,
          courseName: transfer.examSession.courseName,
          fromHandlerId: transfer.fromHandlerId,
          fromHandlerName: `${transfer.fromHandler.firstName} ${transfer.fromHandler.lastName}`,
          toHandlerId: transfer.toHandlerId,
          toHandlerName: `${transfer.toHandler.firstName} ${transfer.toHandler.lastName}`,
          scriptsExpected: transfer.scriptsExpected,
          reason,
        },
      },
    });

    return res.status(200).json({
      message: "Transfer rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting transfer:", error);
    return res.status(500).json({
      error: "Failed to reject transfer",
    });
  }
};

/**
 * Update transfer status (admin only - for resolving discrepancies)
 * PATCH /api/transfers/:id/status
 * Auth: Admin only
 */
export const updateTransferStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateTransferStatusSchema.parse(req.body);
    const adminId = req.user!.userId;

    // Find transfer
    const transfer = await prisma.batchTransfer.findUnique({
      where: { id },
      include: {
        examSession: {
          select: {
            courseCode: true,
            courseName: true,
          },
        },
      },
    });

    if (!transfer) {
      return res.status(404).json({
        error: "Transfer not found",
      });
    }

    // Update status
    const updatedTransfer = await prisma.batchTransfer.update({
      where: { id },
      data: {
        status: validatedData.status,
      },
      include: {
        examSession: {
          select: {
            batchQrCode: true,
            courseCode: true,
            courseName: true,
            venue: true,
            status: true,
          },
        },
        fromHandler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        toHandler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "UPDATE_TRANSFER_STATUS",
        entity: "BatchTransfer",
        entityId: transfer.id,
        details: {
          examSessionId: transfer.examSessionId,
          courseCode: transfer.examSession.courseCode,
          courseName: transfer.examSession.courseName,
          previousStatus: transfer.status,
          newStatus: validatedData.status,
        },
      },
    });

    return res.status(200).json({
      message: "Transfer status updated successfully",
      transfer: updatedTransfer,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.issues,
      });
    }

    console.error("Error updating transfer status:", error);
    return res.status(500).json({
      error: "Failed to update transfer status",
    });
  }
};

/**
 * Get transfers with filters
 * GET /api/transfers
 * Query params: examSessionId, status, fromHandlerId, toHandlerId, handlerId (either from or to)
 * Auth: Authenticated users can see transfers they're involved in, admins see all
 */
export const getTransfers = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { examSessionId, status, fromHandlerId, toHandlerId, handlerId } =
      req.query;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN";

    // Build where clause
    const where: any = {};

    if (examSessionId) {
      where.examSessionId = examSessionId as string;
    }

    if (status) {
      where.status = status as TransferStatus;
    }

    if (handlerId) {
      // User wants transfers where they are either sender or receiver
      where.OR = [
        { fromHandlerId: handlerId as string },
        { toHandlerId: handlerId as string },
      ];
    } else {
      // Specific filters
      if (fromHandlerId) {
        where.fromHandlerId = fromHandlerId as string;
      }

      if (toHandlerId) {
        where.toHandlerId = toHandlerId as string;
      }

      // Non-admin users can only see their own transfers
      if (!isAdmin) {
        where.OR = [{ fromHandlerId: userId }, { toHandlerId: userId }];
      }
    }

    const transfers = await prisma.batchTransfer.findMany({
      where,
      include: {
        examSession: {
          select: {
            batchQrCode: true,
            courseCode: true,
            courseName: true,
            venue: true,
            status: true,
          },
        },
        fromHandler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        toHandler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    return res.status(200).json({
      transfers,
      count: transfers.length,
    });
  } catch (error) {
    console.error("Error fetching transfers:", error);
    return res.status(500).json({
      error: "Failed to fetch transfers",
    });
  }
};

/**
 * Get single transfer by ID
 * GET /api/transfers/:id
 * Auth: Involved handlers and admins only
 */
export const getTransferById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const transfer = await prisma.batchTransfer.findUnique({
      where: { id },
      include: {
        examSession: {
          select: {
            batchQrCode: true,
            courseCode: true,
            courseName: true,
            venue: true,
            examDate: true,
            status: true,
          },
        },
        fromHandler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            email: true,
          },
        },
        toHandler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            email: true,
          },
        },
      },
    });

    if (!transfer) {
      return res.status(404).json({
        error: "Transfer not found",
      });
    }

    // Check authorization - user must be involved in transfer or admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN";
    const isInvolved =
      transfer.fromHandlerId === userId || transfer.toHandlerId === userId;

    if (!isAdmin && !isInvolved) {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    return res.status(200).json({
      transfer,
    });
  } catch (error) {
    console.error("Error fetching transfer:", error);
    return res.status(500).json({
      error: "Failed to fetch transfer",
    });
  }
};

/**
 * Get transfer history for an exam session (chain of custody)
 * GET /api/transfers/history/:examSessionId
 * Auth: Authenticated users
 */
export const getTransferHistory = async (req: Request, res: Response) => {
  try {
    const { examSessionId } = req.params;

    // Verify exam session exists
    const examSession = await prisma.examSession.findUnique({
      where: { id: examSessionId },
      select: {
        courseCode: true,
        courseName: true,
        venue: true,
        examDate: true,
        status: true,
      },
    });

    if (!examSession) {
      return res.status(404).json({
        error: "Exam session not found",
      });
    }

    const transfers = await prisma.batchTransfer.findMany({
      where: { examSessionId },
      include: {
        fromHandler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        toHandler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        requestedAt: "asc",
      },
    });

    return res.status(200).json({
      examSession,
      transfers,
      count: transfers.length,
    });
  } catch (error) {
    console.error("Error fetching transfer history:", error);
    return res.status(500).json({
      error: "Failed to fetch transfer history",
    });
  }
};
