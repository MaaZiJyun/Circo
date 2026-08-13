import type { DailyTask } from "@/shared/model/entities";
import { taskCoordinates } from "@/modules/me/model/task-quadrant";

export interface DailyScore {
  score: number;
  total: number;
  completed: number;
  incomplete: number;
  actualMinutes: number;
  plannedMinutes: number;
  completionScore: number;
  timeScore: number;
  priorityScore: number;
  reason: "empty" | "excellent" | "good" | "partial" | "low";
}

const round = (value: number) => Math.round(value * 10) / 10;

export function calculateDailyScore(
  tasks: DailyTask[],
  date: string,
): DailyScore {
  const active = tasks.filter((task) => !task.deletedAt && task.date === date);
  const completed = active.filter((task) => task.completed);
  const actualMinutes = active.reduce(
    (sum, task) => sum + (task.actualMinutes ?? 0),
    0,
  );
  const plannedMinutes = active.reduce(
    (sum, task) => sum + Math.max(0, task.estimatedMinutes),
    0,
  );
  const scoringTime = new Date(`${date}T23:59:59`).getTime();
  const priority = (task: DailyTask) => {
    const coordinates = taskCoordinates(
      task.dueAt,
      task.estimatedMinutes,
      task.importance,
      scoringTime,
    );
    return (coordinates.urgency + coordinates.importance) / 200;
  };
  const totalPriority = active.reduce((sum, task) => sum + priority(task), 0);
  const completedPriority = completed.reduce(
    (sum, task) => sum + priority(task),
    0,
  );
  const completionScore = active.length
    ? (completed.length / active.length) * 40
    : 0;
  const timeScore = plannedMinutes
    ? Math.min(1, actualMinutes / plannedMinutes) * 30
    : 0;
  const priorityScore = totalPriority
    ? (completedPriority / totalPriority) * 30
    : 0;
  const score = Math.round(completionScore + timeScore + priorityScore);
  return {
    score,
    total: active.length,
    completed: completed.length,
    incomplete: active.length - completed.length,
    actualMinutes: round(actualMinutes),
    plannedMinutes,
    completionScore: round(completionScore),
    timeScore: round(timeScore),
    priorityScore: round(priorityScore),
    reason: !active.length
      ? "empty"
      : score >= 85
        ? "excellent"
        : score >= 65
          ? "good"
          : score >= 40
            ? "partial"
            : "low",
  };
}
