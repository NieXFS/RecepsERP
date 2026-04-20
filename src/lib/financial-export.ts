import "server-only";
import ExcelJS from "exceljs";

export type ExportColumnType = "text" | "currency" | "date" | "percent" | "integer";

export type ExportColumn = {
  header: string;
  type?: ExportColumnType;
  width?: number;
};

export type ExportRowValue = string | number | Date | null | undefined;

export type ExportPayload = {
  sheetName: string;
  tenantName: string;
  periodLabel: string;
  generatedAt: Date;
  columns: ExportColumn[];
  rows: ExportRowValue[][];
  totals?: ExportRowValue[];
  emptyMessage?: string;
};

const BRL_FORMAT = '"R$" #,##0.00;[Red]"-R$" #,##0.00';
const DATE_FORMAT = "dd/mm/yyyy";
const PERCENT_FORMAT = "0.00%";
const INTEGER_FORMAT = "0";

function pad2(value: number) {
  return value < 10 ? `0${value}` : String(value);
}

function formatDateBR(date: Date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function formatDateTimeBR(date: Date) {
  return `${formatDateBR(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatBRNumber(value: number, digits = 2) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function csvEscape(value: string) {
  const needsQuoting = /[";\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

function csvCell(value: ExportRowValue, type: ExportColumnType = "text") {
  if (value == null || value === "") return "";
  if (value instanceof Date) return csvEscape(formatDateBR(value));

  if (type === "currency") {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(num)) return "";
    return csvEscape(formatBRNumber(num, 2));
  }

  if (type === "percent") {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(num)) return "";
    return csvEscape(`${formatBRNumber(num * 100, 2)}%`);
  }

  if (type === "integer") {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(num)) return "";
    return csvEscape(String(Math.trunc(num)));
  }

  if (type === "date" && typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return csvEscape(formatDateBR(parsed));
  }

  return csvEscape(String(value));
}

export function buildCsv(payload: ExportPayload): Buffer {
  const separator = ";";
  const lines: string[] = [];
  const generated = formatDateTimeBR(payload.generatedAt);

  lines.push(csvEscape(payload.tenantName));
  lines.push(csvEscape(payload.periodLabel));
  lines.push(csvEscape(`Gerado em: ${generated}`));
  lines.push("");
  lines.push(payload.columns.map((col) => csvEscape(col.header)).join(separator));

  if (payload.rows.length === 0) {
    lines.push(csvEscape(payload.emptyMessage ?? "Sem dados no período"));
  } else {
    for (const row of payload.rows) {
      const cells = payload.columns.map((col, index) =>
        csvCell(row[index], col.type ?? "text")
      );
      lines.push(cells.join(separator));
    }

    if (payload.totals && payload.totals.length > 0) {
      const cells = payload.columns.map((col, index) =>
        csvCell(payload.totals![index], col.type ?? "text")
      );
      lines.push(cells.join(separator));
    }
  }

  const content = lines.join("\r\n") + "\r\n";
  return Buffer.from("\uFEFF" + content, "utf8");
}

export async function buildXlsx(payload: ExportPayload): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Receps ERP";
  workbook.created = payload.generatedAt;

  const sheet = workbook.addWorksheet(payload.sheetName, {
    views: [{ state: "frozen", ySplit: 5 }],
  });

  const columnCount = payload.columns.length;
  const endColLetter = columnLetter(columnCount);

  sheet.getCell("A1").value = payload.tenantName;
  sheet.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
  sheet.mergeCells(`A1:${endColLetter}1`);

  sheet.getCell("A2").value = payload.periodLabel;
  sheet.getCell("A2").font = { name: "Calibri", size: 11 };
  sheet.mergeCells(`A2:${endColLetter}2`);

  sheet.getCell("A3").value = `Gerado em: ${formatDateTimeBR(payload.generatedAt)}`;
  sheet.getCell("A3").font = {
    name: "Calibri",
    size: 10,
    italic: true,
    color: { argb: "FF6B7280" },
  };
  sheet.mergeCells(`A3:${endColLetter}3`);

  const headerRow = sheet.getRow(5);
  payload.columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF111827" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3F4F6" },
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF9CA3AF" } },
    };
  });
  headerRow.commit();

  if (payload.rows.length === 0) {
    const emptyRow = sheet.getRow(6);
    emptyRow.getCell(1).value = payload.emptyMessage ?? "Sem dados no período";
    emptyRow.getCell(1).font = { italic: true, color: { argb: "FF6B7280" } };
    if (columnCount > 1) {
      sheet.mergeCells(`A6:${endColLetter}6`);
    }
    emptyRow.commit();
  } else {
    payload.rows.forEach((row, rowIndex) => {
      const excelRow = sheet.getRow(6 + rowIndex);
      payload.columns.forEach((col, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        applyCell(cell, row[colIndex], col.type ?? "text");
      });
      excelRow.commit();
    });

    if (payload.totals && payload.totals.length > 0) {
      const totalRow = sheet.getRow(6 + payload.rows.length);
      payload.columns.forEach((col, colIndex) => {
        const cell = totalRow.getCell(colIndex + 1);
        applyCell(cell, payload.totals![colIndex], col.type ?? "text");
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE5E7EB" },
        };
      });
      totalRow.commit();
    }
  }

  payload.columns.forEach((col, index) => {
    const excelCol = sheet.getColumn(index + 1);
    const width = col.width ?? estimateWidth(payload, index);
    excelCol.width = Math.min(Math.max(width, 10), 45);
    if (col.type === "currency") {
      excelCol.numFmt = BRL_FORMAT;
    } else if (col.type === "percent") {
      excelCol.numFmt = PERCENT_FORMAT;
    } else if (col.type === "date") {
      excelCol.numFmt = DATE_FORMAT;
    } else if (col.type === "integer") {
      excelCol.numFmt = INTEGER_FORMAT;
    }
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
}

function applyCell(
  cell: ExcelJS.Cell,
  value: ExportRowValue,
  type: ExportColumnType
) {
  if (value == null || value === "") {
    cell.value = null;
    return;
  }

  if (type === "currency") {
    const num = typeof value === "number" ? value : Number(value);
    cell.value = Number.isFinite(num) ? num : null;
    cell.numFmt = BRL_FORMAT;
    return;
  }

  if (type === "percent") {
    const num = typeof value === "number" ? value : Number(value);
    cell.value = Number.isFinite(num) ? num : null;
    cell.numFmt = PERCENT_FORMAT;
    return;
  }

  if (type === "integer") {
    const num = typeof value === "number" ? value : Number(value);
    cell.value = Number.isFinite(num) ? Math.trunc(num) : null;
    cell.numFmt = INTEGER_FORMAT;
    return;
  }

  if (type === "date") {
    if (value instanceof Date) {
      cell.value = value;
      cell.numFmt = DATE_FORMAT;
      return;
    }
    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        cell.value = parsed;
        cell.numFmt = DATE_FORMAT;
        return;
      }
    }
    cell.value = null;
    return;
  }

  cell.value = String(value);
}

function columnLetter(index: number) {
  let n = index;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result || "A";
}

function estimateWidth(payload: ExportPayload, columnIndex: number) {
  const headerLen = payload.columns[columnIndex]?.header.length ?? 10;
  let max = headerLen;

  const type = payload.columns[columnIndex]?.type ?? "text";
  const sampleLimit = Math.min(payload.rows.length, 50);
  for (let i = 0; i < sampleLimit; i++) {
    const value = payload.rows[i]?.[columnIndex];
    max = Math.max(max, approxValueWidth(value, type));
  }
  if (payload.totals) {
    max = Math.max(max, approxValueWidth(payload.totals[columnIndex], type));
  }
  return max + 2;
}

function approxValueWidth(value: ExportRowValue, type: ExportColumnType) {
  if (value == null) return 0;
  if (value instanceof Date) return 10;
  if (type === "currency") {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(num)) return 0;
    return formatBRNumber(num, 2).length + 4;
  }
  if (type === "percent") return 7;
  if (type === "integer") {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) ? String(Math.trunc(num)).length : 0;
  }
  return String(value).length;
}

export function buildExportFilename(
  base: string,
  start: string | null,
  end: string | null,
  ext: "csv" | "xlsx"
) {
  const parts = [base];
  if (start) parts.push(start);
  if (end && end !== start) parts.push(end);
  return `${parts.join("_")}.${ext}`;
}

export function csvMimeType() {
  return "text/csv; charset=utf-8";
}

export function xlsxMimeType() {
  return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}
