import { Server } from "socket.io";
import { emitToRoles } from "../socketServer";

/**
 * Emit class attendance student scanned event
 */
export function emitClassAttendanceScanned(
  io: Server,
  data: {
    recordId: string;
    sessionId: string;
    studentId: string;
    studentName: string;
    indexNumber: string;
    scanTime: string;
    totalStudents: number;
    courseCode?: string;
    courseName?: string;
    verificationMethod?: string;
  }
) {
  // Emit to admins and class reps
  emitToRoles(io, ["ADMIN", "CLASS_REP"], "class_attendance:student_scanned", {
    recordId: data.recordId,
    sessionId: data.sessionId,
    studentId: data.studentId,
    studentName: data.studentName,
    indexNumber: data.indexNumber,
    scanTime: data.scanTime,
    totalStudents: data.totalStudents,
    courseCode: data.courseCode,
    courseName: data.courseName,
    verificationMethod: data.verificationMethod,
  });
}

/**
 * Emit class attendance recording started event
 */
export function emitClassAttendanceStarted(
  io: Server,
  data: {
    recordId: string;
    sessionId: string;
    courseCode?: string;
    courseName?: string;
    lecturerName?: string;
    startTime: string;
  }
) {
  emitToRoles(
    io,
    ["ADMIN", "CLASS_REP"],
    "class_attendance:recording_started",
    {
      recordId: data.recordId,
      sessionId: data.sessionId,
      courseCode: data.courseCode,
      courseName: data.courseName,
      lecturerName: data.lecturerName,
      startTime: data.startTime,
    }
  );
}

/**
 * Emit class attendance recording ended event
 */
export function emitClassAttendanceEnded(
  io: Server,
  data: {
    recordId: string;
    sessionId: string;
    courseCode?: string;
    courseName?: string;
    totalStudents: number;
    endTime: string;
  }
) {
  emitToRoles(io, ["ADMIN", "CLASS_REP"], "class_attendance:recording_ended", {
    recordId: data.recordId,
    sessionId: data.sessionId,
    courseCode: data.courseCode,
    courseName: data.courseName,
    totalStudents: data.totalStudents,
    endTime: data.endTime,
  });
}
