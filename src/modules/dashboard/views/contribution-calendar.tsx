"use client";

import { useMemo, useState } from "react";
import { SectionHeader } from "@/shared/components/page-elements";
import { Card } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { DailyTask } from "@/shared/model/entities";
import { today } from "@/shared/model/factories";
import { calculateDailyScore } from "../model/daily-score";

const levels = [
  "bg-zinc-100 dark:bg-zinc-900",
  "bg-zinc-300 dark:bg-zinc-700",
  "bg-zinc-500 dark:bg-zinc-500",
  "bg-zinc-700 dark:bg-zinc-300",
  "bg-zinc-950 dark:bg-zinc-50",
];

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function intensity(score: number) {
  if (!score) return 0;
  return Math.min(4, Math.ceil(score / 25));
}

function buildDays(tasks: DailyTask[], year: number) {
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  const start = new Date(year, 0, 1);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(year, 11, 31);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const length = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Array.from({ length }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const hidden = date.getFullYear() !== year || date > current;
    const key = dateKey(date);
    return { date, key, hidden, result: calculateDailyScore(tasks, key) };
  });
}

export function ContributionCalendar({
  dailyTasks,
}: {
  dailyTasks: DailyTask[];
}) {
  const { t, locale, formatNumber } = useI18n();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedDate, setSelectedDate] = useState(today());
  const years = Array.from({ length: 5 }, (_, index) => currentYear - index);
  const days = useMemo(
    () => buildDays(dailyTasks, selectedYear),
    [dailyTasks, selectedYear],
  );
  const scoredDays = days.filter((day) => !day.hidden && day.result.total > 0);
  const average = scoredDays.length
    ? scoredDays.reduce((sum, day) => sum + day.result.score, 0) /
      scoredDays.length
    : 0;
  const selected = days.find((day) => day.key === selectedDate);
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
            {t("dashboard.averageScore")}:{" "}
            {formatNumber(average, { maximumFractionDigits: 1 })}
          </span>
        }
      />
      {/* <p className="mb-4 text-xs leading-5 text-zinc-500">
        {t("dashboard.scoreFormula")}
      </p> */}
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
                  const label = `${dateFormatter.format(day.date)}: score ${day.result.score}`;
                  return (
                    <button
                      key={day.key}
                      title={day.hidden ? undefined : label}
                      aria-label={day.hidden ? undefined : label}
                      disabled={day.hidden}
                      onClick={() => setSelectedDate(day.key)}
                      className={`size-3 rounded-[3px] ${day.hidden ? "bg-transparent" : levels[intensity(day.result.score)]} ${selectedDate === day.key ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-950" : ""}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <YearSelector
          years={years}
          selectedYear={selectedYear}
          onChange={setSelectedYear}
        />
      </div>
      <ScoreDetails date={selected?.date} result={selected?.result} />
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

function YearSelector({
  years,
  selectedYear,
  onChange,
}: {
  years: number[];
  selectedYear: number;
  onChange: (year: number) => void;
}) {
  const { t } = useI18n();
  return (
    <nav
      aria-label={t("dashboard.selectYear")}
      className="grid w-32 shrink-0 gap-1 border-l border-zinc-200 pl-3 dark:border-zinc-800"
    >
      {years.map((year) => (
        <button
          key={year}
          aria-pressed={year === selectedYear}
          onClick={() => onChange(year)}
          className={`rounded-md px-2 py-1 text-xs font-medium ${year === selectedYear ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}
        >
          {year}
        </button>
      ))}
    </nav>
  );
}

function ScoreDetails({
  date,
  result,
}: {
  date?: Date;
  result?: ReturnType<typeof calculateDailyScore>;
}) {
  const { t, formatDate, formatNumber } = useI18n();
  if (!date || !result) return null;
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
  return (
    <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{formatDate(date.toISOString())}</p>
        <strong className="text-lg">score {result.score}</strong>
      </div>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        {t(`dashboard.scoreReason.${result.reason}`)}
      </p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{breakdown}</p>
    </div>
  );
}
