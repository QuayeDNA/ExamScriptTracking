import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";
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
      res.status(403).json({
        error: "Account has been deactivated. Contact administrator.",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log("[LOGIN] Invalid password for user:", email);
      res.status(401).json({ error: "Invalid credentials" });
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
