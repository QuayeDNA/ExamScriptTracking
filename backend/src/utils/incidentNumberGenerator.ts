import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Generate unique incident number in format: INC-YYYYMMDD-XXXX
 * Example: INC-20251213-0001
 */
export async function generateIncidentNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePrefix = `${year}${month}${day}`;

  // Find the highest incident number for today
  const prefix = `INC-${datePrefix}-`;
  const latestIncident = await prisma.incident.findFirst({
    where: {
      incidentNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      incidentNumber: "desc",
    },
  });

  let sequence = 1;
  if (latestIncident) {
    // Extract sequence number and increment
    const lastSequence = parseInt(latestIncident.incidentNumber.split("-")[2]);
    sequence = lastSequence + 1;
  }

  const sequenceStr = String(sequence).padStart(4, "0");
  return `INC-${datePrefix}-${sequenceStr}`;
}
