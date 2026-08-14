"use client";

import { useEffect } from "react";
import { calculateDailyScore } from "@/modules/dashboard/model/daily-score";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { FutureMessage } from "@/shared/model/message";
import { now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";

const summaryId = (date: string) => `message_daily_summary_${date}`;

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

  useEffect(() => {
    if (!state) return;
    const current = new Date();
    const dueDate = latestDueDate(current);
    const existing = new Set((state.messages ?? []).map((item) => item.id));
    const historicalDates = state.dailyTasks
      .filter((task) => task.date <= dueDate)
      .map((task) => task.date);
    const dates = [...new Set([...historicalDates, dueDate])]
      .filter((date) => !existing.has(summaryId(date)))
      .sort();
    if (dates.length) {
      const stamp = now();
      const generated = dates.map((date) => {
        const tasks = state.dailyTasks.filter(
          (task) => task.date === date && !task.deletedAt,
        );
        const result = calculateDailyScore(state.dailyTasks, date);
        const taskLines = tasks.length
          ? tasks.map(
              (task) =>
                `${task.completed ? "✓" : "○"} ${task.title} · ${formatNumber(task.actualMinutes, { maximumFractionDigits: 1 })} ${t("common.minutes")}`,
            )
          : [t("messages.dailySummary.noTasks")];
        const breakdown = t("dashboard.scoreBreakdown")
          .replace("{completed}", String(result.completed))
          .replace("{incomplete}", String(result.incomplete))
          .replace(
            "{actual}",
            formatNumber(result.actualMinutes, { maximumFractionDigits: 1 }),
          )
          .replace("{planned}", formatNumber(result.plannedMinutes))
          .replace("{completionScore}", formatNumber(result.completionScore))
          .replace("{timeScore}", formatNumber(result.timeScore))
          .replace("{priorityScore}", formatNumber(result.priorityScore));
        return {
          id: summaryId(date),
          subject: t("messages.dailySummary.subject").replace("{date}", date),
          body: [
            t("messages.dailySummary.intro").replace("{date}", date),
            "",
            t("messages.dailySummary.activities"),
            ...taskLines,
            "",
            `score: ${result.score} / 100`,
            t("dashboard.scoreFormula"),
            breakdown,
            t(`dashboard.scoreReason.${result.reason}`),
          ].join("\n"),
          recipient: "futureSelf",
          deliveryMode: "scheduled",
          deliverAt: `${date}T23:59:00`,
          references: tasks.flatMap((task) =>
            task.sourceTaskId
              ? [
                  {
                    kind: "task" as const,
                    id: task.sourceTaskId,
                    label: task.title,
                  },
                ]
              : [],
          ),
          attachments: [],
          systemGenerated: true,
          messageType: "dailySummary",
          createdAt: stamp,
          updatedAt: stamp,
        } satisfies FutureMessage;
      });
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
  }, [formatNumber, mutate, state, t]);

  return null;
}
