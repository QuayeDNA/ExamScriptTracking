import { Request, Response } from "express";
import {
  generateBatchManifestPDF,
  generateAttendanceReportPDF,
  generateHandlerPerformanceExcel,
  generateDiscrepancyReportPDF,
  generateAnalyticsOverviewExcel,
} from "../services/exportService";

/**
 * Export batch manifest as PDF
 * GET /api/reports/export/batch-manifest/:id
 */
export const exportBatchManifest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await generateBatchManifestPDF(id, res);
  } catch (error) {
    console.error("Error exporting batch manifest:", error);
    res.status(500).json({ error: "Failed to generate batch manifest" });
  }
};

/**
 * Export attendance report as PDF
 * GET /api/reports/export/attendance/:id
 */
export const exportAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await generateAttendanceReportPDF(id, res);
  } catch (error) {
    console.error("Error exporting attendance report:", error);
    res.status(500).json({ error: "Failed to generate attendance report" });
  }
};

/**
 * Export handler performance as Excel
 * GET /api/reports/export/handler-performance
 * Query params: startDate, endDate (optional)
 */
export const exportHandlerPerformance = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const buffer = await generateHandlerPerformanceExcel(start, end);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=handler-performance-${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    console.error("Error exporting handler performance:", error);
    res
      .status(500)
      .json({ error: "Failed to generate handler performance report" });
  }
};

/**
 * Export discrepancy report as PDF
 * GET /api/reports/export/discrepancies
 * Query params: startDate, endDate (optional)
 */
export const exportDiscrepancyReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    await generateDiscrepancyReportPDF(start, end, res);
  } catch (error) {
    console.error("Error exporting discrepancy report:", error);
    res.status(500).json({ error: "Failed to generate discrepancy report" });
  }
};

/**
 * Export analytics overview as Excel
 * GET /api/reports/export/analytics-overview
 * Query params: startDate, endDate (optional)
 */
export const exportAnalyticsOverview = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const buffer = await generateAnalyticsOverviewExcel(start, end);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=analytics-overview-${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    console.error("Error exporting analytics overview:", error);
    res.status(500).json({ error: "Failed to generate analytics overview" });
  }
};
