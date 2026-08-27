import type { ActivityRecord } from "./entities";
import { deadlineTime } from "./task-status";

export type TaskReminderKind = "expectedStart" | "deadline";

export interface TaskReminder {
  task: ActivityRecord;
  kind: TaskReminderKind;
  notifyAt: number;
}

const minute = 60_000;

export function taskReminderKey(
  task: ActivityRecord,
  kind: TaskReminderKind,
) {
  return `${kind}:${task.id}:${task.dueDate}:${task.estimatedMinutes}`;
}

export function taskReminderTime(
  task: ActivityRecord,
  kind: TaskReminderKind,
) {
  const deadline = deadlineTime(task.dueDate);
  return kind === "deadline"
    ? deadline - minute
    : deadline - Math.max(0, task.estimatedMinutes) * minute - minute;
}

export function activeTaskReminders(
  activities: ActivityRecord[],
  currentTime: number,
  dismissed: Set<string>,
) {
  return activities
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
