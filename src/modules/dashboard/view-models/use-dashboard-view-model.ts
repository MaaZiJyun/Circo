"use client";

import { useMemo } from "react";
import { activeItems } from "@/shared/model/app-state";
import { calculateMetrics, progressPercent } from "@/shared/model/metrics";
import { useStore } from "@/shared/view-models/store-context";

export function useDashboardViewModel() {
  const { state } = useStore();
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
    return {
      activeCycle,
      goals,
      recentArtifacts,
      metrics: calculateMetrics(state),
    };
  }, [state]);
}
