"use client";

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import Header from "@/components/common/Header";
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import LoadingSpinner from "@/components/LoadingSpinner";
import TaskTable, { TaskData } from "@/components/common/TaskTable";
import { FieldDefinition } from "@/types/FieldDefinitions";
import TaskSearchBar from "@/components/common/TaskSearchBar";
import AdvancedFilterPopover from "@/components/common/AdvancedFilterPopover";
import SortFilterPopover from "@/components/common/SortFilterPopover";
import Bar from "@/components/Project/PaginationBar";
import { useTheme } from "@/store/hooks";
import { customToast as toast } from "@/utils/toast";
import {
  useGetAllTasksQuery,
  usePickTaskFromCompanyJobBucketMutation
} from "@/store/api_query/LazyKill/lazyKill.api";
import FilterIcon from "@/assests/filter-icon.png";
import { Button } from "@mui/material";

const COMPANY_BUCKET_FIELD_KEYS = [
  "taskId",
  "taskName",
  "description",
  "priority",
  "taskType",
  "tags",
  "estimationTime",
  "action"
] as const;

const FIELD_LABELS: Record<(typeof COMPANY_BUCKET_FIELD_KEYS)[number], string> = {
  taskId: "Task ID",
  taskName: "Task Name",
  description: "Description",
  priority: "Priority",
  taskType: "Type",
  tags: "Tags",
  estimationTime: "Estimate",
  action: "Action"
};

const buildFieldDefinitions = (): FieldDefinition[] => {
  return COMPANY_BUCKET_FIELD_KEYS.map((key, index) => ({
    fieldKey: key,
    displayName: FIELD_LABELS[key],
    fieldType: key === "action" ? "ACTION" : "TEXT",
    isVisible: true,
    isSortable: !["description", "tags", "action"].includes(key),
    columnWidth: key === "action" ? 140 : 180,
    displayOrder: index
  }));
};

const formatEstimate = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;
  const totalSeconds = Number(value);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;

  let seconds = Math.floor(totalSeconds);
  const days = Math.floor(seconds / 86400);
  seconds -= days * 86400;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds && parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
};

const formatValueForCell = (val: unknown): string => {
  if (val === null || val === undefined) return "-";
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
    return String(val);
  }

  if (Array.isArray(val)) {
    if (!val.length) return "-";
    const mapped = val
      .map((item) => {
        if (item && typeof item === "object") {
          return (
            (item as Record<string, unknown>).label ||
            (item as Record<string, unknown>).taskName ||
            (item as Record<string, unknown>).name ||
            (item as Record<string, unknown>).value ||
            (item as Record<string, unknown>).id
          );
        }
        return item;
      })
      .filter(Boolean);
    if (mapped.length) {
      return mapped.join(", ");
    }
    return `${val.length} item${val.length > 1 ? "s" : ""}`;
  }

  if (typeof val === "object") {
    const record = val as Record<string, unknown>;
    return (
      (record.label as string) ||
      (record.name as string) ||
      (record.taskName as string) ||
      (record.value as string) ||
      (record.id as string) ||
      "-"
    );
  }

  return "-";
};

export default function CompanyJobBucketPage() {
  const { isDark, colors } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showLessColumns, setShowLessColumns] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: "asc" | "desc" }>({
    field: "createdAt",
    direction: "desc"
  });
  const [searchQueryParams, setSearchQueryParams] = useState<Record<string, string>>({});
  const [advancedFilterParams, setAdvancedFilterParams] = useState<Record<string, string>>({});
  const [advancedFilters, setAdvancedFilters] = useState<any[]>([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [sortFilterAnchorEl, setSortFilterAnchorEl] = useState<HTMLElement | null>(null);

  const fieldDefinitions = useMemo(() => buildFieldDefinitions(), []);

  const visibleFields = useMemo(() => {
    if (!showLessColumns) return fieldDefinitions;
    const keepKeys = new Set(["taskId", "taskName", "priority", "tags", "action"]);
    return fieldDefinitions.filter((field) => keepKeys.has(field.fieldKey));
  }, [fieldDefinitions, showLessColumns]);

  const queryParams = useMemo(() => {
    return {
      companyJobBucket: "eq:true",
      page: currentPage,
      countPerPage: pageSize,
      sort: sortConfig.field,
      sortDirection: sortConfig.direction,
      ...searchQueryParams,
      ...advancedFilterParams
    };
  }, [currentPage, pageSize, sortConfig, searchQueryParams, advancedFilterParams]);

  const {
    data: tasksData,
    isLoading,
    refetch
  } = useGetAllTasksQuery(queryParams);

  const [pickTask, { isLoading: isPicking }] = usePickTaskFromCompanyJobBucketMutation();

  const tasks: TaskData[] = useMemo(() => {
    const rows = tasksData?.data?.data?.tasks || tasksData?.data?.tasks || [];
    if (!Array.isArray(rows)) return [];

    return rows.map((task: any) => ({
      id: task.id || task._id,
      taskId: task.taskId || task.id,
      taskName: task.taskName || task.name || "",
      description: task.description || "",
      priority: task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : "Medium",
      taskType: task.taskType || [],
      tags: task.tags || [],
      estimationTime: formatEstimate(task.estimationTime),
      rawRecord: task
    }));
  }, [tasksData]);

  const totalTasks = tasksData?.data?.data?.total || tasksData?.data?.total || 0;

  const handleSearch = useCallback(
    (_term: string, _columns: string[], params?: Record<string, string>) => {
      setSearchQueryParams(params ?? {});
      setCurrentPage(1);
    },
    []
  );

  const handleApplyAdvancedFilters = useCallback(
    (filters: any[], queryOverrides?: Record<string, string>) => {
      let params: Record<string, string> = {};
      if (queryOverrides && Object.keys(queryOverrides).length > 0) {
        params = queryOverrides;
      } else {
        filters.forEach((filter) => {
          if (filter.field && filter.operator && filter.value?.trim()) {
            params[filter.field] = `${filter.operator}:${filter.value.trim()}`;
          }
        });
      }
      setAdvancedFilters(filters);
      setAdvancedFilterParams(params);
      setCurrentPage(1);
      setFilterAnchorEl(null);
    },
    []
  );

  const handleClearAdvancedFilters = useCallback(() => {
    setAdvancedFilters([]);
    setAdvancedFilterParams({});
    setCurrentPage(1);
  }, []);

  const handleApplySortFilter:any = useCallback((sort: { field: string; direction: "asc" | "desc" }) => {
    setSortConfig(sort);
    setSortFilterAnchorEl(null);
    setCurrentPage(1);
  }, []);

  const handlePick = useCallback(
    async (taskId: string) => {
      try {
        const response = await pickTask(taskId).unwrap();
        const message =
          (response && (response as any).message) ||
          "Task picked from company job bucket";
        toast.success(message);
        refetch();
      } catch (error: any) {
        const message = error?.data?.message || "Failed to pick task";
        toast.error(message);
      }
    },
    [pickTask, refetch]
  );

  const getCellRenderer = useCallback(
    ({ field, value, row }: { field: FieldDefinition; value: any; row: TaskData }) => {
      if (field.fieldKey === "taskId" && typeof value === "string") {
        return (
          <span className="text-sm text-blue-600 underline cursor-pointer">
            {value}
          </span>
        );
      }

      if (field.fieldKey === "taskName") {
        return <span className="font-medium text-sm">{formatValueForCell(value)}</span>;
      }

      if (field.fieldKey === "tags") {
        const tags = Array.isArray(value) ? value : [];
        if (!tags.length) return <span className="text-gray-400 text-sm">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag: any, idx: number) => (
              <span
                key={`${row.id}-tag-${idx}`}
                className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-700"
              >
                {typeof tag === "string" ? tag : tag?.label || tag?.value || tag?.name}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="text-xs text-slate-500">+{tags.length - 4}</span>
            )}
          </div>
        );
      }

      if (field.fieldKey === "estimationTime") {
        return (
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
            {value || "-"}
          </span>
        );
      }

      if (field.fieldKey === "action") {
        return (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handlePick(String(row.id));
            }}
            disabled={isPicking}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {isPicking ? "Processing..." : "Pick Task"}
          </Button>
        );
      }

      return <span>{formatValueForCell(value)}</span>;
    },
    [handlePick, isPicking]
  );

  const backgroundColor = isDark ? colors.dark.lightBg : colors.light.lightBg;

  return (
    <ProtectedRoute>
      <div
        className="w-screen h-screen overflow-hidden flex"
        style={{ backgroundColor }}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <div className="border-t-2 border-b-2 border-l-2 border-red-600 flex-1 m-1 overflow-hidden flex flex-col">
            <div
              className="border-b px-5 py-1"
              style={{ borderBottomColor: isDark ? colors.dark.text : undefined }}
            >
              <BreadcrumbsNavBar
                customItems={[
                  { label: "LazyKill", href: "/lazykill/projects" },
                  { label: "Company Job Bucket", href: "/lazykill/company-job-bucket" }
                ]}
              />
            </div>

            <div
              className="mx-5 mt-4 px-4 py-4 rounded shadow bg-white flex justify-between items-center"
              style={{ backgroundColor: isDark ? colors.dark.sidebar : "#fff" }}
            >
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Company Job Bucket
                </h1>
                <p className="text-sm text-slate-500">
                  Review and pick tasks queued in the global bucket
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900">{totalTasks}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Total Tasks
                </p>
              </div>
            </div>

            <div
              className="bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-3 flex justify-end items-center gap-2"
              style={{ backgroundColor: isDark ? colors.dark.sidebar : undefined }}
            >
              <TaskSearchBar
                onSearch={handleSearch}
                placeholder="Search by task, type, tags..."
                className="flex-1"
                showOperatorSelector={false}
              />

              <button
                onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                <Image src={FilterIcon} alt="Filters" width={16} height={16} />
                <span>Filters</span>
                {advancedFilters.length > 0 && (
                  <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {advancedFilters.length}
                  </span>
                )}
              </button>

              <button
                onClick={(e) => setSortFilterAnchorEl(e.currentTarget)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                <Image src="/sort.svg" alt="Sort" width={16} height={16} />
                <span>Sort</span>
              </button>
            </div>

            <div className="mx-5 mt-4 py-2 px-2 rounded flex">
              <Bar
                total={totalTasks}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                onToggleColumns={() => setShowLessColumns((prev) => !prev)}
                showLessColumns={showLessColumns}
              />
            </div>

            <div className="flex-1 bg-white dark:bg-gray-900 relative rounded-md border border-gray-200 dark:border-gray-800 m-5 mt-0 p-2">
              {isLoading ? (
                <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <TaskTable
                  tasks={tasks}
                  fieldDefinitions={visibleFields}
                  treeColumnKey="taskName"
                  taskIdKey="id"
                  subtasksKey="subtasks"
                  initialExpandedIds={[]}
                  selectable={false}
                  stickyHeader
                  indentationSize={24}
                  getCellRenderer={getCellRenderer}
                  onSelectionChange={() => undefined}
                  onRowClick={() => undefined}
                  onRenameColumn={() => undefined}
                  appearance="figma"
                  rowKey="id"
                />
              )}
            </div>

            <AdvancedFilterPopover
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={() => setFilterAnchorEl(null)}
              onApplyFilters={handleApplyAdvancedFilters}
              initialFilters={advancedFilters}
              title="Filter Bucket Tasks"
              mode="task"
              onClearFilters={handleClearAdvancedFilters}
            />

            <SortFilterPopover
              anchorEl={sortFilterAnchorEl}
              open={Boolean(sortFilterAnchorEl)}
              onClose={() => setSortFilterAnchorEl(null)}
              onApplySort={handleApplySortFilter}
              currentSort={sortConfig}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
