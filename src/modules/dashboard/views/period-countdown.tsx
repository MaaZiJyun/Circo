"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/shared/components/page-elements";
import { Tabs } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";

type Scale = "year" | "month" | "day" | "hour";
const scales: Scale[] = ["year", "month", "day", "hour"];
function bounds(date: Date, scale: Scale) {
  const start = new Date(date);
  const end = new Date(date);
  if (scale === "year") {
    start.setMonth(0, 1); start.setHours(0, 0, 0, 0);
    end.setFullYear(date.getFullYear() + 1, 0, 1); end.setHours(0, 0, 0, 0);
  } else if (scale === "month") {
    start.setDate(1); start.setHours(0, 0, 0, 0);
    end.setMonth(date.getMonth() + 1, 1); end.setHours(0, 0, 0, 0);
  } else if (scale === "day") {
    start.setHours(0, 0, 0, 0); end.setDate(date.getDate() + 1); end.setHours(0, 0, 0, 0);
  } else {
    start.setMinutes(0, 0, 0); end.setHours(date.getHours() + 1); end.setMinutes(0, 0, 0);
  }
  return { start: start.getTime(), end: end.getTime() };
}
function remaining(ms: number, scale: Scale) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  if (scale === "hour") return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return scale === "day" ? `${hours}h ${minutes}m` : `${days}d ${hours}h`;
}
function scaleLabels(scale: Scale, date: Date | null) {
  if (scale === "year") return ["1", "3", "5", "7", "9", "11"];
  if (scale === "day") return ["0", "4", "8", "12", "16", "20"];
  if (scale === "hour") return ["0", "10", "20", "30", "40", "50"];
  const lastDay = date
    ? new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    : 30;
  return Array.from({ length: 6 }, (_, index) =>
    String(Math.floor((index * lastDay) / 6) + 1),
  );
}
export function PeriodCountdown() {
  const { t } = useI18n();
  const [scale, setScale] = useState<Scale>("day");
  const [current, setCurrent] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setCurrent(new Date()); update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const timing = current ? bounds(current, scale) : null;
  const progress = timing && current ? (current.getTime() - timing.start) / (timing.end - timing.start) : 0;
  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const labels = scaleLabels(scale, current);
  return (
    <>
      <SectionHeader title={t("dashboard.countdown")} />
      <Tabs value={scale} onChange={setScale} items={scales.map((item) => ({
        value: item, label: t(`dashboard.countdown.${item}`),
      }))} />
      <div className="grid min-h-80 place-items-center">
        <div className="relative size-64">
          <svg className="absolute inset-4 size-56 -rotate-90" viewBox="0 0 192 192" aria-hidden="true">
            {Array.from({ length: 60 }, (_, index) => {
              const major = index % 5 === 0;
              return (
                <line
                  key={index}
                  x1="96"
                  y1={major ? "5" : "8"}
                  x2="96"
                  y2={major ? "13" : "11"}
                  stroke="currentColor"
                  strokeWidth={major ? "0.9" : "0.5"}
                  strokeLinecap="round"
                  className={major ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-300 dark:text-zinc-700"}
                  transform={`rotate(${index * 6} 96 96)`}
                />
              );
            })}
            <circle cx="96" cy="96" r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-zinc-100 dark:text-zinc-800" />
            <circle cx="96" cy="96" r={radius} fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} className="text-zinc-950 transition-[stroke-dashoffset] duration-1000 dark:text-zinc-50" />
          </svg>
          {labels.map((label, index) => {
            const angle = (index * 60 - 90) * (Math.PI / 180);
            return (
              <span
                key={label}
                className="absolute text-[10px] tabular-nums text-zinc-500"
                style={{
                  left: 128 + Math.cos(angle) * 123,
                  top: 128 + Math.sin(angle) * 123,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {label}
              </span>
            );
          })}
          <div className="absolute inset-0 grid place-content-center text-center">
            <strong className="text-3xl tabular-nums">{timing && current ? remaining(timing.end - current.getTime(), scale) : "—"}</strong>
            <span className="mt-1 text-xs text-zinc-500">{t("dashboard.timeRemaining")}</span>
          </div>
        </div>
      </div>
    </>
  );
}
