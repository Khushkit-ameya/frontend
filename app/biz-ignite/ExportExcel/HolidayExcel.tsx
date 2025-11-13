"use client";
import React, { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";

interface ExcelExportProps {
  isOpen: boolean;
  entityLabel: string;
  holidayData: any[];
  onClose: () => void;
  onFetchAll?: () => Promise<{
    holidayData: any[];
    flexibleData: any[];
    weekOffData: any[];
  }>;
}

export default function ExcelExportButton({
  isOpen,
  entityLabel,
  holidayData,
  onClose,
  onFetchAll,
}: ExcelExportProps) {
  const [exportType, setExportType] = useState<"current" | "all">("current");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const formatted = `${entityLabel}_List_${formatDatePart(now)}`;
      setFileName(formatted);
      setExportType("current");
    }
  }, [isOpen, entityLabel]);

  const formatDatePart = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${dd}-${mm}-${yyyy}_${hh}-${mi}-${ss}`;
  };

  const formatDatesInData = (data: any[]) =>
    data.map((row) => {
      const newRow: Record<string, any> = {};
      for (const key in row) {
        if (key === "id") continue; //Exclude id column
        const val = row[key];
        if (
          typeof val === "string" &&
          !isNaN(Date.parse(val)) &&
          val.match(/\d{4}-\d{2}-\d{2}/)
        ) {
        const d = new Date(val);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        newRow[key] = `${dd}-${mm}-${yyyy}`;
        } else {
          newRow[key] = val;
        }
      }
      return newRow;
    });

  const createSheet = (
    workbook: ExcelJS.Workbook,
    sheetName: string,
    data: any[]
  ) => {
    if (!data?.length) return;
    const formatted = formatDatesInData(data);
    const worksheet = workbook.addWorksheet(sheetName);

    const headers = Object.keys(formatted[0]);
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "#9f1d1d" },
      };
      cell.font = { color: { argb: "FFFFFF" }, bold: true };
      cell.alignment = { horizontal: "center" };
    });

    formatted.forEach((row) => {
      const rowValues = headers.map((key) => row[key]);
      worksheet.addRow(rowValues);
    });

    // Safe Auto-fit columns
  worksheet.columns.forEach((col) => {
  if (!col) return; // skip undefined columns

  let maxLength = 10;
  if (typeof col.eachCell === "function") {
    col.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value ? cell.value.toString() : "";
      maxLength = Math.max(maxLength, value.length + 2);
    });
  }
  col.width = maxLength;
  });
  };

//   convert weekIndex to name
  const weekIndexToName = (index: number) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[index] ?? "Unknown";
};

  const handleExport = async () => {
  try {
    setBusy(true);

    let allHoliday = holidayData;
    let allFlexible: any[] = [];
    let allWeekOff: any[] = [];

    // Fetch all data only when "all" selected
    if (exportType === "all" && onFetchAll) {
      const allData = await onFetchAll();
      allHoliday = allData.holidayData;
      allFlexible = allData.flexibleData;
      allWeekOff = allData.weekOffData;
    }

    const workbook = new ExcelJS.Workbook();

    // choose only needed columns
     const pickColumns = (data: any[], columns: string[]) =>
      data.map((row) => {
        const filtered: Record<string, any> = {};

        columns.forEach((key) => {
          // Handle nested user list in flexibleData
          if (key === "usersOff") {
            const users = row.usersOff || [];
            filtered["Alloted To"] = users
              .map(
                (u: any) =>
                  u.user
                    ? `${u.user.firstName || ""} ${u.user.lastName || ""}`.trim()
                    : ""
              )
              .filter(Boolean)
              .join(", ");
          } else {
            filtered[key] = row[key];
          }
        });
        return filtered;
      });

    // When current → only show Holidays
    if (exportType === "current") {
      if (!allHoliday.length) {
        toast.error("No holiday data to export!");
        return;
      }

      const formattedHoliday = pickColumns(allHoliday, [
        "name",
        "holidayType",
        "fromDate",
        "toDate",
        "startTime",
        "endTime",
        "description",
      ]);
      createSheet(workbook, "Holidays", formattedHoliday);
    }

    // When all → show all three (with filtered columns)
    if (exportType === "all") {
      if (allHoliday.length)
        createSheet(
          workbook,
          "Holidays",
          pickColumns(allHoliday, ["name","holidayType","fromDate","toDate","startTime","endTime","description",]));

      if (allFlexible.length)
        createSheet(
          workbook,
          "Flexible Week Off",
          pickColumns(allFlexible, ["name","holidayType","fromDate","toDate","startTime","endTime","usersOff"])
        );

      if (allWeekOff.length)
        createSheet(
          workbook,
          "Permanent Week Off",
          allWeekOff.map((d) => ({
            WeekDay: weekIndexToName(d.weekIndex ?? d),
          }))
        );
    }

    // 🧩 Save Excel
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${fileName || "HolidayData"}.xlsx`);
    toast.success("Excel Exported Successfully!");
    onClose?.();
  } catch (err) {
    console.error(err);
    toast.error("Failed To Export Excel File");
  } finally {
    setBusy(false);
  }
};


  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      />
      <div
        className="relative w-full max-w-md rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Header */}
        <div className="px-4 py-3" style={{ backgroundColor: "#C81C1F" }}>
          <h3 className="text-white text-base font-semibold">
            Export {entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)}
          </h3>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: "#656462" }}>
              File name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full border rounded px-3 py-2 capitalize"
              style={{ borderColor: "#8F8E8C", color: "#656462" }}
              placeholder={`${entityLabel}_List_DD-MM-YYYY_HH:MM:SS`}
            />
            <p className="text-xs mt-1 capitalize" style={{ color: "#8F8E8C" }}>
              Default: {entityLabel}_List_DD-MM-YYYY_HH:MM:SS.xlsx
            </p>
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: "#656462" }}>
              What to export?
            </label>
            <div className="space-y-2">
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: "#656462" }}
              >
                <input
                  type="radio"
                  className="accent-[#C81C1F]"
                  checked={exportType === "current"}
                  onChange={() => setExportType("current")}
                />
                <span>Export current (current page only)</span>
              </label>
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: "#656462" }}
              >
                <input
                  type="radio"
                  className="accent-[#C81C1F]"
                  checked={exportType === "all"}
                  onChange={() => setExportType("all")}
                />
                <span>Export all ({entityLabel} in database)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 flex items-center justify-end gap-2 border-t"
          style={{ borderColor: "#8F8E8C" }}
        >
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
}
