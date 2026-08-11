"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/shared/i18n/i18n-context";
import { activeItems } from "@/shared/model/app-state";
import type {
  Cycle,
  EventReason,
  Goal,
  WorkSession,
} from "@/shared/model/entities";
import { createId, now, today } from "@/shared/model/factories";
import { calculateMetrics } from "@/shared/model/metrics";
import { useStore } from "@/shared/view-models/store-context";

export type GoalInput = Pick<
  Goal,
  "title" | "target" | "current" | "unit" | "dueDate"
>;
export type CycleInput = Pick<
  Cycle,
  "name" | "startDate" | "endDate" | "cadence"
>;
export type SessionInput = Pick<
  WorkSession,
  "title" | "minutes" | "effective" | "focus" | "output" | "note"
> &
  Pick<WorkSession, "goalId" | "projectId" | "taskId">;
export type EventInput = Pick<
  EventReason,
  | "type"
  | "phenomenon"
  | "reason"
  | "impact"
  | "evidence"
  | "action"
  | "category"
>;

export function useMeViewModel() {
  const { state, mutate, softDelete } = useStore();
  const { locale } = useI18n();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(
      () => setTimerSeconds((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const view = useMemo(() => {
    if (!state) return null;
    const cycle =
      activeItems(state.cycles).find((item) => item.status === "active") ??
      activeItems(state.cycles)[0];
    return {
      cycle,
      goals: activeItems(state.goals).filter(
        (item) => !cycle || item.cycleId === cycle.id,
      ),
      sessions: activeItems(state.sessions)
        .slice()
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
      events: activeItems(state.events)
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      artifacts: activeItems(state.artifacts).filter((item) =>
        ["final", "published"].includes(item.status),
      ),
      projects: activeItems(state.projects),
      tasks: activeItems(state.tasks),
      metrics: calculateMetrics(state),
    };
  }, [state]);

  const addGoal = (input: GoalInput) => {
    if (!view?.cycle) return;
    const stamp = now();
    const goal: Goal = {
      id: createId("goal"),
      cycleId: view.cycle.id,
      priority: "medium",
      status: input.current >= input.target ? "completed" : "active",
      ...input,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({ ...current, goals: [...current.goals, goal] }));
  };

  const addCycle = (input: CycleInput) => {
    const stamp = now();
    const cycle: Cycle = {
      id: createId("cycle"),
      ...input,
      status: "active",
      review: "",
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      cycles: [
        ...current.cycles.map((item) =>
          item.status === "active"
            ? { ...item, status: "archived" as const, updatedAt: stamp }
            : item,
        ),
        cycle,
      ],
    }));
  };

  const archiveCycle = () => {
    if (!view?.cycle) return;
    mutate((current) => ({
      ...current,
      cycles: current.cycles.map((item) =>
        item.id === view.cycle?.id
          ? { ...item, status: "archived", updatedAt: now() }
          : item,
      ),
    }));
  };

  const updateGoal = (id: string, currentValue: number) => {
    mutate((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              current: currentValue,
              status: currentValue >= goal.target ? "completed" : "active",
              updatedAt: now(),
            }
          : goal,
      ),
    }));
  };

  const addSession = (input: SessionInput) => {
    if (!view?.cycle) return;
    const stamp = now();
    const endedAt = stamp;
    const startedAt = new Date(
      Date.now() - input.minutes * 60_000,
    ).toISOString();
    const session: WorkSession = {
      id: createId("session"),
      cycleId: view.cycle.id,
      ...input,
      startedAt,
      endedAt,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      sessions: [...current.sessions, session],
    }));
  };

  const addEvent = (input: EventInput) => {
    if (!view?.cycle) return;
    const stamp = now();
    const event: EventReason = {
      id: createId("event"),
      cycleId: view.cycle.id,
      ...input,
      confirmed: true,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({ ...current, events: [...current.events, event] }));
  };

  const finishTimer = (title: string, output: string) => {
    addSession({
      title,
      output,
      minutes: Math.max(1, Math.ceil(timerSeconds / 60)),
      effective: true,
      focus: 4,
      note: "",
    });
    setTimerSeconds(0);
    setTimerRunning(false);
  };

  const generateReview = () => {
    if (!view?.cycle) return;
    const effective =
      view.metrics.effectiveRate === null
        ? "—"
        : `${Math.round(view.metrics.effectiveRate * 100)}%`;
    const completed = view.goals.filter(
      (item) => item.status === "completed",
    ).length;
    const successes = view.events
      .filter((item) => item.type === "success")
      .map((item) => item.reason)
      .join("；");
    const errors = view.events
      .filter((item) => item.type === "error")
      .map((item) => item.action)
      .join("；");
    const review =
      locale === "zh-CN"
        ? `# ${view.cycle.name}复盘\n\n- 总投入：${view.metrics.totalMinutes} 分钟\n- 有效投入率：${effective}\n- 完成目标：${completed}/${view.goals.length}\n- 成功经验：${successes || "待补充"}\n- 改进措施：${errors || "待补充"}\n- 下一周期行动：待确认`
        : `# ${view.cycle.name} review\n\n- Total effort: ${view.metrics.totalMinutes} minutes\n- Effective rate: ${effective}\n- Goals completed: ${completed}/${view.goals.length}\n- Successes: ${successes || "To complete"}\n- Improvements: ${errors || "To complete"}\n- Next-cycle action: To confirm`;
    mutate((current) => ({
      ...current,
      cycles: current.cycles.map((item) =>
        item.id === view.cycle?.id
          ? { ...item, review, updatedAt: now() }
          : item,
      ),
    }));
  };

  if (!view) return null;

  return {
    ...view,
    timerSeconds,
    timerRunning,
    setTimerRunning,
    addGoal,
    addCycle,
    archiveCycle,
    updateGoal,
    addSession,
    addEvent,
    finishTimer,
    generateReview,
    deleteGoal: (id: string) => softDelete("goals", id),
    today: today(),
  };
}
