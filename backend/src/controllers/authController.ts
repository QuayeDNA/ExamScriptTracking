import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";
import crypto from "crypto";
import { generateToken, generateRefreshToken } from "../utils/jwt";

const prisma = new PrismaClient();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

const firstTimePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("[LOGIN] Login attempt for email:", req.body.email);
    console.log("[LOGIN] Request IP:", req.ip);

    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("[LOGIN] User not found:", email);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      console.log("[LOGIN] Inactive account attempt:", email);
      res.status(403).json({
        error: "Account has been deactivated. Contact administrator.",
      });
      return;
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - new Date().getTime()) / (1000 * 60)
      );
      console.log(
        "[LOGIN] Account locked:",
        email,
        "Minutes left:",
        minutesLeft
      );
      res.status(403).json({
        error: `Account is locked due to multiple failed login attempts. Try again in ${minutesLeft} minutes.`,
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log("[LOGIN] Invalid password for user:", email);

      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const maxAttempts = 5;

      if (failedAttempts >= maxAttempts) {
        // Lock account for 30 minutes
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: failedAttempts,
            lockedUntil: lockUntil,
          },
        });

        // Log audit
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "ACCOUNT_LOCKED",
            entity: "User",
            entityId: user.id,
            details: {
              reason: "Too many failed login attempts",
              attempts: failedAttempts,
              lockedUntil: lockUntil.toISOString(),
            },
            ipAddress: req.ip,
          },
        });

        console.log(
          "[LOGIN] Account locked after",
          failedAttempts,
          "failed attempts:",
          email
        );
        res.status(403).json({
          error:
            "Account locked due to multiple failed login attempts. Try again in 30 minutes.",
        });
        return;
      }

      // Update failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: failedAttempts },
      });

      res.status(401).json({
        error: "Invalid credentials",
        attemptsLeft: maxAttempts - failedAttempts,
      });
      return;
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isSuperAdmin: user.isSuperAdmin,
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

    // Reset failed attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        details: {
          email: user.email,
          role: user.role,
        },
        ipAddress: req.ip,
      },
    });

    console.log("[LOGIN] Successful login:", email, "Role:", user.role);

    res.json({
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        department: user.phone || "",
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        isActive: user.isActive,
        passwordChanged: user.passwordChanged,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.issues });
      return;
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[CHANGE_PASSWORD] Request from:", req.user?.email);

    if (!req.user) {
      console.log("[CHANGE_PASSWORD] Unauthorized");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(
      req.body
    );

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      res.status(400).json({
        error: "New password must be different from current password",
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChanged: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_CHANGE",
        entity: "User",
        entityId: user.id,
        ipAddress: req.ip,
      },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.issues });
      return;
    }
    console.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const firstTimePasswordChange = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[FIRST_TIME_PASSWORD] Request from:", req.user?.email);

    if (!req.user) {
      console.log("[FIRST_TIME_PASSWORD] Unauthorized");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { newPassword } = firstTimePasswordSchema.parse(req.body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if password already changed
    if (user.passwordChanged) {
      res.status(400).json({
        error: "Password already changed. Use change password endpoint.",
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChanged: true,
      },
    });

    // Generate new token with updated info
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isSuperAdmin: user.isSuperAdmin,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "FIRST_TIME_PASSWORD_CHANGE",
        entity: "User",
        entityId: user.id,
        ipAddress: req.ip,
      },
    });

    res.json({
      message: "Password set successfully",
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.issues });
      return;
    }
    console.error("First time password change error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[GET_PROFILE] Request from:", req.user?.email);

    if (!req.user) {
      console.log("[GET_PROFILE] Unauthorized");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isSuperAdmin: true,
        isActive: true,
        passwordChanged: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      console.log("[GET_PROFILE] User not found:", req.user.userId);
      res.status(404).json({ error: "User not found" });
      return;
    }

    console.log("[GET_PROFILE] Profile retrieved for:", user.email);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        department: user.phone || "",
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        isActive: user.isActive,
        passwordChanged: user.passwordChanged,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("[LOGOUT] User logging out:", req.user?.email);

    if (!req.user) {
      console.log("[LOGOUT] Unauthorized logout attempt");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Delete refresh tokens
    const deletedCount = await prisma.refreshToken.deleteMany({
      where: { userId: req.user.userId },
    });

    console.log("[LOGOUT] Deleted", deletedCount.count, "refresh tokens");

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: "LOGOUT",
        entity: "User",
        entityId: req.user.userId,
        ipAddress: req.ip,
      },
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Refresh token endpoint
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[REFRESH_TOKEN] Request received");

    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    // Find refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      console.log("[REFRESH_TOKEN] Invalid token");
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    // Check if token expired
    if (new Date() > tokenRecord.expiresAt) {
      console.log("[REFRESH_TOKEN] Token expired");
      await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      res.status(401).json({ error: "Refresh token expired" });
      return;
    }

    const user = tokenRecord.user;

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({ error: "Account is inactive" });
      return;
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isSuperAdmin: user.isSuperAdmin,
    };

    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Delete old refresh token and create new one (token rotation)
    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    console.log("[REFRESH_TOKEN] Tokens refreshed for:", user.email);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Admin unlock user account
export const unlockUserAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[UNLOCK_ACCOUNT] Request from:", req.user?.email);

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    await prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: "UNLOCK_ACCOUNT",
        entity: "User",
        entityId: id,
        details: { unlockedBy: req.user.email },
        ipAddress: req.ip,
      },
    });

    console.log("[UNLOCK_ACCOUNT] Account unlocked:", id);
    res.json({ message: "Account unlocked successfully" });
  } catch (error) {
    console.error("Unlock account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Admin reset user password
export const adminResetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[ADMIN_RESET_PASSWORD] Request from:", req.user?.email);

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    // Generate new password
    const generateRandomPassword = (): string => {
      const length = 12;
      const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let password = "";
      password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
      password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
      password += "0123456789"[Math.floor(Math.random() * 10)];
      password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
      for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
      }
      return password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
    };

    const newPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordChanged: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: "ADMIN_PASSWORD_RESET",
        entity: "User",
        entityId: id,
        details: { resetBy: req.user.email },
        ipAddress: req.ip,
      },
    });

    console.log("[ADMIN_RESET_PASSWORD] Password reset for user:", id);

    res.json({
      message: "Password reset successfully",
      temporaryPassword: newPassword,
    });
  } catch (error) {
    console.error("Admin reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get active sessions (refresh tokens)
export const getActiveSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[GET_ACTIVE_SESSIONS] Request from:", req.user?.email);

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sessions = await prisma.refreshToken.findMany({
      where: { userId: req.user.userId },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ sessions });
  } catch (error) {
    console.error("Get active sessions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Revoke specific session
export const revokeSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[REVOKE_SESSION] Request from:", req.user?.email);

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { sessionId } = req.params;

    // Delete the refresh token (session)
    await prisma.refreshToken.delete({
      where: {
        id: sessionId,
        userId: req.user.userId, // Ensure user can only delete their own sessions
      },
    });

    // Blacklist the current access token to force immediate logout
    const token = req.headers.authorization?.substring(7); // Remove 'Bearer '
    if (token) {
      // Access tokens expire in 15 minutes, blacklist until then
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.blacklistedToken.create({
        data: {
          token,
          userId: req.user.userId,
          expiresAt,
        },
      });
    }

    console.log("[REVOKE_SESSION] Session revoked:", sessionId);
    res.json({ message: "Session revoked successfully" });
  } catch (error) {
    console.error("Revoke session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Logout all sessions
export const logoutAllSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[LOGOUT_ALL_SESSIONS] Request from:", req.user?.email);

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Delete all refresh tokens
    const deletedCount = await prisma.refreshToken.deleteMany({
      where: { userId: req.user.userId },
    });

    // Blacklist the current access token
    const token = req.headers.authorization?.substring(7);
    if (token) {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.blacklistedToken.create({
        data: {
          token,
          userId: req.user.userId,
          expiresAt,
        },
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: "LOGOUT_ALL_SESSIONS",
        entity: "User",
        entityId: req.user.userId,
        details: { sessionsRevoked: deletedCount.count },
        ipAddress: req.ip,
      },
    });

    console.log(
      "[LOGOUT_ALL_SESSIONS] All sessions logged out:",
      deletedCount.count
    );

    res.json({
      message: "All sessions logged out successfully",
      count: deletedCount.count,
    });
  } catch (error) {
    console.error("Logout all sessions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Admin force logout user
export const forceLogoutUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[FORCE_LOGOUT] Request from:", req.user?.email);

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    const deletedCount = await prisma.refreshToken.deleteMany({
      where: { userId: id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: "FORCE_LOGOUT_USER",
        entity: "User",
        entityId: id,
        details: {
          forcedBy: req.user.email,
          sessionsRevoked: deletedCount.count,
        },
        ipAddress: req.ip,
      },
    });

    console.log("[FORCE_LOGOUT] User force logged out:", id);

    res.json({
      message: "User logged out successfully",
      count: deletedCount.count,
    });
  } catch (error) {
    console.error("Force logout user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get audit logs
export const getAuditLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[GET_AUDIT_LOGS] Request from:", req.user?.email);
    console.log("[GET_AUDIT_LOGS] Query params:", req.query);

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const {
      userId,
      action,
      entity,
      dateFrom,
      dateTo,
      page = "1",
      limit = "50",
    } = req.query;

    const where: any = {};

    if (userId) where.userId = userId as string;
    if (action) where.action = action as string;
    if (entity) where.entity = entity as string;

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom as string);
      if (dateTo) where.timestamp.lte = new Date(dateTo as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.auditLog.count({ where }),
    ]);

    console.log("[GET_AUDIT_LOGS] Returning", logs.length, "of", total, "logs");

    res.json({
      logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Request password reset
export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[REQUEST_PASSWORD_RESET] Request for:", req.body.email);

    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      console.log("[REQUEST_PASSWORD_RESET] User not found:", email);
      res.json({
        message:
          "If the email exists, a password reset token has been generated",
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entity: "User",
        entityId: user.id,
        ipAddress: req.ip,
      },
    });

    console.log("[REQUEST_PASSWORD_RESET] Token generated for:", email);

    // In production, send this via in-app notification
    // For now, return it (in real app, don't return token directly)
    res.json({
      message: "Password reset token generated",
      resetToken, // In production, send via in-app notification
      expiresAt,
    });
  } catch (error) {
    console.error("Request password reset error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reset password with token
export const resetPasswordWithToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[RESET_PASSWORD] Reset attempt with token");

    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: "Token and new password are required" });
      return;
    }

    // Validate new password
    try {
      firstTimePasswordSchema.parse({ newPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        });
        return;
      }
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    if (resetToken.used) {
      res.status(400).json({ error: "Reset token has already been used" });
      return;
    }

    if (new Date() > resetToken.expiresAt) {
      res.status(400).json({ error: "Reset token has expired" });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
        passwordChanged: true,
      },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: resetToken.userId,
        action: "PASSWORD_RESET_COMPLETED",
        entity: "User",
        entityId: resetToken.userId,
        ipAddress: req.ip,
      },
    });

    console.log(
      "[RESET_PASSWORD] Password reset successful for:",
      resetToken.user.email
    );

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
