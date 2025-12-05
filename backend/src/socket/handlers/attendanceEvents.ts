import { Server } from "socket.io";
import { SocketEvents, emitToUser, emitToRoles } from "../socketServer";

/**
 * Emit attendance recorded notification
 */
export function emitAttendanceRecorded(
  io: Server,
  attendance: {
    id: string;
    studentId: string;
    examSessionId: string;
    status: string;
    student: {
      indexNumber: string;
      firstName: string;
      lastName: string;
    };
    examSession: {
      courseCode: string;
      courseName: string;
    };
  }
) {
  // Notify admins
  emitToRoles(io, ["ADMIN"], SocketEvents.ATTENDANCE_RECORDED, {
    attendanceId: attendance.id,
    studentId: attendance.studentId,
    studentName: `${attendance.student.firstName} ${attendance.student.lastName}`,
    indexNumber: attendance.student.indexNumber,
    examSessionId: attendance.examSessionId,
    courseCode: attendance.examSession.courseCode,
    courseName: attendance.examSession.courseName,
    status: attendance.status,
    timestamp: new Date().toISOString(),
  });
}
