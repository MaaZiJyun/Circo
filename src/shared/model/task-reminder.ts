import type { TaskRecord } from "./entities";
import { deadlineTime } from "./task-status";

export type TaskReminderKind = "expectedStart" | "deadline";

export interface TaskReminder {
  task: TaskRecord;
  kind: TaskReminderKind;
  notifyAt: number;
}

const minute = 60_000;

export function taskReminderKey(
  task: TaskRecord,
  kind: TaskReminderKind,
) {
  return `${kind}:${task.id}:${task.dueDate}:${task.estimatedMinutes}`;
}

export function taskReminderTime(
  task: TaskRecord,
  kind: TaskReminderKind,
) {
  const deadline = deadlineTime(task.dueDate);
  return kind === "deadline"
    ? deadline - minute
    : deadline - Math.max(0, task.estimatedMinutes) * minute - minute;
}

export function activeTaskReminders(
  tasks: TaskRecord[],
  currentTime: number,
  dismissed: Set<string>,
) {
  return tasks
    .filter((task) => !task.deletedAt && task.status !== "done")
    .flatMap((task) =>
      (["expectedStart", "deadline"] as const).flatMap((kind) => {
        if (dismissed.has(taskReminderKey(task, kind))) return [];
        const notifyAt = taskReminderTime(task, kind);
        return currentTime >= notifyAt && currentTime <= notifyAt + minute
          ? [{ task, kind, notifyAt } satisfies TaskReminder]
          : [];
      }),
    )
    .sort((a, b) => a.notifyAt - b.notifyAt);
}
