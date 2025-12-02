import { Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";
import crypto from "crypto";

const prisma = new PrismaClient();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  department: z.string().min(1, "Department is required"),
  role: z.nativeEnum(Role),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  department: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
});

// Generate random password
const generateRandomPassword = (): string => {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one of each required character type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  password += "0123456789"[Math.floor(Math.random() * 10)];
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[CREATE_USER] Request received from:", req.user?.email);
    console.log("[CREATE_USER] Request body:", {
      ...req.body,
      password: "[REDACTED]",
    });

    if (!req.user) {
      console.log("[CREATE_USER] Unauthorized - no user in request");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const data = createUserSchema.parse(req.body);
    console.log("[CREATE_USER] Validated data:", { ...data });

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      console.log("[CREATE_USER] Email already exists:", data.email);
      res.status(400).json({ error: "Email already exists" });
      return;
    }

    // Generate password
    const plainPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.name.split(" ")[0] || data.name,
        lastName: data.name.split(" ").slice(1).join(" ") || "",
        phone: data.department, // Store department in phone field for now
        role: data.role,
        isSuperAdmin: false,
        isActive: true,
        passwordChanged: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        passwordChanged: true,
        createdAt: true,
      },
    });

    console.log(
      "[CREATE_USER] User created successfully:",
      user.id,
      user.email
    );

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: "CREATE_USER",
        entity: "User",
        entityId: user.id,
        details: {
          email: user.email,
          role: user.role,
          createdBy: req.user.email,
        },
        ipAddress: req.ip,
      },
    });

    // Return user with temporary credentials
    res.status(201).json({
      message: "User created successfully",
      email: user.email,
      temporaryPassword: plainPassword,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.issues });
      return;
    }
    console.error("Create user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("[GET_USERS] Request from:", req.user?.email);
    console.log("[GET_USERS] Query params:", req.query);

    const { role, isActive, search } = req.query;

    const where: any = {};

    if (role) {
      where.role = role as Role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: "insensitive" } },
        { lastName: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to match frontend format
    const formattedUsers = users.map((user) => ({
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
    }));

    console.log("[GET_USERS] Returning", formattedUsers.length, "users");
    res.json({ users: formattedUsers });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("[GET_USER] Request from:", req.user?.email);
    console.log("[GET_USER] User ID:", req.params.id);

    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[UPDATE_USER] Request from:", req.user?.email);
    console.log("[UPDATE_USER] User ID:", req.params.id);
    console.log("[UPDATE_USER] Update data:", req.body);

    if (!req.user) {
      console.log("[UPDATE_USER] Unauthorized");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Prevent updating super admin
    if (existingUser.isSuperAdmin && !req.user.isSuperAdmin) {
      res.status(403).json({ error: "Cannot modify super admin account" });
      return;
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: "UPDATE_USER",
        entity: "User",
        entityId: user.id,
        details: {
          changes: data,
          updatedBy: req.user.email,
        },
        ipAddress: req.ip,
      },
    });

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.issues });
      return;
    }
    console.error("Update user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deactivateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[DEACTIVATE_USER] Request from:", req.user?.email);
    console.log("[DEACTIVATE_USER] User ID:", req.params.id);

    if (!req.user) {
      console.log("[DEACTIVATE_USER] Unauthorized");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Prevent deactivating super admin
    if (existingUser.isSuperAdmin) {
      res.status(403).json({ error: "Cannot deactivate super admin account" });
      return;
    }

    // Prevent deactivating self
    if (id === req.user.userId) {
      res.status(400).json({ error: "Cannot deactivate your own account" });
      return;
    }

    // Deactivate user
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: "DEACTIVATE_USER",
        entity: "User",
        entityId: user.id,
        details: {
          deactivatedBy: req.user.email,
        },
        ipAddress: req.ip,
      },
    });

    res.json({ message: "User deactivated successfully", user });
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reactivateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[REACTIVATE_USER] Request from:", req.user?.email);
    console.log("[REACTIVATE_USER] User ID:", req.params.id);

    if (!req.user) {
      console.log("[REACTIVATE_USER] Unauthorized");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    // Reactivate user
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: "REACTIVATE_USER",
        entity: "User",
        entityId: user.id,
        details: {
          reactivatedBy: req.user.email,
        },
        ipAddress: req.ip,
      },
    });

    res.json({ message: "User reactivated successfully", user });
  } catch (error) {
    console.error("Reactivate user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getHandlers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[GET_HANDLERS] Request from:", req.user?.email);

    const handlerRoles: Role[] = [
      Role.INVIGILATOR,
      Role.LECTURER,
      Role.DEPARTMENT_HEAD,
      Role.FACULTY_OFFICER,
    ];

    const handlers = await prisma.user.findMany({
      where: {
        role: { in: handlerRoles },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
      orderBy: [{ role: "asc" }, { firstName: "asc" }],
    });

    res.json({ handlers, count: handlers.length });
  } catch (error) {
    console.error("Get handlers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
