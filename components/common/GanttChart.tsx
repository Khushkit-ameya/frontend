"use client";

import React, { CSSProperties, useMemo } from "react";
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isBefore,
  isWithinInterval,
  startOfDay
} from "date-fns";
import clsx from "clsx";

export interface GanttTask {
  id: string;
  name: string;
  start: Date | string;
  end: Date | string;
  progress?: number; // value from 0-100
  status?: string;
  barColor?: string;
  assignee?: string;
  metadata?: Record<string, unknown>;
}

export interface GanttChartProps {
  tasks: GanttTask[];
  dateRange?: {
    start: Date | string;
    end: Date | string;
  };
  title?: string;
  description?: string;
  className?: string;
  dayWidth?: number;
  showToday?: boolean;
  compactRows?: boolean;
  onTaskClick?: (task: GanttTask) => void;
}

const STATUS_COLORS: Record<string, { bar: string; progress: string }> = {
  pending: { bar: "#cbd5f5", progress: "#4c6ef5" },
  "in progress": { bar: "#fee2cc", progress: "#f97316" },
  blocked: { bar: "#ffe3e3", progress: "#e03131" },
  completed: { bar: "#dcfce7", progress: "#16a34a" },
  default: { bar: "#e2e8f0", progress: "#64748b" }
};

const parseToDate = (value: Date | string): Date => {
  if (value instanceof Date) {
    return startOfDay(value);
  }

  const parsed = new Date(value);
  return startOfDay(parsed);
};

const clampDate = (value: Date, floor: Date, ceil: Date): Date => {
  if (isBefore(value, floor)) return floor;
  if (isBefore(ceil, value)) return ceil;
  return value;
};

const getStatusColors = (task: GanttTask) => {
  if (task.barColor) {
    return {
      bar: task.barColor,
      progress: STATUS_COLORS.default.progress
    };
  }

  if (!task.status) return STATUS_COLORS.default;
  const normalized = task.status.trim().toLowerCase();
  return STATUS_COLORS[normalized] || STATUS_COLORS.default;
};

const formatRangeLabel = (start: Date, end: Date) => {
  const sameMonth = format(start, "MMM") === format(end, "MMM");
  const sameDay = differenceInCalendarDays(end, start) === 0;

  if (sameDay) {
    return format(start, "MMM d, yyyy");
  }

  if (sameMonth) {
    return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
  }

  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
};

const DEFAULT_EMPTY_STATES = {
  title: "No timeline data",
  body: "Provide tasks with start and end dates to see them on the Gantt chart."
};

const DEFAULT_DAY_WIDTH = 36;
const MIN_TIMELINE_DAYS = 7;

type LayoutTask = GanttTask & {
  clampedStart: Date;
  clampedEnd: Date;
  offsetDays: number;
  durationDays: number;
  barStyle: CSSProperties;
  progressStyle: CSSProperties;
  statusColors: { bar: string; progress: string };
};

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  dateRange,
  title = "Timeline overview",
  description = "Visualise task durations, overlaps, and progress",
  className,
  dayWidth = DEFAULT_DAY_WIDTH,
  showToday = true,
  compactRows = false,
  onTaskClick
}) => {
  const normalizedTasks:any = useMemo(() => {
    return tasks
      .map((task) => {
        try {
          const start = parseToDate(task.start);
          const rawEnd = parseToDate(task.end);
          const end = isBefore(rawEnd, start) ? start : rawEnd;

          return {
            ...task,
            start,
            end
          };
        } catch (error) {
          console.warn("[GanttChart] Failed to normalise task:", task, error);
          return null;
        }
      })
      .filter((value) => Boolean(value))
      .sort((a:any, b:any) => a.start.getTime() - b.start.getTime());
  }, [tasks]);

  const [timelineStart, timelineEnd] = useMemo(() => {
    if (dateRange) {
      const start = parseToDate(dateRange.start);
      const endCandidate = parseToDate(dateRange.end);
      const end = isBefore(endCandidate, start) ? start : endCandidate;
      return [start, end];
    }

    if (normalizedTasks.length) {
      const start = normalizedTasks[0].start;
      const end = normalizedTasks.reduce(
        (latest:any, task:any) => (isBefore(latest, task.end) ? task.end : latest),
        normalizedTasks[0].end
      );
      return [start, end];
    }

    const today = startOfDay(new Date());
    return [today, addDays(today, MIN_TIMELINE_DAYS - 1)];
  }, [dateRange, normalizedTasks]);

  const safeTimelineEnd = useMemo(() => {
    if (differenceInCalendarDays(timelineEnd, timelineStart) + 1 >= MIN_TIMELINE_DAYS) {
      return timelineEnd;
    }
    return addDays(timelineStart, MIN_TIMELINE_DAYS - 1);
  }, [timelineStart, timelineEnd]);

  const timelineDays = useMemo(() => {
    return eachDayOfInterval({
      start: timelineStart,
      end: safeTimelineEnd
    });
  }, [timelineStart, safeTimelineEnd]);

  const chartWidth = useMemo(() => Math.max(1, timelineDays.length * dayWidth), [timelineDays.length, dayWidth]);

  const tasksWithLayout: LayoutTask[] = useMemo(() => {
    return normalizedTasks.map((task:any) => {
      const clampedStart = clampDate(task.start, timelineStart, safeTimelineEnd);
      const clampedEnd = clampDate(task.end, clampedStart, safeTimelineEnd);

      const offsetDays = differenceInCalendarDays(clampedStart, timelineStart);
      const durationDays = Math.max(1, differenceInCalendarDays(clampedEnd, clampedStart) + 1);

      const colors = getStatusColors(task);
      const percent = Math.min(100, Math.max(0, task.progress ?? 0));

      return {
        ...task,
        clampedStart,
        clampedEnd,
        offsetDays,
        durationDays,
        statusColors: colors,
        barStyle: {
          left: offsetDays * dayWidth,
          width: durationDays * dayWidth,
          backgroundColor: colors.bar
        } satisfies CSSProperties,
        progressStyle: {
          width: `${percent}%`,
          backgroundColor: colors.progress
        } satisfies CSSProperties
      } as LayoutTask;
    });
  }, [normalizedTasks, timelineStart, safeTimelineEnd, dayWidth]);

  const todayMarker = useMemo(() => {
    if (!showToday) return null;
    const today = startOfDay(new Date());
    const withinTimeline = isWithinInterval(today, {
      start: timelineStart,
      end: safeTimelineEnd
    });

    if (!withinTimeline) return null;

    const offset = differenceInCalendarDays(today, timelineStart) * dayWidth;
    return {
      label: format(today, "MMM d"),
      style: {
        left: offset
      } satisfies CSSProperties
    };
  }, [showToday, timelineStart, safeTimelineEnd, dayWidth]);

  const statusLegend = useMemo(() => {
    const legend = new Map<string, { label: string; colors: { bar: string; progress: string } }>();
    tasksWithLayout.forEach((task) => {
      const label = task.status?.trim();
      if (!label) return;
      const key = label.toLowerCase();
      if (!legend.has(key)) {
        legend.set(key, { label, colors: task.statusColors });
      }
    });
    return Array.from(legend.values());
  }, [tasksWithLayout]);

  return (
    <section className={clsx("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      <header className="border-b border-slate-100 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-slate-900">{title}</p>
            <p className="text-sm text-slate-500">{description}</p>
          </div>

          {statusLegend.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wide text-slate-400">Legend</span>
              {statusLegend.map(({ label, colors }) => (
                <span key={label} className="flex items-center gap-1.5 capitalize">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: colors.bar }} />
                  <span className="text-slate-600">{label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="divide-y divide-slate-100">
        <div className="flex bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div className="w-72 flex-shrink-0 px-4 py-2">Task</div>
          <div className="flex-1 overflow-hidden">
            <div className="relative overflow-x-auto">
              <div className="min-w-full" style={{ width: chartWidth }}>
                <div className="flex">
                  {timelineDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={clsx(
                        "flex h-10 flex-col items-center justify-center border-l border-slate-100 text-[11px] text-slate-500",
                        format(day, "d") === "1" && "bg-slate-100 font-semibold text-slate-700"
                      )}
                      style={{ width: dayWidth }}
                    >
                      <span>{format(day, "MMM")}</span>
                      <span>{format(day, "d")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {!tasksWithLayout.length ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-base font-semibold text-slate-800">{DEFAULT_EMPTY_STATES.title}</p>
            <p className="text-sm text-slate-500">{DEFAULT_EMPTY_STATES.body}</p>
          </div>
        ) : (
          <div className="max-h-[480px] overflow-auto">
            {tasksWithLayout.map((task:any) => {
              const progressPercent = Math.round(Math.min(100, Math.max(0, task.progress ?? 0)));
              const startLabel = format(task.start, "EEE, dd MMM");
              const endLabel = format(task.end, "EEE, dd MMM");

              return (
                <div
                  key={task.id}
                  className="flex border-b border-slate-100 last:border-none hover:bg-slate-50"
                  role={onTaskClick ? "button" : "group"}
                  tabIndex={onTaskClick ? 0 : -1}
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className="w-72 flex-shrink-0 px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-3 w-3 rounded-full"
                          style={{ backgroundColor: task.statusColors.bar }}
                        />
                        <p className="text-sm font-semibold text-slate-900">{task.name}</p>
                      </div>
                      <div className="relative h-7 w-7" title={`${progressPercent}% complete`}>
                        <span
                          className="absolute inset-0 rounded-full"
                          style={{
                            backgroundImage: `conic-gradient(${task.statusColors.progress} ${progressPercent * 3.6}deg, #e2e8f0 ${progressPercent * 3.6}deg)`
                          }}
                        />
                        <span className="absolute inset-[0.2rem] flex items-center justify-center rounded-full bg-white text-[10px] font-semibold text-slate-600 shadow-inner">
                          {progressPercent}%
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400">Start:</span>
                        <strong className="text-slate-700">{startLabel}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400">Due:</span>
                        <strong className="text-slate-700">{endLabel}</strong>
                      </span>
                      {task.assignee && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <span className="text-slate-400">Owner:</span>
                          <span className="font-medium text-slate-700">{task.assignee}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative flex-1 overflow-x-auto bg-white">
                    <div className="relative" style={{ width: chartWidth, height: compactRows ? 40 : 56 }}>
                      <div className="absolute inset-0 flex">
                        {timelineDays.map((day) => (
                          <div
                            key={`grid-${task.id}-${day.toISOString()}`}
                            className="border-l border-slate-100"
                            style={{ width: dayWidth }}
                          />
                        ))}
                      </div>

                      {todayMarker && (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-y-0 border-l-2 border-dashed border-rose-400"
                          style={todayMarker.style}
                        >
                          <span className="absolute -top-5 -translate-x-1/2 rounded bg-rose-50 px-1 text-[10px] font-semibold uppercase tracking-wide text-rose-500">
                            Today
                          </span>
                        </div>
                      )}

                      <div
                        className={clsx(
                          "absolute inset-y-1 flex flex-col justify-center rounded-md border border-slate-200 shadow-sm transition hover:shadow-md",
                          onTaskClick && "cursor-pointer"
                        )}
                        style={task.barStyle}
                      >
                        <div className="px-3 text-xs font-semibold text-slate-700">{task.name}</div>
                        <div className="h-1.5 w-full rounded-b-md bg-slate-200">
                          <div className="h-full rounded-b-md" style={task.progressStyle} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default GanttChart;
