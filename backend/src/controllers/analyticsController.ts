import { Request, Response } from "express";
import { PrismaClient, BatchStatus, TransferStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Analytics Controller
 *
 * Provides data analytics and insights for the Exam Logistics System (ELMS).
 * All endpoints require ADMIN role.
 */

interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

interface FilterParams extends DateRangeParams {
  department?: string;
  faculty?: string;
  status?: string;
}

/**
 * GET /api/analytics/overview
 *
 * System overview statistics
 *
 * @returns {Object} Overview statistics including:
 *   - Total exams (all time, this month)
 *   - Active batches count
 *   - Total handlers
 *   - Total discrepancies
 *   - Average transfer time
 */
export const getOverview = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as DateRangeParams;

    // Date range filter
    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };

    // Total exams
    const totalExams = await prisma.examSession.count({
      where: startDate || endDate ? { examDate: dateFilter } : undefined,
    });

    // Exams this month
    const firstDayOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const examsThisMonth = await prisma.examSession.count({
      where: {
        createdAt: { gte: firstDayOfMonth },
      },
    });

    // Active batches (not completed)
    const activeBatches = await prisma.examSession.count({
      where: {
        status: {
          not: BatchStatus.COMPLETED,
        },
      },
    });

    // Total handlers
    const totalHandlers = await prisma.user.count({
      where: {
        role: {
          in: ["INVIGILATOR", "LECTURER", "FACULTY_OFFICER", "DEPARTMENT_HEAD"],
        },
        isActive: true,
      },
    });

    // Total discrepancies (transfers with discrepancy notes)
    const totalDiscrepancies = await prisma.batchTransfer.count({
      where: {
        discrepancyNote: { not: null },
        ...(startDate || endDate ? { requestedAt: dateFilter } : {}),
      },
    });

    // Average transfer time (hours)
    const completedTransfers = await prisma.batchTransfer.findMany({
      where: {
        status: TransferStatus.CONFIRMED,
        confirmedAt: { not: null },
        ...(startDate || endDate ? { requestedAt: dateFilter } : {}),
      },
      select: {
        requestedAt: true,
        confirmedAt: true,
      },
    });

    const avgTransferTimeHours =
      completedTransfers.length > 0
        ? completedTransfers.reduce((acc: number, transfer: any) => {
            const duration =
              transfer.confirmedAt!.getTime() - transfer.requestedAt.getTime();
            return acc + duration / (1000 * 60 * 60); // Convert to hours
          }, 0) / completedTransfers.length
        : 0;

    // Discrepancy rate
    const totalTransfers = await prisma.batchTransfer.count({
      where: startDate || endDate ? { requestedAt: dateFilter } : undefined,
    });

    const discrepancyRate =
      totalTransfers > 0 ? (totalDiscrepancies / totalTransfers) * 100 : 0;

    // Exam trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentExams = await prisma.examSession.findMany({
      where: {
        examDate: { gte: thirtyDaysAgo },
      },
      select: {
        examDate: true,
      },
    });

    // Format trends by day
    const trendsByDay = recentExams.reduce((acc: any, item: any) => {
      const day = item.examDate.toISOString().split("T")[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    res.json({
      overview: {
        totalExams,
        examsThisMonth,
        activeBatches,
        totalHandlers,
        totalDiscrepancies,
        discrepancyRate: parseFloat(discrepancyRate.toFixed(2)),
        avgTransferTimeHours: parseFloat(avgTransferTimeHours.toFixed(2)),
      },
      trends: {
        examsByDay: trendsByDay,
      },
    });
  } catch (error) {
    console.error("Error fetching overview analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics overview" });
  }
};

/**
 * GET /api/analytics/handler-performance
 *
 * Handler performance metrics
 *
 * @returns {Array} Handler performance data including:
 *   - Handler name, email, role
 *   - Transfers handled
 *   - Average response time
 *   - Discrepancy rate
 *   - Current custody count
 */
export const getHandlerPerformance = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as DateRangeParams;

    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };

    // Get all handlers
    const handlers = await prisma.user.findMany({
      where: {
        role: {
          in: ["INVIGILATOR", "LECTURER", "FACULTY_OFFICER", "DEPARTMENT_HEAD"],
        },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    // Calculate metrics for each handler
    const performanceData = await Promise.all(
      handlers.map(async (handler: any) => {
        // Transfers received
        const transfersReceived = await prisma.batchTransfer.count({
          where: {
            toHandlerId: handler.id,
            ...(startDate || endDate ? { requestedAt: dateFilter } : {}),
          },
        });

        // Transfers initiated
        const transfersInitiated = await prisma.batchTransfer.count({
          where: {
            fromHandlerId: handler.id,
            ...(startDate || endDate ? { requestedAt: dateFilter } : {}),
          },
        });

        const totalTransfers = transfersReceived + transfersInitiated;

        // Average response time (for received transfers)
        const receivedTransfersWithTime = await prisma.batchTransfer.findMany({
          where: {
            toHandlerId: handler.id,
            confirmedAt: { not: null },
            ...(startDate || endDate ? { requestedAt: dateFilter } : {}),
          },
          select: {
            requestedAt: true,
            confirmedAt: true,
          },
        });

        const avgResponseTimeHours =
          receivedTransfersWithTime.length > 0
            ? receivedTransfersWithTime.reduce((acc: number, transfer: any) => {
                const duration =
                  transfer.confirmedAt!.getTime() -
                  transfer.requestedAt.getTime();
                return acc + duration / (1000 * 60 * 60);
              }, 0) / receivedTransfersWithTime.length
            : 0;

        // Discrepancies
        const discrepancies = await prisma.batchTransfer.count({
          where: {
            OR: [{ fromHandlerId: handler.id }, { toHandlerId: handler.id }],
            discrepancyNote: { not: null },
            ...(startDate || endDate ? { requestedAt: dateFilter } : {}),
          },
        });

        const discrepancyRate =
          totalTransfers > 0 ? (discrepancies / totalTransfers) * 100 : 0;

        // Current custody (batches in their custody right now)
        const currentCustody = await prisma.batchTransfer.count({
          where: {
            toHandlerId: handler.id,
            status: TransferStatus.CONFIRMED,
            examSession: {
              status: {
                not: BatchStatus.COMPLETED,
              },
            },
          },
        });

        return {
          handler: {
            id: handler.id,
            name: `${handler.firstName} ${handler.lastName}`,
            email: handler.email,
            role: handler.role,
          },
          metrics: {
            totalTransfers,
            transfersReceived,
            transfersInitiated,
            avgResponseTimeHours: parseFloat(avgResponseTimeHours.toFixed(2)),
            discrepancies,
            discrepancyRate: parseFloat(discrepancyRate.toFixed(2)),
            currentCustody,
          },
        };
      })
    );

    // Sort by total transfers (descending)
    performanceData.sort(
      (a: any, b: any) => b.metrics.totalTransfers - a.metrics.totalTransfers
    );

    res.json(performanceData);
  } catch (error) {
    console.error("Error fetching handler performance:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch handler performance data" });
  }
};

/**
 * GET /api/analytics/discrepancies
 *
 * Discrepancy reports and analytics
 *
 * @returns {Object} Discrepancy data including:
 *   - Total discrepancies
 *   - Discrepancies by type
 *   - Trend over time
 *   - Most common issues
 *   - Resolution rate
 */
export const getDiscrepancies = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, department, faculty } =
      req.query as FilterParams;

    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };

    // Build filters
    const filters: any = {
      discrepancyNote: { not: null },
      ...(startDate || endDate ? { requestedAt: dateFilter } : {}),
    };

    if (department || faculty) {
      filters.examSession = {
        ...(department && { department }),
        ...(faculty && { faculty }),
      };
    }

    // Get all discrepancies
    const discrepancies = await prisma.batchTransfer.findMany({
      where: filters,
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
        examSession: {
          select: {
            id: true,
            batchQrCode: true,
            courseCode: true,
            courseName: true,
            department: true,
            faculty: true,
            status: true,
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    // Total discrepancies
    const totalDiscrepancies = discrepancies.length;

    // Resolved vs unresolved
    const resolved = discrepancies.filter(
      (d: any) => d.status === TransferStatus.RESOLVED
    ).length;
    const unresolved = totalDiscrepancies - resolved;
    const resolutionRate =
      totalDiscrepancies > 0 ? (resolved / totalDiscrepancies) * 100 : 0;

    // Discrepancies by status
    const byStatus = discrepancies.reduce((acc: any, d: any) => {
      const status = d.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Discrepancies by department
    const byDepartment = discrepancies.reduce((acc: any, d: any) => {
      const dept = d.examSession.department;
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    // Trend over time (group by day)
    const trend = discrepancies.reduce((acc: any, d: any) => {
      const day = d.requestedAt.toISOString().split("T")[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    // Most common notes (if discrepancy notes exist)
    const notes = discrepancies
      .filter((d: any) => d.discrepancyNote)
      .map((d: any) => d.discrepancyNote!);

    res.json({
      summary: {
        total: totalDiscrepancies,
        resolved,
        unresolved,
        resolutionRate: parseFloat(resolutionRate.toFixed(2)),
      },
      breakdown: {
        byStatus,
        byDepartment,
      },
      trend,
      recentDiscrepancies: discrepancies.slice(0, 20), // Latest 20
    });
  } catch (error) {
    console.error("Error fetching discrepancies:", error);
    res.status(500).json({ message: "Failed to fetch discrepancy data" });
  }
};

/**
 * GET /api/analytics/exam-stats
 *
 * Exam statistics and completion metrics
 *
 * @returns {Object} Exam statistics including:
 *   - Exams by status
 *   - Exams by department/faculty
 *   - Peak exam periods
 *   - Completion rates
 *   - Average processing time
 */
export const getExamStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, department, faculty } =
      req.query as FilterParams;

    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };

    const filters: any = {
      ...(startDate || endDate ? { examDate: dateFilter } : {}),
      ...(department && { department }),
      ...(faculty && { faculty }),
    };

    // Exams by status
    const examsByStatus = await prisma.examSession.groupBy({
      by: ["status"],
      where: filters,
      _count: true,
    });

    const statusBreakdown = examsByStatus.reduce((acc: any, item: any) => {
      acc[item.status] = item._count;
      return acc;
    }, {});

    // Exams by department
    const examsByDepartment = await prisma.examSession.groupBy({
      by: ["department"],
      where: filters,
      _count: true,
    });

    const departmentBreakdown = examsByDepartment.reduce(
      (acc: any, item: any) => {
        acc[item.department] = item._count;
        return acc;
      },
      {}
    );

    // Exams by faculty
    const examsByFaculty = await prisma.examSession.groupBy({
      by: ["faculty"],
      where: filters,
      _count: true,
    });

    const facultyBreakdown = examsByFaculty.reduce((acc: any, item: any) => {
      acc[item.faculty] = item._count;
      return acc;
    }, {});

    // Completion rate
    const totalExams = await prisma.examSession.count({ where: filters });
    const completedExams = await prisma.examSession.count({
      where: {
        ...filters,
        status: BatchStatus.COMPLETED,
      },
    });

    const completionRate =
      totalExams > 0 ? (completedExams / totalExams) * 100 : 0;

    // Average processing time (from creation to completion)
    const completedExamsWithTime = await prisma.examSession.findMany({
      where: {
        ...filters,
        status: BatchStatus.COMPLETED,
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const avgProcessingTimeDays =
      completedExamsWithTime.length > 0
        ? completedExamsWithTime.reduce((acc: number, exam: any) => {
            const duration =
              exam.updatedAt.getTime() - exam.createdAt.getTime();
            return acc + duration / (1000 * 60 * 60 * 24); // Convert to days
          }, 0) / completedExamsWithTime.length
        : 0;

    // Peak exam periods (group by month)
    const examsByMonth = await prisma.examSession.findMany({
      where: filters,
      select: {
        examDate: true,
      },
    });

    const monthlyBreakdown = examsByMonth.reduce((acc: any, exam: any) => {
      const month = exam.examDate.toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    // Average students per exam
    const examsWithAttendance = await prisma.examSession.findMany({
      where: filters,
      include: {
        _count: {
          select: {
            attendances: true,
          },
        },
      },
    });

    const avgStudentsPerExam =
      examsWithAttendance.length > 0
        ? examsWithAttendance.reduce(
            (acc: number, exam: any) => acc + exam._count.attendances,
            0
          ) / examsWithAttendance.length
        : 0;

    res.json({
      summary: {
        totalExams,
        completedExams,
        completionRate: parseFloat(completionRate.toFixed(2)),
        avgProcessingTimeDays: parseFloat(avgProcessingTimeDays.toFixed(2)),
        avgStudentsPerExam: parseFloat(avgStudentsPerExam.toFixed(1)),
      },
      breakdown: {
        byStatus: statusBreakdown,
        byDepartment: departmentBreakdown,
        byFaculty: facultyBreakdown,
        byMonth: monthlyBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching exam stats:", error);
    res.status(500).json({ message: "Failed to fetch exam statistics" });
  }
};

/**
 * GET /api/analytics/user-activity
 *
 * Get recent activity for the logged-in user
 *
 * @returns {Object} User activity data including:
 *   - Recent audit logs for the user
 *   - Recent incidents assigned to the user
 *   - Recent batch transfers involving the user
 *   - Recent attendance sessions
 */
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Get recent audit logs for this user (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: {
        userId,
        timestamp: { gte: thirtyDaysAgo },
      },
      orderBy: { timestamp: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        timestamp: true,
        details: true,
      },
    });

    // Get recent incidents assigned to this user
    const recentIncidents = await prisma.incident.findMany({
      where: {
        assigneeId: userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        incidentNumber: true,
        title: true,
        status: true,
        severity: true,
        createdAt: true,
      },
    });

    // Get recent batch transfers involving this user
    const recentTransfers = await prisma.batchTransfer.findMany({
      where: {
        OR: [{ fromHandlerId: userId }, { toHandlerId: userId }],
        requestedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { requestedAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        requestedAt: true,
        confirmedAt: true,
        examSession: {
          select: {
            batchQrCode: true,
            courseCode: true,
            courseName: true,
          },
        },
      },
    });

    // Get recent attendance sessions for this user (if applicable)
    // Note: Attendance sessions are device-based, not directly tied to users in current schema
    const recentAttendance: any[] = []; // Temporarily disabled

    // Combine and sort all activities by date
    const activities = [
      ...recentAuditLogs.map((log) => ({
        id: `audit-${log.id}`,
        type: "audit" as const,
        title: getActivityTitle(log.action, log.entity),
        description:
          formatActivityDescription(log.details) ||
          `${log.action} on ${log.entity}`,
        timestamp: log.timestamp,
        status: "completed" as const,
      })),
      ...recentIncidents.map((incident) => ({
        id: `incident-${incident.id}`,
        type: "incident" as const,
        title: `Incident Assigned: ${incident.incidentNumber}`,
        description: incident.title,
        timestamp: incident.createdAt,
        status: incident.status.toLowerCase() as any,
      })),
      ...recentTransfers.map((transfer) => ({
        id: `transfer-${transfer.id}`,
        type: "transfer" as const,
        title: `Batch Transfer: ${
          transfer.examSession?.batchQrCode || "Unknown"
        }`,
        description: `${transfer.examSession?.courseCode} - ${transfer.examSession?.courseName}`,
        timestamp: transfer.requestedAt,
        status: transfer.status.toLowerCase() as any,
      })),
      // Attendance tracking temporarily disabled due to schema limitations
      // ...recentAttendance.map((session) => ({
      //   id: `attendance-${session.id}`,
      //   type: "attendance" as const,
      //   title: `Attendance Session: ${
      //     session.record.session.sessionName || session.record.session.lecturerName || "Session"
      //   }`,
      //   description: `${session.record.session.courseCode} - ${session.record.session.courseName}`,
      //   timestamp: session.scanTime,
      //   status: session.status.toLowerCase() as any,
      // })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 20);

    res.json({
      activities,
      summary: {
        totalActivities: activities.length,
        auditLogs: recentAuditLogs.length,
        incidents: recentIncidents.length,
        transfers: recentTransfers.length,
        attendance: recentAttendance.length,
      },
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE /api/analytics/user-activity
 *
 * Clear all recent activity for the logged-in user
 *
 * @returns {Object} Success message
 */
export const clearUserActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Delete all audit logs for this user (older than 30 days will be kept automatically)
    // Note: In a production system, you might want to soft delete or archive instead
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const deletedCount = await prisma.auditLog.deleteMany({
      where: {
        userId,
        timestamp: { gte: thirtyDaysAgo }, // Only delete recent logs
      },
    });

    res.json({
      message: "Recent activity cleared successfully",
      deletedCount,
    });
  } catch (error) {
    console.error("Error clearing user activity:", error);
    res.status(500).json({ message: "Failed to clear user activity" });
  }
};

// Helper function to get human-readable activity titles
function getActivityTitle(action: string, entity: string): string {
  const actionMap: Record<string, string> = {
    LOGIN: "Logged in",
    LOGOUT: "Logged out",
    PASSWORD_CHANGE: "Changed password",
    FIRST_TIME_PASSWORD_CHANGE: "Set initial password",
    CREATE: `Created ${entity.toLowerCase()}`,
    UPDATE: `Updated ${entity.toLowerCase()}`,
    DELETE: `Deleted ${entity.toLowerCase()}`,
    REACTIVATE: `Reactivated ${entity.toLowerCase()}`,
    DEACTIVATE: `Deactivated ${entity.toLowerCase()}`,
    UPLOAD: `Uploaded to ${entity.toLowerCase()}`,
    DOWNLOAD: `Downloaded from ${entity.toLowerCase()}`,
  };

  return actionMap[action] || `${action} ${entity.toLowerCase()}`;
}

// Helper function to format activity descriptions
function formatActivityDescription(details: any): string | null {
  if (!details) return null;

  // If details is already a string, return it
  if (typeof details === "string") return details;

  // If details is an object, format it nicely
  if (typeof details === "object") {
    const parts: string[] = [];

    if (details.email) parts.push(`Email: ${details.email}`);
    if (details.role) parts.push(`Role: ${details.role}`);
    if (details.name) parts.push(`Name: ${details.name}`);
    if (details.firstName && details.lastName) {
      parts.push(`Name: ${details.firstName} ${details.lastName}`);
    }
    if (details.department) parts.push(`Department: ${details.department}`);
    if (details.faculty) parts.push(`Faculty: ${details.faculty}`);

    return parts.length > 0 ? parts.join(", ") : null;
  }

  return null;
}
