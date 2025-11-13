"use client";
import React, { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs"
import { saveAs} from "file-saver";
import { customToast } from "../../../utils/toast";
import { Column } from "@/components/common/DynamicTable";

interface ExportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  entityLabel: string; // bizIgnite models like holiday, attendance, leave etc.
  fields: Column<T>[];
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
  return `${dd}-${mm}-${yyyy}_${hh}:${mi}:${ss}`;
};

const valueToText = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => valueToText(x)).join(", ");
  if (typeof v === "object") {
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

const ExportModal = <T,>({
  isOpen,
  onClose,
  entityLabel,
  fields,
  rows,
  fetchAll,
}: ExportModalProps<T>) => {  const [exportScope, setExportScope] = useState<"current" | "all">("current");
  const [fileName, setFileName] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const filterableFields = useMemo(() => {
    return (fields || []).filter((f:any) => f && f.isFilterable);
  }, [fields]);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const def = `${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1).toLowerCase()}_List_${formatDatePart(now)}.xlsx`;
      setFileName(def);
      setExportScope("current");
    }
  }, [isOpen, entityLabel]);

  const downloadExcel = async (data: Array<Record<string, unknown>>) => {
    if (!Array.isArray(data) || data.length === 0) {
      customToast.error("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    // Add header row
    const headers = filterableFields.map((f:any) => f.label || f.key);
    const headerRow = worksheet.addRow(headers);

    // Style header with black background
    headerRow.eachCell((cell:any) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "#9f1d1d" }, 
      };
      cell.font = { color: { argb: "FFFFFF" }, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add data rows
    data.forEach((rowData) => {
      const row = worksheet.addRow(filterableFields.map((f:any) => valueToText(rowData[f.key])));
      row.eachCell((cell:any) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Auto-fit column widths based on content
    worksheet.columns.forEach((col:any) => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, (cell:any) => {
        const value = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, value.length + 2);
      });
      col.width = maxLength;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const finalName = fileName?.toLowerCase().endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
    saveAs(blob, finalName);
    customToast.success("Excel Exported Successfully");
  };

  const handleExport = async () => {
    if (filterableFields.length === 0) {
      customToast.error("No filterable columns to export");
      return;
    }

    try {
      setBusy(true);
      let data: Array<Record<string, unknown>> = [];
      if (exportScope === "current") {
        data = rows || [];
      } else {
        data = await fetchAll(); 
      }
      console.log("Export data=", data);

      await downloadExcel(data);
      onClose();
    } catch (e) {
      console.error("Excel Export failed", e);
      customToast.error("Export Failed");
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
              Default: {entityLabel}_List_YYYY-MM-DD_HH:MM:SS.xlsx
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
            {busy ? "Exporting..." : "Export Excel"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
