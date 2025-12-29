import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { generateToken, generateRefreshToken } from "../utils/jwt";

const prisma = new PrismaClient();

// Validation schemas
const createRegistrationSessionSchema = z.object({
  expiresInMinutes: z.number().min(1).max(1440).optional().default(60), // Default 1 hour
  department: z.string().min(1, "Department is required"),
});

const bulkCreateSessionsSchema = z.object({
  sessions: z.array(z.object({
    expiresInMinutes: z.number().min(1).max(1440).optional().default(60),
    department: z.string().min(1, "Department is required"),
  })).min(1, "At least one session is required").max(10, "Maximum 10 sessions at once"),
});

const extendExpirationSchema = z.object({
  additionalMinutes: z.number().min(1).max(1440, "Cannot extend more than 24 hours"),
});

const registerWithQRSchema = z.object({
  qrToken: z.string().min(1, "QR token is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().regex(/^(\+233|0)[0-9]{9}$/, "Invalid phone number format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Create a new registration session (Admin only)
 * Generates a QR code token that expires after specified time
 */
export const createRegistrationSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { expiresInMinutes, department } = createRegistrationSessionSchema.parse(
      req.body
    );
    const adminId = req.user!.userId;

    // Generate unique QR token
    const qrToken = crypto.randomBytes(32).toString("hex");

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    // Create registration session
    const session = await prisma.registrationSession.create({
      data: {
        qrToken,
        createdById: adminId,
        department,
        expiresAt,
      },
    });

    res.status(201).json({
      sessionId: session.id,
      qrToken: session.qrToken,
      expiresAt: session.expiresAt,
      qrCodeData: {
        type: "REGISTRATION",
        token: session.qrToken,
        department: session.department,
        expiresAt: session.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create registration session error:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    res.status(500).json({
      error: "Failed to create registration session",
    });
  }
};

/**
 * Register user using QR code token
 * Creates user account with phone/password authentication
 */
export const registerWithQR = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { qrToken, firstName, lastName, phone, password } =
      registerWithQRSchema.parse(req.body);

    // Find and validate registration session
    const session = await prisma.registrationSession.findUnique({
      where: { qrToken },
    });

    if (!session) {
      res.status(400).json({
        error: "Invalid QR code",
      });
      return;
    }

    if (!session.department) {
      res.status(400).json({
        error: "QR code is not configured with a department",
      });
      return;
    }

    if (session.used) {
      res.status(400).json({
        error: "QR code has already been used",
      });
      return;
    }

    if (new Date() > session.expiresAt) {
      res.status(400).json({
        error: "QR code has expired",
      });
      return;
    }

    // Check if phone number is already registered
    const existingUser = await prisma.user.findFirst({
      where: { phone },
    });

    if (existingUser) {
      res.status(400).json({
        error: "Phone number is already registered",
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate unique email (since email is required but not used for auth)
    const baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@examtrack.local`;
    let email = baseEmail;
    let counter = 1;

    while (await prisma.user.findUnique({ where: { email } })) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${counter}@examtrack.local`;
      counter++;
    }

    // Create user account
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        department: session.department,
        role: "INVIGILATOR", // Default role for QR registrations
        registrationToken: null, // Clear any existing token
        passwordChanged: true, // Mark as changed since they set their own password
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Mark session as used
    await prisma.registrationSession.update({
      where: { id: session.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isSuperAdmin: false, // New QR registrations are not super admins
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token to database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Log the registration
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED_QR",
        entity: "User",
        entityId: user.id,
        details: {
          method: "QR_CODE",
          sessionId: session.id,
          phone: user.phone,
        },
        ipAddress: req.ip,
      },
    });

    res.status(201).json({
      message: "Registration successful",
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        department: user.department || "",
        role: user.role,
        isSuperAdmin: false,
        isActive: user.isActive,
        passwordChanged: true,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Register with QR error:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    res.status(500).json({
      error: "Failed to register account",
    });
  }
};

/**
 * Get registration sessions created by admin (Admin only)
 */
export const getRegistrationSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.registrationSession.findMany({
        where: { createdById: adminId },
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.registrationSession.count({
        where: { createdById: adminId },
      }),
    ]);

    res.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get registration sessions error:", error);
    res.status(500).json({ error: "Failed to fetch registration sessions" });
  }
};

/**
 * Bulk create multiple registration sessions (Admin only)
 */
export const bulkCreateSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { sessions: sessionConfigs } = bulkCreateSessionsSchema.parse(req.body);
    const adminId = req.user!.userId;

    const createdSessions = [];

    for (const config of sessionConfigs) {
      // Generate unique QR token
      const qrToken = crypto.randomBytes(32).toString("hex");

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + config.expiresInMinutes);

      // Create registration session
      const session = await prisma.registrationSession.create({
        data: {
          qrToken,
          createdById: adminId,
          department: config.department,
          expiresAt,
        },
      });

      createdSessions.push({
        sessionId: session.id,
        qrToken: session.qrToken,
        department: session.department,
        expiresAt: session.expiresAt,
        qrCodeData: {
          type: "REGISTRATION",
          token: session.qrToken,
          department: session.department,
          expiresAt: session.expiresAt.toISOString(),
        },
      });
    }

    res.status(201).json({
      message: `Successfully created ${createdSessions.length} registration sessions`,
      sessions: createdSessions,
    });
  } catch (error) {
    console.error("Bulk create registration sessions error:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    res.status(500).json({
      error: "Failed to create registration sessions",
    });
  }
};

/**
 * Deactivate a registration session (Admin only)
 */
export const deactivateSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;

    // Check if session exists and belongs to admin
    const session = await prisma.registrationSession.findFirst({
      where: {
        id,
        createdById: adminId,
      },
    });

    if (!session) {
      res.status(404).json({ error: "Registration session not found" });
      return;
    }

    if (session.used) {
      res.status(400).json({ error: "Cannot deactivate a session that has already been used" });
      return;
    }

    // Deactivate session by setting expiresAt to now
    await prisma.registrationSession.update({
      where: { id },
      data: {
        expiresAt: new Date(),
      },
    });

    res.json({ message: "Registration session deactivated successfully" });
  } catch (error) {
    console.error("Deactivate session error:", error);
    res.status(500).json({ error: "Failed to deactivate session" });
  }
};

/**
 * Extend expiration of a registration session (Admin only)
 */
export const extendSessionExpiration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { additionalMinutes } = extendExpirationSchema.parse(req.body);
    const adminId = req.user!.userId;

    // Check if session exists and belongs to admin
    const session = await prisma.registrationSession.findFirst({
      where: {
        id,
        createdById: adminId,
      },
    });

    if (!session) {
      res.status(404).json({ error: "Registration session not found" });
      return;
    }

    if (session.used) {
      res.status(400).json({ error: "Cannot extend a session that has already been used" });
      return;
    }

    // Extend expiration
    const newExpiresAt = new Date(session.expiresAt);
    newExpiresAt.setMinutes(newExpiresAt.getMinutes() + additionalMinutes);

    await prisma.registrationSession.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt,
      },
    });

    res.json({
      message: "Session expiration extended successfully",
      newExpiresAt,
    });
  } catch (error) {
    console.error("Extend session expiration error:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        details: error.issues,
      });
      return;
    }

    res.status(500).json({ error: "Failed to extend session expiration" });
  }
};

/**
 * Get registration analytics and statistics (Admin only)
 */
export const getSessionAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = req.user!.userId;

    // Get all sessions for this admin
    const sessions = await prisma.registrationSession.findMany({
      where: { createdById: adminId },
      select: {
        id: true,
        department: true,
        used: true,
        usedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    const now = new Date();
    const analytics = {
      total: sessions.length,
      active: sessions.filter(s => !s.used && s.expiresAt > now).length,
      used: sessions.filter(s => s.used).length,
      expired: sessions.filter(s => !s.used && s.expiresAt <= now).length,
      departments: {} as Record<string, {
        total: number;
        active: number;
        used: number;
        expired: number;
      }>,
      recentActivity: sessions
        .filter(s => s.used || s.expiresAt <= now)
        .sort((a, b) => (b.usedAt || b.expiresAt).getTime() - (a.usedAt || a.expiresAt).getTime())
        .slice(0, 10)
        .map(s => ({
          id: s.id,
          department: s.department,
          status: s.used ? 'used' : 'expired',
          timestamp: s.usedAt || s.expiresAt,
        })),
    };

    // Group by department
    sessions.forEach(session => {
      const dept = session.department;
      if (!analytics.departments[dept]) {
        analytics.departments[dept] = { total: 0, active: 0, used: 0, expired: 0 };
      }

      analytics.departments[dept].total++;
      if (session.used) {
        analytics.departments[dept].used++;
      } else if (session.expiresAt <= now) {
        analytics.departments[dept].expired++;
      } else {
        analytics.departments[dept].active++;
      }
    });

    res.json(analytics);
  } catch (error) {
    console.error("Get session analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

/**
 * Clean up expired and unused registration sessions (Admin only)
 */
export const cleanupExpiredSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    const now = new Date();

    // Delete expired sessions that haven't been used and are older than 24 hours
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);

    const result = await prisma.registrationSession.deleteMany({
      where: {
        createdById: adminId,
        used: false,
        expiresAt: { lte: now },
        createdAt: { lte: cutoffDate }, // Only delete if expired for more than 24 hours
      },
    });

    res.json({
      message: `Cleaned up ${result.count} expired registration sessions`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Cleanup expired sessions error:", error);
    res.status(500).json({ error: "Failed to cleanup sessions" });
  }
};
