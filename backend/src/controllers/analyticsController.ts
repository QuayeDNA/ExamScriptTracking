import { Request, Response } from "express";
import { PrismaClient, BatchStatus, TransferStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Analytics Controller
 *
 * Provides data analytics and insights for the Exam Script Tracking System.
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
