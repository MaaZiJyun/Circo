import type { TaskRecord } from "@/shared/model/entities";
import { formatLocalDateTime } from "@/shared/model/factories";
import type { GanttTaskPatch } from "../view-models/use-project-task-actions";

export const DAY = 86_400_000;
export const HOUR = 3_600_000;
export const ROW_HEIGHT = 52;
export const BAR_HEIGHT = 24;
export const HEADER_HEIGHT = 44;

export type GanttScale = "overall" | "month" | "week" | "day";
export type GanttRow = {
  task: TaskRecord;
  start: number;
  end: number;
  depth: number;
};
export type GanttTick = { value: number; label: string; major: boolean };

export function buildGanttRows(
  tasks: TaskRecord[],
  projectStart: string,
  projectEnd: string,
): GanttRow[] {
  const fallbackStart = safeDate(projectStart, Date.now());
  const fallbackEnd = Math.max(
    fallbackStart + HOUR,
    safeDate(projectEnd, fallbackStart + DAY),
  );
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const depthFor = (task: TaskRecord) => {
    let depth = 0;
    let parentId = task.parentId;
    const visited = new Set<string>();
    while (parentId && depth < 5 && !visited.has(parentId)) {
      visited.add(parentId);
      depth += 1;
      parentId = taskById.get(parentId)?.parentId;
    }
    return depth;
  };
  return dependencyOrder(tasks).map((task) => {
    const end = safeDate(taskDateTime(task.dueDate, true), fallbackEnd);
    const start = safeDate(
      taskDateTime(task.startDate, false),
      end - Math.max(HOUR, task.estimatedMinutes * 60_000),
    );
    return {
      task,
      start,
      end: Math.max(start + 15 * 60_000, end),
      depth: depthFor(task),
    };
  });
}

export function buildOverallRange(
  rows: GanttRow[],
  projectStart: string,
  projectEnd: string,
) {
  if (!rows.length) {
    const start = startOfDay(safeDate(projectStart, Date.now()));
    return {
      start,
      end: Math.max(start + DAY, safeDate(projectEnd, start + DAY)),
    };
  }
  const first = Math.min(...rows.map((row) => row.start));
  const last = Math.max(...rows.map((row) => row.end));
  const padding = Math.max(DAY, (last - first) * 0.04);
  return { start: startOfDay(first - padding), end: endOfDay(last + padding) };
}

export function buildTicks(
  scale: GanttScale,
  start: number,
  end: number,
  locale: string,
): GanttTick[] {
  const ticks: GanttTick[] = [];
  if (scale === "day") {
    for (let value = start; value < end; value += 3 * HOUR)
      ticks.push({ value, label: hour(value, locale), major: true });
    return ticks;
  }
  const days = (end - start) / DAY;
  if (scale === "week" || days <= 14) {
    for (let value = startOfDay(start); value < end; value += DAY)
      ticks.push({ value, label: shortDay(value, locale), major: true });
    return ticks;
  }
  if (scale === "month" || days <= 70) {
    for (let value = startOfWeek(start); value < end; value += 7 * DAY) {
      if (value >= start)
        ticks.push({ value, label: shortDate(value, locale), major: true });
    }
    return ticks;
  }
  for (
    let value = startOfMonth(start);
    value < end;
    value = addMonths(value, 1)
  ) {
    if (value >= start)
      ticks.push({ value, label: monthLabel(value, locale), major: true });
  }
  return ticks;
}

export function buildWeekendBands(start: number, end: number) {
  if ((end - start) / DAY > 100) return [];
  const result: number[] = [];
  for (let value = startOfDay(start); value < end; value += DAY) {
    const weekday = new Date(value).getDay();
    if (weekday === 0 || weekday === 6) result.push(value);
  }
  return result;
}

export function periodRange(
  scale: Exclude<GanttScale, "overall">,
  anchor: number,
) {
  if (scale === "day") {
    const start = startOfDay(anchor);
    return { start, end: start + DAY };
  }
  if (scale === "week") {
    const start = startOfWeek(anchor);
    return { start, end: start + 7 * DAY };
  }
  const start = startOfMonth(anchor);
  return { start, end: addMonths(start, 1) };
}

export function stepPeriod(
  scale: Exclude<GanttScale, "overall">,
  anchor: number,
  direction: 1 | -1,
) {
  if (scale === "day") return anchor + direction * DAY;
  if (scale === "week") return anchor + direction * 7 * DAY;
  return addMonths(anchor, direction);
}

export function createsDependencyCycle(
  tasks: TaskRecord[],
  sourceId: string,
  targetId: string,
) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const visited = new Set<string>();
  const reaches = (id: string): boolean => {
    if (id === targetId) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    return (byId.get(id)?.dependencyIds ?? []).some(reaches);
  };
  return reaches(sourceId);
}

export function isTaskDescendant(
  tasks: TaskRecord[],
  candidateId: string,
  ancestorId: string,
) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const visited = new Set<string>();
  let current = byId.get(candidateId);
  while (current?.parentId && !visited.has(current.parentId)) {
    if (current.parentId === ancestorId) return true;
    visited.add(current.parentId);
    current = byId.get(current.parentId);
  }
  return false;
}

export function schedulePatch(start: number, end: number): GanttTaskPatch {
  return {
    startDate: formatLocalDateTime(start),
    dueDate: formatLocalDateTime(end),
    estimatedMinutes: Math.max(1, Math.round((end - start) / 60_000)),
  };
}

export function startOfDay(value: number) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function formatRange(start: number, end: number, locale: string) {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formatter.format(start)} → ${formatter.format(end)}`;
}

function dependencyOrder(tasks: TaskRecord[]) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const result: TaskRecord[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (task: TaskRecord) => {
    if (visited.has(task.id) || visiting.has(task.id)) return;
    visiting.add(task.id);
    task.dependencyIds.forEach((id) => {
      const dependency = byId.get(id);
      if (dependency) visit(dependency);
    });
    visiting.delete(task.id);
    visited.add(task.id);
    result.push(task);
  };
  tasks.forEach(visit);
  return result;
}

function safeDate(value: string | undefined, fallback: number) {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function taskDateTime(value: string | undefined, useEndOfDay: boolean) {
  if (!value) return "";
  return value.length === 10
    ? `${value}T${useEndOfDay ? "23:59" : "00:00"}`
    : value;
}

function endOfDay(value: number) {
  const date = new Date(value);
  date.setHours(24, 0, 0, 0);
  return date.getTime();
}

function startOfWeek(value: number) {
  const date = new Date(value);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return startOfDay(date.getTime());
}

function startOfMonth(value: number) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

function addMonths(value: number, months: number) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth() + months, 1).getTime();
}

function shortDay(value: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
  }).format(value);
}

function shortDate(value: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(value);
}

function monthLabel(value: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
  }).format(value);
}

function hour(value: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
