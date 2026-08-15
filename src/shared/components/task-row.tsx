"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { TaskRecord } from "@/shared/model/entities";
import { Badge } from "./ui";

export function TaskRow({
  title,
  description,
  status,
  dueAt,
  completedAt,
  estimatedMinutes,
  actualMinutes,
  expectedOutput,
  source,
  milestone,
  deadlineInline = false,
  toggleDisabled = false,
  draggable = false,
  onToggle,
  onContextMenu,
  onDragStart,
  action,
}: {
  title: string;
  description: string;
  status: TaskRecord["status"];
  dueAt: string;
  completedAt?: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  expectedOutput: string;
  source?: string;
  milestone?: boolean;
  deadlineInline?: boolean;
  toggleDisabled?: boolean;
  draggable?: boolean;
  onToggle: () => void;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
  action?: React.ReactNode;
}) {
  const { t, formatDate, locale } = useI18n();
  const completed = status === "done";
  const [expandedOverride, setExpandedOverride] = useState<boolean | null>(null);
  const expanded = expandedOverride ?? !completed;

  return (
    <div
      draggable={draggable || undefined}
      className={`select-none flex items-start gap-3 py-3 ${draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
      onClick={() => setExpandedOverride(!expanded)}
      onContextMenu={onContextMenu}
      onDragStart={onDragStart}
    >
      <button
        className="mt-0.5 shrink-0 rounded-full"
        aria-label={t(statusLabels[status])}
        disabled={toggleDisabled}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        <CheckCircleIcon
          className={`size-5 ${completed ? "text-green-500" : status === "overdue" ? "text-red-500" : status === "doing" ? "text-blue-500" : "text-zinc-300 dark:text-zinc-700"}`}
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {deadlineInline ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <p
                title={title}
                className={`min-w-0 truncate text-sm font-medium ${completed ? "text-zinc-400 line-through" : ""}`}
              >
                {title}
              </p>
              <time className="shrink-0 whitespace-nowrap text-xs text-zinc-500">
                {t("me.taskDueAt")}: {formatDeadline(dueAt, locale)}
              </time>
            </div>
          ) : (
            <p
              className={`text-sm font-medium ${completed ? "text-zinc-400 line-through" : ""}`}
            >
              {title}
            </p>
          )}
          {expanded && milestone && (
            <Badge tone="warning">{t("hand.milestone")}</Badge>
          )}
          <Badge
            tone={
              completed
                ? "success"
                : status === "overdue"
                  ? "danger"
                  : status === "doing"
                    ? "info"
                    : "neutral"
            }
          >
            {t(statusLabels[status])}
          </Badge>
        </div>
        {expanded && (
          <>
            {source && <p className="mt-1 text-xs text-zinc-500">{source}</p>}
            <p className="mt-1 text-xs text-zinc-500">
              {!deadlineInline && (
                <>
                  {t("me.taskDueAt")}: {formatDate(dueAt)} ·{" "}
                </>
              )}
              {t("me.taskEstimate")}: {estimatedMinutes} {t("common.minutes")}
              {actualMinutes !== undefined && (
                <>
                  {" · "}
                  {t("me.actualTime")}: {formatElapsed(actualMinutes)}
                </>
              )}
            </p>
            {description && (
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {description}
              </p>
            )}
            {expectedOutput && (
              <p className="mt-1 text-xs text-zinc-500">
                {t("me.taskExpectedOutput")}: {expectedOutput}
              </p>
            )}
            {completedAt && (
              <p className="mt-1 text-xs text-zinc-500">
                {t("me.completedAt")}: {formatDate(completedAt)}
              </p>
            )}
          </>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function formatDeadline(value: string, locale: string) {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T23:59`
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatElapsed(minutes: number) {
  const totalSeconds = Math.floor(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const remainingMinutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;
  return hours
    ? `${hours}h ${remainingMinutes}m ${seconds}s`
    : `${remainingMinutes}m ${seconds}s`;
}
