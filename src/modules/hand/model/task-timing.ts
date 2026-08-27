import type { ActivityRecord, FocusRecord } from "@/shared/model/entities";

export type TaskTiming = {
  plannedStart: number;
  plannedEnd: number;
  actualStart: number | null;
  actualEnd: number | null;
  startDeltaMinutes: number | null;
  endDeltaMinutes: number | null;
  actualDurationMinutes: number | null;
};

export function taskTiming(
  task: ActivityRecord,
  now = Date.now(),
  focusRecords: FocusRecord[] = [],
): TaskTiming {
  const plannedStart = parseDate(task.startDate);
  const plannedEnd = parseDate(task.dueDate, true);
  const relatedFocus = focusRecords
    .filter((focus) => focus.focusOn === task.id)
    .map((focus) => ({
      start: parseDate(focus.startedAt),
      end: parseDate(focus.endedAt),
      duration: Number.isFinite(focus.duration) ? Math.max(0, focus.duration) : 0,
    }))
    .filter((focus) => Number.isFinite(focus.start));
  const actualStart = relatedFocus.length
    ? Math.min(...relatedFocus.map((focus) => focus.start))
    : parseDate(task.actualStartedAt);
  const completed = parseDate(task.completedAt);
  const actualEnd = relatedFocus.length
    ? Math.max(
        ...relatedFocus
          .map((focus) => focus.end)
          .filter((value): value is number => Number.isFinite(value)),
      )
    : completed ?? (task.status === "doing" ? now : null);
  const safeActualStart = Number.isFinite(actualStart) ? actualStart : null;
  const safeActualEnd = Number.isFinite(actualEnd) ? actualEnd : null;
  const actualDurationMinutes = relatedFocus.length
    ? relatedFocus.reduce((total, focus) => total + focus.duration, 0)
    : safeActualStart !== null && safeActualEnd !== null
      ? minutes(safeActualEnd - safeActualStart)
      : null;
  return {
    plannedStart,
    plannedEnd,
    actualStart: safeActualStart,
    actualEnd: safeActualEnd,
    startDeltaMinutes:
      safeActualStart !== null && Number.isFinite(plannedStart)
        ? minutes(safeActualStart - plannedStart)
        : null,
    endDeltaMinutes:
      safeActualEnd !== null && Number.isFinite(plannedEnd)
        ? minutes(safeActualEnd - plannedEnd)
        : null,
    actualDurationMinutes,
  };
}

export function formatTimingDelta(deltaMinutes: number | null) {
  if (deltaMinutes === null) return "—";
  const absolute = formatDuration(Math.abs(deltaMinutes));
  return deltaMinutes > 0 ? `+${absolute}` : deltaMinutes < 0 ? `-${absolute}` : "0m";
}

export function formatDuration(value: number) {
  const total = Math.abs(Math.round(value));
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function parseDate(value?: string, endOfDay = false) {
  if (!value) return Number.NaN;
  const normalized = value.length === 10 ? `${value}T${endOfDay ? "23:59" : "00:00"}` : value;
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function minutes(value: number) {
  return Math.round(value / 60_000);
}
