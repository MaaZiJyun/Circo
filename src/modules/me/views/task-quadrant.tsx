"use client";

import { useI18n } from "@/shared/i18n/i18n-context";
import type { DailyTask } from "@/shared/model/entities";
import type { TaskCoordinates } from "../model/task-quadrant";

export function TaskQuadrant({
  tasks,
  coordinates,
}: {
  tasks: DailyTask[];
  coordinates: (task: DailyTask) => TaskCoordinates;
}) {
  const { t } = useI18n();
  return (
    <div className="relative h-[420px] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="absolute inset-y-0 left-1/2 border-l border-zinc-300 dark:border-zinc-700" />
      <div className="absolute inset-x-0 top-1/2 border-t border-zinc-300 dark:border-zinc-700" />
      <span className="absolute left-3 top-3 text-xs font-semibold text-red-600">
        {t("me.quadrant.schedule")}
      </span>
      <span className="absolute right-3 top-3 text-xs font-semibold text-red-600">
        {t("me.quadrant.do")}
      </span>
      <span className="absolute bottom-3 left-3 text-xs font-semibold text-zinc-500">
        {t("me.quadrant.eliminate")}
      </span>
      <span className="absolute bottom-3 right-3 text-xs font-semibold text-amber-600">
        {t("me.quadrant.delegate")}
      </span>
      {tasks
        .filter((task) => !task.completed)
        .map((task) => {
          const point = coordinates(task);
          return (
            <span
              key={task.id}
              title={`${task.title}\n${t("me.urgency")}: ${point.urgency}\n${t("me.importance")}: ${point.importance}`}
              className="absolute max-w-36 -translate-x-1/2 translate-y-1/2 truncate rounded-full border border-blue-300 bg-blue-100 px-2 py-1 text-xs font-medium text-blue-900 shadow-sm dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100"
              style={{
                left: `${point.urgency}%`,
                bottom: `${point.importance}%`,
              }}
            >
              {task.title}
            </span>
          );
        })}
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-zinc-400">
        {t("me.urgency")} →
      </span>
      <span className="absolute left-0 top-1/2 -translate-x-3 -rotate-90 text-[10px] text-zinc-400">
        {t("me.importance")} →
      </span>
    </div>
  );
}
