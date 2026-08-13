"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";
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
  expectedOutput,
  source,
  milestone,
  onToggle,
  onContextMenu,
  action,
}: {
  title: string;
  description: string;
  status: TaskRecord["status"];
  dueAt: string;
  completedAt?: string;
  estimatedMinutes: number;
  expectedOutput: string;
  source?: string;
  milestone?: boolean;
  onToggle: () => void;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  action?: React.ReactNode;
}) {
  const { t, formatDate } = useI18n();
  const completed = status === "done";
  return (
    <div className="flex items-start gap-3 py-3" onContextMenu={onContextMenu}>
      <button
        className="mt-0.5 shrink-0 rounded-full"
        aria-label={t(statusLabels[status])}
        onClick={onToggle}
      >
        <CheckCircleIcon
          className={`size-5 ${completed ? "text-green-500" : status === "doing" ? "text-blue-500" : "text-zinc-300 dark:text-zinc-700"}`}
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-sm font-medium ${completed ? "text-zinc-400 line-through" : ""}`}
          >
            {title}
          </p>
          {milestone && <Badge tone="warning">{t("hand.milestone")}</Badge>}
          <Badge
            tone={
              completed ? "success" : status === "doing" ? "info" : "neutral"
            }
          >
            {t(statusLabels[status])}
          </Badge>
        </div>
        {source && <p className="mt-1 text-xs text-zinc-500">{source}</p>}
        <p className="mt-1 text-xs text-zinc-500">
          {t("me.taskDueAt")}: {formatDate(dueAt)} · {t("me.taskEstimate")}:{" "}
          {estimatedMinutes} {t("common.minutes")}
        </p>
        {description && (
          <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
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
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
