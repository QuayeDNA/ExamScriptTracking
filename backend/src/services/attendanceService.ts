import { PrismaClient, VerificationMethod, AttendanceStatus, SessionStatus } from "@prisma/client";
import { emitAttendanceRecorded, emitLiveAttendanceUpdate } from "../socket/handlers/classAttendanceEvents";
import { StudentLookupService } from "./studentLookupService";
import * as crypto from "crypto";

const prisma = new PrismaClient();
const studentLookupService = new StudentLookupService();

interface RecordAttendanceParams {
  sessionId: string;
  studentId: string;
  method: VerificationMethod;
  deviceId?: string;
  biometricConfidence?: number;
  status: AttendanceStatus;
  recordedBy: string;
  linkTokenUsed?: string;
  metadata?: any;
}

export class AttendanceService {
  /**
   * Core method to record student attendance
   * Handles validation, duplicate checking, and real-time updates
   */
  async recordAttendance(params: RecordAttendanceParams) {
    const {
      sessionId,
      studentId,
      method,
      deviceId,
      biometricConfidence,
      status,
      recordedBy,
      linkTokenUsed,
      metadata,
    } = params;

    // Verify session exists and is active
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        creator: true,
      },
    });

    if (!session) {
      throw new Error("Attendance session not found");
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new Error("Attendance session is not active");
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Check for duplicate attendance
    const existingAttendance = await prisma.studentAttendance.findUnique({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId,
        },
      },
    });

    if (existingAttendance) {
      throw new Error(`Student ${student.indexNumber} has already been recorded for this session`);
    }

    // Check if attendance limit has been reached (if expectedStudentCount is set)
    if (session.expectedStudentCount > 0) {
      const currentAttendanceCount = await prisma.studentAttendance.count({
        where: { sessionId },
      });

      if (currentAttendanceCount >= session.expectedStudentCount) {
        throw new Error(`Attendance limit reached. Maximum ${session.expectedStudentCount} students expected for this session`);
      }
    }

    // Determine if confirmation is required (self-marked attendance via link)
    const requiresConfirmation = !!linkTokenUsed;

    // Create attendance record
    const attendance = await prisma.studentAttendance.create({
      data: {
        sessionId,
        studentId,
        verificationMethod: method,
        deviceId,
        biometricConfidence,
        status,
        recordedBy,
        requiresConfirmation,
        confirmedBy: requiresConfirmation ? null : recordedBy,
        confirmedAt: requiresConfirmation ? null : new Date(),
        linkTokenUsed,
        location: metadata?.location,
        metadata,
      },
      include: {
        student: true,
        session: {
          include: {
            creator: true,
          },
        },
      },
    });

    // Get updated session with all students for socket emission
    const updatedSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        attendance: {
          include: {
            student: true,
          },
          orderBy: {
            markedAt: 'desc',
          },
        },
        creator: true,
      },
    });

    // Emit real-time events
    emitAttendanceRecorded(attendance);
    if (updatedSession) {
      emitLiveAttendanceUpdate(updatedSession);
    }

    return attendance;
  }

  /**
   * Validate attendance link
   */
  async validateAttendanceLink(linkToken: string): Promise<{
    valid: boolean;
    sessionId?: string;
    error?: string;
  }> {
    const link = await prisma.attendanceLink.findUnique({
      where: { linkToken },
    });

    if (!link) {
      return { valid: false, error: "Invalid link" };
    }

    if (!link.isActive) {
      return { valid: false, error: "Link has been deactivated" };
    }

    if (new Date() > link.expiresAt) {
      return { valid: false, error: "Link has expired" };
    }

    if (link.maxUses && link.usesCount >= link.maxUses) {
      return { valid: false, error: "Link usage limit reached" };
    }

    // If link is associated with a session, check its status
    if (link.sessionId) {
      const session = await prisma.attendanceSession.findUnique({
        where: { id: link.sessionId },
      });

      if (session && session.status !== SessionStatus.IN_PROGRESS) {
        return { valid: false, error: "Attendance session is no longer active" };
      }
    }

    return { 
      valid: true, 
      sessionId: link.sessionId || undefined,
    };
  }

  /**
   * Increment link usage counter
   */
  async incrementLinkUsage(linkToken: string) {
    await prisma.attendanceLink.update({
      where: { linkToken },
      data: {
        usesCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get attendance summary for a session
   */
  async getAttendanceSummary(sessionId: string) {
    const [session, attendance] = await Promise.all([
      prisma.attendanceSession.findUnique({
        where: { id: sessionId },
        include: {
          creator: true,
        },
      }),
      prisma.studentAttendance.findMany({
        where: { sessionId },
        include: {
          student: true,
        },
        orderBy: {
          markedAt: 'asc',
        },
      }),
    ]);

    if (!session) {
      return null;
    }

    // Group by verification method
    const methodCounts = attendance.reduce((acc, att) => {
      const method = att.verificationMethod || 'UNKNOWN';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by status
    const statusCounts = attendance.reduce((acc, att) => {
      acc[att.status] = (acc[att.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average time between marks
    let avgTimeBetweenMarks = 0;
    if (attendance.length > 1) {
      const timeDiffs = [];
      for (let i = 1; i < attendance.length; i++) {
        const diff = attendance[i].markedAt.getTime() - attendance[i - 1].markedAt.getTime();
        timeDiffs.push(diff);
      }
      avgTimeBetweenMarks = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length / 1000; // seconds
    }

    return {
      session,
      attendance,
      summary: {
        totalStudents: attendance.length,
        expectedStudents: session.expectedStudentCount,
        methodBreakdown: methodCounts,
        statusBreakdown: statusCounts,
        avgTimeBetweenMarks: Math.round(avgTimeBetweenMarks),
        duration: session.endTime 
          ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60)
          : null,
      },
    };
  }

  /**
   * Get lecturer's attendance statistics
   */
  async getLecturerStats(userId: string, options?: {
    courseCode?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const whereClause: any = { createdBy: userId };
    if (options?.courseCode) whereClause.courseCode = options.courseCode;
    if (options?.startDate || options?.endDate) {
      whereClause.startTime = {};
      if (options?.startDate) whereClause.startTime.gte = options.startDate;
      if (options?.endDate) whereClause.startTime.lte = options.endDate;
    }

    const [sessions, coursesWithSessions] = await Promise.all([
      prisma.attendanceSession.findMany({
        where: whereClause,
        include: {
          attendance: true,
        },
      }),
      prisma.attendanceSession.groupBy({
        by: ['courseCode'],
        where: whereClause,
        _count: true,
        _sum: {
          expectedStudentCount: true,
        },
      }),
    ]);

    const completedSessions = sessions.filter(s => s.status === SessionStatus.COMPLETED);
    const totalStudents = sessions.reduce((sum, s) => sum + s.attendance.length, 0);
    const avgStudentsPerSession = sessions.length > 0 ? totalStudents / sessions.length : 0;

    return {
      overview: {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        activeSessions: sessions.length - completedSessions.length,
        totalStudentsRecorded: totalStudents,
        avgStudentsPerSession: Math.round(avgStudentsPerSession),
      },
      courses: coursesWithSessions.map(c => ({
        courseCode: c.courseCode,
        sessionCount: c._count,
        expectedStudents: c._sum.expectedStudentCount || 0,
      })),
    };
  }

  /**
   * Check if student can mark attendance via link
   */
  async canStudentUseLink(linkToken: string, studentId: string): Promise<{
    canUse: boolean;
    error?: string;
  }> {
    // Validate link first
    const linkValidation = await this.validateAttendanceLink(linkToken);
    if (!linkValidation.valid) {
      return { canUse: false, error: linkValidation.error };
    }

    if (!linkValidation.sessionId) {
      return { canUse: false, error: "Invalid attendance link" };
    }

    // Check if student already marked attendance
    const existingAttendance = await prisma.studentAttendance.findUnique({
      where: {
        sessionId_studentId: {
          sessionId: linkValidation.sessionId,
          studentId,
        },
      },
    });

    if (existingAttendance) {
      return { canUse: false, error: "You have already marked attendance for this session" };
    }

    return { canUse: true };
  }

  /**
   * Clean up expired links
   */
  async cleanupExpiredLinks() {
    const result = await prisma.attendanceLink.updateMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        isActive: true,
      },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Get student's attendance history
   */
  async getStudentAttendanceHistory(studentId: string, options?: {
    courseCode?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const whereClause: any = { studentId };
    if (options?.courseCode) {
      whereClause.session = { courseCode: options.courseCode };
    }
    if (options?.startDate || options?.endDate) {
      whereClause.markedAt = {};
      if (options?.startDate) whereClause.markedAt.gte = options.startDate;
      if (options?.endDate) whereClause.markedAt.lte = options.endDate;
    }

    const attendance = await prisma.studentAttendance.findMany({
      where: whereClause,
      include: {
        session: {
          include: {
            creator: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        markedAt: 'desc',
      },
    });

    // Group by course
    const byCourse = attendance.reduce((acc, att) => {
      const courseCode = att.session.courseCode || 'Unknown';
      if (!acc[courseCode]) {
        acc[courseCode] = {
          courseCode,
          courseName: att.session.courseName,
          sessions: [],
          totalSessions: 0,
          presentCount: 0,
        };
      }
      acc[courseCode].sessions.push(att);
      acc[courseCode].totalSessions++;
      if (att.status === AttendanceStatus.PRESENT) {
        acc[courseCode].presentCount++;
      }
      return acc;
    }, {} as Record<string, any>);

    return {
      attendance,
      summary: {
        totalSessions: attendance.length,
        present: attendance.filter(a => a.status === AttendanceStatus.PRESENT).length,
        late: attendance.filter(a => a.status === AttendanceStatus.LATE).length,
        excused: attendance.filter(a => a.status === AttendanceStatus.EXCUSED).length,
      },
      byCourse: Object.values(byCourse),
    };
  }

  /**
   * Create a new attendance session
   */
  async createSession(params: {
    userId: string;
    courseCode: string;
    courseName: string;
    venue?: string;
    notes?: string;
    expectedStudentCount?: number;
  }) {
    const { userId, courseCode, courseName, venue, notes, expectedStudentCount } = params;

    // Get lecturer name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const session = await prisma.attendanceSession.create({
      data: {
        courseCode,
        courseName,
        venue,
        notes,
        lecturerName: user ? `${user.firstName} ${user.lastName}` : undefined,
        createdBy: userId,
        expectedStudentCount: expectedStudentCount || 0,
        status: SessionStatus.IN_PROGRESS,
      },
      include: {
        creator: true,
      },
    });

    return session;
  }

  /**
   * End attendance session
   */
  async endSession(sessionId: string, userId: string, notes?: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.createdBy !== userId) {
      throw new Error("Unauthorized to end this session");
    }

    if (session.status !== SessionStatus.IN_PROGRESS && session.status !== SessionStatus.PAUSED) {
      throw new Error("Only active or paused sessions can be ended");
    }

    // Deactivate all active links for this session
    await prisma.attendanceLink.updateMany({
      where: {
        sessionId,
        isActive: true,
      },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    const updatedSession = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        endTime: new Date(),
        notes: notes || session.notes,
      },
      include: {
        creator: true,
        attendance: {
          include: {
            student: true,
          },
        },
      },
    });

    return updatedSession;
  }

  /**
   * Pause attendance session
   */
  async pauseSession(sessionId: string, userId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.createdBy !== userId) {
      throw new AppError('Only the session creator can pause it', 403);
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new AppError('Only active sessions can be paused', 400);
    }

    const updatedSession = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.PAUSED,
      },
      include: {
        creator: true,
        attendance: {
          include: {
            student: true,
          },
        },
      },
    });

    return updatedSession;
  }

  /**
   * Resume paused attendance session
   */
  async resumeSession(sessionId: string, userId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.createdBy !== userId) {
      throw new AppError('Only the session creator can resume it', 403);
    }

    if (session.status !== SessionStatus.PAUSED) {
      throw new AppError('Only paused sessions can be resumed', 400);
    }

    const updatedSession = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.IN_PROGRESS,
      },
      include: {
        creator: true,
        attendance: {
          include: {
            student: true,
          },
        },
      },
    });

    return updatedSession;
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string, userId: string, userRole: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    // Only creator or admin can delete
    if (session.createdBy !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new Error("Unauthorized to delete this session");
    }

    await prisma.attendanceSession.delete({
      where: { id: sessionId },
    });
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(userId: string, role: string) {
    const whereClause: any = { 
      status: { 
        in: [SessionStatus.IN_PROGRESS, SessionStatus.PAUSED] 
      } 
    };
    
    // Non-admins can only see their own sessions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      whereClause.createdBy = userId;
    }

    const sessions = await prisma.attendanceSession.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        attendance: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return sessions;
  }

  /**
   * Get session with statistics
   */
  async getSessionWithStats(sessionId: string, userId: string, role: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        creator: true,
        attendance: {
          include: {
            student: true,
          },
          orderBy: {
            markedAt: 'desc',
          },
        },
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    // Check access
    if (session.createdBy !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      throw new Error("Unauthorized to view this session");
    }

    return session;
  }

  /**
   * Get attendance history
   */
  async getHistory(
    userId: string,
    role: string,
    filters?: {
      courseCode?: string;
      startDate?: Date;
      endDate?: Date;
      status?: SessionStatus;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ) {
    const whereClause: any = {};

    // Non-admins can only see their own sessions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      whereClause.createdBy = userId;
    }

    if (filters?.courseCode) whereClause.courseCode = filters.courseCode;
    if (filters?.status) whereClause.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      whereClause.startTime = {};
      if (filters?.startDate) whereClause.startTime.gte = filters.startDate;
      if (filters?.endDate) whereClause.startTime.lte = filters.endDate;
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.attendanceSession.findMany({
        where: whereClause,
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          attendance: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.attendanceSession.count({ where: whereClause }),
    ]);

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Export session to CSV
   */
  async exportSessionToCSV(sessionId: string, userId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        attendance: {
          include: {
            student: true,
          },
          orderBy: {
            markedAt: 'asc',
          },
        },
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.createdBy !== userId) {
      throw new Error("Unauthorized to export this session");
    }

    // Generate CSV
    const headers = ['Index Number', 'First Name', 'Last Name', 'Program', 'Level', 'Status', 'Method', 'Time Marked', 'Confirmed'];
    const rows = session.attendance.map(att => [
      att.student.indexNumber,
      att.student.firstName,
      att.student.lastName,
      att.student.program,
      att.student.level.toString(),
      att.status,
      att.verificationMethod,
      att.markedAt.toISOString(),
      att.confirmedAt ? 'Yes' : 'No',
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return csv;
  }

  /**
   * Self-mark attendance (for students using link)
   */
  async selfMarkAttendance(params: {
    linkToken: string;
    studentId: string;
    location?: { lat: number; lng: number };
  }) {
    const { linkToken, studentId, location } = params;

    // Validate link
    const linkValidation = await this.validateAttendanceLink(linkToken);
    if (!linkValidation.valid) {
      throw new Error(linkValidation.error || "Invalid link");
    }

    if (!linkValidation.sessionId) {
      throw new Error("Link is not associated with a session");
    }

    // Check if student can use link
    const canUse = await this.canStudentUseLink(linkToken, studentId);
    if (!canUse.canUse) {
      throw new Error(canUse.error || "Cannot use link");
    }

    // Increment link usage
    await this.incrementLinkUsage(linkToken);

    // Record attendance
    return this.recordAttendance({
      sessionId: linkValidation.sessionId,
      studentId,
      method: VerificationMethod.LINK_SELF_MARK,
      status: AttendanceStatus.PRESENT,
      recordedBy: studentId, // Self-recorded
      linkTokenUsed: linkToken,
      metadata: { location },
    });
  }

  /**
   * Bulk record attendance
   */
  async recordBulkAttendance(
    sessionId: string,
    students: Array<{ identifier: string; method: VerificationMethod; status?: AttendanceStatus }>,
    recordedBy: string
  ) {
    const results = {
      success: [] as any[],
      failed: [] as any[],
    };

    for (const student of students) {
      try {
        const studentRecord = await studentLookupService.findStudent(student.identifier, student.method);
        if (!studentRecord) {
          results.failed.push({
            identifier: student.identifier,
            error: "Student not found",
          });
          continue;
        }

        const attendance = await this.recordAttendance({
          sessionId,
          studentId: studentRecord.id,
          method: student.method,
          status: student.status || AttendanceStatus.PRESENT,
          recordedBy,
        });

        results.success.push(attendance);
      } catch (error: any) {
        results.failed.push({
          identifier: student.identifier,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Add assistant to session
   */
  async addAssistant(sessionId: string, userId: string, assistantUserId: string, role: string = 'ASSISTANT') {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.createdBy !== userId) {
      throw new Error("Only session creator can add assistants");
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new Error("Cannot add assistants to completed sessions");
    }

    // Check if assistant exists
    const existingAssistant = await prisma.attendanceSessionAssistant.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: assistantUserId,
        },
      },
    });

    if (existingAssistant) {
      throw new Error("User is already an assistant for this session");
    }

    const assistant = await prisma.attendanceSessionAssistant.create({
      data: {
        sessionId,
        userId: assistantUserId,
        role: role as any,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return assistant;
  }

  /**
   * Remove assistant from session
   */
  async removeAssistant(sessionId: string, userId: string, assistantUserId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.createdBy !== userId) {
      throw new Error("Only session creator can remove assistants");
    }

    await prisma.attendanceSessionAssistant.delete({
      where: {
        sessionId_userId: {
          sessionId,
          userId: assistantUserId,
        },
      },
    });
  }

  /**
   * Check if user has permission to record attendance for a session
   */
  async canRecordAttendance(sessionId: string, userId: string): Promise<boolean> {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        assistants: true,
      },
    });

    if (!session) {
      return false;
    }

    // Creator can always record
    if (session.createdBy === userId) {
      return true;
    }

    // Check if user is an assistant with recording permissions
    const assistant = session.assistants.find(a => a.userId === userId);
    return assistant?.role === 'ASSISTANT'; // OBSERVER role cannot record
  }

  /**
   * Bulk confirm attendance records
   */
  async bulkConfirmAttendance(sessionId: string, userId: string, attendanceIds: string[], confirm: boolean = true) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.createdBy !== userId) {
      throw new Error("Only session creator can confirm attendance");
    }

    const now = new Date();
    
    const updated = await prisma.studentAttendance.updateMany({
      where: {
        id: { in: attendanceIds },
        sessionId,
        requiresConfirmation: true,
      },
      data: confirm ? {
        confirmedBy: userId,
        confirmedAt: now,
        requiresConfirmation: false,
      } : {
        // Rejecting means deleting the record
      },
    });

    // If rejecting, delete the records
    if (!confirm) {
      await prisma.studentAttendance.deleteMany({
        where: {
          id: { in: attendanceIds },
          sessionId,
        },
      });
    }

    return {
      confirmed: confirm ? updated.count : 0,
      rejected: confirm ? 0 : attendanceIds.length,
    };
  }

  /**
   * Update attendance status (for late arrivals, excused absences)
   */
  async updateAttendanceStatus(attendanceId: string, userId: string, status: AttendanceStatus, notes?: string) {
    const attendance = await prisma.studentAttendance.findUnique({
      where: { id: attendanceId },
      include: {
        session: true,
      },
    });

    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    // Check permission
    const canUpdate = await this.canRecordAttendance(attendance.sessionId, userId);
    if (!canUpdate) {
      throw new Error("Unauthorized to update this attendance");
    }

    const updated = await prisma.studentAttendance.update({
      where: { id: attendanceId },
      data: {
        status,
        metadata: {
          ...(typeof attendance.metadata === 'object' ? attendance.metadata : {}),
          statusNote: notes,
          statusUpdatedAt: new Date().toISOString(),
          statusUpdatedBy: userId,
        },
      },
      include: {
        student: true,
      },
    });

    return updated;
  }

  /**
   * Delete attendance record (undo)
   */
  async deleteAttendance(attendanceId: string, userId: string, userRole: string) {
    const attendance = await prisma.studentAttendance.findUnique({
      where: { id: attendanceId },
      include: {
        session: true,
      },
    });

    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    // Check permission
    const canDelete = await this.canRecordAttendance(attendance.sessionId, userId);
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);

    if (!canDelete && !isAdmin) {
      throw new Error("Unauthorized to delete this attendance");
    }

    await prisma.studentAttendance.delete({
      where: { id: attendanceId },
    });
  }

  /**
   * Save session as template
   */
  async saveSessionTemplate(userId: string, name: string, courseCode: string, courseName: string, venue?: string, expectedStudentCount?: number) {
    const template = await prisma.sessionTemplate.create({
      data: {
        name,
        courseCode,
        courseName,
        venue,
        expectedStudentCount: expectedStudentCount || 0,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return template;
  }

  /**
   * Get all templates for a user
   */
  async getSessionTemplates(userId: string, role: string) {
    const whereClause: any = {};
    
    // Non-admins can only see their own templates
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      whereClause.createdBy = userId;
    }

    const templates = await prisma.sessionTemplate.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return templates;
  }

  /**
   * Create session from template
   */
  async createSessionFromTemplate(userId: string, templateId: string) {
    // Get the template
    const template = await prisma.sessionTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Create session from template
    return this.createSession({
      userId,
      courseCode: template.courseCode,
      courseName: template.courseName,
      venue: template.venue || undefined,
      expectedStudentCount: template.expectedStudentCount,
    });
  }

  /**
   * Get attendance analytics
   */
  async getAnalytics(
    userId: string,
    role: string,
    filters: {
      startDate: Date;
      endDate: Date;
      courseCode?: string;
      lecturerId?: string;
      groupBy?: 'day' | 'week' | 'month' | 'course';
    }
  ) {
    const whereClause: any = {
      startTime: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    };

    // Non-admins can only see their own sessions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      whereClause.createdBy = userId;
    }

    if (filters.courseCode) whereClause.courseCode = filters.courseCode;
    if (filters.lecturerId) whereClause.createdBy = filters.lecturerId;

    // Get sessions with attendance data
    const sessions = await prisma.attendanceSession.findMany({
      where: whereClause,
      include: {
        attendance: {
          select: {
            status: true,
            markedAt: true,
          },
        },
      },
    });

    // Calculate summary statistics
    const totalSessions = sessions.length;
    const totalAttendance = sessions.reduce((sum, session) => sum + session.attendance.length, 0);
    const presentAttendance = sessions.reduce((sum, session) =>
      sum + session.attendance.filter(a => a.status === 'PRESENT').length, 0
    );
    const averageAttendanceRate = totalSessions > 0 ? (presentAttendance / totalAttendance) * 100 : 0;

    // Get unique students
    const studentIds = new Set<string>();
    sessions.forEach(session => {
      session.attendance.forEach(attendance => {
        // Assuming attendance has studentId, but we need to get it from the record
        // For now, we'll count unique attendance records as students
      });
    });
    const totalStudents = studentIds.size || totalAttendance; // Fallback

    // Calculate trends
    const dailyTrends: Record<string, number> = {};
    const courseBreakdown: Record<string, { sessions: number; attendance: number; rate: number }> = {};

    sessions.forEach(session => {
      // Daily trends
      const date = session.startTime.toISOString().split('T')[0];
      if (!dailyTrends[date]) dailyTrends[date] = 0;
      dailyTrends[date] += session.attendance.filter(a => a.status === 'PRESENT').length;

      // Course breakdown
      if (!courseBreakdown[session.courseCode]) {
        courseBreakdown[session.courseCode] = { sessions: 0, attendance: 0, rate: 0 };
      }
      courseBreakdown[session.courseCode].sessions += 1;
      courseBreakdown[session.courseCode].attendance += session.attendance.filter(a => a.status === 'PRESENT').length;
    });

    // Calculate rates for course breakdown
    Object.keys(courseBreakdown).forEach(courseCode => {
      const course = courseBreakdown[courseCode];
      course.rate = course.sessions > 0 ? (course.attendance / course.sessions) * 100 : 0;
    });

    return {
      period: {
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
      },
      summary: {
        totalSessions,
        totalAttendance,
        averageAttendanceRate,
        totalStudents,
      },
      trends: {
        daily: dailyTrends,
        courseBreakdown,
      },
    };
  }
}
