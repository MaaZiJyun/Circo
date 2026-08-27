"use client";

import { useMemo } from "react";
import { dailySummaryId } from "@/modules/dashboard/model/daily-summary-message";
import { activeItems } from "@/shared/model/app-state";
import { today } from "@/shared/model/factories";
import { calculateMetrics, progressPercent } from "@/shared/model/metrics";
import { useStore } from "@/shared/view-models/store-context";
import { useDailyTaskCache } from "@/modules/me/view-models/use-daily-task-cache";
import type { DailyTask } from "@/shared/model/entities";

export function useDashboardViewModel() {
  const { state } = useStore();
  const dailyCache = useDailyTaskCache();
  return useMemo(() => {
    if (!state) return null;
    const activeCycle =
      activeItems(state.cycles).find((cycle) => cycle.status === "active") ??
      activeItems(state.cycles)[0];
    const goals = activeItems(state.goals)
      .filter((goal) => !activeCycle || goal.cycleId === activeCycle.id)
      .map((goal) => ({
        ...goal,
        percent: progressPercent(goal.current, goal.target),
      }));
    const recentArtifacts = activeItems(state.artifacts)
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 3);
    const historyTasks: DailyTask[] = activeItems(state.taskHistory ?? []).map((task) => ({
      ...task,
      date: task.completedAt.slice(0, 10),
      dueAt: task.dueDate,
      completed: true,
      sourceTaskId: task.id,
    }));
    return {
      activeCycle,
      goals,
      recentArtifacts,
      sessions: activeItems(state.sessions),
      dailyTasks: [...(dailyCache?.dailyTasks ?? []), ...historyTasks],
      finishedToday: (state.messages ?? []).some(
        (message) => message.id === dailySummaryId(today()),
      ),
      metrics: calculateMetrics(state),
    };
  }, [state, dailyCache]);
}
