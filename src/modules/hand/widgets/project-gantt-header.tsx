"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

import { IconButton } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { GanttScale } from "../model/gantt-layout";

const SCALES = ["overall", "month", "week", "day"] as const;
const SCALE_KEYS = {
  overall: "hand.ganttScaleGlobal",
  month: "hand.ganttScaleMonth",
  week: "hand.ganttScaleWeek",
  day: "hand.ganttScaleDay",
} as const;

export function ProjectGanttHeader({
  scale,
  zoom,
  onScale,
  onPrevious,
  onNext,
  onToday,
  onFit,
  onZoom,
}: {
  scale: GanttScale;
  zoom: number;
  onScale: (scale: GanttScale) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onFit: () => void;
  onZoom: (delta: number) => void;
}) {
  const { t } = useI18n();
  const textButton =
    "rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900";
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800">
      <div className="flex items-center rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-900">
        {SCALES.map((item) => (
          <button
            key={item}
            type="button"
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              scale === item
                ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
            onClick={() => onScale(item)}
          >
            {t(SCALE_KEYS[item])}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {scale !== "overall" && (
          <>
            <IconButton
              size="sm"
              label={t("hand.ganttPrevious")}
              onClick={onPrevious}
            >
              <ChevronLeftIcon className="size-4" />
            </IconButton>
            <IconButton size="sm" label={t("hand.ganttNext")} onClick={onNext}>
              <ChevronRightIcon className="size-4" />
            </IconButton>
          </>
        )}
        <button type="button" className={textButton} onClick={onToday}>
          {t("hand.ganttToday")}
        </button>
        <button type="button" className={textButton} onClick={onFit}>
          {t("hand.ganttFit")}
        </button>
        <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
        <IconButton
          size="sm"
          label={t("hand.ganttZoomOut")}
          disabled={zoom <= 0.5}
          onClick={() => onZoom(-0.25)}
        >
          <MinusIcon className="size-4" />
        </IconButton>
        <span className="w-10 text-center text-[11px] tabular-nums text-zinc-500">
          {Math.round(zoom * 100)}%
        </span>
        <IconButton
          size="sm"
          label={t("hand.ganttZoomIn")}
          disabled={zoom >= 4}
          onClick={() => onZoom(0.25)}
        >
          <PlusIcon className="size-4" />
        </IconButton>
      </div>
    </header>
  );
}
