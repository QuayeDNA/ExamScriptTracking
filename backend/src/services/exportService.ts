import PDFDocument from "pdfkit";
import "pdfkit-table";
import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";
import { Response } from "express";
import { exportData, ExportData } from "../utils/exportUtils";

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
        d.examsExpected.toString(),
        (d.examsReceived || 0).toString(),
        (d.examsExpected - (d.examsReceived || 0)).toString(),
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
    const examDateFilter =
      startDate && endDate
        ? {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    const transferDateFilter =
      startDate && endDate
        ? {
            requestedAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Exam Logistics System (ELMS)";
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
    overviewSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Get basic metrics
    const totalSessions = await prisma.examSession.count({
      where: examDateFilter,
    });
    const activeTransfers = await prisma.batchTransfer.count({
      where: {
        ...transferDateFilter,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    const completedTransfers = await prisma.batchTransfer.count({
      where: {
        ...transferDateFilter,
        status: "CONFIRMED",
      },
    });
    const totalDiscrepancies = await prisma.batchTransfer.count({
      where: {
        ...transferDateFilter,
        discrepancyNote: { not: null },
      },
    });

    // Get exam stats
    const examStats = await prisma.examSession.findMany({
      where: examDateFilter,
      include: {
        attendances: true,
      },
    });

    const totalExams = examStats.length;
    const completedExams = examStats.filter(
      (e) => e.status === "COMPLETED"
    ).length;
    const completionRate =
      totalExams > 0 ? (completedExams / totalExams) * 100 : 0;

    const avgProcessingTime =
      examStats.length > 0
        ? examStats.reduce((acc, exam) => {
            if (exam.status === "COMPLETED" && exam.createdAt) {
              return (
                acc + (exam.updatedAt.getTime() - exam.createdAt.getTime())
              );
            }
            return acc;
          }, 0) /
          examStats.length /
          (1000 * 60 * 60 * 24) // days
        : 0;

    const totalStudents = examStats.reduce(
      (acc, exam) => acc + exam.attendances.length,
      0
    );
    const avgStudentsPerExam = totalExams > 0 ? totalStudents / totalExams : 0;

    overviewSheet.addRows([
      { metric: "Total Exam Sessions", value: totalSessions },
      { metric: "Active Transfers", value: activeTransfers },
      { metric: "Completed Transfers", value: completedTransfers },
      { metric: "Total Discrepancies", value: totalDiscrepancies },
      { metric: "Completed Exams", value: completedExams },
      { metric: "Exam Completion Rate (%)", value: completionRate.toFixed(1) },
      {
        metric: "Avg Processing Time (days)",
        value: avgProcessingTime.toFixed(1),
      },
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

/**
 * Generate Incident Report PDF
 * Shows incident details, timeline, comments, and attachments
 */
export const generateIncidentReportPDF = async (
  incidentId: string,
  res: Response
) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        reporter: true,
        assignee: true,
        student: true,
        examSession: {
          include: {
            createdBy: true,
          },
        },
        attendance: {
          include: {
            student: true,
            examSession: true,
          },
        },
        transfer: {
          include: {
            fromHandler: true,
            toHandler: true,
            examSession: true,
          },
        },
        attachments: {
          orderBy: { uploadedAt: "asc" },
        },
        comments: {
          include: {
            user: true,
          },
          orderBy: { createdAt: "asc" },
        },
        statusHistory: {
          include: {
            user: true,
          },
          orderBy: { changedAt: "asc" },
        },
      },
    });

    if (!incident) {
      throw new Error("Incident not found");
    }

    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=incident-${incident.incidentNumber}.pdf`
    );

    doc.pipe(res);

    // Header
    addPDFHeader(
      doc,
      "Incident Report",
      `Incident #${incident.incidentNumber}`
    );

    // Incident Overview
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Incident Details", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    doc.text(`Type: ${incident.type.replace(/_/g, " ")}`);
    doc.text(`Severity: ${incident.severity}`);
    doc.text(`Status: ${incident.status.replace(/_/g, " ")}`);
    if (incident.isConfidential) {
      doc
        .fillColor("red")
        .text("⚠ CONFIDENTIAL", { continued: false })
        .fillColor("black");
    }
    doc.text(`Reported: ${formatDate(incident.reportedAt)}`);
    doc.text(
      `Reporter: ${incident.reporter.firstName} ${incident.reporter.lastName} (${incident.reporter.email})`
    );
    if (incident.assignee) {
      doc.text(
        `Assigned To: ${incident.assignee.firstName} ${incident.assignee.lastName}`
      );
    }
    if (incident.resolvedAt) {
      doc.text(`Resolved: ${formatDate(incident.resolvedAt)}`);
    }
    doc.moveDown(1);

    // Description
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Description", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(incident.description, { align: "justify" });
    doc.moveDown(1);

    // Resolution (if available)
    if (incident.resolutionNotes) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Resolution", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      doc.text(incident.resolutionNotes, { align: "justify" });
      doc.moveDown(1);
    }

    // Related Context
    if (
      incident.student ||
      incident.examSession ||
      incident.attendance ||
      incident.transfer
    ) {
      doc.addPage();
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Related Information", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");

      if (incident.student) {
        doc.text("Student Information:");
        doc.text(
          `  Name: ${incident.student.firstName} ${incident.student.lastName}`
        );
        doc.text(`  Index Number: ${incident.student.indexNumber}`);
        doc.text(`  Program: ${incident.student.program}`);
        doc.text(`  Level: ${incident.student.level}`);
        doc.moveDown(0.5);
      }

      if (incident.examSession) {
        doc.text("Exam Session:");
        doc.text(
          `  Course: ${incident.examSession.courseCode} - ${incident.examSession.courseName}`
        );
        doc.text(`  Batch: ${incident.examSession.batchQrCode}`);
        doc.text(`  Date: ${formatDate(incident.examSession.examDate)}`);
        doc.text(`  Venue: ${incident.examSession.venue}`);
        doc.moveDown(0.5);
      }

      if (incident.attendance) {
        doc.text("Attendance Record:");
        doc.text(
          `  Student: ${incident.attendance.student.firstName} ${incident.attendance.student.lastName}`
        );
        doc.text(`  Status: ${incident.attendance.status}`);
        if (incident.attendance.entryTime) {
          doc.text(`  Entry: ${formatDate(incident.attendance.entryTime)}`);
        }
        if (incident.attendance.exitTime) {
          doc.text(`  Exit: ${formatDate(incident.attendance.exitTime)}`);
        }
        doc.moveDown(0.5);
      }

      if (incident.transfer) {
        doc.text("Batch Transfer:");
        doc.text(
          `  From: ${incident.transfer.fromHandler.firstName} ${incident.transfer.fromHandler.lastName}`
        );
        doc.text(
          `  To: ${incident.transfer.toHandler.firstName} ${incident.transfer.toHandler.lastName}`
        );
        doc.text(`  Scripts Expected: ${incident.transfer.examsExpected}`);
        doc.text(
          `  Scripts Received: ${incident.transfer.examsReceived || "Pending"}`
        );
        doc.text(`  Status: ${incident.transfer.status}`);
        doc.moveDown(0.5);
      }

      doc.moveDown(1);
    }

    // Status Timeline
    if (incident.statusHistory.length > 0) {
      doc.addPage();
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Status Timeline", { underline: true });
      doc.moveDown(1);

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
        width: 500,
      });

      doc.moveDown(1);
    }

    // Comments
    if (incident.comments.length > 0) {
      doc.addPage();
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Comments & Discussion", { underline: true });
      doc.moveDown(1);

      incident.comments.forEach((comment, index) => {
        doc.fontSize(9).font("Helvetica-Bold");
        doc.text(
          `${comment.user.firstName} ${comment.user.lastName} - ${formatDate(
            comment.createdAt
          )}`
        );
        doc.fontSize(9).font("Helvetica");
        doc.text(comment.comment, { indent: 20 });

        if (index < incident.comments.length - 1) {
          doc.moveDown(0.5);
          doc
            .strokeColor("#cccccc")
            .lineWidth(0.5)
            .moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .stroke();
          doc.moveDown(0.5);
        }
      });

      doc.moveDown(1);
    }

    // Attachments
    if (incident.attachments.length > 0) {
      doc.addPage();
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Attachments", { underline: true });
      doc.moveDown(1);

      const attachmentData = {
        headers: ["Filename", "Type", "Size", "Uploaded"],
        rows: incident.attachments.map((attachment) => [
          attachment.fileName,
          attachment.fileType,
          `${(attachment.fileSize / 1024).toFixed(1)} KB`,
          formatDate(attachment.uploadedAt),
        ]),
      };

      // @ts-ignore
      await doc.table(attachmentData, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9),
        prepareRow: () => doc.font("Helvetica").fontSize(8),
      });

      doc.moveDown(0.5);
      doc
        .fontSize(8)
        .font("Helvetica-Oblique")
        .text(
          "Note: Attachments can be downloaded separately from the incident management system."
        );
    }

    // Footer
    doc
      .moveDown(2)
      .fontSize(8)
      .font("Helvetica-Oblique")
      .text(
        "This is a computer-generated document. No signature is required.",
        { align: "center" }
      );

    if (incident.isConfidential) {
      doc
        .fillColor("red")
        .text("CONFIDENTIAL - Handle with appropriate discretion", {
          align: "center",
        })
        .fillColor("black");
    }

    doc.end();
  } catch (error) {
    console.error("Error generating incident report PDF:", error);
    throw error;
  }
};

/**
 * Generate Incident Summary Excel
 * Shows filtered list of incidents with statistics
 */
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

    // Build query filter
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.severity) where.severity = filters.severity;
    if (filters.status) where.status = filters.status;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.isConfidential !== undefined)
      where.isConfidential = filters.isConfidential;
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

    // Style header
    incidentsSheet.getRow(1).font = { bold: true };
    incidentsSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    incidentsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Add data
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

      // Color code by severity
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
      } else if (incident.severity === "MEDIUM") {
        row.getCell("severity").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFF00" },
        };
      }

      // Mark confidential rows
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
      fgColor: { argb: "FF4472C4" },
    };
    statsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Calculate statistics
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

    const resolvedCount = incidents.filter(
      (i) => i.status === "RESOLVED"
    ).length;
    const avgResolutionTime =
      resolvedCount > 0
        ? incidents
            .filter((i) => i.resolvedAt)
            .reduce((acc, i) => {
              const duration =
                new Date(i.resolvedAt!).getTime() -
                new Date(i.reportedAt).getTime();
              return acc + duration;
            }, 0) /
          resolvedCount /
          (1000 * 60 * 60)
        : 0;

    // Add statistics
    statsSheet.addRow({ metric: "Total Incidents", value: totalIncidents });
    statsSheet.addRow({ metric: "", value: "" }); // Spacer

    statsSheet.addRow({ metric: "By Type:", value: "" });
    Object.entries(byType).forEach(([type, count]) => {
      statsSheet.addRow({
        metric: `  ${type.replace(/_/g, " ")}`,
        value: count,
      });
    });
    statsSheet.addRow({ metric: "", value: "" }); // Spacer

    statsSheet.addRow({ metric: "By Severity:", value: "" });
    Object.entries(bySeverity).forEach(([severity, count]) => {
      statsSheet.addRow({ metric: `  ${severity}`, value: count });
    });
    statsSheet.addRow({ metric: "", value: "" }); // Spacer

    statsSheet.addRow({ metric: "By Status:", value: "" });
    Object.entries(byStatus).forEach(([status, count]) => {
      statsSheet.addRow({
        metric: `  ${status.replace(/_/g, " ")}`,
        value: count,
      });
    });
    statsSheet.addRow({ metric: "", value: "" }); // Spacer

    statsSheet.addRow({ metric: "Resolved Incidents", value: resolvedCount });
    statsSheet.addRow({
      metric: "Avg Resolution Time (hours)",
      value: avgResolutionTime.toFixed(1),
    });
    statsSheet.addRow({
      metric: "Report Generated",
      value: new Date().toLocaleString(),
    });

    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error generating incident summary Excel:", error);
    throw error;
  }
};
