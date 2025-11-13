"use client";

import React, { useEffect, useMemo, useState } from "react";
import { customToast } from "../../utils/toast";
import type { FieldDefinition } from "../../types/FieldDefinitions";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityLabel: string; // contacts, leads, opportunities, deals, activities
  fields: FieldDefinition[];
  rows: Array<Record<string, unknown>>; // current page rows (current view)
  fetchAll: () => Promise<Array<Record<string, unknown>>>; // callback to fetch all rows for this entity
}

const formatDatePart = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}_${hh}:${mi}:${ss}`;
};

const valueToText = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => valueToText(x)).join(", ");
  if (typeof v === "object") {
    // Prefer label/name/value if present
    const o = v as Record<string, unknown>;
    if (typeof o.label === "string") return o.label;
    if (typeof o.name === "string") return o.name;
    if (typeof o.value === "string" || typeof o.value === "number") return String(o.value);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
};

const escapeCSV = (text: string): string => {
  const t = text?.replace(/\r?\n/g, " ") ?? "";
  if (/[",\n]/.test(t)) {
    return '"' + t.replace(/"/g, '""') + '"';
  }
  return t;
};

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, entityLabel, fields, rows, fetchAll }) => {
  const [exportScope, setExportScope] = useState<"current" | "all">("current");
  const [fileName, setFileName] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("excel");

  const filterableFields = useMemo(() => {
    return (fields || [])
      .filter((f) => f && f.isFilterable)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [fields]);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const def = `${entityLabel.toLowerCase()}_List_${formatDatePart(now)}`;
      setFileName(def);
      setExportScope("current");
    }
  }, [isOpen, entityLabel]);

  const buildCSV = (data: Array<Record<string, unknown>>) => {
    if (!Array.isArray(data)) return "";

    const headers = filterableFields.map((f) => f.displayName || f.fieldKey);
    const keys = filterableFields.map((f) => f.fieldKey);

    const lines: string[] = [];
    lines.push(headers.map(escapeCSV).join(","));

    data.forEach((row) => {
      const cols = keys.map((k) => {
        const val = row?.[k];
        return escapeCSV(valueToText(val));
      });
      lines.push(cols.join(","));
    });

    return lines.join("\n");
  };

  const buildExcelAndDownload = async (data: Array<Record<string, unknown>>) => {
    const headers = filterableFields.map((f) => f.displayName || f.fieldKey);
    const keys = filterableFields.map((f) => f.fieldKey);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} List`);
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // Add header row
    const headerRow = worksheet.addRow(headers);

    // Style header with dark background (from snippet: #9f1d1d) and white bold text
    headerRow.eachCell((cell: any) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF9F1D1D" },
      };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add data rows
    data.forEach((row) => {
      const vals = keys.map((k) => valueToText(row?.[k]));
      worksheet.addRow(vals);
    });

    // Autosize columns (basic)
    const colCount = headers.length;
    for (let i = 1; i <= colCount; i++) {
      let maxLen = headers[i - 1]?.toString().length ?? 10;
      worksheet.eachRow((r, rowNumber) => {
        const val = r.getCell(i).value;
        const len = (val ? String(val) : "").length;
        if (len > maxLen) maxLen = len;
      });
      worksheet.getColumn(i).width = Math.min(Math.max(maxLen + 2, 12), 50);
    }

    const finalName = fileName?.toLowerCase().endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, finalName);
  };

  const downloadCSV = (csv: string) => {
    const finalName = fileName?.toLowerCase().endsWith(".csv") ? fileName : `${fileName}.csv`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (filterableFields.length === 0) {
      customToast.error("No filterable columns to export");
      return;
    }

    try {
      setBusy(true);
      let data = [];
      if (exportScope === "current") {
        data = rows || [];
      } else {
        data = await fetchAll();
      }
      if (exportFormat === "excel") {
        await buildExcelAndDownload(data);
        customToast.success("Exported Excel successfully");
      } else {
        const csv = buildCSV(data);
        if (!csv) {
          customToast.error("Failed to build CSV");
          return;
        }
        downloadCSV(csv);
        customToast.success("Exported CSV successfully");
      }
      onClose();
    } catch (e) {
      console.error("Export failed", e);
      customToast.error("Export failed");
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.35)" }} />
      <div
        className="relative w-full max-w-md rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="px-4 py-3" style={{ backgroundColor: "#C81C1F" }}>
          <h3 className="text-white text-base font-semibold">Export {entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)}</h3>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: "#656462" }}>File name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full border rounded px-3 py-2 capitalize"
              placeholder={`${entityLabel}_List_YYYY-MM-DD_HH:MM:SS`}
              style={{ borderColor: "#8F8E8C", color: "#656462" }}
            />
            <p className="text-xs mt-1 capitalize" style={{ color: "#8F8E8C" }}>
              Default: {entityLabel}_List_YYYY-MM-DD_HH:MM:SS.{exportFormat === "excel" ? "xlsx" : "csv"}
            </p>
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: "#656462" }}>What to export?</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm" style={{ color: "#656462" }}>
                <input
                  type="radio"
                  className="accent-[#C81C1F]"
                  checked={exportScope === "current"}
                  onChange={() => setExportScope("current")}
                />
                <span>Export current view (current page only)</span>
              </label>
              <label className="flex items-center gap-2 text-sm" style={{ color: "#656462" }}>
                <input
                  type="radio"
                  className="accent-[#C81C1F]"
                  checked={exportScope === "all"}
                  onChange={() => setExportScope("all")}
                />
                <span>Export all {entityLabel} in database</span>
              </label>
            </div>
            {/* <p className="text-xs mt-2" style={{ color: "#8F8E8C" }}>
              Only columns with isFilterable: true will be included.
            </p> */}
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: "#656462" }}>Format</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm" style={{ color: "#656462" }}>
                <input
                  type="radio"
                  className="accent-[#C81C1F]"
                  checked={exportFormat === "excel"}
                  onChange={() => setExportFormat("excel")}
                />
                <span>Excel (.xlsx)</span>
              </label>
              <label className="flex items-center gap-2 text-sm" style={{ color: "#656462" }}>
                <input
                  type="radio"
                  className="accent-[#C81C1F]"
                  checked={exportFormat === "csv"}
                  onChange={() => setExportFormat("csv")}
                />
                <span>CSV (.csv)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 flex items-center justify-end gap-2 border-t" style={{ borderColor: "#8F8E8C" }}>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded text-sm"
            style={{ color: "#656462", backgroundColor: "#f3f4f6" }}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 rounded text-sm text-white disabled:opacity-60"
            style={{ backgroundColor: "#C81C1F" }}
            disabled={busy}
          >
            {busy ? "Exporting..." : exportFormat === "excel" ? "Export Excel" : "Export CSV"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
