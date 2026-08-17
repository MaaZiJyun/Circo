"use client";

import { useState } from "react";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

import type { TaskRecord } from "@/shared/model/entities";
import { useI18n } from "@/shared/i18n/i18n-context";

const day = 86_400_000;
const chartWidth = 880;
const rowHeight = 60;
const barHeight = 28;
const barInsetY = (rowHeight - barHeight) / 2;

type Scale = "global" | "year" | "month" | "week" | "day";

const SCALES = ["global", "year", "month", "week", "day"] as const;

const SCALE_KEYS = {
  global: "hand.ganttScaleGlobal",
  year: "hand.ganttScaleYear",
  month: "hand.ganttScaleMonth",
  week: "hand.ganttScaleWeek",
  day: "hand.ganttScaleDay",
} as const;

type GanttRow = {
  task: TaskRecord;
  start: number;
  end: number;
};

type Cell = {
  start: number;
  end: number;
  top: string;
  bottom: string;
  sub?: string;
  weekend: boolean;
};

const STATUS_LEGEND: {
  key: "status.todo" | "status.doing" | "status.done" | "status.overdue";
  dot: string;
}[] = [
  { key: "status.todo", dot: "bg-zinc-400 dark:bg-zinc-600" },
  { key: "status.doing", dot: "bg-blue-500" },
  { key: "status.done", dot: "bg-emerald-500" },
  { key: "status.overdue", dot: "bg-red-500" },
];

export function ProjectGantt({
  tasks,
  startDate,
  endDate,
}: {
  tasks: TaskRecord[];
  startDate: string;
  endDate: string;
}) {
  const { t, locale } = useI18n();
  const [today] = useState(() => startOfDay(Date.now()));
  const [scale, setScale] = useState<Scale>("global");
  const [anchor, setAnchor] = useState<number>(today);

  const rootTasks = tasks.filter((task) => !task.parentId);
  if (!rootTasks.length) return null;

  const plan = buildGanttPlan(rootTasks, startDate, endDate);

  const anchorClamped = clampToRange(
    anchor,
    plan.start,
    Math.max(plan.start, plan.end - day),
  );

  const period =
    scale === "global"
      ? { start: plan.start, end: plan.end }
      : periodRange(scale, anchorClamped);

  const { start: visStart, end: visEnd } = period;
  const toX = (ms: number) =>
    ((ms - visStart) / Math.max(day, visEnd - visStart)) * chartWidth;

  const tickCount = getTickCount(visEnd - visStart);
  const cells = buildCells(scale, visStart, visEnd, tickCount, locale);
  const bands = buildBands(cells);

  // 每列宽度按「天数」比例分配，保证年视图里长短不一的月份与 SVG 时间轴对齐。
  const columnsTemplate = cells
    .map(
      (cell) =>
        `${Math.round(((cell.end - cell.start) / day) * 1000) / 1000}fr`,
    )
    .join(" ");

  // 月/日视图列数多、列宽窄：只保留一个短标签并压缩内边距，避免日期栏溢出。
  const compactHeader = scale === "month" || scale === "day";

  const visibleRows = plan.rows.filter(
    (row) => row.end > visStart && row.start < visEnd,
  );

  const rowById = new Map(plan.rows.map((row) => [row.task.id, row]));

  const displayIndexById = new Map(
    visibleRows.map((row, index) => [row.task.id, index]),
  );

  const totalHeight = visibleRows.length * rowHeight;
  const todayX = today >= visStart && today <= visEnd ? toX(today) : null;

  const rangeLabel =
    scale === "global"
      ? `${fullDate(plan.start, locale)} → ${fullDate(plan.end - day, locale)}`
      : scale === "day"
        ? fullDate(visStart, locale)
        : `${fullDate(visStart, locale)} → ${fullDate(visEnd - day, locale)}`;

  const navigate = (direction: 1 | -1) =>
    setAnchor(stepPeriod(scale, anchorClamped, direction));

  return (
    <section className="mb-6 min-w-0 max-w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200/70 px-6 py-5 dark:border-zinc-800">
        {/* Scale switcher */}
        <div className="flex rounded-full border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
          {SCALES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setScale(item)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                scale === item
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {t(SCALE_KEYS[item])}
            </button>
          ))}
        </div>
        {/* Period navigator */}
        {scale === "global" ? (
          <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            {rangeLabel}
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t("hand.ganttPrevious")}
              onClick={() => navigate(-1)}
              className="grid h-7 w-7 place-items-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <ChevronLeftIcon className="size-4" />
            </button>

            <span className="whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              {rangeLabel}
            </span>

            <button
              type="button"
              aria-label={t("hand.ganttNext")}
              onClick={() => navigate(1)}
              className="grid h-7 w-7 place-items-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <ChevronRightIcon className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => setAnchor(today)}
              className="ml-1 rounded-full px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
            >
              {t("hand.ganttToday")}
            </button>
          </div>
        )}
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[1290px]">
          {/* Column headers */}
          <div className="grid grid-cols-[240px_170px_880px] border-b border-zinc-200/70 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex items-center px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
              {t("common.title")}
            </div>

            <div className="flex items-center border-l border-zinc-200/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              {t("hand.dependencies")}
            </div>

            {/* Timeline header */}
            <div className="border-l border-zinc-200/70 dark:border-zinc-800">
              <div
                className="grid"
                style={{ gridTemplateColumns: columnsTemplate }}
              >
                {bands.map((band, index) => (
                  <div
                    key={index}
                    className="border-b border-zinc-200/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800/70 dark:text-zinc-500"
                    style={{ gridColumn: `span ${band.count}` }}
                  >
                    {band.label}
                  </div>
                ))}
              </div>

              <div
                className="grid"
                style={{ gridTemplateColumns: columnsTemplate }}
              >
                {cells.map((cell, index) => (
                  <div
                    key={index}
                    className={`border-r border-zinc-200/60 py-2 last:border-r-0 dark:border-zinc-800/70 ${
                      compactHeader ? "px-1 text-center" : "px-3"
                    } ${
                      cell.weekend ? "bg-zinc-100/80 dark:bg-white/[0.04]" : ""
                    }`}
                  >
                    {cell.sub && (
                      <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                        {cell.sub}
                      </div>
                    )}

                    <div className="mt-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                      {cell.bottom}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          {visibleRows.length ? (
            <div className="grid grid-cols-[240px_170px_880px]">
              {/* Task column */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {visibleRows.map(({ task }) => (
                  <div
                    key={task.id}
                    className="flex min-w-0 items-center px-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                    style={{ height: rowHeight }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(
                            task.status,
                          )}`}
                        />

                        {task.milestone && (
                          <span
                            title={t("hand.ganttMilestone")}
                            className="h-2 w-2 shrink-0 rotate-45 bg-amber-400"
                          />
                        )}

                        <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {task.title}
                        </p>
                      </div>

                      <p className="ml-4 mt-1 text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                        {t("me.due")}{" "}
                        {fullDate(safeDate(task.dueDate, plan.start), locale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dependencies */}
              <div className="divide-y divide-zinc-100 border-l border-zinc-200/70 dark:divide-zinc-900 dark:border-zinc-800">
                {visibleRows.map(({ task }) => {
                  const names = (task.dependencyIds ?? [])
                    .map((id) => rowById.get(id)?.task.title)
                    .filter(Boolean) as string[];

                  return (
                    <div
                      key={task.id}
                      className="flex items-center px-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                      style={{ height: rowHeight }}
                    >
                      {names.length ? (
                        <div
                          className="flex flex-wrap items-center gap-1"
                          title={names.join(", ")}
                        >
                          {names.slice(0, 2).map((name) => (
                            <span
                              key={name}
                              className="max-w-[110px] truncate rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                            >
                              {name}
                            </span>
                          ))}

                          {names.length > 2 && (
                            <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                              +{names.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">
                          —
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Timeline */}
              <div className="relative overflow-hidden border-l border-zinc-200/70 bg-zinc-50/30 dark:border-zinc-800 dark:bg-zinc-950">
                <svg
                  viewBox={`0 0 ${chartWidth} ${totalHeight}`}
                  preserveAspectRatio="none"
                  className="relative z-10 block w-full"
                  style={{ height: totalHeight }}
                  role="img"
                  aria-label={t("hand.gantt")}
                >
                  <defs>
                    <marker
                      id="gantt-dependency-arrow"
                      viewBox="0 0 8 8"
                      refX="7"
                      refY="4"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto"
                    >
                      <path
                        d="M 0 0 L 8 4 L 0 8 z"
                        className="fill-zinc-300 dark:fill-zinc-700"
                      />
                    </marker>

                    <filter
                      id="gantt-bar-shadow"
                      x="-20%"
                      y="-40%"
                      width="140%"
                      height="180%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="1"
                        stdDeviation="1.5"
                        floodColor="#18181b"
                        floodOpacity="0.22"
                      />
                    </filter>

                    {visibleRows.map((row, index) => {
                      const startX = toX(Math.max(row.start, visStart));
                      const endX = toX(Math.min(row.end, visEnd));

                      return (
                        <clipPath
                          key={row.task.id}
                          id={`bar-clip-${row.task.id}`}
                        >
                          <rect
                            x={startX}
                            y={index * rowHeight + barInsetY}
                            width={Math.max(8, endX - startX)}
                            height={barHeight}
                            rx={9}
                          />
                        </clipPath>
                      );
                    })}
                  </defs>

                  {/* Weekend bands */}
                  {cells.map((cell, index) =>
                    cell.weekend ? (
                      <rect
                        key={`weekend-${index}`}
                        x={toX(cell.start)}
                        y="0"
                        width={toX(cell.end) - toX(cell.start)}
                        height={totalHeight}
                        className="fill-zinc-100/70 dark:fill-white/[0.03]"
                      />
                    ) : null,
                  )}

                  {/* Vertical time grid */}
                  {cells.map((cell, index) => (
                    <line
                      key={`tick-${index}`}
                      x1={toX(cell.start)}
                      x2={toX(cell.start)}
                      y1="0"
                      y2={totalHeight}
                      className="stroke-zinc-200/70 dark:stroke-zinc-800/70"
                    />
                  ))}

                  {/* Horizontal rows */}
                  {visibleRows.map((_, index) => (
                    <line
                      key={`row-${index}`}
                      x1="0"
                      x2={chartWidth}
                      y1={(index + 1) * rowHeight}
                      y2={(index + 1) * rowHeight}
                      className="stroke-zinc-100 dark:stroke-zinc-900"
                    />
                  ))}

                  {/* Row hover */}
                  {visibleRows.map((_, index) => (
                    <rect
                      key={`hover-${index}`}
                      x="0"
                      y={index * rowHeight}
                      width={chartWidth}
                      height={rowHeight}
                      className="fill-transparent transition-colors hover:fill-zinc-500/5 dark:hover:fill-white/5"
                    />
                  ))}

                  {/* Dependencies */}
                  {visibleRows.flatMap((target, targetIndex) =>
                    (target.task.dependencyIds ?? []).map((dependencyId) => {
                      const source = rowById.get(dependencyId);
                      const sourceIndex = displayIndexById.get(dependencyId);

                      if (!source || sourceIndex === undefined) return null;

                      const startY = sourceIndex * rowHeight + rowHeight / 2;
                      const endY = targetIndex * rowHeight + rowHeight / 2;
                      const sourceEnd = toX(Math.min(source.end, visEnd));
                      const targetStart = toX(Math.max(target.start, visStart));

                      return (
                        <g key={`${dependencyId}-${target.task.id}`}>
                          <path
                            d={dependencyPath(
                              sourceEnd,
                              startY,
                              endY,
                              targetStart,
                            )}
                            fill="none"
                            markerEnd="url(#gantt-dependency-arrow)"
                            className="stroke-zinc-300 dark:stroke-zinc-700"
                            strokeWidth="1.3"
                          />

                          <circle
                            cx={sourceEnd}
                            cy={startY}
                            r="2.5"
                            className="fill-zinc-400 dark:fill-zinc-600"
                          />
                        </g>
                      );
                    }),
                  )}

                  {/* Task bars */}
                  {visibleRows.map((row, index) => {
                    const startX = toX(Math.max(row.start, visStart));
                    const endX = toX(Math.min(row.end, visEnd));
                    const width = Math.max(8, endX - startX);
                    const y = index * rowHeight + barInsetY;
                    const progress =
                      row.task.estimatedMinutes > 0
                        ? Math.min(
                            1,
                            Math.max(
                              0,
                              row.task.actualMinutes /
                                row.task.estimatedMinutes,
                            ),
                          )
                        : 0;

                    return (
                      <g key={row.task.id}>
                        {/* Main bar */}
                        <rect
                          x={startX}
                          y={y}
                          width={width}
                          height={barHeight}
                          rx="9"
                          filter="url(#gantt-bar-shadow)"
                          className={`${barFill(
                            row.task.status,
                          )} transition-opacity hover:opacity-90`}
                        />

                        {/* Progress overlay */}
                        {progress > 0 && row.task.status !== "done" && (
                          <rect
                            x={startX}
                            y={y}
                            width={width * progress}
                            height={barHeight}
                            clipPath={`url(#bar-clip-${row.task.id})`}
                            className="fill-white/30 dark:fill-black/40"
                          />
                        )}

                        {/* Top highlight */}
                        <rect
                          x={startX + 2}
                          y={y + 1.5}
                          width={Math.max(0, width - 4)}
                          height="2"
                          rx="1"
                          className="fill-white/25 dark:fill-white/10"
                        />

                        {/* Label */}
                        {width > 96 && (
                          <text
                            x={startX + 10}
                            y={y + barHeight / 2 + 3.5}
                            fontSize="11"
                            fontWeight="600"
                            className="fill-white"
                            style={{ pointerEvents: "none" }}
                          >
                            {truncateSvgText(row.task.title, width)}
                          </text>
                        )}

                        {/* Milestone marker */}
                        {row.task.milestone && (
                          <path
                            d={diamondPath(
                              Math.min(endX, chartWidth - 8),
                              y + barHeight / 2,
                              7,
                            )}
                            className="fill-amber-400 stroke-white dark:stroke-zinc-950"
                            strokeWidth="1.5"
                          />
                        )}

                        <title>
                          {`${row.task.title} · ${fullDate(
                            row.start,
                            locale,
                          )} → ${fullDate(row.end, locale)}`}
                        </title>
                      </g>
                    );
                  })}

                  {/* Today line */}
                  {todayX !== null && (
                    <>
                      <line
                        x1={todayX}
                        x2={todayX}
                        y1="0"
                        y2={totalHeight}
                        className="stroke-red-500"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />

                      <circle
                        cx={todayX}
                        cy="6"
                        r="4"
                        className="fill-red-500"
                      />
                    </>
                  )}
                </svg>

                {/* Today badge */}
                {todayX !== null && (
                  <div
                    className="pointer-events-none absolute top-1 z-20 -translate-x-1/2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"
                    style={{ left: `${(todayX / chartWidth) * 100}%` }}
                  >
                    {t("hand.ganttToday")}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid h-28 place-items-center text-sm text-zinc-400 dark:text-zinc-500">
              {t("common.noData")}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-200/70 bg-zinc-50/50 px-6 py-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400">
        {STATUS_LEGEND.map((item) => (
          <span key={item.key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${item.dot}`} />
            {t(item.key)}
          </span>
        ))}

        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rotate-45 bg-amber-400" />
          {t("hand.ganttMilestone")}
        </span>

        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-red-500" />
          {t("hand.ganttToday")}
        </span>

        <span className="ml-auto hidden tabular-nums text-zinc-400 dark:text-zinc-500 sm:inline">
          {t("hand.ganttTaskCount").replace(
            "{count}",
            String(visibleRows.length),
          )}
        </span>
      </footer>
    </section>
  );
}

function buildGanttPlan(
  tasks: TaskRecord[],
  startDate: string,
  endDate: string,
) {
  const dueDates = tasks
    .map((task) => Date.parse(task.dueDate))
    .filter(Number.isFinite);

  const fallbackStart = dueDates.length
    ? Math.min(...dueDates) - day
    : Date.now();

  const projectStart = safeDate(startDate, fallbackStart);

  const projectEnd = Math.max(
    projectStart + day,
    safeDate(endDate, Math.max(...dueDates, projectStart)) + day,
  );

  const scheduled = dependencyOrder(tasks).map((task) => {
    // 任务条右端 = Due date，左端 = Start date；estimate 由 due - start 自动推导，不再参与排期。
    const start = safeDate(taskDateTime(task.startDate, false), projectStart);
    const end = Math.max(
      start,
      safeDate(taskDateTime(task.dueDate, true), projectStart + day),
    );

    return {
      task,
      start,
      end,
    };
  });

  const start = Math.min(projectStart, ...scheduled.map((row) => row.start));

  const end = Math.max(projectEnd, ...scheduled.map((row) => row.end));

  const rows: GanttRow[] = scheduled.map((row) => ({
    task: row.task,
    start: row.start,
    end: row.end,
  }));

  return {
    rows,
    start,
    end,
  };
}

function dependencyOrder(tasks: TaskRecord[]) {
  const byId = new Map(tasks.map((task) => [task.id, task]));

  const ordered: TaskRecord[] = [];

  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (task: TaskRecord) => {
    if (visited.has(task.id) || visiting.has(task.id)) {
      return;
    }

    visiting.add(task.id);

    for (const id of task.dependencyIds ?? []) {
      const dependency = byId.get(id);

      if (dependency) {
        visit(dependency);
      }
    }

    visiting.delete(task.id);
    visited.add(task.id);

    ordered.push(task);
  };

  tasks.forEach(visit);

  return ordered;
}

function safeDate(value: string, fallback: number) {
  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

// 纯日期（YYYY-MM-DD）补上时间，避免 Date.parse 把它当 UTC 午夜导致本地时区偏移。
function taskDateTime(value: string | undefined, endOfDay: boolean) {
  if (!value) return "";
  return value.length === 10 ? `${value}T${endOfDay ? "23:59" : "00:00"}` : value;
}

function startOfDay(value: number) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function startOfWeek(value: number) {
  const date = new Date(value);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return startOfDay(date.getTime());
}

function startOfMonth(value: number) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

function startOfYear(value: number) {
  return new Date(new Date(value).getFullYear(), 0, 1).getTime();
}

function addMonths(value: number, months: number) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth() + months, 1).getTime();
}

function addYears(value: number, years: number) {
  const date = new Date(value);
  return new Date(date.getFullYear() + years, 0, 1).getTime();
}

function clampToRange(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function periodRange(
  scale: Exclude<Scale, "global">,
  anchor: number,
): { start: number; end: number } {
  const s = startOfDay(anchor);

  if (scale === "day") return { start: s, end: s + day };

  if (scale === "week") {
    const weekStart = startOfWeek(s);
    return { start: weekStart, end: weekStart + 7 * day };
  }

  if (scale === "month") {
    const monthStart = startOfMonth(s);
    return { start: monthStart, end: addMonths(monthStart, 1) };
  }

  const yearStart = startOfYear(s);
  return { start: yearStart, end: addYears(yearStart, 1) };
}

function stepPeriod(scale: Scale, anchor: number, direction: 1 | -1) {
  if (scale === "day") return anchor + direction * day;
  if (scale === "week") return anchor + direction * 7 * day;

  if (scale === "month") {
    const date = new Date(anchor);
    return new Date(
      date.getFullYear(),
      date.getMonth() + direction,
      1,
    ).getTime();
  }

  if (scale === "year") {
    const date = new Date(anchor);
    return new Date(date.getFullYear() + direction, 0, 1).getTime();
  }

  return anchor;
}

function getTickCount(range: number) {
  const days = range / day;

  if (days <= 14) return Math.max(4, Math.ceil(days));
  if (days <= 60) return 8;
  if (days <= 180) return 10;

  return 12;
}

function isWeekend(value: number) {
  const weekday = new Date(value).getDay();
  return weekday === 0 || weekday === 6;
}

function dayNumber(value: number) {
  return String(new Date(value).getDate());
}

function hourLabel(hour: number) {
  return String(hour).padStart(2, "0");
}

function weekdayShort(value: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
  }).format(new Date(value));
}

function monthShort(value: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
  }).format(new Date(value));
}

function monthBandLabel(value: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function fullDate(value: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function buildCells(
  scale: Scale,
  start: number,
  end: number,
  tickCount: number,
  locale: string,
): Cell[] {
  const cells: Cell[] = [];

  const pushDayCell = (cellStart: number, cellEnd: number) => {
    cells.push({
      start: cellStart,
      end: cellEnd,
      top: monthBandLabel(cellStart, locale),
      bottom: dayNumber(cellStart),
      sub: weekdayShort(cellStart, locale),
      weekend: isWeekend(cellStart),
    });
  };

  if (scale === "global") {
    const range = end - start;

    for (let i = 0; i < tickCount; i += 1) {
      pushDayCell(
        start + (range * i) / tickCount,
        start + (range * (i + 1)) / tickCount,
      );
    }

    return cells;
  }

  if (scale === "year") {
    const year = new Date(start).getFullYear();

    for (let month = 0; month < 12; month += 1) {
      cells.push({
        start: new Date(year, month, 1).getTime(),
        end: new Date(year, month + 1, 1).getTime(),
        top: String(year),
        bottom: monthShort(new Date(year, month, 1).getTime(), locale),
        weekend: false,
      });
    }

    return cells;
  }

  if (scale === "month") {
    const date = new Date(start);
    const daysInMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();

    for (let i = 0; i < daysInMonth; i += 1) {
      const cellStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        i + 1,
      ).getTime();
      // 月视图列宽不足以放下「星期 + 日期」，只显示日期数字。
      cells.push({
        start: cellStart,
        end: cellStart + day,
        top: monthBandLabel(cellStart, locale),
        bottom: dayNumber(cellStart),
        weekend: isWeekend(cellStart),
      });
    }

    return cells;
  }

  if (scale === "week") {
    for (let i = 0; i < 7; i += 1) {
      pushDayCell(start + i * day, start + (i + 1) * day);
    }

    return cells;
  }

  // day 视图：一天 24 小时，每小时一列，日期在上方作为顶层 band。
  for (let hour = 0; hour < 24; hour += 1) {
    const cellStart = start + hour * (day / 24);
    cells.push({
      start: cellStart,
      end: cellStart + day / 24,
      top: fullDate(start, locale),
      bottom: hourLabel(hour),
      weekend: isWeekend(start),
    });
  }

  return cells;
}

function buildBands(cells: Cell[]) {
  const bands: { label: string; count: number }[] = [];
  let current: { label: string; count: number } | null = null;

  for (const cell of cells) {
    if (current && current.label === cell.top) {
      current.count += 1;
    } else {
      if (current) bands.push(current);
      current = { label: cell.top, count: 1 };
    }
  }

  if (current) bands.push(current);

  return bands;
}

function dependencyPath(
  sourceEnd: number,
  startY: number,
  endY: number,
  targetStart: number,
) {
  const radius = 6;
  const bendX = Math.min(
    chartWidth - 12,
    Math.max(sourceEnd + 14, targetStart - 20),
  );
  const direction = Math.sign(endY - startY) || 1;
  const yTop = startY + radius * direction;
  const yBottom = endY - radius * direction;

  return [
    `M ${sourceEnd} ${startY}`,
    `H ${bendX - radius}`,
    `Q ${bendX} ${startY} ${bendX} ${yTop}`,
    `V ${yBottom}`,
    `Q ${bendX} ${endY} ${bendX + radius} ${endY}`,
    `H ${targetStart - 4}`,
  ].join(" ");
}

function diamondPath(cx: number, cy: number, radius: number) {
  return `M ${cx} ${cy - radius} L ${cx + radius} ${cy} L ${cx} ${
    cy + radius
  } L ${cx - radius} ${cy} Z`;
}

function truncateSvgText(text: string, width: number) {
  const maxChars = Math.floor((width - 20) / 6.2);

  if (text.length <= maxChars) return text;

  return `${text.slice(0, Math.max(1, maxChars - 1))}…`;
}

function barFill(status: TaskRecord["status"]) {
  if (status === "done") {
    return "fill-emerald-500";
  }

  if (status === "doing") {
    return "fill-blue-500";
  }

  if (status === "overdue") {
    return "fill-red-500";
  }

  return "fill-zinc-400 dark:fill-zinc-600";
}

function statusDotClass(status: TaskRecord["status"]) {
  if (status === "done") {
    return "bg-emerald-500";
  }

  if (status === "doing") {
    return "bg-blue-500";
  }

  if (status === "overdue") {
    return "bg-red-500";
  }

  return "bg-zinc-400";
}
