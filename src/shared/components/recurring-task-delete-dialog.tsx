"use client";

import { Button, Dialog } from "./ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { TaskRecord } from "@/shared/model/entities";
import type { RecurringDeleteMode } from "@/shared/model/task-recurrence";

export function RecurringTaskDeleteDialog({
  task,
  onClose,
  onDelete,
}: {
  task: TaskRecord;
  onClose: () => void;
  onDelete: (mode: RecurringDeleteMode) => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog
      open
      title={t("task.recurrence.deleteTitle")}
      closeLabel={t("common.cancel")}
      onClose={onClose}
    >
      <p className="mb-5 text-sm text-zinc-500">{task.title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" onClick={() => onDelete("single")}>
          {t("task.recurrence.deleteSingle")}
        </Button>
        <Button variant="danger" onClick={() => onDelete("series")}>
          {t("task.recurrence.deleteSeries")}
        </Button>
      </div>
    </Dialog>
  );
}
