"use client";

import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  DragEvent,
  MouseEventHandler,
  PointerEvent as ReactPointerEvent,
  PointerEventHandler,
  RefObject,
  WheelEventHandler,
} from "react";

import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ActivityRecord, FocusRecord } from "@/shared/model/entities";
import {
  BAR_HEIGHT,
  buildWeekendBands,
  clamp,
  formatRange,
  HEADER_HEIGHT,
  ROW_HEIGHT,
  type GanttRow,
  type GanttTick,
} from "../model/gantt-layout";
import { ProjectGanttDependencies } from "./project-gantt-dependencies";
import { formatDuration, taskTiming } from "../model/task-timing";

type Preview = { taskId: string; start: number; end: number } | null;
type DragMode = "move" | "start" | "end";

const STATUS_STYLES: Record<ActivityRecord["status"], string> = {
  todo: "bg-zinc-400 dark:bg-zinc-600",
  doing: "bg-blue-500 dark:bg-blue-400",
  done: "bg-emerald-500 dark:bg-emerald-400",
  overdue: "bg-red-500 dark:bg-red-400",
};

export function ProjectGanttCanvas({
  scrollRef,
  rows,
  ticks,
  range,
  chartWidth,
  totalHeight,
  focus,
  todayX,
  currentTime,
  preview,
  toX,
  onWheel,
  onDoubleClick,
  onPointerMove,
  onPointerEnd,
  onBeginDrag,
  onTaskClick,
  onCreateDependency,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  rows: GanttRow[];
  ticks: GanttTick[];
  range: { start: number; end: number };
  chartWidth: number;
  totalHeight: number;
  focus: FocusRecord[];
  todayX: number | null;
  currentTime: number | null;
  preview: Preview;
  toX: (value: number) => number;
  onWheel: WheelEventHandler<HTMLDivElement>;
  onDoubleClick: MouseEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerEnd: PointerEventHandler<HTMLDivElement>;
  onBeginDrag: (
    event: ReactPointerEvent<HTMLElement>,
    row: GanttRow,
    mode: DragMode,
  ) => void;
  onTaskClick: (taskId: string) => void;
  onCreateDependency: (sourceId: string, target: ActivityRecord) => void;
}) {
  const { t, locale } = useI18n();
  const [hovered, setHovered] = useState<{
    row: GanttRow;
    anchor: HTMLElement;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTooltipTimer = useRef<number | null>(null);
  const scrollingAt = useRef(0);

  const cancelHideTooltip = () => {
    if (hideTooltipTimer.current !== null) {
      window.clearTimeout(hideTooltipTimer.current);
      hideTooltipTimer.current = null;
    }
  };
  const hideTooltip = () => {
    cancelHideTooltip();
    hideTooltipTimer.current = window.setTimeout(() => {
      if (Date.now() - scrollingAt.current < 300) return;
      setHovered(null);
    }, 160);
  };

  useLayoutEffect(() => {
    if (!hovered) return;
    const updatePosition = () => {
      const anchor = hovered.anchor.getBoundingClientRect();
      const tooltip = tooltipRef.current;
      const width = tooltip?.offsetWidth ?? 288;
      const height = tooltip?.offsetHeight ?? 150;
      const gap = 8;
      const margin = 8;
      const preferredLeft = anchor.left + anchor.width / 2 - width / 2;
      const left = Math.min(
        Math.max(margin, preferredLeft),
        Math.max(margin, window.innerWidth - width - margin),
      );
      const below = anchor.bottom + gap;
      const above = anchor.top - height - gap;
      const top = below + height <= window.innerHeight - margin
        ? below
        : above >= margin
          ? above
          : Math.max(margin, window.innerHeight - height - margin);
      setTooltipPosition({ left, top });
    };
    const onScroll = () => {
      scrollingAt.current = Date.now();
      updatePosition();
    };
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [hovered]);

  useEffect(() => () => cancelHideTooltip(), []);
  return (
    <>
    <div
      ref={scrollRef}
      className="min-w-0 overflow-x-auto overscroll-x-contain"
      onWheel={onWheel}
    >
      <div style={{ width: chartWidth }}>
        <div
          className="relative border-b border-zinc-200/70 text-[11px] text-zinc-500 dark:border-zinc-800"
          style={{ height: HEADER_HEIGHT }}
        >
          {ticks.map((tick) => (
            <div
              key={tick.value}
              className="absolute inset-y-0 flex items-center border-l border-zinc-200/70 px-2 tabular-nums dark:border-zinc-800"
              style={{ left: toX(tick.value) }}
            >
              <span className="whitespace-nowrap">{tick.label}</span>
            </div>
          ))}
        </div>
        <div
          className="relative select-none"
          style={{ height: totalHeight }}
          onDoubleClick={onDoubleClick}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          {buildWeekendBands(range.start, range.end).map((band) => (
            <div
              key={band}
              className="pointer-events-none absolute inset-y-0 bg-zinc-100/65 dark:bg-zinc-900/45"
              style={{
                left: toX(band),
                width: Math.max(
                  0,
                  toX(Math.min(band + 86_400_000, range.end)) - toX(band),
                ),
              }}
            />
          ))}
          {ticks
            .filter((tick) => tick.major)
            .map((tick) => (
              <div
                key={tick.value}
                className="pointer-events-none absolute inset-y-0 border-l border-zinc-200/70 dark:border-zinc-800/80"
                style={{ left: toX(tick.value) }}
              />
            ))}
          {rows.map((row, index) => (
            <div
              key={row.task.id}
              className="absolute inset-x-0 border-b border-zinc-100 transition-colors hover:bg-zinc-50/50 dark:border-zinc-900 dark:hover:bg-zinc-900/20"
              style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
            />
          ))}
          <ProjectGanttDependencies
            rows={rows}
            toX={toX}
            width={chartWidth}
            height={totalHeight}
            preview={preview}
          />
          {!rows.length && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-xs text-zinc-400">
              {t("hand.ganttEmptyHint")}
            </div>
          )}
          {rows.map((row, index) => {
            const shown = preview?.taskId === row.task.id ? preview : row;
            if (shown.end < range.start || shown.start > range.end) return null;
            const timing = taskTiming(row.task, currentTime ?? undefined, focus);
            const left = toX(clamp(shown.start, range.start, range.end));
            const width = Math.max(
              8,
              toX(clamp(shown.end, range.start, range.end)) - left,
            );
            const progress = clamp(
              row.task.status === "done"
                ? 1
                : row.task.estimatedMinutes
                  ? row.task.actualMinutes / row.task.estimatedMinutes
                  : 0,
              0,
              1,
            );
            const actualVisible =
              timing.actualStart !== null && timing.actualEnd !== null;
            const actualLeft = actualVisible
              ? toX(clamp(timing.actualStart!, range.start, range.end))
              : 0;
            const actualWidth = actualVisible
              ? Math.max(6, toX(clamp(timing.actualEnd!, range.start, range.end)) - actualLeft)
              : 0;
            return (
              <div key={row.task.id}>
                {actualVisible && (
                  <div
                    className="pointer-events-none absolute z-[8] h-1.5 rounded-full bg-zinc-950/45 dark:bg-white/55"
                    style={{
                      left: actualLeft,
                      top: index * ROW_HEIGHT + 6,
                      width: actualWidth,
                    }}
                  />
                )}
                <div
                data-task-bar
                className="group absolute z-10 hover:z-[60]"
                style={{
                  left,
                  top: index * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2,
                  width,
                  height: BAR_HEIGHT,
                }}
                onClick={() => onTaskClick(row.task.id)}
                onMouseEnter={(event) => {
                  cancelHideTooltip();
                  setHovered({ row, anchor: event.currentTarget });
                }}
                onMouseLeave={hideTooltip}
                onPointerDown={(event) => onBeginDrag(event, row, "move")}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) =>
                  dropDependency(event, row.task, onCreateDependency)
                }
              >
                <div
                  className={`relative h-full overflow-hidden rounded-[5px] ${STATUS_STYLES[row.task.status]}`}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-black/20 dark:bg-white/20"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <button
                  type="button"
                  aria-label={t("hand.ganttResizeStart")}
                  className="absolute inset-y-0 left-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
                  onPointerDown={(event) => onBeginDrag(event, row, "start")}
                />
                <button
                  type="button"
                  aria-label={t("hand.ganttResizeEnd")}
                  className="absolute inset-y-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
                  onPointerDown={(event) => onBeginDrag(event, row, "end")}
                />
                <span className="pointer-events-none absolute -bottom-1 -top-1 right-0 w-px bg-zinc-950/55 dark:bg-white/60" />
                {row.task.milestone && (
                  <span className="pointer-events-none absolute right-0 top-1/2 size-3 -translate-y-1/2 translate-x-1/2 rotate-45 border border-amber-600 bg-amber-400 dark:border-amber-300" />
                )}
                <DependencyHandle taskId={row.task.id} />
                </div>
              </div>
            );
          })}
          {todayX !== null && (
            <div
              className="pointer-events-none absolute inset-y-0 z-20 w-px bg-red-500"
              style={{ left: todayX }}
            >
              <span className="absolute left-1 top-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {t("hand.ganttToday")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
    {hovered && typeof document !== "undefined" && createPortal(
      <div
        ref={tooltipRef}
        role="tooltip"
        className="fixed z-[1000] w-[18rem] max-w-[calc(100vw-1rem)] rounded-lg bg-zinc-950 px-3 py-2 text-[11px] leading-5 text-white shadow-xl ring-1 ring-black/10 dark:bg-zinc-100 dark:text-zinc-950"
        style={{ left: tooltipPosition.left, top: tooltipPosition.top }}
        onMouseEnter={cancelHideTooltip}
        onMouseLeave={hideTooltip}
      >
        <p className="font-medium">{hovered.row.task.title}</p>
        <p>{formatRange(hovered.row.start, hovered.row.end, locale)}</p>
        <p>
          {t(statusLabels[hovered.row.task.status])} · {Math.round(
            clamp(
              hovered.row.task.status === "done"
                ? 1
                : hovered.row.task.estimatedMinutes
                  ? hovered.row.task.actualMinutes / hovered.row.task.estimatedMinutes
                  : 0,
              0,
              1,
            ) * 100,
          )}% · {t("hand.dependencies")} {hovered.row.task.dependencyIds.length}
        </p>
        <p className="mt-1 border-t border-white/20 pt-1 text-zinc-300 dark:border-zinc-950/20 dark:text-zinc-700">
          {t("hand.ganttExpectedDuration")}: {formatDuration(hovered.row.task.estimatedMinutes)}
        </p>
        {(() => {
          const timing = taskTiming(hovered.row.task, currentTime ?? undefined, focus);
          if (timing.actualStart === null || timing.actualEnd === null) return null;
          return (
            <>
              <p>{t("hand.ganttActualDuration")}: {formatDuration(timing.actualDurationMinutes ?? 0)}</p>
              <p>{formatTimingLabel("start", timing.startDeltaMinutes, t)}</p>
              <p>{formatTimingLabel("end", timing.endDeltaMinutes, t)}</p>
            </>
          );
        })()}
      </div>,
      document.body,
    )}
    </>
  );
}

function formatTimingLabel(
  kind: "start" | "end",
  deltaMinutes: number | null,
  translate: (key: Parameters<ReturnType<typeof useI18n>["t"]>[0]) => string,
) {
  if (deltaMinutes === null) return "";
  const direction = deltaMinutes > 0
    ? kind === "start" ? "hand.ganttLateStart" : "hand.ganttLateEnd"
    : deltaMinutes < 0
      ? kind === "start" ? "hand.ganttEarlyStart" : "hand.ganttEarlyEnd"
      : kind === "start" ? "hand.ganttOnTimeStart" : "hand.ganttOnTimeEnd";
  return `${translate(direction)}${deltaMinutes === 0 ? "" : ` ${formatDuration(Math.abs(deltaMinutes))}`}`;
}

function DependencyHandle({ taskId }: { taskId: string }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      draggable
      aria-label={t("hand.ganttCreateDependency")}
      className="absolute right-0 top-1/2 z-20 size-3 -translate-y-1/2 translate-x-full cursor-crosshair rounded-full border-2 border-white bg-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 dark:border-zinc-950 dark:bg-zinc-300"
      onPointerDown={(event) => event.stopPropagation()}
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.setData("application/x-circo-task", taskId);
        event.dataTransfer.effectAllowed = "link";
      }}
    />
  );
}

function dropDependency(
  event: DragEvent<HTMLDivElement>,
  target: ActivityRecord,
  create: (sourceId: string, target: ActivityRecord) => void,
) {
  event.preventDefault();
  const sourceId = event.dataTransfer.getData("application/x-circo-task");
  if (sourceId) create(sourceId, target);
}
