import type { DailyTask, ActivityRecord } from "./entities";

export function deadlineTime(value: string) {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T23:59:59.999`
    : value;
  return Date.parse(normalized);
}

export function isOverdue(
  dueAt: string,
  completed: boolean,
  currentTime = Date.now(),
) {
  const deadline = deadlineTime(dueAt);
  return !completed && Number.isFinite(deadline) && currentTime > deadline;
}

export function taskStatusAt(
  task: ActivityRecord,
  currentTime = Date.now(),
): ActivityRecord["status"] {
  if (task.status === "done") return "done";
  if (isOverdue(task.dueDate, false, currentTime)) return "overdue";
  return task.status === "overdue" ? "todo" : task.status;
}

export function dailyTaskStatusAt(
  task: DailyTask,
  currentTime = Date.now(),
): ActivityRecord["status"] {
  if (task.completed) return "done";
  return isOverdue(task.dueAt, false, currentTime) ? "overdue" : "todo";
}
