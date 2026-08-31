"use client";

import { useEffect } from "react";
import {
  buildDailySummaryMessage,
  dailySummaryId,
} from "@/modules/dashboard/model/daily-summary-message";
import { useI18n } from "@/shared/i18n/i18n-context";
import { now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";
import { useDailyTaskCache } from "@/modules/me/view-models/use-daily-task-cache";
import type { DailyTask } from "@/shared/model/entities";

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function latestDueDate(current: Date) {
  const cutoff = new Date(current);
  cutoff.setHours(23, 59, 0, 0);
  if (current < cutoff) cutoff.setDate(cutoff.getDate() - 1);
  return dateKey(cutoff);
}

function nextSummaryTime(current: Date) {
  const next = new Date(current);
  next.setHours(23, 59, 0, 0);
  if (next <= current) next.setDate(next.getDate() + 1);
  return next.getTime();
}

export function DailySummaryScheduler() {
  const { t, formatNumber } = useI18n();
  const { state, mutate } = useStore();
  const dailyCache = useDailyTaskCache();

  useEffect(() => {
    if (!state) return;
    const current = new Date();
    const dueDate = latestDueDate(current);
    const existing = new Set((state.messages ?? []).map((item) => item.id));
    const archivedTasks: DailyTask[] = state.activities
      .filter((task) => !task.deletedAt && task.archivedAt && task.completedAt)
      .map((task) => ({
        ...task,
        date: task.completedAt!.slice(0, 10),
        dueAt: task.dueDate,
        completed: true,
        sourceTaskId: task.id,
      }));
    const historicalTasks = archivedTasks;
    const allDailyTasks = [...(dailyCache?.dailyTasks ?? []), ...historicalTasks];
    const historicalDates = historicalTasks
      .filter((task) => task.date <= dueDate)
      .map((task) => task.date);
    const dates = [...new Set([...historicalDates, dueDate])]
      .filter((date) => !existing.has(dailySummaryId(date)))
      .sort();
    if (dates.length) {
      const stamp = now();
      const generated = dates.map(
        (date) =>
          buildDailySummaryMessage({
            dailyTasks: allDailyTasks,
            date,
            stamp,
            t,
            formatNumber,
          }).message,
      );
      mutate((currentState) => ({
        ...currentState,
        messages: [...(currentState.messages ?? []), ...generated],
      }));
    }
    const timer = window.setTimeout(
      () => window.dispatchEvent(new Event("circo-daily-summary")),
      nextSummaryTime(current) - current.getTime() + 100,
    );
    const refresh = () => mutate((currentState) => ({ ...currentState }));
    window.addEventListener("circo-daily-summary", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("circo-daily-summary", refresh);
    };
  }, [dailyCache, formatNumber, mutate, state, t]);

  return null;
}
