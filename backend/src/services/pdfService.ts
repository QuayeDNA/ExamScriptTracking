import PDFDocument from "pdfkit";
import type { ExamSession } from "@prisma/client";

interface ExamSessionWithStats extends ExamSession {
  stats?: {
    expectedStudents: number;
    totalAttended: number;
    submitted: number;
    present: number;
    attendanceRate: string | null;
  };
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

export class ExamSessionPDFService {
  /**
   * Generate a PDF report for an exam session
   * @param examSession - The exam session with stats
   * @param qrCodeDataUrl - Base64 QR code data URL
   * @returns PDF buffer
   */
  async generateExamSessionPDF(
    examSession: ExamSessionWithStats,
    qrCodeDataUrl: string
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const buffers: Buffer[] = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);

        // Header
        doc
          .fontSize(24)
          .font("Helvetica-Bold")
          .text("EXAM SESSION REPORT", { align: "center" });

        doc.moveDown(0.5);

        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`Batch Code: ${examSession.batchQrCode}`, { align: "center" });

        doc.moveDown(1);

        // Horizontal line
        doc
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke();

        doc.moveDown(1);

        // QR Code Section
        try {
          // Extract base64 data from data URL
          const base64Data = qrCodeDataUrl.split(",")[1];
          const qrBuffer = Buffer.from(base64Data, "base64");
          
          const qrSize = 150;
          const pageWidth = 595.28; // A4 width in points
          const qrX = (pageWidth - qrSize) / 2;

          doc.image(qrBuffer, qrX, doc.y, {
            width: qrSize,
            height: qrSize,
          });

          doc.moveDown(10);
        } catch (error) {
          console.error("Error embedding QR code in PDF:", error);
          doc.fontSize(10).text("(QR Code unavailable)", { align: "center" });
          doc.moveDown(1);
        }

        // Course Information Section
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("COURSE INFORMATION", { underline: true });

        doc.moveDown(0.5);

        const courseInfo = [
          ["Course Code:", examSession.courseCode],
          ["Course Name:", examSession.courseName],
          ["Lecturer:", examSession.lecturerName],
          ["Department:", examSession.department],
          ["Faculty:", examSession.faculty],
        ];

        doc.fontSize(10).font("Helvetica");
        courseInfo.forEach(([label, value]) => {
          doc.text(label, { continued: true, width: 150 });
          doc.font("Helvetica-Bold").text(value);
          doc.font("Helvetica");
        });

        doc.moveDown(1);

        // Schedule & Venue Section
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("SCHEDULE & VENUE", { underline: true });

        doc.moveDown(0.5);

        const scheduleInfo = [
          [
            "Exam Date:",
            new Date(examSession.examDate).toLocaleString("en-US", {
              dateStyle: "full",
              timeStyle: "short",
            }),
          ],
          ["Venue:", examSession.venue],
          [
            "Status:",
            examSession.status.replace(/_/g, " "),
          ],
        ];

        doc.fontSize(10).font("Helvetica");
        scheduleInfo.forEach(([label, value]) => {
          doc.text(label, { continued: true, width: 150 });
          doc.font("Helvetica-Bold").text(value);
          doc.font("Helvetica");
        });

        doc.moveDown(1);

        // Attendance Statistics Section (if available)
        if (examSession.stats) {
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("ATTENDANCE STATISTICS", { underline: true });

          doc.moveDown(0.5);

          const stats = [
            ["Expected Students:", examSession.stats.expectedStudents.toString()],
            ["Total Attended:", examSession.stats.totalAttended.toString()],
            ["Submitted Scripts:", examSession.stats.submitted.toString()],
            ["Present (Not Submitted):", examSession.stats.present.toString()],
            [
              "Attendance Rate:",
              examSession.stats.attendanceRate
                ? `${examSession.stats.attendanceRate}%`
                : "N/A",
            ],
          ];

          doc.fontSize(10).font("Helvetica");
          stats.forEach(([label, value]) => {
            doc.text(label, { continued: true, width: 200 });
            doc.font("Helvetica-Bold").text(value);
            doc.font("Helvetica");
          });

          doc.moveDown(1);
        }

        // Horizontal line
        doc
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke();

        doc.moveDown(1);

        // Footer
        const generatedBy = examSession.createdBy
          ? `${examSession.createdBy.firstName} ${examSession.createdBy.lastName}`
          : "System";

        doc.fontSize(8).font("Helvetica").fillColor("#666666");
        doc.text(`Generated: ${new Date().toLocaleString("en-US")}`, {
          align: "left",
        });
        doc.text(`By: ${generatedBy}`, { align: "left" });
        doc.text("Exam Logistics Management System (ELMS)", { align: "left" });

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const pdfService = new ExamSessionPDFService();
