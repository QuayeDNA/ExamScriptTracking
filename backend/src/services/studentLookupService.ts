import { PrismaClient, VerificationMethod } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Centralized student lookup service
 * Handles all different ways to identify a student
 */
export class StudentLookupService {
  /**
   * Find student by identifier based on verification method
   */
  async findStudent(identifier: string, method: VerificationMethod) {
    switch (method) {
      case VerificationMethod.QR_SCAN:
        return this.findByQRCode(identifier);
      
      case VerificationMethod.MANUAL_ENTRY:
        return this.findByIndexNumber(identifier);
      
      case VerificationMethod.BIOMETRIC_FINGERPRINT:
      case VerificationMethod.BIOMETRIC_FACE:
        return this.findByBiometricHash(identifier);
      
      case VerificationMethod.LINK_SELF_MARK:
        // For link-based, identifier is the studentId
        return this.findByStudentId(identifier);
      
      default:
        throw new Error(`Unsupported verification method: ${method}`);
    }
  }

  /**
   * Find student by QR code
   * Handles both JSON format and direct string
   */
  private async findByQRCode(qrCode: string) {
    // Try parsing as JSON first
    try {
      const qrData = JSON.parse(qrCode);
      if (qrData.type === "STUDENT" && qrData.id) {
        return await prisma.student.findUnique({
          where: { id: qrData.id },
        });
      }
    } catch {
      // Not JSON, continue to direct lookup
    }

    // Direct string match
    return await prisma.student.findUnique({
      where: { qrCode },
    });
  }

  /**
   * Find student by index number
   */
  private async findByIndexNumber(indexNumber: string) {
    return await prisma.student.findUnique({
      where: { indexNumber: indexNumber.trim().toUpperCase() },
    });
  }

  /**
   * Find student by biometric template hash
   */
  private async findByBiometricHash(hash: string) {
    return await prisma.student.findUnique({
      where: { biometricTemplateHash: hash },
    });
  }

  /**
   * Find student by ID
   */
  private async findByStudentId(id: string) {
    return await prisma.student.findUnique({
      where: { id },
    });
  }

  /**
   * Search students by partial match (for autocomplete)
   */
  async searchStudents(query: string, limit: number = 10) {
    const normalizedQuery = query.trim().toUpperCase();

    return await prisma.student.findMany({
      where: {
        OR: [
          { indexNumber: { contains: normalizedQuery, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        indexNumber: true,
        firstName: true,
        lastName: true,
        program: true,
        level: true,
        profilePicture: true,
      },
      take: limit,
      orderBy: {
        indexNumber: 'asc',
      },
    });
  }

  /**
   * Validate student exists and is active
   */
  async validateStudent(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    return student;
  }

  /**
   * Get student with full details
   */
  async getStudentDetails(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        attendance: {
          include: {
            session: {
              select: {
                id: true,
                courseCode: true,
                courseName: true,
                startTime: true,
              },
            },
          },
          orderBy: {
            markedAt: 'desc',
          },
          take: 10, // Last 10 attendances
        },
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    return student;
  }

  /**
   * Check if student has biometric enrolled
   */
  async hasBiometricEnrolled(studentId: string): Promise<boolean> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        biometricTemplateHash: true,
        biometricEnrolledAt: true,
      },
    });

    return !!(student?.biometricTemplateHash && student?.biometricEnrolledAt);
  }
}