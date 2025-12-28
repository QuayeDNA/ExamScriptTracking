import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting production database seed...");

  // Get credentials from environment variables or use defaults
  const superAdminEmail =
    process.env.SUPER_ADMIN_EMAIL || "superadmin@elms.com";
  const superAdminPassword =
    process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@123";
  const classRepEmail =
    process.env.CLASS_REP_EMAIL || "attendance@elms.com";
  const classRepPassword = process.env.CLASS_REP_PASSWORD || "Attendance@123";

  // Create Super Admin
  const hashedSuperPassword = await bcrypt.hash(superAdminPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      password: hashedSuperPassword,
      role: Role.ADMIN,
      firstName: "Super",
      lastName: "Admin",
      phone: "+1234567890",
      isSuperAdmin: true,
      isActive: true,
      passwordChanged: false, // Will be forced to change on first login
    },
  });

  console.log("✅ Super Admin created:", superAdmin.email);
  console.log("📧 Email:", superAdminEmail);
  console.log("🔑 Password:", superAdminPassword);
  console.log("⚠️  Please change this password after first login!");

  // Create shared CLASS_REP credentials for attendance
  const hashedClassRepPassword = await bcrypt.hash(classRepPassword, 10);

  const classRep = await prisma.user.upsert({
    where: { email: classRepEmail },
    update: {},
    create: {
      email: classRepEmail,
      password: hashedClassRepPassword,
      role: Role.CLASS_REP,
      firstName: "Class",
      lastName: "Attendance",
      phone: "+1234567891",
      isSuperAdmin: false,
      isActive: true,
      passwordChanged: true, // Set to true so they can use it immediately
    },
  });

  console.log("\n✅ CLASS_REP credentials created:", classRep.email);
  console.log("📧 Email:", classRepEmail);
  console.log("🔑 Password:", classRepPassword);
  console.log(
    "📱 Use these shared credentials on mobile devices for class attendance"
  );

  console.log("\n✨ Database seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
