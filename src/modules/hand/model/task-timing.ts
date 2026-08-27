import type { ActivityRecord } from "@/shared/model/entities";

export type TaskTiming = {
  plannedStart: number;
  plannedEnd: number;
  actualStart: number | null;
  actualEnd: number | null;
  startDeltaMinutes: number | null;
  endDeltaMinutes: number | null;
  actualDurationMinutes: number | null;
};

export function taskTiming(task: ActivityRecord, now = Date.now()): TaskTiming {
  const plannedStart = parseDate(task.startDate);
  const plannedEnd = parseDate(task.dueDate, true);
  const actualStart = parseDate(task.actualStartedAt);
  const completed = parseDate(task.completedAt);
  const actualEnd = completed ?? (task.status === "doing" ? now : null);
  return {
    plannedStart,
    plannedEnd,
    actualStart,
    actualEnd,
    startDeltaMinutes: actualStart === null ? null : minutes(actualStart - plannedStart),
    endDeltaMinutes: actualEnd === null ? null : minutes(actualEnd - plannedEnd),
    actualDurationMinutes: actualStart !== null && actualEnd !== null
      ? minutes(actualEnd - actualStart)
      : null,
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
