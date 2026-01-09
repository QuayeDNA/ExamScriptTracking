import { Request, Response } from "express";
import { z } from "zod";
import { AttendanceService } from "../services/attendanceService";
import { LinkService } from "../services/linkService";
import { StudentLookupService } from "../services/studentLookupService";
import { VerificationMethod, AttendanceStatus } from "@prisma/client";

const attendanceService = new AttendanceService();
const linkService = new LinkService();
const studentLookupService = new StudentLookupService();

// ============================================================================
// VALIDATION SCHEMAS - Consolidated and Reusable
// ============================================================================

const createSessionSchema = z.object({
  courseCode: z.string().min(1, "Course code is required"),
  courseName: z.string().min(1, "Course name is required"),
  venue: z.string().optional(),
  notes: z.string().optional(),
  expectedStudentCount: z.number().int().min(0).optional(),
});

const recordAttendanceSchema = z.object({
  sessionId: z.string().uuid(),
  identifier: z.string().min(1), // Could be QR, index, or biometric hash
  method: z.nativeEnum(VerificationMethod),
  status: z.nativeEnum(AttendanceStatus).default(AttendanceStatus.PRESENT),
  metadata: z.object({
    deviceId: z.string().optional(),
    biometricConfidence: z.number().min(0).max(1).optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }).optional(),
});

const selfMarkAttendanceSchema = z.object({
  linkToken: z.string().min(1),
  studentId: z.string().uuid(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

const generateLinkSchema = z.object({
  sessionId: z.string().uuid(),
  expiresInMinutes: z.number().min(5).max(120).default(30),
  maxUses: z.number().min(1).optional(),
  requiresLocation: z.boolean().default(false),
  geofence: z.object({
    lat: z.number(),
    lng: z.number(),
    radiusMeters: z.number().min(10).max(5000),
  }).optional(),
});

// ============================================================================
// SESSION MANAGEMENT - Simplified
// ============================================================================

/**
 * Create a new attendance session
 * POST /api/attendance/sessions
 */
export const createSession = async (req: Request, res: Response) => {
  try {
    const data = createSessionSchema.parse(req.body);
    const userId = req.user!.userId;

    const session = await attendanceService.createSession({
      userId,
      courseCode: data.courseCode,
      courseName: data.courseName,
      venue: data.venue,
      notes: data.notes,
      expectedStudentCount: data.expectedStudentCount,
    });

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: session,
    });
  } catch (error) {
    handleError(res, error, "Failed to create session");
  }
};

/**
 * End attendance session
 * POST /api/attendance/sessions/:id/end
 */
export const endSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};
    const userId = req.user!.userId;

    const session = await attendanceService.endSession(id, userId, notes);

    res.json({
      success: true,
      message: "Session ended successfully",
      data: session,
    });
  } catch (error) {
    handleError(res, error, "Failed to end session");
  }
};

/**
 * Pause attendance session
 * POST /api/attendance/sessions/:id/pause
 */
export const pauseSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const session = await attendanceService.pauseSession(id, userId);

    res.json({
      success: true,
      message: "Session paused successfully",
      data: session,
    });
  } catch (error) {
    handleError(res, error, "Failed to pause session");
  }
};

/**
 * Resume paused attendance session
 * POST /api/attendance/sessions/:id/resume
 */
export const resumeSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const session = await attendanceService.resumeSession(id, userId);

    res.json({
      success: true,
      message: "Session resumed successfully",
      data: session,
    });
  } catch (error) {
    handleError(res, error, "Failed to resume session");
  }
};

/**
 * Delete session
 * DELETE /api/attendance/sessions/:id
 */
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await attendanceService.deleteSession(id, userId, req.user!.role);

    res.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    handleError(res, error, "Failed to delete session");
  }
};

// ============================================================================
// ATTENDANCE RECORDING - Unified Endpoint
// ============================================================================

/**
 * Record attendance (unified endpoint for all methods)
 * POST /api/attendance/sessions/:id/record
 */
export const recordAttendance = async (req: Request, res: Response) => {
  try {
    const data = recordAttendanceSchema.parse({
      ...req.body,
      sessionId: req.params.id,
    });
    const userId = req.user!.userId;

    // Lookup student based on identifier and method
    const student = await studentLookupService.findStudent(
      data.identifier,
      data.method
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found with provided identifier",
      });
    }

    // Record attendance
    const attendance = await attendanceService.recordAttendance({
      sessionId: data.sessionId,
      studentId: student.id,
      method: data.method,
      status: data.status,
      recordedBy: userId,
      metadata: data.metadata,
    });

    res.status(201).json({
      success: true,
      message: "Attendance recorded successfully",
      data: {
        attendance,
        student: {
          id: student.id,
          indexNumber: student.indexNumber,
          name: `${student.firstName} ${student.lastName}`,
        },
      },
    });
  } catch (error) {
    handleError(res, error, "Failed to record attendance");
  }
};

/**
 * Bulk record attendance (for CSV imports)
 * POST /api/attendance/sessions/:id/record/bulk
 */
export const recordBulkAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { students } = req.body; // Array of { identifier, method, status }
    const userId = req.user!.userId;

    const results = await attendanceService.recordBulkAttendance(
      id,
      students,
      userId
    );

    res.json({
      success: true,
      message: "Bulk attendance recorded",
      data: results,
    });
  } catch (error) {
    handleError(res, error, "Failed to record bulk attendance");
  }
};

// ============================================================================
// STUDENT SELF-MARKING
// ============================================================================

/**
 * Validate attendance link (public endpoint)
 * GET /api/attendance/links/:token/validate
 */
export const validateLink = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const location = req.query.lat && req.query.lng 
      ? { lat: Number(req.query.lat), lng: Number(req.query.lng) }
      : undefined;

    const validation = await linkService.validateLink(token, location);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        errorCode: validation.errorCode,
      });
    }

    res.json({
      success: true,
      data: validation.session,
    });
  } catch (error) {
    handleError(res, error, "Failed to validate link");
  }
};

/**
 * Self-mark attendance using link
 * POST /api/attendance/self-mark
 */
export const selfMarkAttendance = async (req: Request, res: Response) => {
  try {
    const data = selfMarkAttendanceSchema.parse(req.body);

    const result = await attendanceService.selfMarkAttendance({
      linkToken: data.linkToken,
      studentId: data.studentId,
      location: data.location,
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: result,
    });
  } catch (error) {
    handleError(res, error, "Failed to mark attendance");
  }
};

// ============================================================================
// LINK MANAGEMENT
// ============================================================================

/**
 * Generate attendance link
 * POST /api/attendance/sessions/:id/links
 */
export const generateLink = async (req: Request, res: Response) => {
  try {
    const data = generateLinkSchema.parse({
      ...req.body,
      sessionId: req.params.id,
    });
    const userId = req.user!.userId;

    const link = await linkService.generateLink({
      sessionId: data.sessionId,
      createdBy: userId,
      expiresInMinutes: data.expiresInMinutes,
      maxUses: data.maxUses,
      geofence: data.geofence,
    });

    res.status(201).json({
      success: true,
      message: "Link generated successfully",
      data: link,
    });
  } catch (error) {
    handleError(res, error, "Failed to generate link");
  }
};

/**
 * Get active links for session
 * GET /api/attendance/sessions/:id/links
 */
export const getActiveLinks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const links = await linkService.getActiveLinks(id, userId);

    res.json({
      success: true,
      data: links,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch links");
  }
};

/**
 * Revoke attendance link
 * DELETE /api/attendance/links/:token
 */
export const revokeLink = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const userId = req.user!.userId;

    await linkService.revokeLink(token, userId);

    res.json({
      success: true,
      message: "Link revoked successfully",
    });
  } catch (error) {
    handleError(res, error, "Failed to revoke link");
  }
};

// ============================================================================
// QUERIES & ANALYTICS
// ============================================================================

/**
 * Get active sessions
 * GET /api/attendance/sessions/active
 */
export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const sessions = await attendanceService.getActiveSessions(userId, role);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch active sessions");
  }
};

/**
 * Get session details with real-time stats
 * GET /api/attendance/sessions/:id
 */
export const getSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const session = await attendanceService.getSessionWithStats(id, userId, role);

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch session");
  }
};

/**
 * Get attendance history
 * GET /api/attendance/history
 */
export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const filters = {
      courseCode: req.query.courseCode as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      status: req.query.status as any, // SessionStatus enum
    };
    const pagination = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    };

    const result = await attendanceService.getHistory(userId, role, filters, pagination);

    res.json({
      success: true,
      data: result.sessions,
      pagination: result.pagination,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch history");
  }
};

/**
 * Export session to CSV
 * GET /api/attendance/sessions/:id/export
 */
export const exportSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const csv = await attendanceService.exportSessionToCSV(id, userId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${id}.csv"`);
    res.send(csv);
  } catch (error) {
    handleError(res, error, "Failed to export session");
  }
};

// ============================================================================
// ASSISTANT MANAGEMENT
// ============================================================================

/**
 * Add assistant to session
 * POST /api/attendance/sessions/:id/assistants
 */
export const addAssistant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: assistantUserId, role } = req.body;
    const userId = req.user!.userId;

    if (!assistantUserId) {
      return res.status(400).json({
        success: false,
        error: "Assistant user ID is required",
      });
    }

    const assistant = await attendanceService.addAssistant(id, userId, assistantUserId, role);

    res.status(201).json({
      success: true,
      message: "Assistant added successfully",
      data: assistant,
    });
  } catch (error) {
    handleError(res, error, "Failed to add assistant");
  }
};

/**
 * Remove assistant from session
 * DELETE /api/attendance/sessions/:id/assistants/:userId
 */
export const removeAssistant = async (req: Request, res: Response) => {
  try {
    const { id, userId: assistantUserId } = req.params;
    const userId = req.user!.userId;

    await attendanceService.removeAssistant(id, userId, assistantUserId);

    res.json({
      success: true,
      message: "Assistant removed successfully",
    });
  } catch (error) {
    handleError(res, error, "Failed to remove assistant");
  }
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Get attendance analytics
 * GET /api/attendance/sessions/analytics
 */
export const getAttendanceAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const filters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to last 30 days
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : new Date(),
      courseCode: req.query.courseCode as string,
      lecturerId: req.query.lecturerId as string,
      groupBy: req.query.groupBy as 'day' | 'week' | 'month' | 'course',
    };

    const analytics = await attendanceService.getAnalytics(userId, role, filters);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch analytics");
  }
};

/**
 * Bulk confirm or reject attendance
 * POST /api/attendance/sessions/:id/confirm-bulk
 */
export const bulkConfirmAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { attendanceIds, confirm = true } = req.body;
    const userId = req.user!.userId;

    if (!attendanceIds || !Array.isArray(attendanceIds)) {
      return res.status(400).json({
        success: false,
        error: "attendanceIds array is required",
      });
    }

    const result = await attendanceService.bulkConfirmAttendance(id, userId, attendanceIds, confirm);

    res.json({
      success: true,
      message: confirm ? "Attendance confirmed" : "Attendance rejected",
      data: result,
    });
  } catch (error) {
    handleError(res, error, "Failed to bulk confirm attendance");
  }
};

// ============================================================================
// ATTENDANCE MODIFICATION
// ============================================================================

/**
 * Update attendance status
 * PATCH /api/attendance/:attendanceId
 */
export const updateAttendanceStatus = async (req: Request, res: Response) => {
  try {
    const { attendanceId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user!.userId;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }

    const updated = await attendanceService.updateAttendanceStatus(attendanceId, userId, status, notes);

    res.json({
      success: true,
      message: "Attendance status updated",
      data: updated,
    });
  } catch (error) {
    handleError(res, error, "Failed to update attendance status");
  }
};

/**
 * Delete attendance record
 * DELETE /api/attendance/:attendanceId
 */
export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const { attendanceId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    await attendanceService.deleteAttendance(attendanceId, userId, userRole);

    res.json({
      success: true,
      message: "Attendance deleted successfully",
    });
  } catch (error) {
    handleError(res, error, "Failed to delete attendance");
  }
};

// ============================================================================
// STUDENT SEARCH
// ============================================================================

/**
 * Search students (for autocomplete)
 * GET /api/attendance/students/search
 */
export const searchStudents = async (req: Request, res: Response) => {
  try {
    const { q, limit } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Search query 'q' is required",
      });
    }

    const students = await studentLookupService.searchStudents(
      q,
      limit ? parseInt(limit as string) : 10
    );

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    handleError(res, error, "Failed to search students");
  }
};

// ============================================================================
// SESSION TEMPLATES (Simple implementation)
// ============================================================================

/**
 * Save session as template
 * POST /api/attendance/templates
 */
export const saveTemplate = async (req: Request, res: Response) => {
  try {
    const { name, courseCode, courseName, venue, expectedStudentCount } = req.body;
    const userId = req.user!.userId;

    if (!name || !courseCode || !courseName) {
      return res.status(400).json({
        success: false,
        error: "Name, course code, and course name are required",
      });
    }

    const template = await attendanceService.saveSessionTemplate(
      userId,
      name,
      courseCode,
      courseName,
      venue,
      expectedStudentCount
    );

    res.status(201).json({
      success: true,
      message: "Template saved successfully",
      data: template,
    });
  } catch (error) {
    handleError(res, error, "Failed to save template");
  }
};

/**
 * Get session templates
 * GET /api/attendance/templates
 */
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const templates = await attendanceService.getSessionTemplates(userId, role);

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    handleError(res, error, "Failed to get templates");
  }
};

/**
 * Create session from template
 * POST /api/attendance/sessions/from-template
 */
export const createFromTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.body;
    const userId = req.user!.userId;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: "Template ID is required",
      });
    }

    const session = await attendanceService.createSessionFromTemplate(userId, templateId);

    res.status(201).json({
      success: true,
      message: "Session created from template",
      data: session,
    });
  } catch (error) {
    handleError(res, error, "Failed to create session from template");
  }
};;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function handleError(res: Response, error: unknown, defaultMessage: string) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: error.issues,
    });
  }

  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    if (error.message.includes('already recorded') || error.message.includes('duplicate')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        errorCode: 'DUPLICATE_ATTENDANCE',
      });
    }
    if (error.message.includes('unauthorized') || error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  console.error(`${defaultMessage}:`, error);
  res.status(500).json({
    success: false,
    error: defaultMessage,
  });
}