import { Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// CREATE ARCHIVE WITH SESSIONS
// ============================================================================
export const createArchive = async (req: Request, res: Response) => {
  try {
    const { name, description, sessionIds } = req.body;
    const userId = req.user!.userId;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length < 3 || name.length > 100) {
      return res.status(400).json({
        error: "Archive name is required and must be between 3-100 characters"
      });
    }

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({
        error: "At least one session ID is required"
      });
    }

    // Check if user is admin
    if (req.user!.role !== Role.ADMIN) {
      return res.status(403).json({
        error: "Only administrators can create archives"
      });
    }

    // Validate sessions exist and are eligible for archiving
    const sessions = await prisma.examSession.findMany({
      where: {
        id: { in: sessionIds },
        isArchived: false
      }
    });

    if (sessions.length !== sessionIds.length) {
      return res.status(400).json({
        error: "Some sessions not found or already archived"
      });
    }

    // Check if all sessions are in COMPLETED status
    const ineligibleSessions = sessions.filter(s => s.status !== 'COMPLETED');
    if (ineligibleSessions.length > 0) {
      return res.status(400).json({
        error: "All sessions must be in COMPLETED status to be archived"
      });
    }

    // Check if archive name is unique for this admin
    const existingArchive = await prisma.examSessionArchive.findFirst({
      where: {
        name: name.trim(),
        createdById: userId
      }
    });

    if (existingArchive) {
      return res.status(409).json({
        error: "Archive name already exists"
      });
    }

    // Create archive and update sessions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the archive
      const archive = await tx.examSessionArchive.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          createdById: userId
        }
      });

      // Update sessions to be archived
      await tx.examSession.updateMany({
        where: { id: { in: sessionIds } },
        data: {
          archiveId: archive.id,
          isArchived: true,
          status: 'ARCHIVED'
        }
      });

      // Return archive with session count
      return await tx.examSessionArchive.findUnique({
        where: { id: archive.id },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          sessions: {
            select: {
              id: true,
              courseCode: true,
              courseName: true,
              status: true,
              isArchived: true,
              examDate: true
            }
          }
        }
      });
    });

    res.status(201).json({
      message: "Archive created successfully",
      archive: result
    });

  } catch (error) {
    console.error("Error creating archive:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================================================
// GET ALL ARCHIVES
// ============================================================================
export const getArchives = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [archives, totalCount] = await Promise.all([
      prisma.examSessionArchive.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          },
          sessions: {
            select: {
              id: true,
              courseCode: true,
              courseName: true,
              examDate: true
            }
          }
        }
      }),
      prisma.examSessionArchive.count()
    ]);

    // Add session count to each archive
    const archivesWithCount = archives.map(archive => ({
      ...archive,
      sessionCount: archive.sessions.length
    }));

    res.json({
      archives: archivesWithCount,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching archives:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================================================
// GET SINGLE ARCHIVE
// ============================================================================
export const getArchive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const archive = await prisma.examSessionArchive.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        sessions: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            lecturerName: true,
            department: true,
            venue: true,
            examDate: true,
            status: true,
            isArchived: true,
            createdAt: true
          },
          orderBy: { examDate: 'desc' }
        }
      }
    });

    if (!archive) {
      return res.status(404).json({ error: "Archive not found" });
    }

    res.json({
      archive: {
        ...archive,
        sessionCount: archive.sessions.length
      }
    });

  } catch (error) {
    console.error("Error fetching archive:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================================================
// UPDATE ARCHIVE
// ============================================================================
export const updateArchive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user!.userId;

    // Check if user is admin
    if (req.user!.role !== Role.ADMIN) {
      return res.status(403).json({
        error: "Only administrators can update archives"
      });
    }

    // Validate input
    if (name && (typeof name !== 'string' || name.trim().length < 3 || name.length > 100)) {
      return res.status(400).json({
        error: "Archive name must be between 3-100 characters"
      });
    }

    // Check if archive exists and user owns it
    const existingArchive = await prisma.examSessionArchive.findUnique({
      where: { id }
    });

    if (!existingArchive) {
      return res.status(404).json({ error: "Archive not found" });
    }

    if (existingArchive.createdById !== userId) {
      return res.status(403).json({
        error: "You can only update archives you created"
      });
    }

    // Check name uniqueness if being updated
    if (name && name.trim() !== existingArchive.name) {
      const duplicateName = await prisma.examSessionArchive.findFirst({
        where: {
          name: name.trim(),
          createdById: userId,
          id: { not: id }
        }
      });

      if (duplicateName) {
        return res.status(409).json({
          error: "Archive name already exists"
        });
      }
    }

    // Update archive
    const updatedArchive = await prisma.examSessionArchive.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null })
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        sessions: {
          select: {
            id: true,
            courseCode: true,
            courseName: true
          }
        }
      }
    });

    res.json({
      message: "Archive updated successfully",
      archive: {
        ...updatedArchive,
        sessionCount: updatedArchive.sessions.length
      }
    });

  } catch (error) {
    console.error("Error updating archive:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================================================
// DELETE ARCHIVE
// ============================================================================
export const deleteArchive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if user is admin
    if (req.user!.role !== Role.ADMIN) {
      return res.status(403).json({
        error: "Only administrators can delete archives"
      });
    }

    // Check if archive exists and user owns it
    const archive = await prisma.examSessionArchive.findUnique({
      where: { id },
      include: { sessions: { select: { id: true } } }
    });

    if (!archive) {
      return res.status(404).json({ error: "Archive not found" });
    }

    if (archive.createdById !== userId) {
      return res.status(403).json({
        error: "You can only delete archives you created"
      });
    }

    // Delete archive and unarchive sessions in a transaction
    await prisma.$transaction(async (tx) => {
      // Unarchive all sessions
      await tx.examSession.updateMany({
        where: { archiveId: id },
        data: {
          archiveId: null,
          isArchived: false,
          status: 'COMPLETED' // Reset to COMPLETED status
        }
      });

      // Delete the archive
      await tx.examSessionArchive.delete({
        where: { id }
      });
    });

    res.json({
      message: "Archive deleted successfully",
      unarchivedSessions: archive.sessions.length
    });

  } catch (error) {
    console.error("Error deleting archive:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================================================
// ADD SESSIONS TO EXISTING ARCHIVE
// ============================================================================
export const addSessionsToArchive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sessionIds } = req.body;
    const userId = req.user!.userId;

    // Check if user is admin
    if (req.user!.role !== Role.ADMIN) {
      return res.status(403).json({
        error: "Only administrators can modify archives"
      });
    }

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({
        error: "At least one session ID is required"
      });
    }

    // Check if archive exists and user owns it
    const archive = await prisma.examSessionArchive.findUnique({
      where: { id }
    });

    if (!archive) {
      return res.status(404).json({ error: "Archive not found" });
    }

    if (archive.createdById !== userId) {
      return res.status(403).json({
        error: "You can only modify archives you created"
      });
    }

    // Validate sessions exist and are eligible
    const sessions = await prisma.examSession.findMany({
      where: {
        id: { in: sessionIds },
        isArchived: false
      }
    });

    if (sessions.length !== sessionIds.length) {
      return res.status(400).json({
        error: "Some sessions not found or already archived"
      });
    }

    // Check if all sessions are in COMPLETED status
    const ineligibleSessions = sessions.filter(s => s.status !== 'COMPLETED');
    if (ineligibleSessions.length > 0) {
      return res.status(400).json({
        error: "All sessions must be in COMPLETED status to be archived"
      });
    }

    // Add sessions to archive
    await prisma.examSession.updateMany({
      where: { id: { in: sessionIds } },
      data: {
        archiveId: id,
        isArchived: true,
        status: 'ARCHIVED'
      }
    });

    // Get updated archive
    const updatedArchive = await prisma.examSessionArchive.findUnique({
      where: { id },
      include: {
        sessions: {
          select: {
            id: true,
            courseCode: true,
            courseName: true
          }
        }
      }
    });

    res.json({
      message: "Sessions added to archive successfully",
      archive: {
        ...updatedArchive,
        sessionCount: updatedArchive!.sessions.length
      }
    });

  } catch (error) {
    console.error("Error adding sessions to archive:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================================================
// REMOVE SESSION FROM ARCHIVE
// ============================================================================
export const removeSessionFromArchive = async (req: Request, res: Response) => {
  try {
    const { id, sessionId } = req.params;
    const userId = req.user!.userId;

    // Check if user is admin
    if (req.user!.role !== Role.ADMIN) {
      return res.status(403).json({
        error: "Only administrators can modify archives"
      });
    }

    // Check if archive exists and user owns it
    const archive = await prisma.examSessionArchive.findUnique({
      where: { id }
    });

    if (!archive) {
      return res.status(404).json({ error: "Archive not found" });
    }

    if (archive.createdById !== userId) {
      return res.status(403).json({
        error: "You can only modify archives you created"
      });
    }

    // Check if session exists and belongs to this archive
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.archiveId !== id) {
      return res.status(400).json({
        error: "Session does not belong to this archive"
      });
    }

    // Remove session from archive
    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        archiveId: null,
        isArchived: false,
        status: 'COMPLETED' // Reset to COMPLETED status
      }
    });

    res.json({
      message: "Session removed from archive successfully"
    });

  } catch (error) {
    console.error("Error removing session from archive:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};