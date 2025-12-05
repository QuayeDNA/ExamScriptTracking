import PDFDocument from "pdfkit";
import "pdfkit-table";
import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";
import { Response } from "express";

const prisma = new PrismaClient();

// Helper to format date
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Helper to add PDF header
const addPDFHeader = (
  doc: PDFKit.PDFDocument,
  title: string,
  subtitle?: string
) => {
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(title, { align: "center" })
    .moveDown(0.5);

  if (subtitle) {
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(subtitle, { align: "center" })
      .moveDown(1);
  }

  doc
    .fontSize(10)
    .text(`Generated: ${formatDate(new Date())}`, { align: "right" })
    .moveDown(1);
};

/**
 * Generate Batch Manifest PDF
 * Shows batch details, handler information, and student attendance
 */
export const generateBatchManifestPDF = async (
  examSessionId: string,
  res: Response
) => {
  try {
    const examSession = await prisma.examSession.findUnique({
      where: { id: examSessionId },
      include: {
        attendances: {
          include: {
            student: true,
          },
          orderBy: { student: { indexNumber: "asc" } },
        },
        createdBy: true,
      },
    });

    if (!examSession) {
      throw new Error("Exam session not found");
    }

    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=batch-manifest-${examSession.batchQrCode}.pdf`
    );

    doc.pipe(res);

    // Header
    addPDFHeader(
      doc,
      "Exam Batch Manifest",
      `Batch: ${examSession.batchQrCode}`
    );

    // Exam Details
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Exam Details", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    doc.text(`Course Code: ${examSession.courseCode}`);
    doc.text(`Course Name: ${examSession.courseName}`);
    doc.text(`Department: ${examSession.department}`);
    doc.text(`Faculty: ${examSession.faculty}`);
    doc.text(`Venue: ${examSession.venue}`);
    doc.text(`Exam Date: ${formatDate(examSession.examDate)}`);
    doc.text(`Status: ${examSession.status.replace("_", " ")}`);
    doc.moveDown(1);

    // Handler Information
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Handler Information", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    doc.text(
      `Created By: ${examSession.createdBy.firstName} ${examSession.createdBy.lastName} (${examSession.createdBy.email})`
    );
    doc.text(`Lecturer: ${examSession.lecturerName}`);
    doc.moveDown(1);

    // Attendance Summary
    const presentCount = examSession.attendances.filter(
      (a) => a.status !== "ABSENT"
    ).length;
    const submittedCount = examSession.attendances.filter(
      (a) => a.status === "SUBMITTED"
    ).length;

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Attendance Summary", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    doc.text(`Total Students: ${examSession.attendances.length}`);
    doc.text(`Present: ${presentCount}`);
    doc.text(`Submitted Scripts: ${submittedCount}`);
    doc.text(
      `Completion Rate: ${(
        (submittedCount / examSession.attendances.length) *
        100
      ).toFixed(1)}%`
    );
    doc.moveDown(1);

    // Student Attendance Table
    doc.addPage();
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Student Attendance List", { underline: true });
    doc.moveDown(1);

    const tableData = {
      headers: [
        "Index Number",
        "Name",
        "Program",
        "Level",
        "Entry Time",
        "Exit Time",
        "Status",
      ],
      rows: examSession.attendances.map((attendance) => [
        attendance.student.indexNumber,
        `${attendance.student.firstName} ${attendance.student.lastName}`,
        attendance.student.program,
        attendance.student.level.toString(),
        attendance.entryTime ? formatDate(attendance.entryTime) : "-",
        attendance.exitTime ? formatDate(attendance.exitTime) : "-",
        attendance.status.replace("_", " "),
      ]),
    };

    // @ts-ignore - pdfkit-table types are not fully compatible
    await doc.table(tableData, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
      prepareRow: () => doc.font("Helvetica").fontSize(8),
    });

    // Footer
    doc
      .moveDown(2)
      .fontSize(8)
      .font("Helvetica-Oblique")
      .text(
        "This is a computer-generated document. No signature is required.",
        { align: "center" }
      );

    doc.end();
  } catch (error) {
    console.error("Error generating batch manifest PDF:", error);
    throw error;
  }
};

/**
 * Generate Attendance Report PDF
 * Detailed attendance report with discrepancies
 */
export const generateAttendanceReportPDF = async (
  examSessionId: string,
  res: Response
) => {
  try {
    const examSession = await prisma.examSession.findUnique({
      where: { id: examSessionId },
      include: {
        attendances: {
          include: {
            student: true,
          },
          orderBy: { student: { indexNumber: "asc" } },
        },
      },
    });

    if (!examSession) {
      throw new Error("Exam session not found");
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance-report-${examSession.courseCode}.pdf`
    );

    doc.pipe(res);

    addPDFHeader(
      doc,
      "Attendance Report",
      `${examSession.courseCode} - ${examSession.courseName}`
    );

    // Statistics
    const stats = {
      total: examSession.attendances.length,
      present: examSession.attendances.filter(
        (a) => a.status === "PRESENT" || a.status === "SUBMITTED"
      ).length,
      submitted: examSession.attendances.filter((a) => a.status === "SUBMITTED")
        .length,
      leftWithout: examSession.attendances.filter(
        (a) => a.status === "LEFT_WITHOUT_SUBMITTING"
      ).length,
      absent: examSession.attendances.filter((a) => a.status === "ABSENT")
        .length,
      withDiscrepancy: examSession.attendances.filter((a) => a.discrepancyNote)
        .length,
    };

    doc.fontSize(12).font("Helvetica-Bold").text("Statistics");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Total Registered: ${stats.total}`);
    doc.text(
      `Present: ${stats.present} (${(
        (stats.present / stats.total) *
        100
      ).toFixed(1)}%)`
    );
    doc.text(
      `Submitted: ${stats.submitted} (${(
        (stats.submitted / stats.total) *
        100
      ).toFixed(1)}%)`
    );
    doc.text(`Left Without Submitting: ${stats.leftWithout}`);
    doc.text(`Absent: ${stats.absent}`);
    doc.text(`With Discrepancies: ${stats.withDiscrepancy}`);
    doc.moveDown(1);

    // Detailed Attendance
    doc.fontSize(12).font("Helvetica-Bold").text("Detailed Attendance");
    doc.moveDown(1);

    const tableData = {
      headers: [
        "Index",
        "Name",
        "Entry",
        "Exit",
        "Submission",
        "Status",
        "Notes",
      ],
      rows: examSession.attendances.map((a) => [
        a.student.indexNumber,
        `${a.student.firstName} ${a.student.lastName}`,
        a.entryTime ? new Date(a.entryTime).toLocaleTimeString() : "-",
        a.exitTime ? new Date(a.exitTime).toLocaleTimeString() : "-",
        a.submissionTime
          ? new Date(a.submissionTime).toLocaleTimeString()
          : "-",
        a.status.replace("_", " "),
        a.discrepancyNote || "-",
      ]),
    };

    // @ts-ignore
    await doc.table(tableData, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
      prepareRow: () => doc.font("Helvetica").fontSize(7),
    });

    doc.end();
  } catch (error) {
    console.error("Error generating attendance report PDF:", error);
    throw error;
  }
};

/**
 * Generate Handler Performance Excel Report
 * Comprehensive handler metrics in Excel format
 */
export const generateHandlerPerformanceExcel = async (
  startDate?: Date,
  endDate?: Date
): Promise<ExcelJS.Buffer> => {
  try {
    const dateFilter =
      startDate && endDate
        ? {
            requestedAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    // Get all handlers
    const handlers = await prisma.user.findMany({
      where: {
        OR: [
          { role: "INVIGILATOR" },
          { role: "FACULTY_OFFICER" },
          { role: "DEPARTMENT_HEAD" },
        ],
        isActive: true,
      },
      include: {
        handledBatches: {
          where: dateFilter,
        },
        receivedBatches: {
          where: dateFilter,
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Exam Script Tracking System";
    workbook.created = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet("Summary", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    summarySheet.columns = [
      { header: "Handler Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Role", key: "role", width: 20 },
      { header: "Transfers Sent", key: "sent", width: 15 },
      { header: "Transfers Received", key: "received", width: 15 },
      { header: "Avg Response Time (min)", key: "avgResponse", width: 20 },
      { header: "Discrepancy Rate (%)", key: "discrepancyRate", width: 20 },
    ];

    // Style header row
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Add handler data
    for (const handler of handlers) {
      const sentTransfers = handler.handledBatches;
      const receivedTransfers = handler.receivedBatches;

      // Calculate average response time
      const responseTimes = receivedTransfers
        .filter((t) => t.confirmedAt)
        .map(
          (t) =>
            (new Date(t.confirmedAt!).getTime() -
              new Date(t.requestedAt).getTime()) /
            (1000 * 60)
        );
      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0;

      // Calculate discrepancy rate
      const discrepancies = [...sentTransfers, ...receivedTransfers].filter(
        (t) => t.discrepancyNote
      ).length;
      const totalTransfers = sentTransfers.length + receivedTransfers.length;
      const discrepancyRate =
        totalTransfers > 0 ? (discrepancies / totalTransfers) * 100 : 0;

      summarySheet.addRow({
        name: `${handler.firstName} ${handler.lastName}`,
        email: handler.email,
        role: handler.role,
        sent: sentTransfers.length,
        received: receivedTransfers.length,
        avgResponse: avgResponseTime.toFixed(2),
        discrepancyRate: discrepancyRate.toFixed(2),
      });
    }

    // Detailed Transfers Sheet
    const transfersSheet = workbook.addWorksheet("All Transfers", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    transfersSheet.columns = [
      { header: "Transfer ID", key: "id", width: 30 },
      { header: "From Handler", key: "from", width: 25 },
      { header: "To Handler", key: "to", width: 25 },
      { header: "Requested At", key: "requested", width: 20 },
      { header: "Confirmed At", key: "confirmed", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Scripts Expected", key: "expected", width: 15 },
      { header: "Scripts Received", key: "received", width: 15 },
      { header: "Discrepancy", key: "discrepancy", width: 40 },
    ];

    transfersSheet.getRow(1).font = { bold: true };
    transfersSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    transfersSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Get all transfers
    const allTransfers = await prisma.batchTransfer.findMany({
      where: dateFilter,
      include: {
        fromHandler: true,
        toHandler: true,
      },
      orderBy: { requestedAt: "desc" },
    });

    for (const transfer of allTransfers) {
      transfersSheet.addRow({
        id: transfer.id,
        from: `${transfer.fromHandler.firstName} ${transfer.fromHandler.lastName}`,
        to: `${transfer.toHandler.firstName} ${transfer.toHandler.lastName}`,
        requested: new Date(transfer.requestedAt).toLocaleString(),
        confirmed: transfer.confirmedAt
          ? new Date(transfer.confirmedAt).toLocaleString()
          : "-",
        status: transfer.status,
        expected: transfer.scriptsExpected,
        received: transfer.scriptsReceived || "-",
        discrepancy: transfer.discrepancyNote || "-",
      });
    }

    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error generating handler performance Excel:", error);
    throw error;
  }
};

/**
 * Generate Discrepancy Report PDF
 * Shows all discrepancies with details
 */
export const generateDiscrepancyReportPDF = async (
  startDate?: Date,
  endDate?: Date,
  res?: Response
) => {
  try {
    const dateFilter =
      startDate && endDate
        ? {
            requestedAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    const discrepancies = await prisma.batchTransfer.findMany({
      where: {
        ...dateFilter,
        discrepancyNote: {
          not: null,
        },
      },
      include: {
        fromHandler: true,
        toHandler: true,
        examSession: true,
      },
      orderBy: { requestedAt: "desc" },
    });

    const doc = new PDFDocument({ margin: 50 });

    if (res) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=discrepancy-report-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
      doc.pipe(res);
    }

    addPDFHeader(
      doc,
      "Discrepancy Report",
      startDate && endDate
        ? `${formatDate(startDate)} to ${formatDate(endDate)}`
        : undefined
    );

    // Summary
    const resolved = discrepancies.filter(
      (d) => d.status === "RESOLVED"
    ).length;
    const pending = discrepancies.filter(
      (d) => d.status === "DISCREPANCY_REPORTED"
    ).length;

    doc.fontSize(12).font("Helvetica-Bold").text("Summary");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Total Discrepancies: ${discrepancies.length}`);
    doc.text(
      `Resolved: ${resolved} (${(
        (resolved / discrepancies.length) *
        100
      ).toFixed(1)}%)`
    );
    doc.text(`Pending: ${pending}`);
    doc.moveDown(1);

    // Detailed Discrepancies
    doc.fontSize(12).font("Helvetica-Bold").text("Detailed Discrepancies");
    doc.moveDown(1);

    const tableData = {
      headers: [
        "Course",
        "From",
        "To",
        "Expected",
        "Received",
        "Difference",
        "Status",
        "Note",
      ],
      rows: discrepancies.map((d) => [
        d.examSession.courseCode,
        `${d.fromHandler.firstName} ${d.fromHandler.lastName}`,
        `${d.toHandler.firstName} ${d.toHandler.lastName}`,
        d.scriptsExpected.toString(),
        (d.scriptsReceived || 0).toString(),
        (d.scriptsExpected - (d.scriptsReceived || 0)).toString(),
        d.status.replace("_", " "),
        d.discrepancyNote?.substring(0, 50) || "-",
      ]),
    };

    // @ts-ignore
    await doc.table(tableData, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
      prepareRow: () => doc.font("Helvetica").fontSize(7),
    });

    doc.end();
  } catch (error) {
    console.error("Error generating discrepancy report PDF:", error);
    throw error;
  }
};

/**
 * Generate Analytics Overview Excel
 * Comprehensive analytics data in Excel format
 */
export const generateAnalyticsOverviewExcel = async (
  startDate?: Date,
  endDate?: Date
): Promise<ExcelJS.Buffer> => {
  try {
    const dateFilter =
      startDate && endDate
        ? {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Exam Script Tracking System";
    workbook.created = new Date();

    // Overview Sheet
    const overviewSheet = workbook.addWorksheet("Overview");

    overviewSheet.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 20 },
    ];

    overviewSheet.getRow(1).font = { bold: true };
    overviewSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };

    // Get metrics
    const totalSessions = await prisma.examSession.count({ where: dateFilter });
    const activeTransfers = await prisma.batchTransfer.count({
      where: {
        ...dateFilter,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    const completedTransfers = await prisma.batchTransfer.count({
      where: {
        ...dateFilter,
        status: "CONFIRMED",
      },
    });
    const discrepancies = await prisma.batchTransfer.count({
      where: {
        ...dateFilter,
        discrepancyNote: { not: null },
      },
    });

    overviewSheet.addRows([
      { metric: "Total Exam Sessions", value: totalSessions },
      { metric: "Active Transfers", value: activeTransfers },
      { metric: "Completed Transfers", value: completedTransfers },
      { metric: "Total Discrepancies", value: discrepancies },
      { metric: "Report Generated", value: new Date().toLocaleString() },
    ]);

    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error generating analytics overview Excel:", error);
    throw error;
  }
};
