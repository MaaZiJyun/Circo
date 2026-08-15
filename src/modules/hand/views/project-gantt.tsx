"use client";

import { useState } from "react";

import type { TaskRecord } from "@/shared/model/entities";
import { useI18n } from "@/shared/i18n/i18n-context";

const day = 86_400_000;
const chartWidth = 1000;
const rowHeight = 60;

type GanttRow = {
  task: TaskRecord;
  start: number;
  end: number;
  startX: number;
  endX: number;
};

export function ProjectGantt({
  tasks,
  startDate,
  endDate,
}: {
  tasks: TaskRecord[];
  startDate: string;
  endDate: string;
}) {
  const { t } = useI18n();
  const [today] = useState(() => startOfDay(Date.now()));

  const rootTasks = tasks.filter((task) => !task.parentId);
  if (!rootTasks.length) return null;

  const plan = buildGanttPlan(rootTasks, startDate, endDate);

  const rowById = new Map(
    plan.rows.map((row, index) => [
      row.task.id,
      {
        row,
        index,
      },
    ]),
  );

  const todayX =
    today >= plan.start && today <= plan.end
      ? ((today - plan.start) / (plan.end - plan.start)) * chartWidth
      : null;

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/70 px-6 py-5 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />

            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t("hand.gantt")}
            </h3>
          </div>

          <p className="mt-1.5 text-xs text-zinc-500">
            {t("hand.ganttHint")}
          </p>
        </div>

        <div className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          {shortDate(plan.start)} → {shortDate(plan.end - day)}
        </div>
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[1100px]">
          {/* Column headers */}
          <div className="grid grid-cols-[240px_190px_minmax(670px,1fr)] border-b border-zinc-200/70 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex items-center px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              {t("common.title")}
            </div>

            <div className="flex items-center border-l border-zinc-200/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:border-zinc-800">
              {t("hand.dependencies")}
            </div>

            {/* Timeline header */}
            <div className="relative border-l border-zinc-200/70 dark:border-zinc-800">
              <div
                className="grid h-full"
                style={{
                  gridTemplateColumns: `repeat(${plan.ticks.length}, minmax(0, 1fr))`,
                }}
              >
                {plan.ticks.map((tick) => (
                  <div
                    key={tick}
                    className="border-r border-zinc-200/60 px-3 py-3 last:border-r-0 dark:border-zinc-800/70"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      {monthLabel(tick)}
                    </div>

                    <div className="mt-0.5 text-xs font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                      {dayLabel(tick)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-[240px_190px_minmax(670px,1fr)]">
            {/* Task column */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {plan.rows.map(({ task }) => (
                <div
                  key={task.id}
                  className="group flex h-[60px] min-w-0 items-center px-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(
                          task.status,
                        )}`}
                      />

                      <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {task.title}
                      </p>
                    </div>

                    <p className="ml-4 mt-1 text-[11px] tabular-nums text-zinc-400">
                      Due {shortDate(safeDate(task.dueDate, plan.start))}
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
                  .filter(Boolean);

                return (
                  <div
                    key={task.id}
                    className="flex h-[60px] items-center px-5 text-xs text-zinc-500 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                  >
                    {names.length ? (
                      <div className="flex flex-wrap gap-1">
                        {names.slice(0, 2).map((name) => (
                          <span
                            key={name}
                            className="max-w-[130px] truncate rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                          >
                            {name}
                          </span>
                        ))}

                        {names.length > 2 && (
                          <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-500 dark:bg-zinc-900">
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
              {/* Alternating rows */}
              {plan.rows.map((_, index) => (
                <div
                  key={index}
                  className={`absolute left-0 right-0 ${
                    index % 2 === 0
                      ? "bg-white/60 dark:bg-zinc-950"
                      : "bg-zinc-50/60 dark:bg-zinc-900/20"
                  }`}
                  style={{
                    top: index * rowHeight,
                    height: rowHeight,
                  }}
                />
              ))}

              <svg
                viewBox={`0 0 ${chartWidth} ${
                  plan.rows.length * rowHeight
                }`}
                preserveAspectRatio="none"
                className="relative z-10 block w-full"
                style={{
                  height: plan.rows.length * rowHeight,
                }}
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
                </defs>

                {/* Vertical time grid */}
                {plan.ticks.map((_, index) => {
                  const x = (index / plan.ticks.length) * chartWidth;

                  return (
                    <line
                      key={`tick-${index}`}
                      x1={x}
                      x2={x}
                      y1="0"
                      y2={plan.rows.length * rowHeight}
                      className="stroke-zinc-200/70 dark:stroke-zinc-800/70"
                      vectorEffect="non-scaling-stroke"
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
                    vectorEffect="non-scaling-stroke"
                  />
                ))}

                {/* Dependencies */}
                {plan.rows.flatMap((target, targetIndex) =>
                  (target.task.dependencyIds ?? []).map((dependencyId) => {
                    const source = rowById.get(dependencyId);

                    if (!source) return null;

                    const startY =
                      source.index * rowHeight + rowHeight / 2;

                    const endY =
                      targetIndex * rowHeight + rowHeight / 2;

                    const sourceEnd = source.row.endX;
                    const targetStart = target.startX;

                    const bendX = Math.min(
                      chartWidth - 10,
                      Math.max(sourceEnd + 14, targetStart - 18),
                    );

                    return (
                      <path
                        key={`${dependencyId}-${target.task.id}`}
                        d={`M ${sourceEnd} ${startY}
                            H ${bendX}
                            V ${endY}
                            H ${targetStart}`}
                        fill="none"
                        markerEnd="url(#gantt-dependency-arrow)"
                        className="stroke-zinc-300 dark:stroke-zinc-700"
                        strokeWidth="1.2"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  }),
                )}

                {/* Task bars */}
                {plan.rows.map((row, index) => {
                  const width = Math.max(10, row.endX - row.startX);

                  return (
                    <g key={row.task.id}>
                      {/* Shadow */}
                      <rect
                        x={row.startX}
                        y={index * rowHeight + 18}
                        width={width}
                        height="26"
                        rx="8"
                        className="fill-black/5 dark:fill-black/20"
                        transform="translate(0 2)"
                      />

                      {/* Main bar */}
                      <rect
                        x={row.startX}
                        y={index * rowHeight + 17}
                        width={width}
                        height="26"
                        rx="8"
                        className={`${barClass(
                          row.task.status,
                        )} transition-opacity hover:opacity-90`}
                      />

                      {/* Label */}
                      {width > 110 && (
                        <text
                          x={row.startX + 10}
                          y={index * rowHeight + 34}
                          fontSize="10"
                          fontWeight="600"
                          className="fill-white"
                          style={{
                            pointerEvents: "none",
                          }}
                        >
                          {truncateSvgText(row.task.title, width)}
                        </text>
                      )}

                      <title>
                        {`${row.task.title}: ${shortDate(
                          row.start,
                        )} - ${shortDate(row.end - day)}`}
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
                      y2={plan.rows.length * rowHeight}
                      className="stroke-red-500"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
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
                  className="pointer-events-none absolute top-1 z-20 -translate-x-1/2 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-semibold text-white shadow-sm"
                  style={{
                    left: `${(todayX / chartWidth) * 100}%`,
                  }}
                >
                  TODAY
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <footer className="flex flex-wrap items-center gap-5 border-t border-zinc-200/70 bg-zinc-50/50 px-6 py-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/20">
        <Legend color="bg-zinc-400" label="Todo" />
        <Legend color="bg-blue-500" label="Doing" />
        <Legend color="bg-emerald-500" label="Done" />
        <Legend color="bg-red-500" label="Overdue" />

        <span className="ml-auto hidden tabular-nums text-zinc-400 sm:inline">
          {plan.rows.length} tasks
        </span>
      </footer>
    </section>
  );
}

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
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
    ...row,
    startX:
      ((row.start - start) / range) * chartWidth,
    endX:
      ((row.end - start) / range) * chartWidth,
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

function shortDate(value: number) {
  const date = new Date(value);

  return `${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}/${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function monthLabel(value: number) {
  return new Date(value)
    .toLocaleDateString("en-US", {
      month: "short",
    })
    .toUpperCase();
}

function dayLabel(value: number) {
  const date = new Date(value);

  return `${date.getDate()}`;
}

function getTickCount(range: number) {
  const days = range / day;

  if (days <= 14) return Math.max(4, Math.ceil(days));
  if (days <= 60) return 8;
  if (days <= 180) return 10;

  return 12;
}

function truncateSvgText(
  text: string,
  width: number,
) {
  const maxChars = Math.floor(
    (width - 20) / 6,
  );

  if (text.length <= maxChars) return text;

  return `${text.slice(
    0,
    Math.max(1, maxChars - 1),
  )}…`;
}

function barClass(
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
