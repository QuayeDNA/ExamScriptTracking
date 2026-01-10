#!/usr/bin/env node

/**
 * Production Database Seeding Script
 *
 * This script seeds essential data into the production database:
 * - Super Admin user
 * - Class Attendance shared credentials
 * - Lecturer test account
 * - Invigilator test account
 *
 * Usage:
 * npm run seed:prod
 *
 * Environment Variables:
 * - SUPER_ADMIN_EMAIL (default: superadmin@elms.com)
 * - SUPER_ADMIN_PASSWORD (default: SuperAdmin@123)
 * - CLASS_REP_EMAIL (default: attendance@elms.com)
 * - CLASS_REP_PASSWORD (default: Attendance@123)
 * - LECTURER_EMAIL (default: lecturer@elms.com)
 * - LECTURER_PASSWORD (default: Lecturer@123)
 * - INVIGILATOR_EMAIL (default: invigilator@elms.com)
 * - INVIGILATOR_PASSWORD (default: Invigilator@123)
 */

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

// Load production environment variables
dotenv.config({ path: ".env.production" });

const prisma = new PrismaClient();

async function seedProduction() {
  console.log("🚀 Starting production database seeding...");
  console.log("📍 Environment:", process.env.NODE_ENV || "development");

  try {
    // Get credentials from environment variables or use defaults
    const superAdminEmail =
      process.env.SUPER_ADMIN_EMAIL || "superadmin@elms.com";
    const superAdminPassword =
      process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@123";
    const classRepEmail =
      process.env.CLASS_REP_EMAIL || "attendance@elms.com";
    const classRepPassword = process.env.CLASS_REP_PASSWORD || "Attendance@123";
    const lecturerEmail = process.env.LECTURER_EMAIL || "lecturer@elms.com";
    const lecturerPassword = process.env.LECTURER_PASSWORD || "Lecturer@123";
    const invigilatorEmail =
      process.env.INVIGILATOR_EMAIL || "invigilator@elms.com";
    const invigilatorPassword =
      process.env.INVIGILATOR_PASSWORD || "Invigilator@123";

    console.log("\n👤 Creating Super Admin...");

    // Create Super Admin
    const hashedSuperPassword = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {
        password: hashedSuperPassword,
        isActive: true,
        isSuperAdmin: true,
      },
      create: {
        email: superAdminEmail,
        password: hashedSuperPassword,
        role: Role.ADMIN,
        firstName: "Super",
        lastName: "Admin",
        phone: "+1234567890",
        isSuperAdmin: true,
        isActive: true,
        passwordChanged: false,
      },
    });

    console.log("✅ Super Admin created/updated:");
    console.log("   📧 Email:", superAdminEmail);
    console.log("   🔑 Password:", superAdminPassword);
    console.log("   🎯 Role: ADMIN (Super Admin)");
    console.log("   ⚠️  IMPORTANT: Change this password after first login!");

    console.log("\n📱 Creating Class Attendance shared credentials...");

    // Create shared CLASS_REP credentials for attendance
    const hashedClassRepPassword = await bcrypt.hash(classRepPassword, 10);

    const classRep = await prisma.user.upsert({
      where: { email: classRepEmail },
      update: {
        password: hashedClassRepPassword,
        isActive: true,
      },
      create: {
        email: classRepEmail,
        password: hashedClassRepPassword,
        role: Role.CLASS_REP,
        firstName: "Class",
        lastName: "Attendance",
        phone: "+1234567891",
        isSuperAdmin: false,
        isActive: true,
        passwordChanged: true,
      },
    });

    console.log("✅ Class Attendance credentials created/updated:");
    console.log("   📧 Email:", classRepEmail);
    console.log("   🔑 Password:", classRepPassword);
    console.log("   🎯 Role: CLASS_REP");
    console.log(
      "   📱 Use these shared credentials on mobile devices for class attendance"
    );

    console.log("\n👨‍🏫 Creating Lecturer test account...");

    // Create lecturer account
    const hashedLecturerPassword = await bcrypt.hash(lecturerPassword, 10);

    const lecturer = await prisma.user.upsert({
      where: { email: lecturerEmail },
      update: {
        password: hashedLecturerPassword,
        isActive: true,
      },
      create: {
        email: lecturerEmail,
        password: hashedLecturerPassword,
        role: Role.LECTURER,
        firstName: "Test",
        lastName: "Lecturer",
        phone: "+1234567892",
        department: "Computer Science",
        isSuperAdmin: false,
        isActive: true,
        passwordChanged: false,
      },
    });

    console.log("✅ Lecturer account created/updated:");
    console.log("   📧 Email:", lecturerEmail);
    console.log("   🔑 Password:", lecturerPassword);
    console.log("   🎯 Role: LECTURER");
    console.log("   👨‍🏫 Use these credentials to test lecturer features");

    console.log("\n🔍 Creating Invigilator test account...");

    // Create invigilator account
    const hashedInvigilatorPassword = await bcrypt.hash(invigilatorPassword, 10);

    const invigilator = await prisma.user.upsert({
      where: { email: invigilatorEmail },
      update: {
        password: hashedInvigilatorPassword,
        isActive: true,
      },
      create: {
        email: invigilatorEmail,
        password: hashedInvigilatorPassword,
        role: Role.INVIGILATOR,
        firstName: "Test",
        lastName: "Invigilator",
        phone: "+1234567893",
        department: "General",
        isSuperAdmin: false,
        isActive: true,
        passwordChanged: false,
      },
    });

    console.log("✅ Invigilator account created/updated:");
    console.log("   📧 Email:", invigilatorEmail);
    console.log("   🔑 Password:", invigilatorPassword);
    console.log("   🎯 Role: INVIGILATOR");
    console.log("   🔍 Use these credentials to test invigilator features");

    console.log("\n🎉 Production seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log("   • Super Admin account ready for login");
    console.log("   • Class Attendance shared credentials configured");
    console.log("   • Lecturer test account created");
    console.log("   • Invigilator test account created");
    console.log("   • All essential production data seeded");
  } catch (error) {
    console.error("❌ Error during production seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedProduction();
