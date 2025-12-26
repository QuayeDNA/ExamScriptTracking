import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
} from "docx";
import * as QRCode from "qrcode";
import axios from "axios";

export interface ExportData {
  headers: string[];
  rows: (string | number | Date)[][];
  title?: string;
  subtitle?: string;
}

export interface StudentExportData {
  students: Array<{
    id: string;
    indexNumber: string;
    firstName: string;
    lastName: string;
    program: string;
    level: number;
    profilePicture: string;
    qrCode: string;
    createdAt: string;
  }>;
  title?: string;
  subtitle?: string;
  program?: string;
  level?: number;
}

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  orientation?: "portrait" | "landscape";
}

/**
 * Base exporter class
 */
export abstract class BaseExporter {
  protected data: ExportData;
  protected options: ExportOptions;

  constructor(data: ExportData, options: ExportOptions = {}) {
    this.data = data;
    this.options = options;
  }

  abstract generate(): Promise<Buffer>;
}

/**
 * Excel Exporter
 */
export class ExcelExporter extends BaseExporter {
  async generate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.options.sheetName || "Sheet1");

    // Add title if provided
    if (this.data.title) {
      const titleRow = worksheet.addRow([this.data.title]);
      titleRow.font = { size: 16, bold: true };
      worksheet.mergeCells(1, 1, 1, this.data.headers.length);
      worksheet.addRow([]); // Empty row
    }

    // Add subtitle if provided
    if (this.data.subtitle) {
      const subtitleRow = worksheet.addRow([this.data.subtitle]);
      subtitleRow.font = { size: 12, italic: true };
      worksheet.mergeCells(
        this.data.title ? 3 : 1,
        1,
        this.data.title ? 3 : 1,
        this.data.headers.length
      );
      worksheet.addRow([]); // Empty row
    }

    // Add headers
    const headerRow = worksheet.addRow(this.data.headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6FA" },
    };

    // Add data rows
    this.data.rows.forEach((row) => {
      worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (!column || !column.eachCell) return; // Early return for undefined columns or missing eachCell method

      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(maxLength + 2, 50); // Max width 50
    });

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }
}

/**
 * PDF Exporter
 */
export class PDFExporter extends BaseExporter {
  async generate(): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({
        size: "A4",
        layout: this.options.orientation || "portrait",
        margin: 50,
      });

      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Add title
      if (this.data.title) {
        doc
          .fontSize(20)
          .font("Helvetica-Bold")
          .text(this.data.title, { align: "center" });
        doc.moveDown(0.5);
      }

      // Add subtitle
      if (this.data.subtitle) {
        doc
          .fontSize(12)
          .font("Helvetica")
          .text(this.data.subtitle, { align: "center" });
        doc.moveDown(1);
      }

      // Add generation date
      doc
        .fontSize(10)
        .text(`Generated: ${new Date().toLocaleString()}`, { align: "right" });
      doc.moveDown(1);

      // Create table data
      const tableData = [this.data.headers, ...this.data.rows];

      // Simple table implementation
      const tableTop = doc.y;
      const colWidth = (doc.page.width - 100) / this.data.headers.length;

      // Draw headers
      doc.font("Helvetica-Bold").fontSize(10);
      tableData[0].forEach((header, i) => {
        doc.text(header.toString(), 50 + i * colWidth, tableTop, {
          width: colWidth,
          align: "left",
        });
      });

      // Draw header underline
      doc
        .moveTo(50, doc.y + 5)
        .lineTo(doc.page.width - 50, doc.y + 5)
        .stroke();

      // Draw rows
      doc.font("Helvetica").fontSize(9);
      tableData.slice(1).forEach((row, rowIndex) => {
        const y = tableTop + 25 + rowIndex * 15;
        if (y > doc.page.height - 50) {
          doc.addPage();
        }
        row.forEach((cell, colIndex) => {
          doc.text(cell.toString(), 50 + colIndex * colWidth, y, {
            width: colWidth,
            align: "left",
          });
        });
      });

      doc.end();
    });
  }
}

/**
 * Student PDF Exporter with images and QR codes
 */
export class StudentPDFExporter {
  private data: StudentExportData;

  constructor(data: StudentExportData) {
    this.data = data;
  }

  async generate(): Promise<Buffer> {
    console.log(
      `Starting PDF generation for ${this.data.students.length} students`
    );
    return new Promise(async (resolve) => {
      const doc = new PDFDocument({
        size: "A4",
        layout: "portrait",
        margin: 50,
      });

      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Add title
      if (this.data.title) {
        doc
          .fontSize(24)
          .font("Helvetica-Bold")
          .text(this.data.title, { align: "center" });
        doc.moveDown(0.5);
      }

      // Add subtitle
      if (this.data.subtitle) {
        doc
          .fontSize(14)
          .font("Helvetica")
          .text(this.data.subtitle, { align: "center" });
        doc.moveDown(1);
      }

      // Add filter info
      if (this.data.program || this.data.level) {
        const filterText = [];
        if (this.data.program) filterText.push(`Program: ${this.data.program}`);
        if (this.data.level) filterText.push(`Level: ${this.data.level}`);
        doc
          .fontSize(10)
          .text(`Filtered by: ${filterText.join(", ")}`, { align: "center" });
        doc.moveDown(0.5);
      }

      // Add generation date
      doc
        .fontSize(10)
        .text(`Generated: ${new Date().toLocaleString()}`, { align: "right" });
      doc.moveDown(1);

      // Process students in groups of 3 per page
      const studentsPerPage = 3;
      let currentY = doc.y;

      for (let i = 0; i < this.data.students.length; i++) {
        const student = this.data.students[i];

        // Check if we need a new page
        if (i > 0 && i % studentsPerPage === 0) {
          doc.addPage();
          currentY = 50;
        }

        // Calculate positions for this student row
        const rowHeight = 120;
        const imageSize = 80;
        const qrSize = 80;
        const margin = 20;

        // Left: Profile Image
        const imageX = 50;
        const imageY = currentY;

        try {
          // Load and add profile image
          console.log(
            `Fetching image for ${student.firstName} ${student.lastName}: ${student.profilePicture}`
          );
          const imageResponse = await axios.get(student.profilePicture, {
            responseType: "arraybuffer",
            timeout: 5000,
          });
          const imageBuffer = Buffer.from(imageResponse.data);

          doc.image(imageBuffer, imageX, imageY, {
            width: imageSize,
            height: imageSize,
            fit: [imageSize, imageSize],
          });
          console.log(
            `Successfully added image for ${student.firstName} ${student.lastName}`
          );
        } catch (error) {
          console.log(
            `Failed to load image for ${student.firstName} ${student.lastName}:`,
            error instanceof Error ? error.message : String(error)
          );
          // Fallback: draw a placeholder
          doc.rect(imageX, imageY, imageSize, imageSize).stroke();
          doc.fontSize(8).text("No Image", imageX + 5, imageY + 30);
        }

        // Middle: Student Info
        const infoX = imageX + imageSize + margin;
        const infoWidth = doc.page.width - infoX - qrSize - margin * 2;

        doc.font("Helvetica-Bold").fontSize(12);
        doc.text(`${student.firstName} ${student.lastName}`, infoX, imageY);

        doc.font("Helvetica").fontSize(10);
        doc.text(`Index: ${student.indexNumber}`, infoX, doc.y + 5);
        doc.text(`Program: ${student.program}`, infoX, doc.y + 5);
        doc.text(`Level: ${student.level}`, infoX, doc.y + 5);

        // Right: QR Code
        const qrX = doc.page.width - qrSize - 50;
        const qrY = currentY;

        try {
          // Generate QR code as buffer
          console.log(
            `Generating QR code for ${student.firstName} ${student.lastName}`
          );
          const qrBuffer = await QRCode.toBuffer(student.qrCode, {
            width: qrSize,
            margin: 1,
          });

          doc.image(qrBuffer, qrX, qrY, {
            width: qrSize,
            height: qrSize,
          });
          console.log(
            `Successfully added QR code for ${student.firstName} ${student.lastName}`
          );
        } catch (error) {
          console.log(
            `Failed to generate QR code for ${student.firstName} ${student.lastName}:`,
            error instanceof Error ? error.message : String(error)
          );
          // Fallback: draw a placeholder
          doc.rect(qrX, qrY, qrSize, qrSize).stroke();
          doc.fontSize(8).text("QR Error", qrX + 5, qrY + 30);
        }

        // Move to next row
        currentY += rowHeight + margin;

        // Add some spacing between students
        if (
          (i + 1) % studentsPerPage !== 0 &&
          i < this.data.students.length - 1
        ) {
          doc.moveDown(0.5);
        }
      }

      console.log(`Finalizing PDF document`);
      doc.end();
    });
  }
}

/**
 * DOCX Exporter
 */
export class DOCXExporter extends BaseExporter {
  async generate(): Promise<Buffer> {
    const children: any[] = [];

    // Add title
    if (this.data.title) {
      children.push(
        new Paragraph({
          text: this.data.title,
          heading: "Heading1",
        })
      );
    }

    // Add subtitle
    if (this.data.subtitle) {
      children.push(
        new Paragraph({
          text: this.data.subtitle,
          heading: "Heading2",
        })
      );
    }

    // Create table
    const tableRows = [
      new TableRow({
        children: this.data.headers.map(
          (header) =>
            new TableCell({
              children: [new Paragraph(header)],
              width: {
                size: 100 / this.data.headers.length,
                type: WidthType.PERCENTAGE,
              },
            })
        ),
      }),
      ...this.data.rows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph(cell.toString())],
                  width: {
                    size: 100 / this.data.headers.length,
                    type: WidthType.PERCENTAGE,
                  },
                })
            ),
          })
      ),
    ];

    const table = new Table({
      rows: tableRows,
    });

    children.push(table);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }
}

/**
 * Factory function to create exporters
 */
export function createExporter(
  format: "excel" | "pdf" | "docx",
  data: ExportData,
  options: ExportOptions = {}
): BaseExporter {
  switch (format) {
    case "excel":
      return new ExcelExporter(data, options);
    case "pdf":
      return new PDFExporter(data, options);
    case "docx":
      return new DOCXExporter(data, options);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Utility function to export data directly
 */
export async function exportData(
  format: "excel" | "pdf" | "docx",
  data: ExportData,
  options: ExportOptions = {}
): Promise<Buffer> {
  const exporter = createExporter(format, data, options);
  return await exporter.generate();
}

/**
 * Utility function to export student data with images and QR codes
 */
export async function exportStudentData(
  data: StudentExportData
): Promise<Buffer> {
  const exporter = new StudentPDFExporter(data);
  return await exporter.generate();
}
