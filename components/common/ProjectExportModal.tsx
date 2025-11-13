"use client";
import React, { useEffect, useMemo, useState } from "react";
import { customToast } from "../../utils/toast";
import type { FieldDefinition } from "../../types/FieldDefinitions";
import * as XLSX from "xlsx";

interface ProjectExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FieldDefinition[];
  rows: Array<Record<string, unknown>>;
  fetchAllProjects: () => Promise<Array<Record<string, unknown>>>;
  fetchAllTasks: () => Promise<Array<Record<string, unknown>>>;
  fetchAllSubtasks: () => Promise<Array<Record<string, unknown>>>;
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

const ProjectExportModal: React.FC<ProjectExportModalProps> = ({
  isOpen,
  onClose,
  fields,
  rows,
  fetchAllProjects,
  fetchAllTasks,
  fetchAllSubtasks
}) => {
  const [exportScope, setExportScope] = useState<"current" | "all">("current");
  const [fileName, setFileName] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // FIX: Ensure we have filterable fields or use all visible fields as fallback
  const filterableFields = useMemo(() => {
    const hasFilterable = (fields || []).some(f => f?.isFilterable);

    if (hasFilterable) {
      return (fields || [])
        .filter((f) => f && f.isFilterable)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    } else {
      // Fallback: use all fields that are visible and not action columns
      return (fields || [])
        .filter((f) => f && f.fieldKey !== 'action' && f.isVisible !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }
  }, [fields]);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const def = `Projects_Export_${formatDatePart(now)}`;
      setFileName(def);
      setExportScope("current");
    }
  }, [isOpen]);

  const formatDateToDDMMYYYY = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const prepareDataForExport = (data: Array<Record<string, unknown>>, fieldDefinitions: FieldDefinition[]) => {
    const headers = fieldDefinitions.map((f) => f.displayName || f.fieldKey);
    const keys = fieldDefinitions.map((f) => f.fieldKey);

    return data.map((row) => {
      const exportRow: Record<string, unknown> = {};
      keys.forEach((key, index) => {
        let displayValue = valueToText(row[key]);

        // Custom formatting for specific fields
        switch (key) {
          case 'timeline':
            // Format timeline array to show dates only in DDMMYYYY format
            if (Array.isArray(row[key]) && row[key].length >= 2) {
              const startDate = new Date(row[key][0] as string);
              const endDate = new Date(row[key][1] as string);
              displayValue = `${formatDateToDDMMYYYY(startDate)}, ${formatDateToDDMMYYYY(endDate)}`;
            }
            break;

          case 'startDate':
            // Format start date to DDMMYYYY
            if (row[key]) {
              displayValue = formatDateToDDMMYYYY(new Date(row[key] as string));
            }
            break;

          case 'dueDate':
            // Extract newDueDate from dueDate object and format to DDMMYYYY
            if (row[key] && typeof row[key] === 'object' && (row[key] as any).newDueDate) {
              displayValue = formatDateToDDMMYYYY(new Date((row[key] as any).newDueDate));
            } else if (row[key]) {
              // Fallback: if it's just a string date
              displayValue = formatDateToDDMMYYYY(new Date(row[key] as string));
            }
            break;

          case 'team':
          case 'manager':
            // Extract names from user objects
            if (Array.isArray(row[key])) {
              const names = (row[key] as any[]).map(user => {
                const firstName = user.firstName || '';
                const middleName = user.middleName || '';
                const lastName = user.lastName || '';
                return [firstName, middleName, lastName].filter(Boolean).join(' ');
              }).filter(Boolean);
              displayValue = names.join(', ');
            }
            break;

          case 'updates':
            // Extract update notes from updates array
            if (Array.isArray(row[key])) {
              const notes = (row[key] as any[]).map(update => {
                if (update.updateNotes) {
                  // Strip HTML tags and get plain text
                  const plainText = update.updateNotes.replace(/<[^>]*>/g, '').trim();
                  return plainText;
                }
                return '';
              }).filter(note => note.length > 0);
              displayValue = notes.join(', ');
            }
            break;

          default:
            // Use default formatting
            displayValue = valueToText(row[key]);
        }

        exportRow[headers[index]] = displayValue;
      });
      return exportRow;
    });
  };

  const downloadExcel = async (projectsData: any[], tasksData: any[], subtasksData: any[]) => {
    try {
      // Import exceljs dynamically to avoid SSR issues
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();

      // Helper function to create styled worksheet
      const createStyledWorksheet = (data: any[], sheetName: string) => {
        if (data.length === 0) return;

        const worksheet = workbook.addWorksheet(sheetName);

        // Get headers from first object
        const headers = Object.keys(data[0]);

        // Add header row
        const headerRow = worksheet.addRow(headers);

        // Apply styling to header row
        headerRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC81C1F' } // Red background #C81C1F
          };
          cell.font = {
            color: { argb: 'FFFFFFFF' }, // White text
            size: 12, // Larger font size
            bold: true,
            name: 'Arial'
          };
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center'
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        });

        // Set header row height
        headerRow.height = 20;

        // Add data rows
        data.forEach((row) => {
          const rowData = headers.map(header => row[header]);
          const dataRow = worksheet.addRow(rowData);

          // Add basic styling to data rows
          dataRow.eachCell((cell) => {
            cell.font = {
              size: 11,
              name: 'Arial'
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            };
          });
        });

        // Auto-fit columns
        worksheet.columns = headers.map(() => ({
          width: 20
        }));
      };

      // Create worksheets
      if (projectsData.length > 0) {
        createStyledWorksheet(projectsData, "Projects");
      }

      if (tasksData.length > 0) {
        createStyledWorksheet(tasksData, "Tasks");
      }

      if (subtasksData.length > 0) {
        createStyledWorksheet(subtasksData, "Subtasks");
      }

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const finalName = fileName?.toLowerCase().endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
      link.download = finalName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating Excel file:', error);
      throw new Error('Failed to generate Excel file');
    }
  };

  const handleExport = async () => {
    // FIX: Check if we have any fields to export (using the fallback logic)
    if (filterableFields.length === 0) {
      customToast.error("No columns available to export");
      return;
    }

    try {
      setBusy(true);

      let projectsData = [];
      let tasksData = [];
      let subtasksData = [];

      // Fetch projects
      if (exportScope === "current") {
        projectsData = rows || [];
      } else {
        projectsData = await fetchAllProjects();
      }

      // Fetch tasks and subtasks using the provided functions
      tasksData = await fetchAllTasks();
      subtasksData = await fetchAllSubtasks();

      console.log("Export data:", {
        projectsCount: projectsData.length,
        tasksCount: tasksData.length,
        subtasksCount: subtasksData.length
      });

      // Prepare data for export
      const exportProjects = prepareDataForExport(projectsData, filterableFields);

      // Define task fields for export
      const taskFields: FieldDefinition[] = [
        { fieldKey: 'taskId', displayName: 'Task Number', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'taskName', displayName: 'Task Name', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'description', displayName: 'Description', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'status', displayName: 'Status', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'priority', displayName: 'Priority', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'progress', displayName: 'Progress', fieldType: 'NUMBER', isFilterable: true },
        { fieldKey: 'projectName', displayName: 'Project Name', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'startDate', displayName: 'Start Date', fieldType: 'DATE', isFilterable: true },
        { fieldKey: 'endDate', displayName: 'End Date', fieldType: 'DATE', isFilterable: true },
        { fieldKey: 'taskType', displayName: 'Task Type', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'tags', displayName: 'Tags', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'estimationTime', displayName: 'Estimation Time (seconds)', fieldType: 'NUMBER', isFilterable: true },
      ];

      // Define subtask fields for export
      const subtaskFields: FieldDefinition[] = [
        { fieldKey: 'subtaskId', displayName: 'Subtask Number', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'subtaskName', displayName: 'Subtask Name', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'description', displayName: 'Description', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'status', displayName: 'Status', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'priority', displayName: 'Priority', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'progress', displayName: 'Progress', fieldType: 'NUMBER', isFilterable: true },
        { fieldKey: 'taskName', displayName: 'Parent Task Name', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'projectName', displayName: 'Project Name', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'startDate', displayName: 'Start Date', fieldType: 'DATE', isFilterable: true },
        { fieldKey: 'endDate', displayName: 'End Date', fieldType: 'DATE', isFilterable: true },
        { fieldKey: 'subtaskType', displayName: 'Subtask Type', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'tags', displayName: 'Tags', fieldType: 'TEXT', isFilterable: true },
        { fieldKey: 'estimationTime', displayName: 'Estimation Time (seconds)', fieldType: 'NUMBER', isFilterable: true },
      ];

      // Handle date formatting in tasks and subtasks
      const transformTaskDataForExport = (data: any[]) => {
        return data.map(item => ({
          ...item,
          startDate: item.startDate ? formatDateToDDMMYYYY(new Date(item.startDate)) : '',
          endDate: item.endDate ? formatDateToDDMMYYYY(new Date(item.endDate)) : '',
        }));
      };

      const exportTasks = prepareDataForExport(
        transformTaskDataForExport(tasksData.map((task: any) => ({
          ...task,
          projectName: task.project?.name || task.projectName || 'Unknown Project',
        }))),
        taskFields
      );

      const exportSubtasks = prepareDataForExport(
        transformTaskDataForExport(subtasksData.map((subtask: any) => ({
          ...subtask,
          taskName: subtask.task?.taskName || subtask.task?.name || 'Unknown Task',
          projectName: subtask.project?.name || subtask.projectName || 'Unknown Project',
        }))),
        subtaskFields
      );

      // Use the new async downloadExcel function
      await downloadExcel(exportProjects, exportTasks, exportSubtasks);
      customToast.success("Exported Excel file with 3 sheets successfully");
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
          <h3 className="text-white text-base font-semibold">Export Projects</h3>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: "#656462" }}>File name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full border rounded px-3 py-2 capitalize"
              placeholder={`Projects_Export_YYYY-MM-DD_HH:MM:SS`}
              style={{ borderColor: "#8F8E8C", color: "#656462" }}
            />
            <p className="text-xs mt-1" style={{ color: "#8F8E8C" }}>
              Default: Projects_Export_YYYY-MM-DD_HH:MM:SS.xlsx
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
                <span>Export all projects in database</span>
              </label>

            </div>
            <p className="text-xs mt-2" style={{ color: "#8F8E8C" }}>
              Export will include 3 sheets: Projects, Tasks, and Subtasks
            </p>
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

export default ProjectExportModal;