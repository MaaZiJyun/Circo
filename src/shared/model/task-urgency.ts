import type { DailyTask, TaskRecord } from "./entities";
import type { TaskUrgencyInputs } from "./task-urgency-types";

type UrgencyTask = Pick<TaskRecord, "id" | "dueDate"> &
  Partial<TaskUrgencyInputs>;
type AnyUrgencyTask =
  | UrgencyTask
  | (Pick<DailyTask, "id" | "dueAt" | "sourceTaskId"> &
      Partial<TaskUrgencyInputs>);

export const defaultTaskUrgency: TaskUrgencyInputs = {
  delayLoss: 3,
  dependencyIds: [],
};
const score = (value: unknown, fallback = 3) =>
  Math.max(1, Math.min(5, Math.round(Number(value) || fallback)));

export function taskDueRange(
  deadline: string,
  currentTime = Date.now(),
): number {
  if (!deadline) return 1;
  const due = new Date(deadline).getTime();
  if (!Number.isFinite(due)) return 1;
  const days = (due - currentTime) / 86_400_000;
  if (days > 60) return 2;
  if (days > 14) return 3;
  if (days > 1) return 4;
  return 5;
}

export function taskBlocking(taskId: string, tasks: AnyUrgencyTask[]): number {
  const count = tasks.filter(
    (task) => task.id !== taskId && (task.dependencyIds ?? []).includes(taskId),
  ).length;
  return Math.min(5, count);
}

export function taskUrgency(
  task: AnyUrgencyTask,
  tasks: AnyUrgencyTask[],
  currentTime = Date.now(),
) {
  const targetId =
    "sourceTaskId" in task && task.sourceTaskId ? task.sourceTaskId : task.id;
  const deadline = "dueDate" in task ? task.dueDate : task.dueAt;
  const deadlineScore = taskDueRange(deadline, currentTime);
  const delayLoss = score(task.delayLoss);
  const blocking = taskBlocking(targetId, tasks);
  return {
    deadline: deadlineScore,
    delayLoss,
    blocking,
    urgency: deadlineScore + delayLoss + blocking,
  };
}

export function normalizeTaskUrgency(
  value: Partial<TaskUrgencyInputs>,
): TaskUrgencyInputs {
  return {
    delayLoss: score(value.delayLoss),
    dependencyIds: Array.isArray(value.dependencyIds)
      ? value.dependencyIds.filter((id): id is string => typeof id === "string")
      : [],
  };
}
