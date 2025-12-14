import {
  PrismaClient,
  Incident,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
  Role,
} from "@prisma/client";
import { generateIncidentNumber } from "../utils/incidentNumberGenerator";

const prisma = new PrismaClient();

interface CreateIncidentData {
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location?: string;
  reporterId: string;
  assigneeId?: string;
  studentId?: string;
  examSessionId?: string;
  attendanceId?: string;
  transferId?: string;
  incidentDate?: Date;
  isConfidential?: boolean;
  autoCreated?: boolean;
  metadata?: any;
}

interface UpdateIncidentData {
  type?: IncidentType;
  severity?: IncidentSeverity;
  title?: string;
  description?: string;
  location?: string;
  assigneeId?: string;
  isConfidential?: boolean;
  metadata?: any;
}

interface IncidentFilters {
  type?: IncidentType;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  isConfidential?: boolean;
  reporterId?: string;
  assigneeId?: string;
  studentId?: string;
  examSessionId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

interface UserContext {
  userId: string;
  role: Role;
  isSuperAdmin?: boolean;
}

export class IncidentService {
  /**
   * Create a new incident
   */
  async createIncident(data: CreateIncidentData): Promise<Incident> {
    const incidentNumber = await generateIncidentNumber();

    // Auto-set confidentiality for MALPRACTICE incidents
    const isConfidential = data.isConfidential ?? data.type === "MALPRACTICE";

    const incident = await prisma.incident.create({
      data: {
        incidentNumber,
        type: data.type,
        severity: data.severity,
        title: data.title,
        description: data.description,
        location: data.location,
        reporterId: data.reporterId,
        assigneeId: data.assigneeId,
        studentId: data.studentId,
        examSessionId: data.examSessionId,
        attendanceId: data.attendanceId,
        transferId: data.transferId,
        incidentDate: data.incidentDate || new Date(),
        isConfidential,
        autoCreated: data.autoCreated || false,
        metadata: data.metadata,
        status: "REPORTED",
      },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        student: true,
        examSession: true,
        attendance: true,
        transfer: true,
        attachments: true,
        comments: {
          include: {
            user: { select: { firstName: true, lastName: true, role: true } },
          },
        },
        statusHistory: {
          include: {
            user: { select: { firstName: true, lastName: true, role: true } },
          },
        },
      },
    });

    // Create initial status history
    await prisma.incidentStatusHistory.create({
      data: {
        incidentId: incident.id,
        fromStatus: null,
        toStatus: "REPORTED",
        changedBy: data.reporterId,
        reason: "Incident created",
      },
    });

    // If assigned immediately, create assignment history
    if (data.assigneeId) {
      await this.assignIncident(
        incident.id,
        data.assigneeId,
        data.reporterId,
        "Initial assignment"
      );
    }

    return incident;
  }

  /**
   * Auto-create incident (from system triggers)
   */
  async autoCreateIncident(
    data: Omit<CreateIncidentData, "autoCreated">
  ): Promise<Incident> {
    return this.createIncident({ ...data, autoCreated: true });
  }

  /**
   * Get incidents with filters and access control
   */
  async getIncidents(
    filters: IncidentFilters,
    userContext: UserContext,
    page: number = 1,
    limit: number = 20
  ) {
    const where: any = {};

    // Apply filters
    if (filters.type) where.type = filters.type;
    if (filters.severity) where.severity = filters.severity;
    if (filters.status) where.status = filters.status;
    if (filters.reporterId) where.reporterId = filters.reporterId;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.examSessionId) where.examSessionId = filters.examSessionId;

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.incidentDate = {};
      if (filters.startDate) where.incidentDate.gte = filters.startDate;
      if (filters.endDate) where.incidentDate.lte = filters.endDate;
    }

    // Search filter (title or description)
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { incidentNumber: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Access control
    const accessWhere = this.buildAccessControlWhere(userContext);
    const finalWhere = accessWhere ? { AND: [where, accessWhere] } : where;

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where: finalWhere,
        include: {
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          student: true,
          examSession: {
            select: {
              id: true,
              courseCode: true,
              courseName: true,
              examDate: true,
            },
          },
          attachments: {
            select: {
              id: true,
              fileName: true,
              fileType: true,
              fileSize: true,
              uploadedAt: true,
            },
          },
          comments: { select: { id: true }, take: 0 }, // Just count
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy: { reportedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.incident.count({ where: finalWhere }),
    ]);

    return {
      incidents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single incident with access check
   */
  async getIncidentById(
    id: string,
    userContext: UserContext
  ): Promise<Incident | null> {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        student: true,
        examSession: true,
        attendance: true,
        transfer: true,
        attachments: {
          include: {
            uploader: {
              select: { firstName: true, lastName: true, role: true },
            },
          },
          orderBy: { uploadedAt: "desc" },
        },
        comments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        statusHistory: {
          include: {
            user: { select: { firstName: true, lastName: true, role: true } },
          },
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!incident) return null;

    // Check access
    if (!this.hasAccessToIncident(incident, userContext)) {
      throw new Error("Forbidden: You do not have access to this incident");
    }

    return incident;
  }

  /**
   * Update incident
   */
  async updateIncident(
    id: string,
    data: UpdateIncidentData,
    userContext: UserContext
  ): Promise<Incident> {
    const incident = await this.getIncidentById(id, userContext);
    if (!incident) throw new Error("Incident not found");

    // Only reporter, assignee, or admin can update
    if (!this.canModifyIncident(incident, userContext)) {
      throw new Error("Forbidden: You cannot modify this incident");
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        type: data.type,
        severity: data.severity,
        title: data.title,
        description: data.description,
        location: data.location,
        assigneeId: data.assigneeId,
        isConfidential: data.isConfidential,
        metadata: data.metadata,
      },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        student: true,
        examSession: true,
        attachments: true,
        comments: {
          include: {
            user: { select: { firstName: true, lastName: true, role: true } },
          },
        },
        statusHistory: {
          include: {
            user: { select: { firstName: true, lastName: true, role: true } },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Update incident status
   */
  async updateStatus(
    id: string,
    newStatus: IncidentStatus,
    changedBy: string,
    reason?: string,
    resolutionNotes?: string
  ): Promise<Incident> {
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new Error("Incident not found");

    const updateData: any = { status: newStatus };

    // Set timestamps based on status
    if (newStatus === "UNDER_INVESTIGATION" && !incident.assignedAt) {
      updateData.assignedAt = new Date();
    }
    if (newStatus === "RESOLVED") {
      updateData.resolvedAt = new Date();
      if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
    }
    if (newStatus === "CLOSED") {
      updateData.closedAt = new Date();
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        student: true,
        examSession: true,
        attachments: true,
        comments: {
          include: {
            user: { select: { firstName: true, lastName: true, role: true } },
          },
        },
        statusHistory: {
          include: {
            user: { select: { firstName: true, lastName: true, role: true } },
          },
        },
      },
    });

    // Create status history record
    await prisma.incidentStatusHistory.create({
      data: {
        incidentId: id,
        fromStatus: incident.status,
        toStatus: newStatus,
        changedBy,
        reason,
      },
    });

    return updated;
  }

  /**
   * Assign incident to user
   */
  async assignIncident(
    id: string,
    assigneeId: string,
    assignedBy: string,
    reason?: string
  ): Promise<Incident> {
    const incident = await prisma.incident.update({
      where: { id },
      data: {
        assigneeId,
        assignedAt: new Date(),
        status: "UNDER_INVESTIGATION",
      },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        student: true,
        examSession: true,
      },
    });

    // Create status history
    await prisma.incidentStatusHistory.create({
      data: {
        incidentId: id,
        fromStatus: incident.status,
        toStatus: "UNDER_INVESTIGATION",
        changedBy: assignedBy,
        reason:
          reason ||
          `Assigned to ${incident.assignee?.firstName} ${incident.assignee?.lastName}`,
      },
    });

    return incident;
  }

  /**
   * Add comment to incident
   */
  async addComment(
    incidentId: string,
    userId: string,
    comment: string,
    isInternal: boolean = false
  ) {
    return prisma.incidentComment.create({
      data: {
        incidentId,
        userId,
        comment,
        isInternal,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  /**
   * Delete incident (admin only)
   */
  async deleteIncident(id: string, userContext: UserContext): Promise<void> {
    if (userContext.role !== "ADMIN" && !userContext.isSuperAdmin) {
      throw new Error("Forbidden: Only admins can delete incidents");
    }

    await prisma.incident.delete({ where: { id } });
  }

  /**
   * Get incident statistics
   */
  async getStatistics(filters: IncidentFilters, userContext: UserContext) {
    const where: any = {};
    if (filters.startDate || filters.endDate) {
      where.incidentDate = {};
      if (filters.startDate) where.incidentDate.gte = filters.startDate;
      if (filters.endDate) where.incidentDate.lte = filters.endDate;
    }

    // Access control
    const accessWhere = this.buildAccessControlWhere(userContext);
    const finalWhere = accessWhere ? { AND: [where, accessWhere] } : where;

    const [
      totalIncidents,
      byType,
      bySeverity,
      byStatus,
      avgResolutionTime,
      openIncidents,
      resolvedToday,
    ] = await Promise.all([
      prisma.incident.count({ where: finalWhere }),
      prisma.incident.groupBy({
        by: ["type"],
        where: finalWhere,
        _count: true,
      }),
      prisma.incident.groupBy({
        by: ["severity"],
        where: finalWhere,
        _count: true,
      }),
      prisma.incident.groupBy({
        by: ["status"],
        where: finalWhere,
        _count: true,
      }),
      this.calculateAvgResolutionTime(finalWhere),
      prisma.incident.count({
        where: {
          ...finalWhere,
          status: { notIn: ["RESOLVED", "CLOSED"] },
        },
      }),
      prisma.incident.count({
        where: {
          ...finalWhere,
          status: "RESOLVED",
          resolvedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
            lt: new Date(new Date().setHours(23, 59, 59, 999)), // End of today
          },
        },
      }),
    ]);

    return {
      total: totalIncidents,
      byType: byType.reduce(
        (acc, item) => ({ ...acc, [item.type]: item._count }),
        {}
      ),
      bySeverity: bySeverity.reduce(
        (acc, item) => ({ ...acc, [item.severity]: item._count }),
        {}
      ),
      byStatus: byStatus.reduce(
        (acc, item) => ({ ...acc, [item.status]: item._count }),
        {}
      ),
      openIncidents,
      resolvedToday,
      avgResolutionTime: avgResolutionTime,
    };
  }

  /**
   * Build access control where clause
   */
  private buildAccessControlWhere(userContext: UserContext): any {
    const { userId, role, isSuperAdmin } = userContext;

    // Admin and super admin can see all
    if (role === "ADMIN" || isSuperAdmin) {
      return null;
    }

    // Department heads and faculty officers can see all non-confidential or those they're involved in
    if (role === "DEPARTMENT_HEAD" || role === "FACULTY_OFFICER") {
      return {
        OR: [
          { isConfidential: false },
          { reporterId: userId },
          { assigneeId: userId },
        ],
      };
    }

    // Others can only see their own reports and assignments
    return {
      OR: [{ reporterId: userId }, { assigneeId: userId }],
    };
  }

  /**
   * Check if user has access to an incident
   */
  async hasAccessToIncident(
    incident: any,
    userContext: UserContext
  ): Promise<boolean> {
    const { userId, role, isSuperAdmin } = userContext;

    // Admin and super admin can access all
    if (role === "ADMIN" || isSuperAdmin) return true;

    // Reporter and assignee can access
    if (incident.reporterId === userId || incident.assigneeId === userId)
      return true;

    // Confidential incidents require special access
    if (incident.isConfidential) return false;

    // Department heads and faculty officers can access non-confidential
    if (role === "DEPARTMENT_HEAD" || role === "FACULTY_OFFICER") return true;

    return false;
  }

  /**
   * Check if user can modify incident
   */
  private canModifyIncident(incident: any, userContext: UserContext): boolean {
    const { userId, role, isSuperAdmin } = userContext;

    if (role === "ADMIN" || isSuperAdmin) return true;
    if (incident.reporterId === userId) return true;
    if (incident.assigneeId === userId) return true;
    if (role === "DEPARTMENT_HEAD" || role === "FACULTY_OFFICER") return true;

    return false;
  }

  /**
   * Calculate average resolution time in hours
   */
  private async calculateAvgResolutionTime(where: any): Promise<number | null> {
    const resolvedIncidents = await prisma.incident.findMany({
      where: {
        ...where,
        status: "RESOLVED",
        resolvedAt: { not: null },
      },
      select: {
        reportedAt: true,
        resolvedAt: true,
      },
    });

    if (resolvedIncidents.length === 0) return null;

    const totalHours = resolvedIncidents.reduce((sum, incident) => {
      const diff =
        incident.resolvedAt!.getTime() - incident.reportedAt.getTime();
      return sum + diff / (1000 * 60 * 60); // Convert to hours
    }, 0);

    return Math.round((totalHours / resolvedIncidents.length) * 100) / 100;
  }
}

export const incidentService = new IncidentService();
