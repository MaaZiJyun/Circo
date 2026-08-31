"use client";

import { useEffect, useState } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { activeItems } from "@/shared/model/app-state";
import { now } from "@/shared/model/factories";
import { completeTask } from "@/shared/model/task-lifecycle";
import { deadlineTime } from "@/shared/model/task-status";
import {
  activeTaskReminders,
  taskReminderKey,
} from "@/shared/model/task-reminder";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useStore } from "@/shared/view-models/store-context";

export function TaskDeadlineReminder() {
  const { locale, t } = useI18n();
  const { state, mutate } = useStore();
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const update = () => setCurrentTime(Date.now());
    const initial = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);

  if (!state || currentTime === null) return null;
  const reminder = activeTaskReminders(
    activeItems(state.activities),
    currentTime,
    new Set(dismissed),
  )[0];
  if (!reminder) return null;
  const { task, kind } = reminder;
  const dismiss = () =>
    setDismissed((current) => [...current, taskReminderKey(task, kind)]);
  const complete = () => {
    dismiss();
    const stamp = now();
    mutate((current) => {
      return completeTask(current, task.id, stamp);
    });
  };

  return (
    <aside
      role="status"
      className="fixed right-6 top-6 z-[70] flex min-h-[25px] min-w-[100px] max-w-[calc(100vw-3rem)] items-center gap-4 rounded-full border border-zinc-200 bg-white px-6 py-3 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="min-w-0 flex-1">
        <p className="max-w-64 truncate text-sm font-medium">{task.title}</p>
        <p className="truncate text-xs text-zinc-500">
          {formatDeadline(task.dueDate, locale)}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {kind === "deadline" && (
          <button
            className="grid size-7 place-items-center rounded-full bg-green-500 text-white hover:bg-green-600"
            aria-label={t("dashboard.deadlineReminder.complete")}
            title={t("dashboard.deadlineReminder.complete")}
            onClick={complete}
          >
            <CheckIcon className="size-4" />
          </button>
        )}
        <button
          className="grid size-7 place-items-center rounded-full bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
          aria-label={t(
            kind === "deadline"
              ? "dashboard.deadlineReminder.incomplete"
              : "common.close",
          )}
          title={t(
            kind === "deadline"
              ? "dashboard.deadlineReminder.incomplete"
              : "common.close",
          )}
          onClick={dismiss}
        >
          <XMarkIcon className="size-4" />
        </button>
      </div>
    </aside>
  );
}

function formatDeadline(value: string, locale: string) {
  const deadline = deadlineTime(value);
  if (!Number.isFinite(deadline)) return value;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(deadline);
}
