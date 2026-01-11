import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Middleware to prevent operations on archived exam sessions
export const preventArchivedSessionOperations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.params.id;

    if (!sessionId) {
      return next();
    }

    // Check if the session exists and is archived
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      select: { id: true, isArchived: true, status: true }
    });

    if (!session) {
      return res.status(404).json({ error: "Exam session not found" });
    }

    if (session.isArchived) {
      // Define which operations are not allowed on archived sessions
      const method = req.method;
      const path = req.route?.path || req.path;

      // Prevent attendance scanning
      if (path.includes('/attendance') && (method === 'POST' || method === 'PATCH')) {
        return res.status(403).json({
          error: "Cannot modify attendance for archived exam sessions"
        });
      }

      // Prevent transfers
      if (path.includes('/transfers') && method === 'POST') {
        return res.status(403).json({
          error: "Cannot create transfers for archived exam sessions"
        });
      }

      // Prevent incident reporting
      if (path.includes('/incidents') && method === 'POST') {
        return res.status(403).json({
          error: "Cannot report incidents for archived exam sessions"
        });
      }

      // Prevent status updates (except viewing)
      if (path.includes('/status') && method !== 'GET') {
        return res.status(403).json({
          error: "Cannot modify status of archived exam sessions"
        });
      }

      // Prevent session modifications
      if ((method === 'PUT' || method === 'PATCH') && !path.includes('/status') && !path.includes('/attendance') && !path.includes('/students')) {
        return res.status(403).json({
          error: "Cannot modify archived exam sessions"
        });
      }

      // Prevent deletion
      if (method === 'DELETE' && !path.includes('/students/')) {
        return res.status(403).json({
          error: "Cannot delete archived exam sessions"
        });
      }
    }

    next();
  } catch (error) {
    console.error("Error in preventArchivedSessionOperations middleware:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};