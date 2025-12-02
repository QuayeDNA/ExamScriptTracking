import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Forbidden: Insufficient permissions",
        required: allowedRoles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!req.user.isSuperAdmin) {
    res.status(403).json({ error: "Forbidden: Super Admin access required" });
    return;
  }

  next();
};

// Helper to check if user can perform admin actions
export const isAdmin = (req: Request): boolean => {
  return req.user?.role === Role.ADMIN;
};

// Helper to check if user is a handler (mobile app users)
export const isHandler = (req: Request): boolean => {
  const handlerRoles: Role[] = [
    Role.INVIGILATOR,
    Role.LECTURER,
    Role.DEPARTMENT_HEAD,
    Role.FACULTY_OFFICER,
  ];
  return req.user ? handlerRoles.includes(req.user.role) : false;
};
