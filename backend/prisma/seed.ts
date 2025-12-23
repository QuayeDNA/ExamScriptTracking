import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting production database seed...");

  // Get credentials from environment variables or use defaults
  const superAdminEmail =
    process.env.SUPER_ADMIN_EMAIL || "superadmin@examtrack.com";
  const superAdminPassword =
    process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@123";
  const classRepEmail =
    process.env.CLASS_REP_EMAIL || "attendance@examtrack.com";
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

  // Only create sample students in development
  if (process.env.NODE_ENV !== "production") {
    console.log("\n🎓 Creating sample students...");

    const students = await Promise.all([
      prisma.student.upsert({
        where: { indexNumber: "STU001" },
        update: {},
        create: {
          indexNumber: "STU001",
          firstName: "John",
          lastName: "Doe",
          program: "Computer Science",
          level: 300,
          qrCode: JSON.stringify({
            id: "student-1",
            indexNumber: "STU001",
            name: "John Doe",
            program: "Computer Science",
            level: 300,
          }),
        },
      }),
      prisma.student.upsert({
        where: { indexNumber: "STU002" },
        update: {},
        create: {
          indexNumber: "STU002",
          firstName: "Jane",
          lastName: "Smith",
          program: "Information Technology",
          level: 300,
          qrCode: JSON.stringify({
            id: "student-2",
            indexNumber: "STU002",
            name: "Jane Smith",
            program: "Information Technology",
            level: 300,
          }),
        },
      }),
      prisma.student.upsert({
        where: { indexNumber: "STU003" },
        update: {},
        create: {
          indexNumber: "STU003",
          firstName: "Bob",
          lastName: "Johnson",
          program: "Software Engineering",
          level: 400,
          qrCode: JSON.stringify({
            id: "student-3",
            indexNumber: "STU003",
            name: "Bob Johnson",
            program: "Software Engineering",
            level: 400,
          }),
        },
      }),
    ]);

    console.log(`✅ Created ${students.length} sample students`);
  } else {
    console.log("\n⏭️  Skipping sample students in production environment");
  }

  console.log("\n✨ Production database seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
