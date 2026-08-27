"use client";

import { useMemo, useState } from "react";
import { Dialog, EmptyState, Input } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ActivityRecord } from "@/shared/model/entities";
import type { DailyTaskInput } from "../model/daily-task-input";
import { TaskDialog } from "@/modules/hand/views/task-dialog";
import type { ActivityInput } from "@/modules/hand/view-models/use-hand-view-model";
import { formatLocalDateTime, parseLocalDateTime } from "@/shared/model/factories";

export function CreateDailyTaskDialog({
  open,
  onClose,
  onSave,
  title,
  plannedDate,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: DailyTaskInput) => void;
  title?: string;
  plannedDate?: string;
  initial?: DailyTaskInput;
}) {
  const convertToActivity = (value?: DailyTaskInput): ActivityInput | undefined =>
    value
      ? {
          ...value,
          startDate: Number.isFinite(parseLocalDateTime(value.dueAt))
            ? formatLocalDateTime(
                parseLocalDateTime(value.dueAt) - value.estimatedMinutes * 60 * 1000,
              )
            : value.dueAt,
          dueDate: value.dueAt,
          activityType: "task",
          parentId: undefined,
        }
      : undefined;
  return (
    <TaskDialog
      open={open}
      initial={convertToActivity(initial)}
      initialStartDate={initial?.dueAt ?? (plannedDate ? `${plannedDate}T09:00` : undefined)}
      onClose={onClose}
      onSave={(value) => {
        onSave({ ...value, dueAt: value.dueDate });
      }}
      title={title}
    />
  );
}

export function RetrieveTaskDialog({
  open,
  activities,
  projectName,
  existingIds,
  onClose,
  onChoose,
}: {
  open: boolean;
  activities: ActivityRecord[];
  projectName: (id?: string) => string;
  existingIds: string[];
  onClose: () => void;
  onChoose: (task: ActivityRecord) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const results = useMemo(
    () =>
      activities.filter(
        (task) =>
          task.status !== "done" &&
          !existingIds.includes(task.id) &&
          `${task.title} ${projectName(task.projectId)}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [existingIds, projectName, query, activities],
  );
  return (
    <Dialog
      open={open}
      title={t("me.dailyRetrieve")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <Input
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("me.dailySearchPlaceholder")}
      />
      <div className="mt-4 grid max-h-96 gap-2 overflow-y-auto">
        {results.map((task) => (
          <button
            key={task.id}
            className="rounded-xl border border-zinc-200 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            onClick={() => onChoose(task)}
          >
            <p className="text-sm font-medium">{task.title}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {projectName(task.projectId) || t("me.independentTask")}
            </p>
          </button>
        ))}
        {!results.length && <EmptyState title={t("common.noData")} />}
      </div>
    </Dialog>
  );
}
