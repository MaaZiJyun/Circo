"use client";

import { useState } from "react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

import type { TaskRecord } from "@/shared/model/entities";
import { useI18n } from "@/shared/i18n/i18n-context";

const day = 86_400_000;
const chartWidth = 880;
const rowHeight = 60;
const barHeight = 28;
const barInsetY = (rowHeight - barHeight) / 2;

type GanttRow = {
  task: TaskRecord;
  start: number;
  end: number;
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

  const rootTasks = tasks.filter((task) => !task.parentId);
  if (!rootTasks.length) return null;

  const plan = buildGanttPlan(rootTasks, startDate, endDate);
  const range = Math.max(day, plan.end - plan.start);
  const toX = (ms: number) => ((ms - plan.start) / range) * chartWidth;

  const rowById = new Map(
    plan.rows.map((row, index) => [
      row.task.id,
      {
        row,
        index,
      },
    ]),
  );

  const totalHeight = plan.rows.length * rowHeight;
  const columnWidth = chartWidth / plan.ticks.length;
  const todayX =
    today >= plan.start && today <= plan.end ? toX(today) : null;
  const milestoneCount = rootTasks.filter((task) => task.milestone).length;
  const monthSpans = buildMonthSpans(plan.ticks, locale);

  return (
    <section className="mb-6 min-w-0 max-w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/70 px-6 py-5 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <CalendarDaysIcon className="size-5" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t("hand.gantt")}
            </h3>

            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {t("hand.ganttHint")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {milestoneCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rotate-45 bg-amber-500" />
              {milestoneCount} {t("hand.ganttMilestone")}
            </span>
          )}

          <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            {fullDate(plan.start, locale)} → {fullDate(plan.end - day, locale)}
          </span>
        </div>
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
                style={{
                  gridTemplateColumns: `repeat(${plan.ticks.length}, minmax(0, 1fr))`,
                }}
              >
                {monthSpans.map((span, index) => (
                  <div
                    key={index}
                    className="border-b border-zinc-200/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800/70 dark:text-zinc-500"
                    style={{
                      gridColumn: `span ${span.count}`,
                    }}
                  >
                    {span.label}
                  </div>
                ))}
              </div>

              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${plan.ticks.length}, minmax(0, 1fr))`,
                }}
              >
                {plan.ticks.map((tick, index) => (
                  <div
                    key={index}
                    className={`border-r border-zinc-200/60 px-3 py-2 last:border-r-0 dark:border-zinc-800/70 ${
                      isWeekend(tick)
                        ? "bg-zinc-100/80 dark:bg-white/[0.04]"
                        : ""
                    }`}
                  >
                    <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {weekdayShort(tick, locale)}
                    </div>

                    <div className="mt-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                      {dayNumber(tick)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-[240px_170px_880px]">
            {/* Task column */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {plan.rows.map(({ task }) => (
                <div
                  key={task.id}
                  className="group flex min-w-0 items-center px-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
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
              {plan.rows.map(({ task }) => {
                const names = (task.dependencyIds ?? [])
                  .map((id) => rowById.get(id)?.row.task.title)
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
                      <span className="text-zinc-300 dark:text-zinc-700">—</span>
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

                  {plan.rows.map((row, index) => (
                    <clipPath
                      key={row.task.id}
                      id={`bar-clip-${row.task.id}`}
                    >
                      <rect
                        x={toX(row.start)}
                        y={index * rowHeight + barInsetY}
                        width={Math.max(8, toX(row.end) - toX(row.start))}
                        height={barHeight}
                        rx={9}
                      />
                    </clipPath>
                  ))}
                </defs>

                {/* Weekend bands */}
                {plan.ticks.map((tick, index) =>
                  isWeekend(tick) ? (
                    <rect
                      key={`weekend-${index}`}
                      x={index * columnWidth}
                      y="0"
                      width={columnWidth}
                      height={totalHeight}
                      className="fill-zinc-100/70 dark:fill-white/[0.03]"
                    />
                  ) : null,
                )}

                {/* Vertical time grid */}
                {plan.ticks.map((_, index) => {
                  const x = index * columnWidth;

                  return (
                    <line
                      key={`tick-${index}`}
                      x1={x}
                      x2={x}
                      y1="0"
                      y2={totalHeight}
                      className="stroke-zinc-200/70 dark:stroke-zinc-800/70"
                    />
                  );
                })}

                {/* Horizontal rows */}
                {plan.rows.map((_, index) => (
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
                {plan.rows.map((_, index) => (
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
                {plan.rows.flatMap((target, targetIndex) =>
                  (target.task.dependencyIds ?? []).map((dependencyId) => {
                    const source = rowById.get(dependencyId);

                    if (!source) return null;

                    const startY = source.index * rowHeight + rowHeight / 2;
                    const endY = targetIndex * rowHeight + rowHeight / 2;
                    const sourceEnd = toX(source.row.end);
                    const targetStart = toX(target.start);

                    return (
                      <g key={`${dependencyId}-${target.task.id}`}>
                        <path
                          d={dependencyPath(sourceEnd, startY, endY, targetStart)}
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
                {plan.rows.map((row, index) => {
                  const startX = toX(row.start);
                  const endX = toX(row.end);
                  const width = Math.max(8, endX - startX);
                  const y = index * rowHeight + barInsetY;
                  const progress =
                    row.task.estimatedMinutes > 0
                      ? Math.min(
                          1,
                          Math.max(
                            0,
                            row.task.actualMinutes / row.task.estimatedMinutes,
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
                        )} → ${fullDate(row.end - day, locale)}`}
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

                    <circle cx={todayX} cy="6" r="4" className="fill-red-500" />
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
            String(plan.rows.length),
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
    safeDate(
      endDate,
      Math.max(...dueDates, projectStart),
    ) + day,
  );

  const schedule = new Map<
    string,
    {
      start: number;
      end: number;
    }
  >();

  const scheduled = dependencyOrder(tasks).map((task) => {
    const due = safeDate(task.dueDate, projectStart);

    const duration =
      Math.max(
        1,
        Math.ceil(Math.max(60, task.estimatedMinutes) / 480),
      ) * day;

    const dependencyEnd = Math.max(
      projectStart,
      ...(task.dependencyIds ?? []).map(
        (id) => schedule.get(id)?.end ?? projectStart,
      ),
    );

    const start = Math.max(
      due + day - duration,
      dependencyEnd,
    );

    const end = Math.max(
      due + day,
      start + duration,
    );

    schedule.set(task.id, {
      start,
      end,
    });

    return {
      task,
      start,
      end,
    };
  });

  const start = Math.min(
    projectStart,
    ...scheduled.map((row) => row.start),
  );

  const end = Math.max(
    projectEnd,
    ...scheduled.map((row) => row.end),
  );

  const range = Math.max(day, end - start);

  const rows: GanttRow[] = scheduled.map((row) => ({
    task: row.task,
    start: row.start,
    end: row.end,
  }));

  const tickCount = getTickCount(range);

  const ticks = Array.from(
    {
      length: tickCount,
    },
    (_, index) =>
      start + (range * index) / tickCount,
  );

  return {
    rows,
    start,
    end,
    ticks,
  };
}

function dependencyOrder(tasks: TaskRecord[]) {
  const byId = new Map(
    tasks.map((task) => [task.id, task]),
  );

  const ordered: TaskRecord[] = [];

  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (task: TaskRecord) => {
    if (
      visited.has(task.id) ||
      visiting.has(task.id)
    ) {
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

function safeDate(
  value: string,
  fallback: number,
) {
  const parsed = Date.parse(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function startOfDay(value: number) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
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

function weekdayShort(value: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
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

function buildMonthSpans(ticks: number[], locale: string) {
  const spans: { label: string; count: number }[] = [];
  let current: { label: string; count: number } | null = null;

  for (const tick of ticks) {
    const label = monthBandLabel(tick, locale);

    if (current && current.label === label) {
      current.count += 1;
    } else {
      if (current) spans.push(current);
      current = { label, count: 1 };
    }
  }

  if (current) spans.push(current);

  return spans;
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

function truncateSvgText(
  text: string,
  width: number,
) {
  const maxChars = Math.floor(
    (width - 20) / 6.2,
  );

  if (text.length <= maxChars) return text;

  return `${text.slice(
    0,
    Math.max(1, maxChars - 1),
  )}…`;
}

function barFill(
  status: TaskRecord["status"],
) {
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

function statusDotClass(
  status: TaskRecord["status"],
) {
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
