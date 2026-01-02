/**
 * Socket.IO Event Handlers for Class Attendance
 * Real-time updates for attendance recording, session management, and live tracking
 */

import { io } from "../../server";
import { ClassAttendanceRecord, ClassAttendance, User, Student } from "@prisma/client";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type AttendanceWithRelations = ClassAttendance & {
  student: Student;
  record: ClassAttendanceRecord & {
    user: User | null;
  };
};

type RecordWithRelations = ClassAttendanceRecord & {
  user: User | null;
  students: (ClassAttendance & {
    student: Student;
  })[];
};

// ============================================================================
// EVENT EMITTERS
// ============================================================================

/**
 * Emit when a new attendance session is started
 * Notifies all connected clients about the new session
 */
export const emitSessionStarted = (record: RecordWithRelations) => {
  const payload = {
    type: "SESSION_STARTED",
    data: {
      id: record.id,
      courseCode: record.courseCode,
      courseName: record.courseName,
      lecturerName: record.lecturerName,
      startTime: record.startTime,
      createdBy: record.user ? {
        id: record.user.id,
        name: `${record.user.firstName} ${record.user.lastName}`,
        role: record.user.role,
      } : null,
    },
    timestamp: new Date().toISOString(),
  };

  // Broadcast to all connected clients
  io.emit("attendance:sessionStarted", payload);

  // Also emit to specific room for this session
  io.to(`attendance:session:${record.id}`).emit("attendance:update", payload);

  console.log(`📡 Socket: Session started - ${record.courseCode} (${record.id})`);
};

/**
 * Emit when an attendance session is ended
 * Notifies all clients and provides session summary
 */
export const emitSessionEnded = (record: RecordWithRelations) => {
  const duration = record.endTime && record.startTime
    ? Math.round((record.endTime.getTime() - record.startTime.getTime()) / 1000 / 60)
    : 0;

  const payload = {
    type: "SESSION_ENDED",
    data: {
      id: record.id,
      courseCode: record.courseCode,
      courseName: record.courseName,
      endTime: record.endTime,
      totalStudents: record.totalStudents,
      duration,
      summary: {
        totalRecorded: record.students.length,
        methods: record.students.reduce((acc, s) => {
          const method = s.verificationMethod || 'UNKNOWN';
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    },
    timestamp: new Date().toISOString(),
  };

  // Broadcast to all connected clients
  io.emit("attendance:sessionEnded", payload);

  // Emit to specific room for this session
  io.to(`attendance:session:${record.id}`).emit("attendance:update", payload);

  console.log(`📡 Socket: Session ended - ${record.courseCode} (${record.totalStudents} students)`);
};

/**
 * Emit when a student's attendance is recorded
 * Real-time notification for immediate feedback
 */
export const emitAttendanceRecorded = (attendance: AttendanceWithRelations) => {
  const payload = {
    type: "ATTENDANCE_RECORDED",
    data: {
      id: attendance.id,
      recordId: attendance.recordId,
      student: {
        id: attendance.student.id,
        indexNumber: attendance.student.indexNumber,
        firstName: attendance.student.firstName,
        lastName: attendance.student.lastName,
      },
      scanTime: attendance.scanTime,
      status: attendance.status,
      verificationMethod: attendance.verificationMethod,
      lecturerConfirmed: attendance.lecturerConfirmed,
      biometricConfidence: attendance.biometricConfidence,
    },
    session: {
      id: attendance.record.id,
      courseCode: attendance.record.courseCode,
      courseName: attendance.record.courseName,
    },
    timestamp: new Date().toISOString(),
  };

  // Emit to session-specific room
  io.to(`attendance:session:${attendance.recordId}`).emit("attendance:recorded", payload);

  // Also emit to general attendance channel
  io.emit("attendance:studentRecorded", payload);

  console.log(`📡 Socket: Attendance recorded - ${attendance.student.indexNumber} via ${attendance.verificationMethod}`);
};

/**
 * Emit live attendance updates
 * Used for real-time count updates and student list changes
 */
export const emitLiveAttendanceUpdate = (record: RecordWithRelations) => {
  const payload = {
    type: "LIVE_UPDATE",
    data: {
      id: record.id,
      courseCode: record.courseCode,
      courseName: record.courseName,
      totalStudents: record.totalStudents,
      currentCount: record.students.length,
      recentStudents: record.students.slice(0, 5).map(s => ({
        indexNumber: s.student.indexNumber,
        name: `${s.student.firstName} ${s.student.lastName}`,
        scanTime: s.scanTime,
        method: s.verificationMethod,
        status: s.status,
      })),
    },
    timestamp: new Date().toISOString(),
  };

  // Emit to session-specific room
  io.to(`attendance:session:${record.id}`).emit("attendance:liveUpdate", payload);

  console.log(`📡 Socket: Live update - ${record.courseCode} (${record.totalStudents} students)`);
};

/**
 * Emit when attendance link is generated
 * Notifies connected clients about new self-service link
 */
export const emitLinkGenerated = (data: {
  recordId: string;
  linkToken: string;
  expiresAt: Date;
  maxUses?: number | null;
}) => {
  const payload = {
    type: "LINK_GENERATED",
    data: {
      recordId: data.recordId,
      token: data.linkToken,
      url: `${process.env.APP_URL}/attendance/mark/${data.linkToken}`,
      expiresAt: data.expiresAt,
      maxUses: data.maxUses,
    },
    timestamp: new Date().toISOString(),
  };

  // Emit to session-specific room
  io.to(`attendance:session:${data.recordId}`).emit("attendance:linkGenerated", payload);

  console.log(`📡 Socket: Link generated for session ${data.recordId}`);
};

/**
 * Emit when biometric enrollment is completed
 */
export const emitBiometricEnrolled = (data: {
  studentId: string;
  indexNumber: string;
  provider: string;
}) => {
  const payload = {
    type: "BIOMETRIC_ENROLLED",
    data: {
      studentId: data.studentId,
      indexNumber: data.indexNumber,
      provider: data.provider,
      enrolledAt: new Date(),
    },
    timestamp: new Date().toISOString(),
  };

  // Broadcast to all connected clients
  io.emit("attendance:biometricEnrolled", payload);

  console.log(`📡 Socket: Biometric enrolled - ${data.indexNumber} (${data.provider})`);
};

/**
 * Emit error notification
 * Used for duplicate attendance attempts or other errors
 */
export const emitAttendanceError = (data: {
  recordId: string;
  error: string;
  studentIndexNumber?: string;
}) => {
  const payload = {
    type: "ERROR",
    data: {
      recordId: data.recordId,
      error: data.error,
      studentIndexNumber: data.studentIndexNumber,
    },
    timestamp: new Date().toISOString(),
  };

  // Emit to session-specific room
  io.to(`attendance:session:${data.recordId}`).emit("attendance:error", payload);

  console.log(`📡 Socket: Error - ${data.error}`);
};

// ============================================================================
// SOCKET CONNECTION HANDLERS
// ============================================================================

/**
 * Setup socket.io event listeners for attendance
 * Called when a client connects
 */
export const setupAttendanceSocketHandlers = (socket: any) => {
  // Join attendance session room
  socket.on("attendance:joinSession", (sessionId: string) => {
    socket.join(`attendance:session:${sessionId}`);
    console.log(`📡 Socket ${socket.id} joined attendance session: ${sessionId}`);
    
    socket.emit("attendance:joined", {
      sessionId,
      message: "Successfully joined attendance session",
      timestamp: new Date().toISOString(),
    });
  });

  // Leave attendance session room
  socket.on("attendance:leaveSession", (sessionId: string) => {
    socket.leave(`attendance:session:${sessionId}`);
    console.log(`📡 Socket ${socket.id} left attendance session: ${sessionId}`);
    
    socket.emit("attendance:left", {
      sessionId,
      message: "Successfully left attendance session",
      timestamp: new Date().toISOString(),
    });
  });

  // Request current session status
  socket.on("attendance:requestStatus", async (sessionId: string) => {
    // This would typically fetch from database and emit current state
    // For now, acknowledge the request
    socket.emit("attendance:statusRequested", {
      sessionId,
      timestamp: new Date().toISOString(),
    });
  });

  // Ping/Pong for connection health
  socket.on("attendance:ping", () => {
    socket.emit("attendance:pong", {
      timestamp: new Date().toISOString(),
    });
  });
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all connected clients in a session room
 */
export const getSessionClients = (sessionId: string): number => {
  const room = io.sockets.adapter.rooms.get(`attendance:session:${sessionId}`);
  return room ? room.size : 0;
};

/**
 * Broadcast message to all clients in a session
 */
export const broadcastToSession = (sessionId: string, event: string, data: any) => {
  io.to(`attendance:session:${sessionId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Check if a user is connected to a session
 */
export const isUserInSession = (socketId: string, sessionId: string): boolean => {
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) return false;
  
  return socket.rooms.has(`attendance:session:${sessionId}`);
};
