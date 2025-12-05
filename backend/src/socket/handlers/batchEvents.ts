import { Server } from "socket.io";
import { SocketEvents, emitToRoles, emitToAll } from "../socketServer";

/**
 * Emit batch status update
 */
export function emitBatchStatusUpdated(
  io: Server,
  batch: {
    id: string;
    batchQrCode: string;
    courseCode: string;
    courseName: string;
    status: string;
    department: string;
    faculty: string;
  }
) {
  // Notify all relevant roles
  emitToRoles(
    io,
    ["ADMIN", "FACULTY_OFFICER", "DEPARTMENT_HEAD", "LECTURER", "INVIGILATOR"],
    SocketEvents.BATCH_STATUS_UPDATED,
    {
      batchId: batch.id,
      batchQrCode: batch.batchQrCode,
      courseCode: batch.courseCode,
      courseName: batch.courseName,
      status: batch.status,
      department: batch.department,
      faculty: batch.faculty,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit batch created notification
 */
export function emitBatchCreated(
  io: Server,
  batch: {
    id: string;
    batchQrCode: string;
    courseCode: string;
    courseName: string;
    department: string;
    faculty: string;
    examDate: Date;
  }
) {
  // Notify admins and faculty officers
  emitToRoles(io, ["ADMIN", "FACULTY_OFFICER"], SocketEvents.BATCH_CREATED, {
    batchId: batch.id,
    batchQrCode: batch.batchQrCode,
    courseCode: batch.courseCode,
    courseName: batch.courseName,
    department: batch.department,
    faculty: batch.faculty,
    examDate: batch.examDate.toISOString(),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit dashboard stats update
 */
export function emitDashboardStatsUpdated(io: Server, stats: any) {
  // Notify all connected clients
  emitToAll(io, SocketEvents.DASHBOARD_STATS_UPDATED, {
    stats,
    timestamp: new Date().toISOString(),
  });
}
