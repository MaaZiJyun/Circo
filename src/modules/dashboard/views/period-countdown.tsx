"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/shared/components/page-elements";
import { Tabs } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { MessageKey } from "@/shared/i18n/zh";
import { useStore } from "@/shared/view-models/store-context";

type Scale = "life" | "year" | "month" | "day" | "hour";
const scales: Scale[] = ["life", "year", "month", "day", "hour"];
const lifeStages = [
  { start: 0, end: 2, middle: 1, label: "dashboard.lifeStage.infant", color: "text-rose-500" },
  { start: 2, end: 7, middle: 4.5, label: "dashboard.lifeStage.toddler", color: "text-orange-500" },
  { start: 7, end: 12, middle: 9.5, label: "dashboard.lifeStage.child", color: "text-amber-500" },
  { start: 12, end: 15, middle: 13.5, label: "dashboard.lifeStage.adolescent", color: "text-lime-600" },
  { start: 15, end: 30, middle: 22.5, label: "dashboard.lifeStage.youth", color: "text-emerald-500" },
  { start: 30, end: 50, middle: 40, label: "dashboard.lifeStage.middleAge", color: "text-sky-500" },
  { start: 50, end: 80, middle: 65, label: "dashboard.lifeStage.oldAge", color: "text-violet-500" },
];
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
  if (scale === "life") return lifeStages.map((stage) => ({
    label: stage.label,
    ratio: stage.middle / 80,
    color: stage.color,
  }));
  let values: string[];
  if (scale === "year") values = ["1", "3", "5", "7", "9", "11"];
  else if (scale === "day") values = ["0", "4", "8", "12", "16", "20"];
  else if (scale === "hour") values = ["0", "10", "20", "30", "40", "50"];
  else {
  const lastDay = date
    ? new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    : 30;
    values = Array.from({ length: 6 }, (_, index) =>
    String(Math.floor((index * lastDay) / 6) + 1),
  );
  }
  return values.map((label, index) => ({
    label,
    ratio: index / 6,
    color: "text-zinc-500",
  }));
}
export function PeriodCountdown() {
  const { t } = useI18n();
  const { state } = useStore();
  const [scale, setScale] = useState<Scale>("day");
  const [current, setCurrent] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setCurrent(new Date()); update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const birthDate = state?.profile.birthDate ?? "";
  const lifeStart = birthDate ? new Date(`${birthDate}T00:00:00`).getTime() : 0;
  const lifeEnd = birthDate ? new Date(`${birthDate}T00:00:00`) : null;
  lifeEnd?.setFullYear(lifeEnd.getFullYear() + 80);
  const timing = scale === "life"
    ? lifeEnd && lifeStart ? { start: lifeStart, end: lifeEnd.getTime() } : null
    : current ? bounds(current, scale) : null;
  const progress = timing && current
    ? Math.max(0, Math.min(1, (current.getTime() - timing.start) / (timing.end - timing.start)))
    : 0;
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
        <div className="relative size-72">
          <svg className="absolute inset-8 size-56" viewBox="0 0 192 192" aria-hidden="true">
            {scale !== "life" && Array.from({ length: 60 }, (_, index) => {
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
            {scale === "life" ? lifeStages.flatMap((stage) => {
              const start = stage.start / 80;
              const end = stage.end / 80;
              const remainingStart = Math.max(progress, start);
              const remainingLength = Math.max(0, end - remainingStart);
              const segmentLength = end - start;
              return [
                <circle key={`${stage.label}-base`} cx="96" cy="96" r={radius} fill="none"
                  stroke="currentColor" strokeWidth="12" className={`${stage.color} opacity-20`}
                  transform={`rotate(${-90 + start * 360} 96 96)`}
                  strokeDasharray={`${circumference * segmentLength} ${circumference}`} />,
                <circle key={stage.label} cx="96" cy="96" r={radius} fill="none"
                  stroke="currentColor" strokeWidth="12" className={stage.color}
                  transform={`rotate(${-90 + remainingStart * 360} 96 96)`}
                  strokeDasharray={`${circumference * remainingLength} ${circumference}`} />,
              ];
            }) : (
              <>
                <circle cx="96" cy="96" r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-zinc-100 dark:text-zinc-800" />
                <circle cx="96" cy="96" r={radius} fill="none" stroke="currentColor" strokeWidth="12"
                  transform="rotate(-90 96 96)" strokeDasharray={circumference}
                  strokeDashoffset={circumference * progress} className="text-zinc-950 transition-[stroke-dashoffset] duration-1000 dark:text-zinc-50" />
              </>
            )}
          </svg>
          {labels.map(({ label, ratio, color }, index) => {
            const angle = (ratio * 360 - 90) * (Math.PI / 180);
            const labelRadius = scale === "life" && index > 0 && index < 7
              ? 132 + (index % 2) * 12
              : 132;
            return (
              <span
                key={label}
                className={`absolute text-[10px] font-medium tabular-nums ${color}`}
                style={{
                  left: 144 + Math.cos(angle) * labelRadius,
                  top: 144 + Math.sin(angle) * labelRadius,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {scale === "life" ? t(label as MessageKey) : label}
              </span>
            );
          })}
          <div className="absolute inset-0 grid place-content-center text-center">
            <strong className="text-3xl tabular-nums">
              {timing && current
                ? scale === "life"
                  ? `${Math.max(0, Math.ceil((timing.end - current.getTime()) / 86400000)).toLocaleString()} ${t("dashboard.days")}`
                  : remaining(timing.end - current.getTime(), scale)
                : "—"}
            </strong>
            <span className="mt-1 max-w-32 text-xs text-zinc-500">
              {scale === "life" && !birthDate
                ? t("dashboard.setBirthDateInSettings")
                : t("dashboard.timeRemaining")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
