import { Server } from "socket.io";
import { SocketEvents, emitToUser, emitToRoles } from "../socketServer";

/**
 * Emit transfer request notification
 */
export function emitTransferRequested(
  io: Server,
  transfer: {
    id: string;
    fromHandlerId: string;
    toHandlerId: string;
    examSession: {
      courseCode: string;
      courseName: string;
      batchQrCode: string;
    };
  }
) {
  // Notify the recipient handler
  emitToUser(io, transfer.toHandlerId, SocketEvents.TRANSFER_REQUESTED, {
    transferId: transfer.id,
    fromHandlerId: transfer.fromHandlerId,
    courseCode: transfer.examSession.courseCode,
    courseName: transfer.examSession.courseName,
    batchQrCode: transfer.examSession.batchQrCode,
    type: "transfer_requested",
    timestamp: new Date().toISOString(),
  });

  // Notify admins
  emitToRoles(io, ["ADMIN"], SocketEvents.TRANSFER_REQUESTED, {
    transferId: transfer.id,
    fromHandlerId: transfer.fromHandlerId,
    toHandlerId: transfer.toHandlerId,
    courseCode: transfer.examSession.courseCode,
    courseName: transfer.examSession.courseName,
    type: "transfer_requested",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit transfer confirmation notification
 */
export function emitTransferConfirmed(
  io: Server,
  transfer: {
    id: string;
    fromHandlerId: string;
    toHandlerId: string;
    examSession: {
      courseCode: string;
      courseName: string;
    };
  }
) {
  // Notify the sender
  emitToUser(io, transfer.fromHandlerId, SocketEvents.TRANSFER_CONFIRMED, {
    transferId: transfer.id,
    toHandlerId: transfer.toHandlerId,
    courseCode: transfer.examSession.courseCode,
    courseName: transfer.examSession.courseName,
    timestamp: new Date().toISOString(),
  });

  // Notify admins
  emitToRoles(io, ["ADMIN"], SocketEvents.TRANSFER_CONFIRMED, {
    transferId: transfer.id,
    fromHandlerId: transfer.fromHandlerId,
    toHandlerId: transfer.toHandlerId,
    courseCode: transfer.examSession.courseCode,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit transfer rejection notification
 */
export function emitTransferRejected(
  io: Server,
  transfer: {
    id: string;
    fromHandlerId: string;
    toHandlerId: string;
    examSession: {
      courseCode: string;
      courseName: string;
    };
    rejectionReason?: string;
  }
) {
  // Notify the sender
  emitToUser(io, transfer.fromHandlerId, SocketEvents.TRANSFER_REJECTED, {
    transferId: transfer.id,
    toHandlerId: transfer.toHandlerId,
    courseCode: transfer.examSession.courseCode,
    courseName: transfer.examSession.courseName,
    rejectionReason: transfer.rejectionReason,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit transfer update notification
 */
export function emitTransferUpdated(
  io: Server,
  transfer: {
    id: string;
    fromHandlerId: string;
    toHandlerId: string;
    status: string;
    examSession: {
      courseCode: string;
    };
  }
) {
  // Notify both handlers
  emitToUser(io, transfer.fromHandlerId, SocketEvents.TRANSFER_UPDATED, {
    transferId: transfer.id,
    status: transfer.status,
    courseCode: transfer.examSession.courseCode,
    timestamp: new Date().toISOString(),
  });

  emitToUser(io, transfer.toHandlerId, SocketEvents.TRANSFER_UPDATED, {
    transferId: transfer.id,
    status: transfer.status,
    courseCode: transfer.examSession.courseCode,
    timestamp: new Date().toISOString(),
  });
}
