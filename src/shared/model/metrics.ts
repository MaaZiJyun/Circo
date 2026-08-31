import type { AppState } from "./app-state";
import { activeItems } from "./app-state";

export interface GrowthMetrics {
  totalMinutes: number;
  effectiveRate: number | null;
  completionRate: number | null;
  activeProjects: number;
  publishedArtifacts: number;
}

export function calculateMetrics(state: AppState): GrowthMetrics {
  const focus = activeItems(state.focus);
  const totalMinutes = focus.reduce(
    (total, item) => total + item.duration,
    0,
  );
  const effectiveMinutes = focus
    .filter((item) => item.effective)
    .reduce((total, item) => total + item.duration, 0);
  const dueTasks = Array.from(
    new Map(
      activeItems(state.activities).map((item) => [
        item.id,
        item,
      ]),
    ).values(),
  ).filter((item) => {
    const due = Date.parse(item.dueDate);
    return Number.isFinite(due) && due <= Date.now();
  });
  const completedTasks = dueTasks.filter((item) => item.status === "done");

  return {
    totalMinutes,
    effectiveRate: totalMinutes ? effectiveMinutes / totalMinutes : null,
    completionRate: dueTasks.length
      ? completedTasks.length / dueTasks.length
      : null,
    activeProjects: activeItems(state.projects).filter(
      (item) => item.status === "active",
    ).length,
    publishedArtifacts: activeItems(state.artifacts).filter((item) =>
      ["final", "published"].includes(item.status),
    ).length,
  };
}

export function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}
