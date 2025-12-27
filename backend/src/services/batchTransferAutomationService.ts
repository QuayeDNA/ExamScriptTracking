import { PrismaClient } from "@prisma/client";
import { io } from "../server";
import { emitBatchStatusUpdated } from "../socket/handlers/batchEvents";

const prisma = new PrismaClient();

type BatchStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "IN_TRANSIT"
  | "WITH_LECTURER"
  | "UNDER_GRADING"
  | "GRADED"
  | "RETURNED"
  | "COMPLETED";

function validateStatusTransition(
  currentStatus: BatchStatus,
  newStatus: BatchStatus
): { valid: boolean; error?: string } {
  // Define allowed transitions
  const allowedTransitions: Record<BatchStatus, BatchStatus[]> = {
    NOT_STARTED: ["IN_PROGRESS"], // Auto-triggered only
    IN_PROGRESS: ["SUBMITTED"], // Auto-triggered only on session end
    SUBMITTED: ["IN_TRANSIT"], // When transfer starts
    IN_TRANSIT: ["WITH_LECTURER", "SUBMITTED"], // Normal flow or return
    WITH_LECTURER: ["IN_TRANSIT", "UNDER_GRADING"], // Rollback or progress
    UNDER_GRADING: ["GRADED"],
    GRADED: ["RETURNED"],
    RETURNED: ["COMPLETED"],
    COMPLETED: [], // Terminal state
  };

  // Check if transition is allowed
  const allowed = allowedTransitions[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${
        allowed.join(", ") || "none"
      }`,
    };
  }

  return { valid: true };
}

/**
 * Auto-update exam session status based on transfer events
 */
export class BatchTransferAutomationService {
  /**
   * Called when a transfer is initiated
   * Updates status to IN_TRANSIT if this is the first transfer after SUBMITTED
   */
  static async handleTransferInitiated(examSessionId: string, userId: string) {
    try {
      const examSession = await prisma.examSession.findUnique({
        where: { id: examSessionId },
        include: {
          _count: {
            select: { transfers: true }
          }
        }
      });

      if (!examSession) {
        console.error(`Exam session ${examSessionId} not found for transfer initiation`);
        return;
      }

      // Only update to IN_TRANSIT if status is SUBMITTED and this is the first transfer
      if (examSession.status === "SUBMITTED" && examSession._count.transfers === 0) {
        const validation = validateStatusTransition("SUBMITTED", "IN_TRANSIT");

        if (validation.valid) {
          const updatedSession = await prisma.examSession.update({
            where: { id: examSessionId },
            data: { status: "IN_TRANSIT" }
          });

          // Log audit trail
          await prisma.auditLog.create({
            data: {
              userId,
              action: "AUTO_UPDATE_EXAM_SESSION_STATUS",
              entity: "ExamSession",
              entityId: examSessionId,
              details: {
                statusChange: {
                  from: "SUBMITTED",
                  to: "IN_TRANSIT",
                  triggeredBy: "transfer_initiated",
                  transferCount: 1
                }
              }
            }
          });

          // Emit status update
          emitBatchStatusUpdated(io, {
            id: updatedSession.id,
            batchQrCode: updatedSession.batchQrCode,
            courseCode: updatedSession.courseCode,
            courseName: updatedSession.courseName,
            status: updatedSession.status,
            department: updatedSession.department,
            faculty: updatedSession.faculty,
          });

          console.log(`Auto-updated exam session ${examSessionId} status to IN_TRANSIT`);
        }
      }
    } catch (error) {
      console.error("Error in handleTransferInitiated:", error);
    }
  }

  /**
   * Called when a transfer is confirmed
   * Updates status based on receiver role
   */
  static async handleTransferConfirmed(
    examSessionId: string,
    transferId: string,
    receiverId: string,
    receiverRole: string
  ) {
    try {
      const examSession = await prisma.examSession.findUnique({
        where: { id: examSessionId }
      });

      if (!examSession) {
        console.error(`Exam session ${examSessionId} not found for transfer confirmation`);
        return;
      }

      let newStatus: BatchStatus | null = null;

      // Determine new status based on receiver role
      if (receiverRole === "LECTURER") {
        newStatus = "WITH_LECTURER";
      } else if (["DEPARTMENT_HEAD", "FACULTY_OFFICER"].includes(receiverRole)) {
        newStatus = "UNDER_GRADING";
      }

      if (newStatus && examSession.status !== newStatus) {
        const validation = validateStatusTransition(examSession.status as BatchStatus, newStatus);

        if (validation.valid) {
          const updatedSession = await prisma.examSession.update({
            where: { id: examSessionId },
            data: { status: newStatus }
          });

          // Log audit trail
          await prisma.auditLog.create({
            data: {
              userId: receiverId,
              action: "AUTO_UPDATE_EXAM_SESSION_STATUS",
              entity: "ExamSession",
              entityId: examSessionId,
              details: {
                statusChange: {
                  from: examSession.status,
                  to: newStatus,
                  triggeredBy: "transfer_confirmed",
                  transferId,
                  receiverRole
                }
              }
            }
          });

          // Emit status update
          emitBatchStatusUpdated(io, {
            id: updatedSession.id,
            batchQrCode: updatedSession.batchQrCode,
            courseCode: updatedSession.courseCode,
            courseName: updatedSession.courseName,
            status: updatedSession.status,
            department: updatedSession.department,
            faculty: updatedSession.faculty,
          });

          console.log(`Auto-updated exam session ${examSessionId} status to ${newStatus} (receiver: ${receiverRole})`);
        }
      }
    } catch (error) {
      console.error("Error in handleTransferConfirmed:", error);
    }
  }

  /**
   * Called when exam session status is manually updated
   * Can trigger additional automation based on the new status
   */
  static async handleManualStatusUpdate(
    examSessionId: string,
    newStatus: BatchStatus,
    userId: string
  ) {
    try {
      // Additional automation logic can be added here
      // For example, when status becomes GRADED, automatically schedule return transfer
      // Or when status becomes RETURNED, prepare for completion

      console.log(`Manual status update to ${newStatus} for exam session ${examSessionId}`);
    } catch (error) {
      console.error("Error in handleManualStatusUpdate:", error);
    }
  }

  /**
   * Get the next expected status in the workflow
   */
  static getNextExpectedStatus(currentStatus: BatchStatus, context?: {
    receiverRole?: string;
    hasTransfers?: boolean;
  }): BatchStatus | null {
    switch (currentStatus) {
      case "NOT_STARTED":
        return "IN_PROGRESS";
      case "IN_PROGRESS":
        return "SUBMITTED";
      case "SUBMITTED":
        return context?.hasTransfers ? "IN_TRANSIT" : null;
      case "IN_TRANSIT":
        if (context?.receiverRole === "LECTURER") {
          return "WITH_LECTURER";
        }
        return null; // Wait for transfer confirmation
      case "WITH_LECTURER":
        return "UNDER_GRADING";
      case "UNDER_GRADING":
        return "GRADED";
      case "GRADED":
        return "RETURNED";
      case "RETURNED":
        return "COMPLETED";
      case "COMPLETED":
        return null;
      default:
        return null;
    }
  }

  /**
   * Validate if a status transition is allowed
   */
  static validateTransition(currentStatus: BatchStatus, newStatus: BatchStatus) {
    return validateStatusTransition(currentStatus, newStatus);
  }
}