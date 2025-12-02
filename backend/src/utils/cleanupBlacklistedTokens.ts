import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Clean up expired blacklisted tokens
 * Should be run periodically (e.g., every hour via cron job)
 */
export async function cleanupBlacklistedTokens() {
  try {
    const now = new Date();

    const deleted = await prisma.blacklistedToken.deleteMany({
      where: {
        expiresAt: {
          lt: now, // Delete tokens that have already expired
        },
      },
    });

    console.log(
      `[CLEANUP] Removed ${deleted.count} expired blacklisted tokens`
    );

    return deleted.count;
  } catch (error) {
    console.error("[CLEANUP] Error cleaning up blacklisted tokens:", error);
    throw error;
  }
}

// Auto-run cleanup every hour if this script is executed directly
if (require.main === module) {
  console.log("[CLEANUP] Starting blacklisted token cleanup service...");

  // Run immediately on start
  cleanupBlacklistedTokens();

  // Then run every hour
  setInterval(() => {
    cleanupBlacklistedTokens();
  }, 60 * 60 * 1000); // 1 hour
}
