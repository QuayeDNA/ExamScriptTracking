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

export interface ExportData {
  headers: string[];
  rows: (string | number | Date)[][];
  title?: string;
  subtitle?: string;
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
