import PDFDocument from "pdfkit";
import "pdfkit-table";
import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";
import { Response } from "express";

const prisma = new PrismaClient();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateShort = (date: Date): string => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// PDF Layout Constants
const PAGE_WIDTH = 595.28; // A4 width in points
const PAGE_HEIGHT = 841.89; // A4 height in points
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Color Palette
const COLORS = {
  primary: "#1a56db",
  secondary: "#6b7280",
  success: "#16a34a",
  warning: "#ea580c",
  danger: "#dc2626",
  info: "#0369a1",
  lightBg: "#f9fafb",
  border: "#e5e7eb",
  text: "#111827",
  textLight: "#6b7280",
};

/**
 * Add professional PDF header with branding
 */
const addPDFHeader = (
  doc: PDFKit.PDFDocument,
  title: string,
  subtitle?: string
) => {
  const headerHeight = 80;
  
  // Header background
  doc
    .rect(0, 0, PAGE_WIDTH, headerHeight)
    .fill(COLORS.primary);

  // Title
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .fillColor("#FFFFFF")
    .text(title, MARGIN, 25, { align: "center", width: CONTENT_WIDTH });

  // Subtitle
  if (subtitle) {
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(subtitle, MARGIN, 52, { align: "center", width: CONTENT_WIDTH });
  }

  doc.y = headerHeight + 10;
  
  // Reset to black for body content
  doc.fillColor(COLORS.text);
};

/**
 * Add PDF footer with page numbers
 */
const addPDFFooter = (
  doc: PDFKit.PDFDocument,
  text: string = "Exam Logistics Management System (ELMS)"
) => {
  const bottomMargin = 50;
  
  doc
    .fontSize(8)
    .font("Helvetica-Oblique")
    .fillColor(COLORS.textLight)
    .text(
      text,
      MARGIN,
      PAGE_HEIGHT - bottomMargin,
      { align: "center", width: CONTENT_WIDTH }
    );
  
  doc
    .fontSize(8)
    .text(
      `Generated: ${formatDate(new Date())}`,
      MARGIN,
      PAGE_HEIGHT - bottomMargin + 12,
      { align: "center", width: CONTENT_WIDTH }
    );
};

/**
 * Add section header with underline
 */
const addSectionHeader = (
  doc: PDFKit.PDFDocument,
  title: string,
  topPadding: number = 15
) => {
  doc.moveDown(topPadding / 12); // Convert to relative spacing
  
  const startY = doc.y;
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text(title);

  // Underline
  doc
    .strokeColor(COLORS.primary)
    .lineWidth(2)
    .moveTo(MARGIN, doc.y + 3)
    .lineTo(MARGIN + 150, doc.y + 3)
    .stroke();

  doc.moveDown(0.8);
  doc.fillColor(COLORS.text);
};

/**
 * Create info box with key-value pairs
 */
const addInfoBox = (
  doc: PDFKit.PDFDocument,
  data: { label: string; value: string }[],
  columns: number = 2
) => {
  const boxHeight = Math.ceil(data.length / columns) * 20 + 30;
  const startY = doc.y;

  // Box background
  doc
    .rect(MARGIN, startY, CONTENT_WIDTH, boxHeight)
    .fillAndStroke(COLORS.lightBg, COLORS.border);

  doc.fillColor(COLORS.text);

  const columnWidth = CONTENT_WIDTH / columns;
  const itemsPerColumn = Math.ceil(data.length / columns);

  data.forEach((item, index) => {
    const column = Math.floor(index / itemsPerColumn);
    const row = index % itemsPerColumn;
    
    const x = MARGIN + 15 + column * columnWidth;
    const y = startY + 15 + row * 20;

    doc.fontSize(9).font("Helvetica").text(item.label + ":", x, y);
    doc
      .font("Helvetica-Bold")
      .text(item.value, x + 120, y, { width: columnWidth - 135 });
  });

  doc.y = startY + boxHeight + 10;
  doc.fillColor(COLORS.text);
};

/**
 * Add statistics summary box
 */
const addStatsBox = (
  doc: PDFKit.PDFDocument,
  stats: { label: string; value: string | number; color?: string }[]
) => {
  const boxWidth = CONTENT_WIDTH / stats.length;
  const boxHeight = 70;
  const startY = doc.y;

  stats.forEach((stat, index) => {
    const x = MARGIN + index * boxWidth;

    // Box
    doc
      .rect(x + 5, startY, boxWidth - 10, boxHeight)
      .fillAndStroke("#FFFFFF", COLORS.border);

    // Value
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor(stat.color || COLORS.primary)
      .text(stat.value.toString(), x + 5, startY + 15, {
        width: boxWidth - 10,
        align: "center",
      });

    // Label
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(COLORS.textLight)
      .text(stat.label, x + 5, startY + 45, {
        width: boxWidth - 10,
        align: "center",
      });
  });

  doc.y = startY + boxHeight + 15;
  doc.fillColor(COLORS.text);
};

/**
 * Check if we need a new page (with buffer space)
 */
const checkPageBreak = (doc: PDFKit.PDFDocument, requiredSpace: number = 100) => {
  if (doc.y > PAGE_HEIGHT - MARGIN - requiredSpace) {
    doc.addPage();
    return true;
  }
  return false;
};

// ============================================================================
// BATCH MANIFEST PDF
// ============================================================================

export const generateBatchManifestPDF = async (
  examSessionId: string,
  res: Response
) => {
  try {
    const examSession = await prisma.examSession.findUnique({
      where: { id: examSessionId },
      include: {
        attendances: {
          include: { student: true },
          orderBy: { student: { indexNumber: "asc" } },
        },
        createdBy: true,
      },
    });

    if (!examSession) {
      throw new Error("Exam session not found");
    }

    const doc = new PDFDocument({ margin: MARGIN, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=batch-manifest-${examSession.batchQrCode}.pdf`
    );

    doc.pipe(res);

    // Header
    addPDFHeader(doc, "Exam Batch Manifest", `Batch: ${examSession.batchQrCode}`);

    // Exam Details
    addSectionHeader(doc, "Exam Information");
    addInfoBox(doc, [
      { label: "Course Code", value: examSession.courseCode },
      { label: "Course Name", value: examSession.courseName },
      { label: "Department", value: examSession.department },
      { label: "Faculty", value: examSession.faculty },
      { label: "Venue", value: examSession.venue },
      { label: "Exam Date", value: formatDate(examSession.examDate) },
      { label: "Status", value: examSession.status.replace(/_/g, " ") },
      { label: "Batch QR Code", value: examSession.batchQrCode },
    ]);

    // Handler Information
    addSectionHeader(doc, "Handler Information");
    addInfoBox(doc, [
      {
        label: "Created By",
        value: `${examSession.createdBy.firstName} ${examSession.createdBy.lastName}`,
      },
      { label: "Email", value: examSession.createdBy.email },
      { label: "Lecturer", value: examSession.lecturerName },
      { label: "Created", value: formatDate(examSession.createdAt) },
    ]);

    // Attendance Summary Stats
    const presentCount = examSession.attendances.filter(
      (a) => a.status !== "ABSENT"
    ).length;
    const submittedCount = examSession.attendances.filter(
      (a) => a.status === "SUBMITTED"
    ).length;
    const completionRate =
      examSession.attendances.length > 0
        ? ((submittedCount / examSession.attendances.length) * 100).toFixed(1)
        : "0.0";

    addSectionHeader(doc, "Attendance Summary");
    addStatsBox(doc, [
      { label: "Total Students", value: examSession.attendances.length },
      { label: "Present", value: presentCount, color: COLORS.info },
      { label: "Submitted", value: submittedCount, color: COLORS.success },
      { label: "Completion Rate", value: `${completionRate}%`, color: COLORS.primary },
    ]);

    // Student Attendance Table
    checkPageBreak(doc, 200);
    addSectionHeader(doc, "Student Attendance List");

    const tableData = {
      headers: ["Index No.", "Full Name", "Program", "Level", "Entry", "Exit", "Status"],
      rows: examSession.attendances.map((attendance) => [
        attendance.student.indexNumber,
        `${attendance.student.firstName} ${attendance.student.lastName}`,
        attendance.student.program.length > 20
          ? attendance.student.program.substring(0, 17) + "..."
          : attendance.student.program,
        attendance.student.level.toString(),
        attendance.entryTime ? formatTime(attendance.entryTime) : "-",
        attendance.exitTime ? formatTime(attendance.exitTime) : "-",
        attendance.status.replace(/_/g, " "),
      ]),
    };

    // @ts-ignore
    await doc.table(tableData, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
      prepareRow: (row: any, indexColumn: number, indexRow: number) => {
        doc.font("Helvetica").fontSize(7);
        if (indexRow % 2 === 0) {
          doc.fillColor("#f9fafb");
        }
      },
      width: CONTENT_WIDTH,
    });

    // Footer
    addPDFFooter(doc);

    doc.end();
  } catch (error) {
    console.error("Error generating batch manifest PDF:", error);
    throw error;
  }
};

// ============================================================================
// ATTENDANCE REPORT PDF
// ============================================================================

export const generateAttendanceReportPDF = async (
  examSessionId: string,
  res: Response
) => {
  try {
    const examSession = await prisma.examSession.findUnique({
      where: { id: examSessionId },
      include: {
        attendances: {
          include: { student: true },
          orderBy: { student: { indexNumber: "asc" } },
        },
      },
    });

    if (!examSession) {
      throw new Error("Exam session not found");
    }

    const doc = new PDFDocument({ margin: MARGIN, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance-report-${examSession.courseCode}.pdf`
    );

    doc.pipe(res);

    // Header
    addPDFHeader(
      doc,
      "Attendance Report",
      `${examSession.courseCode} - ${examSession.courseName}`
    );

    // Course Info
    addInfoBox(doc, [
      { label: "Department", value: examSession.department },
      { label: "Faculty", value: examSession.faculty },
      { label: "Venue", value: examSession.venue },
      { label: "Exam Date", value: formatDate(examSession.examDate) },
    ]);

    // Statistics
    const stats = {
      total: examSession.attendances.length,
      present: examSession.attendances.filter(
        (a) => a.status === "PRESENT" || a.status === "SUBMITTED"
      ).length,
      submitted: examSession.attendances.filter((a) => a.status === "SUBMITTED").length,
      leftWithout: examSession.attendances.filter(
        (a) => a.status === "LEFT_WITHOUT_SUBMITTING"
      ).length,
      absent: examSession.attendances.filter((a) => a.status === "ABSENT").length,
      withDiscrepancy: examSession.attendances.filter((a) => a.discrepancyNote).length,
    };

    addSectionHeader(doc, "Statistics");
    addStatsBox(doc, [
      { label: "Total Registered", value: stats.total },
      {
        label: "Present",
        value: `${stats.present} (${((stats.present / stats.total) * 100).toFixed(1)}%)`,
        color: COLORS.info,
      },
      {
        label: "Submitted",
        value: `${stats.submitted} (${((stats.submitted / stats.total) * 100).toFixed(1)}%)`,
        color: COLORS.success,
      },
      { label: "Absent", value: stats.absent, color: COLORS.danger },
    ]);

    doc.moveDown(1);
    addInfoBox(
      doc,
      [
        { label: "Left Without Submitting", value: stats.leftWithout.toString() },
        { label: "With Discrepancies", value: stats.withDiscrepancy.toString() },
      ],
      2
    );

    // Detailed Attendance
    checkPageBreak(doc, 200);
    addSectionHeader(doc, "Detailed Attendance Records");

    const tableData = {
      headers: ["Index", "Name", "Entry", "Exit", "Submit", "Status", "Notes"],
      rows: examSession.attendances.map((a) => [
        a.student.indexNumber,
        `${a.student.firstName} ${a.student.lastName}`,
        a.entryTime ? formatTime(a.entryTime) : "-",
        a.exitTime ? formatTime(a.exitTime) : "-",
        a.submissionTime ? formatTime(a.submissionTime) : "-",
        a.status.replace(/_/g, " "),
        a.discrepancyNote
          ? a.discrepancyNote.substring(0, 30) + (a.discrepancyNote.length > 30 ? "..." : "")
          : "-",
      ]),
    };

    // @ts-ignore
    await doc.table(tableData, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
      prepareRow: () => doc.font("Helvetica").fontSize(7),
      width: CONTENT_WIDTH,
    });

    // Footer
    addPDFFooter(doc);

    doc.end();
  } catch (error) {
    console.error("Error generating attendance report PDF:", error);
    throw error;
  }
};

// ============================================================================
// HANDLER PERFORMANCE EXCEL
// ============================================================================

export const generateHandlerPerformanceExcel = async (
  startDate?: Date,
  endDate?: Date
): Promise<ExcelJS.Buffer> => {
  try {
    const dateFilter =
      startDate && endDate
        ? { requestedAt: { gte: startDate, lte: endDate } }
        : {};

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
        handledBatches: { where: dateFilter },
        receivedBatches: { where: dateFilter },
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Exam Logistics System (ELMS)";
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
      { header: "Transfers Received", key: "received", width: 18 },
      { header: "Avg Response Time (min)", key: "avgResponse", width: 22 },
      { header: "Discrepancy Rate (%)", key: "discrepancyRate", width: 20 },
    ];

    // Style header row
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1a56db" },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    summarySheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    // Add handler data
    for (const handler of handlers) {
      const sentTransfers = handler.handledBatches;
      const receivedTransfers = handler.receivedBatches;

      const responseTimes = receivedTransfers
        .filter((t) => t.confirmedAt)
        .map(
          (t) =>
            (new Date(t.confirmedAt!).getTime() - new Date(t.requestedAt).getTime()) /
            (1000 * 60)
        );
      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0;

      const discrepancies = [...sentTransfers, ...receivedTransfers].filter(
        (t) => t.discrepancyNote
      ).length;
      const totalTransfers = sentTransfers.length + receivedTransfers.length;
      const discrepancyRate = totalTransfers > 0 ? (discrepancies / totalTransfers) * 100 : 0;

      const row = summarySheet.addRow({
        name: `${handler.firstName} ${handler.lastName}`,
        email: handler.email,
        role: handler.role,
        sent: sentTransfers.length,
        received: receivedTransfers.length,
        avgResponse: avgResponseTime.toFixed(2),
        discrepancyRate: discrepancyRate.toFixed(2),
      });

      // Conditional formatting
      if (discrepancyRate > 10) {
        row.getCell("discrepancyRate").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFCCCC" },
        };
      }
    }

    // Detailed Transfers Sheet
    const transfersSheet = workbook.addWorksheet("All Transfers", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    transfersSheet.columns = [
      { header: "Transfer ID", key: "id", width: 35 },
      { header: "From Handler", key: "from", width: 25 },
      { header: "To Handler", key: "to", width: 25 },
      { header: "Requested At", key: "requested", width: 20 },
      { header: "Confirmed At", key: "confirmed", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Expected", key: "expected", width: 12 },
      { header: "Received", key: "received", width: 12 },
      { header: "Discrepancy", key: "discrepancy", width: 40 },
    ];

    transfersSheet.getRow(1).font = { bold: true };
    transfersSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1a56db" },
    };
    transfersSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    transfersSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

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
        confirmed: transfer.confirmedAt ? new Date(transfer.confirmedAt).toLocaleString() : "-",
        status: transfer.status,
        expected: transfer.examsExpected,
        received: transfer.examsReceived || "-",
        discrepancy: transfer.discrepancyNote || "-",
      });
    }

    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error generating handler performance Excel:", error);
    throw error;
  }
};

// ============================================================================
// DISCREPANCY REPORT PDF
// ============================================================================

export const generateDiscrepancyReportPDF = async (
  startDate?: Date,
  endDate?: Date,
  res?: Response
) => {
  try {
    const dateFilter =
      startDate && endDate ? { requestedAt: { gte: startDate, lte: endDate } } : {};

    const discrepancies = await prisma.batchTransfer.findMany({
      where: {
        ...dateFilter,
        discrepancyNote: { not: null },
      },
      include: {
        fromHandler: true,
        toHandler: true,
        examSession: true,
      },
      orderBy: { requestedAt: "desc" },
    });

    const doc = new PDFDocument({ margin: MARGIN, size: "A4" });

    if (res) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=discrepancy-report-${new Date().toISOString().split("T")[0]}.pdf`
      );
      doc.pipe(res);
    }

    addPDFHeader(
      doc,
      "Discrepancy Report",
      startDate && endDate
        ? `${formatDateShort(startDate)} to ${formatDateShort(endDate)}`
        : "All Time"
    );

    // Summary
    const resolved = discrepancies.filter((d) => d.status === "RESOLVED").length;
    const pending = discrepancies.filter((d) => d.status === "DISCREPANCY_REPORTED").length;

    addStatsBox(doc, [
      { label: "Total Discrepancies", value: discrepancies.length },
      {
        label: "Resolved",
        value: `${resolved} (${((resolved / (discrepancies.length || 1)) * 100).toFixed(1)}%)`,
        color: COLORS.success,
      },
      { label: "Pending", value: pending, color: COLORS.warning },
    ]);

    // Detailed Discrepancies
    checkPageBreak(doc, 200);
    addSectionHeader(doc, "Detailed Discrepancies");

    const tableData = {
      headers: ["Course", "From", "To", "Expected", "Received", "Diff", "Status"],
      rows: discrepancies.map((d) => [
        d.examSession.courseCode,
        `${d.fromHandler.firstName.charAt(0)}. ${d.fromHandler.lastName}`,
        `${d.toHandler.firstName.charAt(0)}. ${d.toHandler.lastName}`,
        d.examsExpected.toString(),
        (d.examsReceived || 0).toString(),
        (d.examsExpected - (d.examsReceived || 0)).toString(),
        d.status.replace(/_/g, " "),
      ]),
    };

    // @ts-ignore
    await doc.table(tableData, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
      prepareRow: () => doc.font("Helvetica").fontSize(7),
      width: CONTENT_WIDTH,
    });

    addPDFFooter(doc);
    doc.end();
  } catch (error) {
    console.error("Error generating discrepancy report PDF:", error);
    throw error;
  }
};

// ============================================================================
// ANALYTICS OVERVIEW EXCEL
// ============================================================================

export const generateAnalyticsOverviewExcel = async (
  startDate?: Date,
  endDate?: Date
): Promise<ExcelJS.Buffer> => {
  try {
    const examDateFilter =
      startDate && endDate ? { createdAt: { gte: startDate, lte: endDate } } : {};

    const transferDateFilter =
      startDate && endDate ? { requestedAt: { gte: startDate, lte: endDate } } : {};

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Exam Logistics System (ELMS)";
    workbook.created = new Date();

    // Overview Sheet
    const overviewSheet = workbook.addWorksheet("Overview");
    overviewSheet.columns = [
      { header: "Metric", key: "metric", width: 35 },
      { header: "Value", key: "value", width: 20 },
    ];

    overviewSheet.getRow(1).font = { bold: true };
    overviewSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1a56db" },
    };
    overviewSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    const totalSessions = await prisma.examSession.count({ where: examDateFilter });
    const activeTransfers = await prisma.batchTransfer.count({
      where: { ...transferDateFilter, status: { in: ["PENDING", "CONFIRMED"] } },
    });
    const completedTransfers = await prisma.batchTransfer.count({
      where: { ...transferDateFilter, status: "CONFIRMED" },
    });
    const totalDiscrepancies = await prisma.batchTransfer.count({
      where: { ...transferDateFilter, discrepancyNote: { not: null } },
    });

    const examStats = await prisma.examSession.findMany({
      where: examDateFilter,
      include: { attendances: true },
    });

    const totalExams = examStats.length;
    const completedExams = examStats.filter((e) => e.status === "COMPLETED").length;
    const completionRate = totalExams > 0 ? (completedExams / totalExams) * 100 : 0;

    const avgProcessingTime =
      examStats.length > 0
        ? examStats.reduce((acc, exam) => {
            if (exam.status === "COMPLETED" && exam.createdAt) {
              return acc + (exam.updatedAt.getTime() - exam.createdAt.getTime());
            }
            return acc;
          }, 0) /
          examStats.length /
          (1000 * 60 * 60 * 24)
        : 0;

    const totalStudents = examStats.reduce((acc, exam) => acc + exam.attendances.length, 0);
    const avgStudentsPerExam = totalExams > 0 ? totalStudents / totalExams : 0;

    overviewSheet.addRows([
      { metric: "Total Exam Sessions", value: totalSessions },
      { metric: "Active Transfers", value: activeTransfers },
      { metric: "Completed Transfers", value: completedTransfers },
      { metric: "Total Discrepancies", value: totalDiscrepancies },
      { metric: "Completed Exams", value: completedExams },
      { metric: "Exam Completion Rate (%)", value: completionRate.toFixed(1) },
      { metric: "Avg Processing Time (days)", value: avgProcessingTime.toFixed(1) },
      { metric: "Avg Students per Exam", value: avgStudentsPerExam.toFixed(1) },
      { metric: "Report Generated", value: new Date().toLocaleString() },
    ]);

     // Handler Performance Sheet
    const handlerSheet = workbook.addWorksheet("Handler Performance");
    handlerSheet.columns = [
      { header: "Handler Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Role", key: "role", width: 20 },
      { header: "Total Transfers", key: "total", width: 15 },
      { header: "Sent", key: "sent", width: 15 },
      { header: "Received", key: "received", width: 15 },
      { header: "In Custody", key: "custody", width: 15 },
      { header: "Avg Response (min)", key: "avgResponse", width: 20 },
      { header: "Discrepancies", key: "discrepancies", width: 15 },
      { header: "Discrepancy Rate (%)", key: "discrepancyRate", width: 20 },
    ];

    handlerSheet.getRow(1).font = { bold: true };
    handlerSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    handlerSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Get handlers
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
          where: transferDateFilter,
        },
        receivedBatches: {
          where: transferDateFilter,
        },
      },
    });

    for (const handler of handlers) {
      const sentTransfers = handler.handledBatches;
      const receivedTransfers = handler.receivedBatches;
      const totalTransfers = sentTransfers.length + receivedTransfers.length;

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
      const discrepancyRate =
        totalTransfers > 0 ? (discrepancies / totalTransfers) * 100 : 0;

      handlerSheet.addRow({
        name: `${handler.firstName} ${handler.lastName}`,
        email: handler.email,
        role: handler.role,
        total: totalTransfers,
        sent: sentTransfers.length,
        received: receivedTransfers.length,
        custody: sentTransfers.filter((t) => !t.confirmedAt).length,
        avgResponse: avgResponseTime.toFixed(2),
        discrepancies,
        discrepancyRate: discrepancyRate.toFixed(2),
      });
    }

    // Discrepancies Sheet
    const discrepanciesSheet = workbook.addWorksheet("Discrepancies");
    discrepanciesSheet.columns = [
      { header: "Transfer ID", key: "id", width: 30 },
      { header: "Course", key: "course", width: 25 },
      { header: "From Handler", key: "from", width: 25 },
      { header: "To Handler", key: "to", width: 25 },
      { header: "Expected", key: "expected", width: 15 },
      { header: "Received", key: "received", width: 15 },
      { header: "Difference", key: "difference", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Reported At", key: "reported", width: 18 },
      { header: "Note", key: "note", width: 40 },
    ];

    discrepanciesSheet.getRow(1).font = { bold: true };
    discrepanciesSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    discrepanciesSheet.getRow(1).font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

    const discrepancies = await prisma.batchTransfer.findMany({
      where: {
        ...transferDateFilter,
        discrepancyNote: { not: null },
      },
      include: {
        fromHandler: true,
        toHandler: true,
        examSession: true,
      },
      orderBy: { requestedAt: "desc" },
    });

    for (const transfer of discrepancies) {
      discrepanciesSheet.addRow({
        id: transfer.id,
        course: transfer.examSession.courseCode,
        from: `${transfer.fromHandler.firstName} ${transfer.fromHandler.lastName}`,
        to: `${transfer.toHandler.firstName} ${transfer.toHandler.lastName}`,
        expected: transfer.examsExpected,
        received: transfer.examsReceived || 0,
        difference: transfer.examsExpected - (transfer.examsReceived || 0),
        status: transfer.status,
        reported: transfer.requestedAt.toLocaleString(),
        note: transfer.discrepancyNote || "",
      });
    }

    // Exam Statistics Sheet
    const examSheet = workbook.addWorksheet("Exam Statistics");
    examSheet.columns = [
      { header: "Exam ID", key: "id", width: 30 },
      { header: "Course", key: "course", width: 25 },
      { header: "Department", key: "department", width: 20 },
      { header: "Faculty", key: "faculty", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Total Students", key: "students", width: 15 },
      { header: "Present", key: "present", width: 15 },
      { header: "Submitted", key: "submitted", width: 15 },
      { header: "Created", key: "created", width: 18 },
      { header: "Completed", key: "completed", width: 18 },
    ];

    examSheet.getRow(1).font = { bold: true };
    examSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    examSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    for (const exam of examStats) {
      const present = exam.attendances.filter(
        (a) => a.status !== "ABSENT"
      ).length;
      const submitted = exam.attendances.filter(
        (a) => a.status === "SUBMITTED"
      ).length;

      examSheet.addRow({
        id: exam.id,
        course: `${exam.courseCode} - ${exam.courseName}`,
        department: exam.department,
        faculty: exam.faculty,
        status: exam.status,
        students: exam.attendances.length,
        present,
        submitted,
        created: exam.createdAt.toLocaleString(),
        completed:
          exam.status === "COMPLETED" ? exam.updatedAt.toLocaleString() : "",
      });
    }

    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error generating analytics overview Excel:", error);
    throw error;
  }
};

// ============================================================================
// INCIDENT REPORT PDF
// ============================================================================

export const generateIncidentReportPDF = async (incidentId: string, res: Response) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        reporter: true,
        assignee: true,
        student: true,
        examSession: { include: { createdBy: true } },
        attendance: { include: { student: true, examSession: true } },
        transfer: {
          include: { fromHandler: true, toHandler: true, examSession: true },
        },
        attachments: { orderBy: { uploadedAt: "asc" } },
        comments: {
          include: { user: true },
          where: { isInternal: false },
          orderBy: { createdAt: "asc" },
        },
        statusHistory: {
          include: { user: true },
          orderBy: { changedAt: "asc" },
        },
      },
    });

    if (!incident) {
      throw new Error("Incident not found");
    }

    const doc = new PDFDocument({ margin: MARGIN, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=incident-${incident.incidentNumber}.pdf`
    );

    doc.pipe(res);

    // Header
    addPDFHeader(doc, "INCIDENT REPORT", `#${incident.incidentNumber}`);

    // Confidential Banner
    if (incident.isConfidential) {
      doc
        .rect(MARGIN, doc.y, CONTENT_WIDTH, 25)
        .fillAndStroke(COLORS.danger, COLORS.danger);

      doc
        .fillColor("#FFFFFF")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("⚠ CONFIDENTIAL - RESTRICTED ACCESS", MARGIN, doc.y - 18, {
          align: "center",
          width: CONTENT_WIDTH,
        });

      doc.y += 10;
      doc.fillColor(COLORS.text);
    }

    // Incident Overview
    const severityColor =
      incident.severity === "CRITICAL"
        ? COLORS.danger
        : incident.severity === "HIGH"
        ? COLORS.warning
        : incident.severity === "MEDIUM"
        ? "#ca8a04"
        : COLORS.success;

    addInfoBox(doc, [
      { label: "Type", value: incident.type.replace(/_/g, " ") },
      { label: "Severity", value: incident.severity },
      { label: "Status", value: incident.status.replace(/_/g, " ") },
      { label: "Reported", value: formatDate(incident.reportedAt) },
      {
        label: "Reporter",
        value: `${incident.reporter.firstName} ${incident.reporter.lastName}`,
      },
      {
        label: "Assigned To",
        value: incident.assignee
          ? `${incident.assignee.firstName} ${incident.assignee.lastName}`
          : "Unassigned",
      },
      { label: "Location", value: incident.location || "N/A" },
      {
        label: "Resolved",
        value: incident.resolvedAt ? formatDate(incident.resolvedAt) : "Not resolved",
      },
    ]);

    // Title Section
    addSectionHeader(doc, "Incident Title");
    doc.fontSize(11).font("Helvetica").text(incident.title, { align: "justify" });
    doc.moveDown(1);

    // Description Section
    addSectionHeader(doc, "Description");
    doc.fontSize(10).font("Helvetica").text(incident.description, { align: "justify" });
    doc.moveDown(1);

    // Resolution Section
    if (incident.resolutionNotes) {
      checkPageBreak(doc, 100);
      const resBoxY = doc.y;

      doc
        .rect(MARGIN, resBoxY, CONTENT_WIDTH, 80)
        .fillAndStroke("#dcfce7", "#86efac");

      doc
        .fillColor(COLORS.success)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("✓ RESOLUTION", MARGIN + 10, resBoxY + 10);

      doc
        .fillColor(COLORS.text)
        .fontSize(10)
        .font("Helvetica")
        .text(incident.resolutionNotes, MARGIN + 10, resBoxY + 30, {
          width: CONTENT_WIDTH - 20,
          align: "justify",
        });

      doc.y = resBoxY + 90;
    }

    // Related Information
    if (incident.student || incident.examSession || incident.attendance || incident.transfer) {
      doc.addPage();
      addSectionHeader(doc, "Related Information");

      if (incident.student) {
        addInfoBox(doc, [
          {
            label: "Student Name",
            value: `${incident.student.firstName} ${incident.student.lastName}`,
          },
          { label: "Index Number", value: incident.student.indexNumber },
          { label: "Program", value: incident.student.program },
          { label: "Level", value: incident.student.level.toString() },
        ]);
      }

      if (incident.examSession) {
        addSectionHeader(doc, "Exam Session");
        addInfoBox(doc, [
          {
            label: "Course",
            value: `${incident.examSession.courseCode} - ${incident.examSession.courseName}`,
          },
          { label: "Batch QR Code", value: incident.examSession.batchQrCode },
          { label: "Date", value: formatDate(incident.examSession.examDate) },
          { label: "Venue", value: incident.examSession.venue },
          { label: "Department", value: incident.examSession.department },
          { label: "Faculty", value: incident.examSession.faculty },
        ]);
      }

      if (incident.attendance) {
        addSectionHeader(doc, "Attendance Record");
        addInfoBox(doc, [
          {
            label: "Student",
            value: `${incident.attendance.student.firstName} ${incident.attendance.student.lastName}`,
          },
          { label: "Status", value: incident.attendance.status },
          {
            label: "Entry Time",
            value: incident.attendance.entryTime
              ? formatDate(incident.attendance.entryTime)
              : "N/A",
          },
          {
            label: "Exit Time",
            value: incident.attendance.exitTime ? formatDate(incident.attendance.exitTime) : "N/A",
          },
        ]);
      }

      if (incident.transfer) {
        addSectionHeader(doc, "Batch Transfer");
        addInfoBox(doc, [
          {
            label: "From",
            value: `${incident.transfer.fromHandler.firstName} ${incident.transfer.fromHandler.lastName}`,
          },
          {
            label: "To",
            value: `${incident.transfer.toHandler.firstName} ${incident.transfer.toHandler.lastName}`,
          },
          { label: "Scripts Expected", value: incident.transfer.examsExpected.toString() },
          {
            label: "Scripts Received",
            value: incident.transfer.examsReceived?.toString() || "Pending",
          },
          { label: "Status", value: incident.transfer.status },
        ]);
      }
    }

    // Status Timeline
    if (incident.statusHistory.length > 0) {
      checkPageBreak(doc, 200);
      addSectionHeader(doc, "Status Timeline");

      const timelineData = {
        headers: ["Date/Time", "Status", "Changed By", "Notes"],
        rows: incident.statusHistory.map((history) => [
          formatDate(history.changedAt),
          history.toStatus.replace(/_/g, " "),
          `${history.user.firstName} ${history.user.lastName}`,
          history.reason || "-",
        ]),
      };

      // @ts-ignore
      await doc.table(timelineData, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9),
        prepareRow: () => doc.font("Helvetica").fontSize(8),
        width: CONTENT_WIDTH,
      });
    }

    // Comments
    if (incident.comments.length > 0) {
      checkPageBreak(doc, 150);
      addSectionHeader(doc, "Comments & Discussion");

      incident.comments.forEach((comment, index) => {
        const commentY = doc.y;

        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .text(
            `${comment.user.firstName} ${comment.user.lastName} - ${formatDate(comment.createdAt)}`
          );

        doc.fontSize(9).font("Helvetica").text(comment.comment, { indent: 20 });

        if (index < incident.comments.length - 1) {
          doc.moveDown(0.5);
          doc
            .strokeColor(COLORS.border)
            .lineWidth(0.5)
            .moveTo(MARGIN, doc.y)
            .lineTo(MARGIN + CONTENT_WIDTH, doc.y)
            .stroke();
          doc.moveDown(0.5);
        }

        checkPageBreak(doc, 50);
      });
    }

    // Attachments
    if (incident.attachments.length > 0) {
      checkPageBreak(doc, 100);
      addSectionHeader(doc, "Attachments");

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(COLORS.textLight)
        .text(`Total Attachments: ${incident.attachments.length}`);
      doc.moveDown(0.5);
      doc.fillColor(COLORS.text);

      const baseUrl = process.env.BASE_URL || "http://localhost:5000";

      incident.attachments.forEach((attachment, index) => {
        checkPageBreak(doc, 60);
        const attachmentY = doc.y;

        doc.rect(MARGIN, attachmentY, CONTENT_WIDTH, 50).fillAndStroke(COLORS.lightBg, COLORS.border);

        let icon = "📄";
        if (attachment.fileType.startsWith("image/")) icon = "🖼️";
        else if (attachment.fileType.startsWith("video/")) icon = "🎥";
        else if (attachment.fileType.includes("pdf")) icon = "📋";

        doc.fillColor(COLORS.text).fontSize(10).font("Helvetica").text(icon, MARGIN + 10, attachmentY + 10);

        doc.text(attachment.fileName, MARGIN + 30, attachmentY + 10, { width: 300 });

        doc
          .fontSize(8)
          .fillColor(COLORS.textLight)
          .text(
            `${attachment.fileType} • ${(attachment.fileSize / 1024).toFixed(1)} KB • ${formatDate(attachment.uploadedAt)}`,
            MARGIN + 30,
            attachmentY + 28
          );

        const fileUrl = `${baseUrl}/${attachment.filePath}`;
        doc
          .fillColor(COLORS.primary)
          .fontSize(8)
          .font("Helvetica")
          .text("View File", MARGIN + 380, attachmentY + 28, {
            link: fileUrl,
            underline: true,
          });

        doc.y = attachmentY + 60;
      });
    }

    // Footer
    addPDFFooter(doc);

    if (incident.isConfidential) {
      doc
        .fillColor(COLORS.danger)
        .fontSize(8)
        .text("CONFIDENTIAL - Handle with appropriate discretion", {
          align: "center",
        });
    }

    doc.end();
  } catch (error) {
    console.error("Error generating incident report PDF:", error);
    throw error;
  }
};

// ============================================================================
// INCIDENT REPORT PDF BUFFER (for bulk export)
// ============================================================================

export const generateIncidentReportPDFBuffer = async (
  incidentId: string
): Promise<{ buffer: Buffer; filename: string }> => {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      reporter: true,
      assignee: true,
      student: true,
      examSession: { include: { createdBy: true } },
      attachments: { orderBy: { uploadedAt: "asc" } },
      comments: {
        include: { user: true },
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
      },
      statusHistory: {
        include: { user: true },
        orderBy: { changedAt: "asc" },
      },
    },
  });

  if (!incident) {
    throw new Error("Incident not found");
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: MARGIN, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const filename = `incident-${incident.incidentNumber}.pdf`;
        resolve({ buffer, filename });
      });
      doc.on("error", reject);

      // Simplified version for buffer (reuse same structure)
      addPDFHeader(doc, "INCIDENT REPORT", `#${incident.incidentNumber}`);

      doc.fontSize(10).font("Helvetica");
      doc.text(`Type: ${incident.type.replace(/_/g, " ")}`);
      doc.text(`Severity: ${incident.severity}`);
      doc.text(`Status: ${incident.status.replace(/_/g, " ")}`);
      doc.text(`Reported: ${formatDate(incident.reportedAt)}`);
      doc.moveDown(1);

      addSectionHeader(doc, "Title");
      doc.fontSize(11).font("Helvetica").text(incident.title);
      doc.moveDown(1);

      addSectionHeader(doc, "Description");
      doc.fontSize(10).font("Helvetica").text(incident.description);

      if (incident.resolutionNotes) {
        doc.moveDown(1);
        addSectionHeader(doc, "Resolution");
        doc.fontSize(10).font("Helvetica").text(incident.resolutionNotes);
      }

      addPDFFooter(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// ============================================================================
// INCIDENT SUMMARY EXCEL
// ============================================================================

export const generateIncidentSummaryExcel = async (filters: {
  type?: string;
  severity?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  assignedToId?: string;
  isConfidential?: boolean;
}) => {
  try {
    const workbook = new ExcelJS.Workbook();

    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.severity) where.severity = filters.severity;
    if (filters.status) where.status = filters.status;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.isConfidential !== undefined) where.isConfidential = filters.isConfidential;
    if (filters.startDate || filters.endDate) {
      where.reportedAt = {};
      if (filters.startDate) where.reportedAt.gte = filters.startDate;
      if (filters.endDate) where.reportedAt.lte = filters.endDate;
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        reporter: true,
        assignee: true,
        student: true,
        examSession: true,
      },
      orderBy: { reportedAt: "desc" },
    });

    // Incidents List Sheet
    const incidentsSheet = workbook.addWorksheet("Incidents");

    incidentsSheet.columns = [
      { header: "Incident #", key: "incidentNumber", width: 20 },
      { header: "Type", key: "type", width: 20 },
      { header: "Severity", key: "severity", width: 12 },
      { header: "Status", key: "status", width: 15 },
      { header: "Description", key: "description", width: 40 },
      { header: "Reporter", key: "reporter", width: 25 },
      { header: "Assigned To", key: "assignedTo", width: 25 },
      { header: "Student", key: "student", width: 25 },
      { header: "Exam Session", key: "examSession", width: 25 },
      { header: "Reported At", key: "reportedAt", width: 18 },
      { header: "Resolved At", key: "resolvedAt", width: 18 },
      { header: "Confidential", key: "confidential", width: 12 },
    ];

    incidentsSheet.getRow(1).font = { bold: true };
    incidentsSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1a56db" },
    };
    incidentsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    incidentsSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    incidents.forEach((incident) => {
      const row = incidentsSheet.addRow({
        incidentNumber: incident.incidentNumber,
        type: incident.type.replace(/_/g, " "),
        severity: incident.severity,
        status: incident.status.replace(/_/g, " "),
        description: incident.description,
        reporter: `${incident.reporter.firstName} ${incident.reporter.lastName}`,
        assignedTo: incident.assignee
          ? `${incident.assignee.firstName} ${incident.assignee.lastName}`
          : "Unassigned",
        student: incident.student
          ? `${incident.student.firstName} ${incident.student.lastName} (${incident.student.indexNumber})`
          : "-",
        examSession: incident.examSession
          ? `${incident.examSession.courseCode} - ${incident.examSession.batchQrCode}`
          : "-",
        reportedAt: formatDate(incident.reportedAt),
        resolvedAt: incident.resolvedAt ? formatDate(incident.resolvedAt) : "-",
        confidential: incident.isConfidential ? "Yes" : "No",
      });

      // Conditional formatting
      if (incident.severity === "CRITICAL") {
        row.getCell("severity").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF0000" },
        };
        row.getCell("severity").font = { color: { argb: "FFFFFFFF" } };
      } else if (incident.severity === "HIGH") {
        row.getCell("severity").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF9900" },
        };
      }

      if (incident.isConfidential) {
        row.eachCell((cell) => {
          cell.font = { ...cell.font, italic: true };
        });
      }
    });

    // Statistics Sheet
    const statsSheet = workbook.addWorksheet("Statistics");
    statsSheet.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 15 },
    ];

    statsSheet.getRow(1).font = { bold: true };
    statsSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1a56db" },
    };
    statsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    const totalIncidents = incidents.length;
    const byType = incidents.reduce((acc, inc) => {
      acc[inc.type] = (acc[inc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = incidents.reduce((acc, inc) => {
      acc[inc.severity] = (acc[inc.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = incidents.reduce((acc, inc) => {
      acc[inc.status] = (acc[inc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    statsSheet.addRow({ metric: "Total Incidents", value: totalIncidents });
    statsSheet.addRow({ metric: "", value: "" });

    statsSheet.addRow({ metric: "By Type:", value: "" });
    Object.entries(byType).forEach(([type, count]) => {
      statsSheet.addRow({ metric: `  ${type.replace(/_/g, " ")}`, value: count });
    });

    statsSheet.addRow({ metric: "", value: "" });
    statsSheet.addRow({ metric: "By Severity:", value: "" });
    Object.entries(bySeverity).forEach(([severity, count]) => {
      statsSheet.addRow({ metric: `  ${severity}`, value: count });
    });

    statsSheet.addRow({ metric: "", value: "" });
    statsSheet.addRow({ metric: "By Status:", value: "" });
    Object.entries(byStatus).forEach(([status, count]) => {
      statsSheet.addRow({ metric: `  ${status.replace(/_/g, " ")}`, value: count });
    });

    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error generating incident summary Excel:", error);
    throw error;
  }
};