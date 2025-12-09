import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create Super Admin
  const hashedPassword = await bcrypt.hash("SuperAdmin@123", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@examtrack.com" },
    update: {},
    create: {
      email: "superadmin@examtrack.com",
      password: hashedPassword,
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
  console.log("📧 Email: superadmin@examtrack.com");
  console.log("🔑 Password: SuperAdmin@123");
  console.log("⚠️  Please change this password after first login!");

  // Create shared CLASS_REP credentials for attendance
  const classRepPassword = await bcrypt.hash("Attendance@123", 10);

  const classRep = await prisma.user.upsert({
    where: { email: "attendance@examtrack.com" },
    update: {},
    create: {
      email: "attendance@examtrack.com",
      password: classRepPassword,
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
  console.log("📧 Email: attendance@examtrack.com");
  console.log("🔑 Password: Attendance@123");
  console.log(
    "📱 Use these shared credentials on mobile devices for class attendance"
  );

  // Create sample students for testing
  console.log("\n🎓 Creating sample students...");

  const students = await Promise.all([
    prisma.student.create({
      data: {
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
    prisma.student.create({
      data: {
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
    prisma.student.create({
      data: {
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
