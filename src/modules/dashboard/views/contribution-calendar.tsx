"use client";

import { useMemo, useState } from "react";
import { SectionHeader } from "@/shared/components/page-elements";
import { Card } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { WorkSession } from "@/shared/model/entities";

const levels = [
  "bg-zinc-100 dark:bg-zinc-900",
  "bg-zinc-300 dark:bg-zinc-700",
  "bg-zinc-500 dark:bg-zinc-500",
  "bg-zinc-700 dark:bg-zinc-300",
  "bg-zinc-950 dark:bg-zinc-50",
];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function intensity(minutes: number) {
  if (!minutes) return 0;
  if (minutes <= 30) return 1;
  if (minutes <= 60) return 2;
  if (minutes <= 120) return 3;
  return 4;
}

function buildDays(sessions: WorkSession[], year: number) {
  const minutesByDay = new Map<string, number>();
  for (const session of sessions) {
    const key = dateKey(new Date(session.startedAt));
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + session.minutes);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(year, 0, 1);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(year, 11, 31);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const length = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Array.from({ length }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const hidden = date.getFullYear() !== year || date > today;
    return {
      date,
      hidden,
      minutes: hidden ? 0 : (minutesByDay.get(dateKey(date)) ?? 0),
    };
  });
}

export function ContributionCalendar({
  sessions,
}: {
  sessions: WorkSession[];
}) {
  const { t, locale, formatNumber } = useI18n();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const years = Array.from({ length: 5 }, (_, index) => currentYear - index);
  const days = useMemo(
    () => buildDays(sessions, selectedYear),
    [sessions, selectedYear],
  );
  const total = days.reduce((sum, day) => sum + day.minutes, 0);
  const dayNames = Array.from({ length: 7 }, (_, day) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(
      new Date(2026, 7, 2 + day),
    ),
  );
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });
  const monthLabels = days
    .map((day, index) => ({ day, index }))
    .filter(({ day }) => !day.hidden && day.date.getDate() === 1)
    .map(({ day, index }) => ({
      label: monthFormatter.format(day.date),
      week: Math.floor(index / 7),
    }));
  return (
    <Card>
      <SectionHeader
        title={t("dashboard.contributions")}
        action={
          <span className="text-xs text-zinc-500">
            {formatNumber(total / 60, { maximumFractionDigits: 1 })} {t("common.hours")}
          </span>
        }
      />
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2">
            <div className="mt-5 grid grid-rows-7 gap-1 pt-px text-[10px] leading-3 text-zinc-400">
              {dayNames.map((name, index) => (
                <span key={index} className="h-3">
                  {index % 2 ? name : ""}
                </span>
              ))}
            </div>
            <div>
              <div className="relative h-5 text-[10px] text-zinc-500">
                {monthLabels.map((month) => (
                  <span
                    key={`${month.week}-${month.label}`}
                    className="absolute whitespace-nowrap"
                    style={{ left: `${month.week * 16}px` }}
                  >
                    {month.label}
                  </span>
                ))}
              </div>
              <div className="grid grid-flow-col grid-rows-7 gap-1">
                {days.map((day) => {
                  const label = `${dateFormatter.format(day.date)}: ${formatNumber(day.minutes)} ${t("common.minutes")}`;
                  return (
                    <span
                      key={dateKey(day.date)}
                      title={day.hidden ? undefined : label}
                      aria-label={day.hidden ? undefined : label}
                      aria-hidden={day.hidden || undefined}
                      className={`size-3 rounded-[3px] ${day.hidden ? "bg-transparent" : levels[intensity(day.minutes)]}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <nav
          aria-label={t("dashboard.selectYear")}
          className="grid w-32 shrink-0 gap-1 border-l border-zinc-200 pl-3 dark:border-zinc-800"
        >
          {years.map((year) => (
            <button
              key={year}
              aria-pressed={year === selectedYear}
              onClick={() => setSelectedYear(year)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${year === selectedYear ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}
            >
              {year}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-xs text-zinc-500">
        <span className="mr-1">{t("dashboard.less")}</span>
        {levels.map((color) => (
          <span key={color} className={`size-3 rounded-[3px] ${color}`} />
        ))}
        <span className="ml-1">{t("dashboard.more")}</span>
      </div>
    </Card>
  );
}
