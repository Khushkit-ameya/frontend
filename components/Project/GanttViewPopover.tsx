"use client";

import React, { useMemo } from "react";
import { Popover, Box, Typography, CircularProgress } from "@mui/material";
import { X } from "lucide-react";
import { useTheme } from "@/store/hooks";
import { calculateProjectProgress } from "@/utils/formatTasksForGantt";
import { useGetAllSubtasksQuery, useGetTasksByProjectQuery } from "@/store/api_query/LazyKill/lazyKill.api";
import { useGetProjectByIdQuery } from "@/store/api_query/LazyKill/project.api";
import GanttChart, { GanttTask as TimelineTask } from "@/components/common/GanttChart";

interface GanttViewPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  tasks?: any[];
  projectId?: string;
  projectName: string;
  isLoading?: boolean;
}

const intlRangeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

const formatDateLabel = (value?: string | Date | null) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return intlRangeFormatter.format(date);
};

const statusProgressMap: Record<string, number> = {
  not_started: 0,
  pending: 10,
  todo: 20,
  "in progress": 50,
  in_progress: 50,
  "in review": 75,
  in_review: 75,
  blocked: 30,
  completed: 100,
  done: 100,
  closed: 100
};

const extractStatusColor = (status: unknown): string | undefined => {
  if (!status) return undefined;
  if (typeof status === "object") {
    const record = status as Record<string, unknown>;
    const color =
      record.color ||
      record.hex ||
      record.hexColor ||
      record.backgroundColor ||
      record.barColor ||
      record.tagColor;
    if (typeof color === "string" && color.trim()) {
      return color as string;
    }
  }
  return undefined;
};

const normalizeStatus = (status: unknown): string | undefined => {
  if (!status) return undefined;
  if (typeof status === "string") return status;
  if (typeof status === "object") {
    const value = (status as Record<string, unknown>).value;
    const label = (status as Record<string, unknown>).label;
    const displayName = (status as Record<string, unknown>).displayName;
    if (typeof value === "string") return value;
    if (typeof label === "string") return label;
    if (typeof displayName === "string") return displayName;
  }
  return undefined;
};

const toDateInstance = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
};

const resolveTimeline = (item: any): { start?: Date; end?: Date } => {
  if (!item) return {};
  const timeline = item.timeline;

  if (Array.isArray(timeline)) {
    return {
      start: toDateInstance(timeline[0]),
      end: toDateInstance(timeline[1])
    };
  }

  if (timeline && typeof timeline === "object") {
    return {
      start: toDateInstance((timeline as Record<string, unknown>).start),
      end: toDateInstance((timeline as Record<string, unknown>).end)
    };
  }

  return {};
};

const resolveDueDateValue = (due: any): string | undefined => {
  if (!due) return undefined;
  if (Array.isArray(due) && due.length > 0) {
    const last = due[due.length - 1];
    if (typeof last === "string") return last;
    if (last && typeof last === "object" && typeof last.newDueDate === "string") {
      return last.newDueDate;
    }
  }
  if (typeof due === "object") {
    if (typeof (due as Record<string, unknown>).newDueDate === "string") {
      return (due as Record<string, unknown>).newDueDate as string;
    }
    if (typeof (due as Record<string, unknown>).dueDate === "string") {
      return (due as Record<string, unknown>).dueDate as string;
    }
  }
  if (typeof due === "string") return due;
  return undefined;
};

const pickDate = (item: any, type: "start" | "end"): Date | undefined => {
  if (!item) return undefined;
  const timeline = resolveTimeline(item);
  const candidates: unknown[] =
    type === "start"
      ? [item.startDate, timeline.start, item.timeline?.[0], item.createdAt, item.plannedStartDate]
      : [
          item.endDate,
          timeline.end,
          item.timeline?.[1],
          item.dueDate,
          item.expectedCompletionDate,
          item.completedAt,
          item.updatedAt,
          item.plannedEndDate
        ];

  for (const candidate of candidates) {
    const date = toDateInstance(candidate);
    if (date) return date;
  }
  return undefined;
};

const nameFromRecord = (record: any): string | undefined => {
  if (!record) return undefined;
  if (typeof record === "string") return record;
  if (record.name && typeof record.name === "string") return record.name;
  const first = record.firstName || record.first_name;
  const last = record.lastName || record.last_name;
  const combined = [first, last].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  if (record.email && typeof record.email === "string") return record.email;
  return undefined;
};

const gatherPersonNames = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => nameFromRecord(entry))
      .filter((name): name is string => Boolean(name));
  }
  const single = nameFromRecord(value);
  return single ? [single] : [];
};

const getAssigneeLabel = (task: any): string | undefined => {
  const sources = [task.assignedTo, task.assignees, task.owner, task.manager, task.managedBy];
  for (const source of sources) {
    const names = gatherPersonNames(source);
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]}, ${names[1]}`;
    if (names.length > 2) return `${names[0]}, ${names[1]} +${names.length - 2}`;
  }
  return undefined;
};

const statusToProgress = (status: unknown, fallbackProgress?: number): number => {
  if (typeof fallbackProgress === "number") {
    return Math.min(100, Math.max(0, fallbackProgress));
  }

  const normalized = normalizeStatus(status);
  if (!normalized) return 0;
  return statusProgressMap[normalized.toLowerCase()] ?? 0;
};

const extractProjectTasks = (payload: any): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const candidates = [payload.data?.data, payload.data?.tasks, payload.data, payload.tasks, payload.projectTasks];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
};

const extractSubtasks = (payload: any): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const candidates = [payload.data?.subtasks, payload.subtasks, payload.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
};

const buildTimelineTasks = (tasks: any[]): TimelineTask[] => {
  if (!Array.isArray(tasks)) return [];

  const timelineTasks: TimelineTask[] = [];

  tasks.forEach((task) => {
    const taskId = task?.id || task?._id;
    const start = pickDate(task, "start");
    const end = pickDate(task, "end");
    const barColor =
      extractStatusColor(task.status) ||
      task.statusColor ||
      task.statusHex ||
      task.color;

    if (taskId && start && end) {
      timelineTasks.push({
        id: String(taskId),
        name: task.taskName || task.name || "Task",
        start,
        end,
        progress: statusToProgress(task.status, task.progress),
        status: normalizeStatus(task.status),
        assignee: getAssigneeLabel(task),
        barColor,
        metadata: { level: "task" }
      });
    }

    if (Array.isArray(task?.subtasks)) {
      task.subtasks.forEach((subtask: any) => {
        const subtaskId = subtask?.id || subtask?._id;
        const subStart = pickDate(subtask, "start");
        const subEnd = pickDate(subtask, "end");
        const subColor =
          extractStatusColor(subtask.status) ||
          subtask.statusColor ||
          subtask.color ||
          barColor;

        if (!subtaskId || !subStart || !subEnd) return;

        timelineTasks.push({
          id: String(subtaskId),
          name: subtask.subtaskName || subtask.name || `${task.taskName || task.name || "Task"} - Subtask`,
          start: subStart,
          end: subEnd,
          progress: statusToProgress(subtask.status, subtask.progress),
          status: normalizeStatus(subtask.status) || normalizeStatus(task.status),
          assignee: getAssigneeLabel(subtask) || getAssigneeLabel(task),
          barColor: subColor,
          metadata: { level: "subtask", parentId: taskId ? String(taskId) : undefined }
        });
      });
    }
  });

  return timelineTasks;
};

const computeTimelineRange = (tasks: TimelineTask[]) => {
  if (!tasks.length) return null;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  tasks.forEach((task) => {
    const start = task.start instanceof Date ? task.start.getTime() : new Date(task.start).getTime();
    const end = task.end instanceof Date ? task.end.getTime() : new Date(task.end).getTime();
    if (Number.isFinite(start)) min = Math.min(min, start);
    if (Number.isFinite(end)) max = Math.max(max, end);
  });

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { start: new Date(min), end: new Date(max) };
};

const summarizeTimelineTasks = (tasks: TimelineTask[]) => {
  if (!tasks.length) {
    return { total: 0, completed: 0, active: 0, upcoming: 0, blocked: 0 };
  }

  const now = Date.now();
  let completed = 0;
  let blocked = 0;
  let upcoming = 0;

  tasks.forEach((task) => {
    const progress = task.progress ?? 0;
    const status = (task.status || "").toString().toLowerCase();
    const end = task.end instanceof Date ? task.end.getTime() : new Date(task.end).getTime();

    if (progress >= 100) completed += 1;
    if (status.includes("block")) blocked += 1;
    if (Number.isFinite(end) && end >= now) upcoming += 1;
  });

  return {
    total: tasks.length,
    completed,
    active: Math.max(0, tasks.length - completed),
    upcoming,
    blocked
  };
};

export default function GanttViewPopover({
  anchorEl,
  open,
  onClose,
  tasks: tasksProp,
  projectId,
  projectName,
  isLoading: isLoadingProp = false
}: GanttViewPopoverProps) {
  const { isDark, colors } = useTheme();

  const { data: projectTasksData, isLoading: isFetchingProjectTasks } = useGetTasksByProjectQuery(projectId || "", {
    skip: !projectId || !open
  });

  const { data: subtasksData, isLoading: isFetchingSubtasks } = useGetAllSubtasksQuery(
    { page: 1, countPerPage: 10000 },
    { skip: !open }
  );
  const { data: projectInfoData } = useGetProjectByIdQuery(projectId || "", {
    skip: !projectId || !open
  });
  const projectDetails = projectInfoData?.data;

  const tasksWithSubtasks = useMemo(() => {
    const baseTasks =
      Array.isArray(tasksProp) && tasksProp.length > 0 ? tasksProp : extractProjectTasks(projectTasksData) || [];

    if (!baseTasks.length) return [];

    const subtasks = extractSubtasks(subtasksData);
    if (!subtasks.length) {
      return baseTasks.map((task) => ({ ...task, subtasks: Array.isArray(task.subtasks) ? task.subtasks : [] }));
    }

    const subtasksByTaskId = new Map<string, any[]>();
    subtasks.forEach((subtask: any) => {
      const parentId = subtask?.taskId || subtask?.task?.id || subtask?.parentTaskId;
      if (!parentId) return;
      const bucket = subtasksByTaskId.get(String(parentId)) || [];
      bucket.push(subtask);
      subtasksByTaskId.set(String(parentId), bucket);
    });

    return baseTasks.map((task) => {
      const taskId = task?.id || task?._id;
      return {
        ...task,
        subtasks: Array.isArray(task.subtasks)
          ? task.subtasks
          : taskId
          ? subtasksByTaskId.get(String(taskId)) || []
          : []
      };
    });
  }, [tasksProp, projectTasksData, subtasksData]);

  const ganttTasks = useMemo(() => buildTimelineTasks(tasksWithSubtasks), [tasksWithSubtasks]);
  const timelineRange = useMemo(() => computeTimelineRange(ganttTasks), [ganttTasks]);
  const taskSummary = useMemo(() => summarizeTimelineTasks(ganttTasks), [ganttTasks]);
  const projectProgress = useMemo(() => calculateProjectProgress(tasksWithSubtasks), [tasksWithSubtasks]);

  const isLoading = isLoadingProp || isFetchingProjectTasks || isFetchingSubtasks;

  const rangeLabel = timelineRange
    ? `${intlRangeFormatter.format(timelineRange.start)} - ${intlRangeFormatter.format(timelineRange.end)}`
    : "No dated tasks yet";

  const projectTimelineRange = projectDetails ? resolveTimeline(projectDetails) : null;
  const projectTimelineLabel =
    projectTimelineRange?.start && projectTimelineRange?.end
      ? `${intlRangeFormatter.format(projectTimelineRange.start)} - ${intlRangeFormatter.format(projectTimelineRange.end)}`
      : "Timeline not set";
  const projectStartLabel =
    formatDateLabel(projectDetails?.startDate || projectTimelineRange?.start || null) || "Not started";
  const projectDueDateValue = resolveDueDateValue(projectDetails?.dueDate);
  const projectDueDateLabel =
    formatDateLabel(projectDueDateValue || projectTimelineRange?.end || null) || "No due date";
  const projectDescription =
    projectDetails?.description || "No project description has been provided yet.";
  const projectProgressValue =
    typeof projectDetails?.progress === "number" ? projectDetails.progress : projectProgress;

  const lightBgColor = isDark ? colors.dark.lightBg : colors.light.lightBg;
  const textColor = isDark ? colors.dark.text : colors.light.text;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      PaperProps={{
        sx: {
          width: "100vw",
          maxHeight: "100vh",
          overflow: "visible",
          backgroundColor: lightBgColor,
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)"
        }
      }}
    >
      <Box
        sx={{
          padding: "20px",
          backgroundColor: lightBgColor,
          color: textColor,
          borderRadius: "12px",
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Gantt Timeline - {projectName}
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? "#9ca3af" : "#4b5563", display: "block", marginTop: 0.5 }}>
              {rangeLabel} - Project progress {projectProgress}%
            </Typography>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800"
            aria-label="Close gantt view"
          >
            <X size={20} />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[220px] space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-slate-400">Project</p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white truncate">{projectDetails?.name || projectName}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2">{projectDescription}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-700 dark:text-slate-200">
            <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
              <p className="text-xs uppercase tracking-wide text-slate-400">Timeline</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{projectTimelineLabel}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
              <p className="text-xs uppercase tracking-wide text-slate-400">Start date</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{projectStartLabel}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
              <p className="text-xs uppercase tracking-wide text-slate-400">Due date</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{projectDueDateLabel}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total items</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{taskSummary.total}</p>
            </div>
          </div>
          <div className="w-full space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Project progress</p>
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500"
                style={{ width: `${Math.min(100, Math.max(0, projectProgressValue))}%` }}
              />
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {Math.round(Math.min(100, Math.max(0, projectProgressValue)))}% complete
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total items</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{taskSummary.total}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-400">Active</p>
            <p className="text-lg font-semibold text-indigo-600">{taskSummary.active}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-400">Completed</p>
            <p className="text-lg font-semibold text-emerald-600">{taskSummary.completed}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-400">Upcoming</p>
            <p className="text-lg font-semibold text-amber-600">
              {taskSummary.upcoming}
              {taskSummary.blocked > 0 && (
                <span className="ml-2 text-xs font-medium text-rose-500">Blocked {taskSummary.blocked}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner dark:border-slate-800 dark:bg-slate-900">
          {isLoading ? (
            <div className="flex h-full min-h-[360px] items-center justify-center">
              <CircularProgress size={32} />
            </div>
          ) : (
            <div className="h-full min-h-[360px] overflow-hidden">
              <GanttChart
                tasks={ganttTasks}
                title="Project schedule"
                description={rangeLabel}
                className="h-full"
                dayWidth={32}
                compactRows
                showToday
              />
            </div>
          )}
        </div>
      </Box>
    </Popover>
  );
}
