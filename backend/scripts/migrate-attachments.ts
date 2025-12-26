import { PrismaClient } from "@prisma/client";
import { createStorageService } from "../src/services/storageService";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

// Force production mode for migration to use Cloudinary
process.env.NODE_ENV = "production";

const prisma = new PrismaClient();

async function migrateIncidentAttachments() {
  console.log("Starting incident attachment migration to cloud storage...");

  try {
    // Get all attachments with local file paths
    const attachments = await prisma.incidentAttachment.findMany({
      where: {
        filePath: {
          startsWith: "uploads/incidents/",
        },
      },
    });

    console.log(`Found ${attachments.length} attachments to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const attachment of attachments) {
      try {
        // Check if file exists locally
        const localPath = path.join(process.cwd(), attachment.filePath);

        if (!fs.existsSync(localPath)) {
          console.log(`File not found locally: ${attachment.filePath}`);
          continue;
        }

        // Read file
        const fileBuffer = fs.readFileSync(localPath);
        const fileName = path.basename(attachment.filePath);

        // Create a multer-like file object
        const file = {
          buffer: fileBuffer,
          originalname: attachment.fileName || fileName,
          mimetype: attachment.fileType || "application/octet-stream",
          size: attachment.fileSize || fileBuffer.length,
        } as Express.Multer.File;

        // Upload to cloud storage
        const incidentId = attachment.incidentId;
        const storageService = createStorageService();
        const result = await storageService.uploadFile(
          file,
          `incidents/${incidentId}`
        );

        if (result.success) {
          // Update database with cloud URL
          await prisma.incidentAttachment.update({
            where: { id: attachment.id },
            data: {
              filePath: result.url,
              metadata: {
                publicId: result.publicId,
                provider: result.provider,
                migratedFrom: attachment.filePath,
                migratedAt: new Date().toISOString(),
              },
            },
          });

          // Optionally delete local file after successful upload
          // fs.unlinkSync(localPath);

          migratedCount++;
          console.log(`Migrated: ${attachment.fileName} (${attachment.id})`);
        } else {
          console.error(
            `Failed to upload ${attachment.fileName}: ${result.error}`
          );
          errorCount++;
        }
      } catch (error) {
        console.error(`Error migrating attachment ${attachment.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Migration completed:`);
    console.log(`- Successfully migrated: ${migratedCount}`);
    console.log(`- Errors: ${errorCount}`);

    // Clean up empty incident folders (optional)
    console.log("Cleaning up empty local folders...");
    const incidentDirs = fs.readdirSync(
      path.join(process.cwd(), "uploads/incidents")
    );
    for (const dir of incidentDirs) {
      const dirPath = path.join(process.cwd(), "uploads/incidents", dir);
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        const files = fs.readdirSync(dirPath);
        if (files.length === 0) {
          fs.rmdirSync(dirPath);
          console.log(`Removed empty folder: ${dir}`);
        }
      }
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateIncidentAttachments()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateIncidentAttachments };
