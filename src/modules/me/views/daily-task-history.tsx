"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { SectionHeader } from "@/shared/components/page-elements";
import { Card, EmptyState, IconButton } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import { activeItems } from "@/shared/model/app-state";
import { today } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";

export function DailyTaskHistory() {
  const { t, formatNumber } = useI18n();
  const { state, softDelete } = useStore();
  if (!state) return null;

  const projects = new Map(activeItems(state.projects).map((item) => [item.id, item.name]));
  const groups = new Map<string, typeof state.taskHistory>();
  for (const task of activeItems(state.taskHistory ?? [])) {
    const date = task.completedAt.slice(0, 10);
    if (date >= today()) continue;
    const group = groups.get(date) ?? [];
    group.push(task);
    groups.set(date, group);
  }
  const dates = [...groups.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <Card>
      <SectionHeader title={t("me.history")} />
      <p className="mb-4 text-sm text-zinc-500">{t("me.historyReadOnly")}</p>
      {dates.length ? (
        <div className="space-y-6">
          {dates.map((date) => (
            <section key={date}>
              <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {date}
              </h3>
              <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {groups.get(date)?.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <span className="text-sm text-zinc-500">✓</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {task.projectId
                          ? projects.get(task.projectId) ?? t("me.fromProject")
                          : t("me.independentTask")}
                        {" · "}
                        {formatNumber(task.actualMinutes ?? 0, {
                          maximumFractionDigits: 1,
                        })} {t("common.minutes")}
                      </p>
                    </div>
                    <IconButton
                      label={t("me.deleteHistory")}
                      onClick={() => {
                        if (window.confirm(t("common.confirmDelete"))) {
                          softDelete("taskHistory", task.id);
                        }
                      }}
                    >
                      <TrashIcon className="size-4" />
                    </IconButton>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState title={t("me.historyEmpty")} />
      )}
    </Card>
  );
}
