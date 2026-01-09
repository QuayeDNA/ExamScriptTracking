import { PrismaClient, SessionStatus } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

interface GenerateLinkParams {
  sessionId: string;
  createdBy: string;
  expiresInMinutes: number;
  maxUses?: number;
  geofence?: {
    lat: number;
    lng: number;
    radiusMeters: number;
  };
}

interface LinkValidation {
  valid: boolean;
  error?: string;
  errorCode?: string;
  session?: {
    id: string;
    courseCode: string;
    courseName: string;
    lecturerName?: string;
    startTime: Date;
    venue?: string;
  };
  distanceFromVenue?: number;
}

/**
 * Service for managing attendance links
 * Handles link generation, validation, and geofencing
 */
export class LinkService {
  /**
   * Generate a new attendance link
   */
  async generateLink(params: GenerateLinkParams) {
    const { sessionId, createdBy, expiresInMinutes, maxUses, geofence } = params;

    // Verify session exists and is active
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.createdBy !== createdBy) {
      throw new Error("Unauthorized to create link for this session");
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new Error("Cannot generate link for inactive session");
    }

    // Deactivate existing active links (single active link strategy)
    await this.deactivateSessionLinks(sessionId);

    // Generate new link
    const linkToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const link = await prisma.attendanceLink.create({
      data: {
        sessionId,
        linkToken,
        createdBy,
        expiresAt,
        maxUses,
        requiresLocation: !!geofence,
        geofence: geofence ? JSON.parse(JSON.stringify(geofence)) : null,
        linkType: "ATTENDANCE",
        isActive: true,
      },
    });

    const baseUrl = process.env.APP_URL || 'https://localhost:5173';

    return {
      id: link.id,
      token: link.linkToken,
      url: `${baseUrl}/attend/${link.linkToken}`,
      qrCodeData: JSON.stringify({
        type: 'ATTENDANCE_LINK',
        token: link.linkToken,
        sessionId,
      }),
      expiresAt: link.expiresAt,
      maxUses: link.maxUses,
      requiresLocation: !!geofence,
      geofence,
    };
  }

  /**
   * Validate attendance link
   */
  async validateLink(
    token: string,
    studentLocation?: { lat: number; lng: number }
  ): Promise<LinkValidation> {
    // Find the link
    const link = await prisma.attendanceLink.findUnique({
      where: { linkToken: token },
      include: {
        session: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            lecturerName: true,
            startTime: true,
            venue: true,
            status: true,
          },
        },
      },
    });

    if (!link) {
      return {
        valid: false,
        error: "Invalid or expired attendance link",
        errorCode: "LINK_NOT_FOUND",
      };
    }

    // Check if link is active
    if (!link.isActive) {
      return {
        valid: false,
        error: "This link has been deactivated",
        errorCode: "LINK_DEACTIVATED",
      };
    }

    // Check expiration
    if (new Date() > link.expiresAt) {
      return {
        valid: false,
        error: "This attendance link has expired",
        errorCode: "LINK_EXPIRED",
      };
    }

    // Check usage limit
    if (link.maxUses && link.usesCount >= link.maxUses) {
      return {
        valid: false,
        error: "This link has reached its maximum usage limit",
        errorCode: "MAX_USES_REACHED",
      };
    }

    // Verify session exists
    if (!link.session) {
      return {
        valid: false,
        error: "Associated session not found",
        errorCode: "SESSION_NOT_FOUND",
      };
    }

    // Check if session is still active
    if (link.session.status !== SessionStatus.IN_PROGRESS) {
      return {
        valid: false,
        error: "This attendance session has ended",
        errorCode: "SESSION_ENDED",
      };
    }

    // Geofencing validation
    let distanceFromVenue: number | undefined;
    if (link.geofence) {
      const geofence = link.geofence as { lat: number; lng: number; radiusMeters: number };

      if (!studentLocation) {
        return {
          valid: false,
          error: "Location verification is required for this session",
          errorCode: "LOCATION_REQUIRED",
        };
      }

      distanceFromVenue = this.calculateDistance(
        geofence.lat,
        geofence.lng,
        studentLocation.lat,
        studentLocation.lng
      );

      if (distanceFromVenue > geofence.radiusMeters) {
        return {
          valid: false,
          error: `You must be within ${geofence.radiusMeters}m of the venue to mark attendance`,
          errorCode: "OUTSIDE_GEOFENCE",
          distanceFromVenue: Math.round(distanceFromVenue),
        };
      }
    }

    // Link is valid
    return {
      valid: true,
      session: {
        id: link.session.id,
        courseCode: link.session.courseCode || '',
        courseName: link.session.courseName || '',
        lecturerName: link.session.lecturerName || undefined,
        startTime: link.session.startTime,
        venue: link.session.venue || undefined,
      },
      distanceFromVenue: distanceFromVenue ? Math.round(distanceFromVenue) : undefined,
    };
  }

  /**
   * Get active links for a session
   */
  async getActiveLinks(sessionId: string, userId: string) {
    // Verify access
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.createdBy !== userId) {
      throw new Error("Unauthorized to view links for this session");
    }

    const now = new Date();
    const links = await prisma.attendanceLink.findMany({
      where: {
        sessionId,
        expiresAt: { gt: now },
        isActive: true,
        linkType: "ATTENDANCE",
      },
      orderBy: { createdAt: 'desc' },
    });

    const baseUrl = process.env.APP_URL || 'http://localhost:5173';

    return links.map((link) => ({
      id: link.id,
      token: link.linkToken,
      url: `${baseUrl}/attend/${link.linkToken}`,
      expiresAt: link.expiresAt,
      maxUses: link.maxUses,
      usageCount: link.usesCount,
      requiresLocation: link.requiresLocation,
      geofence: link.geofence as any,
      createdAt: link.createdAt,
    }));
  }

  /**
   * Revoke/deactivate a link
   */
  async revokeLink(token: string, userId: string) {
    const link = await prisma.attendanceLink.findUnique({
      where: { linkToken: token },
      include: {
        session: true,
      },
    });

    if (!link) {
      throw new Error("Link not found");
    }

    // Verify ownership
    if (link.createdBy !== userId && link.session?.createdBy !== userId) {
      throw new Error("Unauthorized to revoke this link");
    }

    await prisma.attendanceLink.update({
      where: { linkToken: token },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });
  }

  /**
   * Increment link usage counter
   */
  async incrementUsage(token: string) {
    await prisma.attendanceLink.update({
      where: { linkToken: token },
      data: {
        usesCount: { increment: 1 },
      },
    });
  }

  /**
   * Deactivate all active links for a session
   */
  async deactivateSessionLinks(sessionId: string) {
    const now = new Date();
    await prisma.attendanceLink.updateMany({
      where: {
        sessionId,
        isActive: true,
        linkType: "ATTENDANCE",
      },
      data: {
        isActive: false,
        deactivatedAt: now,
      },
    });
  }

  /**
   * Cleanup expired links (can be run as a cron job)
   */
  async cleanupExpiredLinks() {
    const result = await prisma.attendanceLink.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: true,
      },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Get link usage statistics
   */
  async getLinkStats(sessionId: string, userId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.createdBy !== userId) {
      throw new Error("Unauthorized or session not found");
    }

    const links = await prisma.attendanceLink.findMany({
      where: {
        sessionId,
        linkType: "ATTENDANCE",
      },
    });

    const totalLinks = links.length;
    const activeLinks = links.filter((l) => l.isActive && new Date() < l.expiresAt).length;
    const totalUses = links.reduce((sum, l) => sum + l.usesCount, 0);

    return {
      totalLinks,
      activeLinks,
      expiredLinks: links.filter((l) => new Date() >= l.expiresAt).length,
      deactivatedLinks: links.filter((l) => !l.isActive).length,
      totalUses,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}