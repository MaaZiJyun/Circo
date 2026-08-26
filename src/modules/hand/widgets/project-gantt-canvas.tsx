"use client";

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
import type { TaskRecord } from "@/shared/model/entities";
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
import { formatDuration, formatTimingDelta, taskTiming } from "../model/task-timing";

type Preview = { taskId: string; start: number; end: number } | null;
type DragMode = "move" | "start" | "end";

const STATUS_STYLES: Record<TaskRecord["status"], string> = {
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
  onCreateDependency: (sourceId: string, target: TaskRecord) => void;
}) {
  const { t, locale } = useI18n();
  return (
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
            const timing = taskTiming(row.task, currentTime ?? undefined);
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
                      top: index * ROW_HEIGHT + ROW_HEIGHT / 2 + 15,
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
                <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-max max-w-72 -translate-x-1/2 rounded-lg bg-zinc-950 px-3 py-2 text-[11px] leading-5 text-white shadow-lg group-hover:block dark:bg-zinc-100 dark:text-zinc-950">
                  <p className="font-medium">{row.task.title}</p>
                  <p>{formatRange(shown.start, shown.end, locale)}</p>
                  <p>
                    {t(statusLabels[row.task.status])} ·{" "}
                    {Math.round(progress * 100)}% · {t("hand.dependencies")}{" "}
                    {row.task.dependencyIds.length}
                  </p>
                  <p className="mt-1 border-t border-white/20 pt-1 text-zinc-300 dark:border-zinc-950/20 dark:text-zinc-700">
                    {t("hand.ganttExpectedDuration")}: {formatDuration(row.task.estimatedMinutes)}
                  </p>
                  {actualVisible && (
                    <>
                      <p>{t("hand.ganttActualDuration")}: {formatDuration(timing.actualDurationMinutes ?? 0)}</p>
                      <p>{t("hand.ganttStartDelta")}: {formatTimingDelta(timing.startDeltaMinutes)}</p>
                      <p>{t("hand.ganttEndDelta")}: {formatTimingDelta(timing.endDeltaMinutes)}</p>
                    </>
                  )}
                </div>
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
  );
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
  target: TaskRecord,
  create: (sourceId: string, target: TaskRecord) => void,
) {
  event.preventDefault();
  const sourceId = event.dataTransfer.getData("application/x-circo-task");
  if (sourceId) create(sourceId, target);
}
