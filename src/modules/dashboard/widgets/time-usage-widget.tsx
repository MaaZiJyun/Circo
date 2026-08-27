"use client";

import { useEffect, useMemo, useState } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useI18n } from "@/shared/i18n/i18n-context";
import { today } from "@/shared/model/factories";
import { activeItems } from "@/shared/model/app-state";
import type { ActivityType } from "@/shared/model/entities";
import { useStore } from "@/shared/view-models/store-context";

const colors = ["#18181b", "#2563eb", "#d97706", "#16a34a", "#a855f7", "#dc2626"];

export function TimeUsageWidget() {
  const { state } = useStore();
  const { t } = useI18n();
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    const update = () => setCurrentTime(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const items = useMemo(() => {
    if (!state || !currentTime) return [];
    const activities = new Map(activeItems(state.activities).map((item) => [item.id, item]));
    const projectNames = new Map(activeItems(state.projects).map((item) => [item.id, item.name]));
    const startOfDay = new Date(`${today()}T00:00:00`).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    const current = Math.min(Math.max(currentTime, startOfDay), endOfDay);
    const totals = new Map<string, number>();

    for (const track of activeItems(state.focus)) {
      const started = new Date(track.startedAt).getTime();
      const ended = new Date(track.endedAt).getTime();
      if (!Number.isFinite(started) || !Number.isFinite(ended) || ended <= startOfDay || started >= endOfDay) continue;
      const minutes = Math.max(0, Math.min(ended, endOfDay) - Math.max(started, startOfDay)) / 60_000;
      if (!minutes) continue;
      const activity = activities.get(track.focusOn);
      const category = activity?.projectId
        ? projectNames.get(activity.projectId) ?? t("dashboard.timeUsage.unknown")
        : activity?.activityType
          ? t(`activity.${activity.activityType}` as `activity.${ActivityType}`)
          : t("dashboard.timeUsage.uncategorized");
      totals.set(category, (totals.get(category) ?? 0) + minutes);
    }

    const trackedMinutes = [...totals.values()].reduce((sum, value) => sum + value, 0);
    const elapsedMinutes = (current - startOfDay) / 60_000;
    const unusedMinutes = Math.max(0, elapsedMinutes - trackedMinutes);
    const remainingMinutes = Math.max(0, (endOfDay - currentTime) / 60_000);
    const categories = [...totals.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([label, minutes], index) => ({ label, minutes, color: colors[index % colors.length] }));
    if (unusedMinutes > 0) categories.push({ label: t("dashboard.timeUsage.unused"), minutes: unusedMinutes, color: "#a1a1aa" });
    if (remainingMinutes > 0) categories.push({ label: t("dashboard.timeUsage.remaining"), minutes: remainingMinutes, color: "#e4e4e7" });
    return categories.map((item) => ({ ...item, percent: (item.minutes / (24 * 60)) * 100 }));
  }, [state, t, currentTime]);

  const trackedMinutes = items
    .filter((item) => item.label !== t("dashboard.timeUsage.unused") && item.label !== t("dashboard.timeUsage.remaining"))
    .reduce((sum, item) => sum + item.minutes, 0);
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <ClockIcon className="size-4" />
            {t("dashboard.timeUsage.title")}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{t("dashboard.timeUsage.subtitle")}</p>
        </div>
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {Math.round(trackedMinutes)} {t("common.minutes")}
        </span>
      </div>
      {items.length ? (
        <div className="mt-5">
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" aria-label={t("dashboard.timeUsage.title")}>
            {items.map((item) => (
              <div
                key={item.label}
                className="h-full min-w-0 transition-[width] duration-500 first:rounded-l-full last:rounded-r-full"
                style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                title={`${item.label}: ${item.percent.toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="mt-4 grid gap-x-5 gap-y-2 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.label} className="flex min-w-0 items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2 truncate text-zinc-700 dark:text-zinc-300">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <span className="shrink-0 tabular-nums text-zinc-500">{item.percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">{t("dashboard.timeUsage.empty")}</p>
      )}
    </section>
  );
}
