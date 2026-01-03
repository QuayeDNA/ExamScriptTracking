import { PrismaClient, AttendanceMethod, ClassAttendanceStatus, RecordingStatus } from "@prisma/client";
import { emitAttendanceRecorded, emitLiveAttendanceUpdate } from "../socket/handlers/classAttendanceEvents";

const prisma = new PrismaClient();

interface RecordAttendanceParams {
  recordId: string;
  studentId: string;
  verificationMethod: AttendanceMethod;
  deviceId?: string;
  biometricConfidence?: number;
  status: ClassAttendanceStatus;
  lecturerConfirmed: boolean;
  linkTokenUsed?: string;
}

export class AttendanceService {
  /**
   * Core method to record student attendance
   * Handles validation, duplicate checking, and real-time updates
   */
  async recordAttendance(params: RecordAttendanceParams) {
    const {
      recordId,
      studentId,
      verificationMethod,
      deviceId,
      biometricConfidence,
      status,
      lecturerConfirmed,
      linkTokenUsed,
    } = params;

    // Verify record exists and is active
    const record = await prisma.classAttendanceRecord.findUnique({
      where: { id: recordId },
      include: {
        user: true,
        session: true,
      },
    });

    if (!record) {
      throw new Error("Attendance record not found");
    }

    if (record.status !== RecordingStatus.IN_PROGRESS) {
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
    const existingAttendance = await prisma.classAttendance.findUnique({
      where: {
        recordId_studentId: {
          recordId,
          studentId,
        },
      },
    });

    if (existingAttendance) {
      throw new Error(`Student ${student.indexNumber} has already been recorded for this session`);
    }

    // Check if attendance limit has been reached (if totalStudents is set)
    if (record.totalStudents > 0) {
      const currentAttendanceCount = await prisma.classAttendance.count({
        where: { recordId },
      });

      if (currentAttendanceCount >= record.totalStudents) {
        throw new Error(`Attendance limit reached. Maximum ${record.totalStudents} students expected for this session`);
      }
    }

    // Create attendance record
    const attendance = await prisma.classAttendance.create({
      data: {
        recordId,
        studentId,
        verificationMethod,
        deviceId,
        biometricConfidence,
        status,
        lecturerConfirmed,
        confirmedAt: lecturerConfirmed ? new Date() : null,
        linkTokenUsed,
      },
      include: {
        student: true,
        record: {
          include: {
            user: true,
          },
        },
      },
    });

    // totalStudents is the EXPECTED limit, not the count
    // The actual count is derived from students.length
    // No need to increment here

    // Get updated record with all students for socket emission
    const updatedRecord = await prisma.classAttendanceRecord.findUnique({
      where: { id: recordId },
      include: {
        students: {
          include: {
            student: true,
          },
          orderBy: {
            scanTime: 'desc',
          },
        },
        user: true,
      },
    });

    // Emit real-time events
    emitAttendanceRecorded(attendance);
    if (updatedRecord) {
      emitLiveAttendanceUpdate(updatedRecord);
    }

    return attendance;
  }

  /**
   * Validate attendance link
   */
  async validateAttendanceLink(linkToken: string): Promise<{
    valid: boolean;
    recordId?: string;
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

    // If link is associated with a record, check its status
    if (link.recordId) {
      const record = await prisma.classAttendanceRecord.findUnique({
        where: { id: link.recordId },
      });

      if (record && record.status !== RecordingStatus.IN_PROGRESS) {
        return { valid: false, error: "Attendance session is no longer active" };
      }
    }

    return { 
      valid: true, 
      recordId: link.recordId || undefined,
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
   * Get attendance summary for a record
   */
  async getAttendanceSummary(recordId: string) {
    const [record, attendance] = await Promise.all([
      prisma.classAttendanceRecord.findUnique({
        where: { id: recordId },
        include: {
          user: true,
        },
      }),
      prisma.classAttendance.findMany({
        where: { recordId },
        include: {
          student: true,
        },
        orderBy: {
          scanTime: 'asc',
        },
      }),
    ]);

    if (!record) {
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

    // Calculate average scan time between students
    let avgTimeBetweenScans = 0;
    if (attendance.length > 1) {
      const timeDiffs = [];
      for (let i = 1; i < attendance.length; i++) {
        const diff = attendance[i].scanTime.getTime() - attendance[i - 1].scanTime.getTime();
        timeDiffs.push(diff);
      }
      avgTimeBetweenScans = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length / 1000; // seconds
    }

    return {
      record,
      attendance,
      summary: {
        totalStudents: attendance.length,
        methodBreakdown: methodCounts,
        statusBreakdown: statusCounts,
        avgTimeBetweenScans: Math.round(avgTimeBetweenScans),
        duration: record.endTime 
          ? Math.round((record.endTime.getTime() - record.startTime.getTime()) / 1000 / 60)
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
    const whereClause: any = { userId };
    if (options?.courseCode) whereClause.courseCode = options.courseCode;
    if (options?.startDate || options?.endDate) {
      whereClause.startTime = {};
      if (options?.startDate) whereClause.startTime.gte = options.startDate;
      if (options?.endDate) whereClause.startTime.lte = options.endDate;
    }

    const [sessions, coursesWithSessions] = await Promise.all([
      prisma.classAttendanceRecord.findMany({
        where: whereClause,
        include: {
          students: true,
        },
      }),
      prisma.classAttendanceRecord.groupBy({
        by: ['courseCode'],
        where: whereClause,
        _count: true,
        _sum: {
          totalStudents: true,
        },
      }),
    ]);

    const completedSessions = sessions.filter(s => s.status === RecordingStatus.COMPLETED);
    const totalStudents = sessions.reduce((sum, s) => sum + s.totalStudents, 0);
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
        totalStudents: c._sum.totalStudents || 0,
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

    if (!linkValidation.recordId) {
      return { canUse: false, error: "Invalid attendance link" };
    }

    // Check if student already marked attendance
    const existingAttendance = await prisma.classAttendance.findUnique({
      where: {
        recordId_studentId: {
          recordId: linkValidation.recordId,
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
      whereClause.record = { courseCode: options.courseCode };
    }
    if (options?.startDate || options?.endDate) {
      whereClause.scanTime = {};
      if (options?.startDate) whereClause.scanTime.gte = options.startDate;
      if (options?.endDate) whereClause.scanTime.lte = options.endDate;
    }

    const attendance = await prisma.classAttendance.findMany({
      where: whereClause,
      include: {
        record: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        scanTime: 'desc',
      },
    });

    // Group by course
    const byCourse = attendance.reduce((acc, att) => {
      const courseCode = att.record.courseCode || 'Unknown';
      if (!acc[courseCode]) {
        acc[courseCode] = {
          courseCode,
          courseName: att.record.courseName,
          sessions: [],
          totalSessions: 0,
          presentCount: 0,
        };
      }
      acc[courseCode].sessions.push(att);
      acc[courseCode].totalSessions++;
      if (att.status === ClassAttendanceStatus.PRESENT) {
        acc[courseCode].presentCount++;
      }
      return acc;
    }, {} as Record<string, any>);

    return {
      attendance,
      summary: {
        totalSessions: attendance.length,
        present: attendance.filter(a => a.status === ClassAttendanceStatus.PRESENT).length,
        late: attendance.filter(a => a.status === ClassAttendanceStatus.LATE).length,
        excused: attendance.filter(a => a.status === ClassAttendanceStatus.EXCUSED).length,
      },
      byCourse: Object.values(byCourse),
    };
  }
}
