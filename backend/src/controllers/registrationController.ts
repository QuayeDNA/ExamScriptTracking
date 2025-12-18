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
});

const registerWithQRSchema = z.object({
  qrToken: z.string().min(1, "QR token is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().regex(/^(\+233|0)[0-9]{9}$/, "Invalid phone number format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  department: z.string().min(1, "Department is required"),
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
    const { expiresInMinutes } = createRegistrationSessionSchema.parse(
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
    const { qrToken, firstName, lastName, phone, password, department } =
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
        department,
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
