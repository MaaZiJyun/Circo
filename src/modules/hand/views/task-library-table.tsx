"use client";

import { Badge } from "@/shared/components/ui";
import { DataTable } from "@/shared/components/data-table";
import type { MenuPosition } from "@/shared/components/context-menu";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ActivityRecord } from "@/shared/model/entities";
import type { useTaskLibrary } from "../view-models/use-task-library";

const statusTone: Record<
  ActivityRecord["status"],
  "neutral" | "info" | "success" | "warning"
> = {
  todo: "neutral",
  doing: "info",
  done: "success",
  overdue: "warning",
};

export function TaskLibraryTable({
  library,
  selectionMode,
  onEnterSelection,
  onEdit,
  onOpenMenu,
}: {
  library: ReturnType<typeof useTaskLibrary>;
  selectionMode: boolean;
  onEnterSelection: (task: ActivityRecord) => void;
  onEdit: (task: ActivityRecord) => void;
  onOpenMenu: (task: ActivityRecord, position: MenuPosition) => void;
}) {
  const { t, formatDate } = useI18n();
  const categoryOf = (task: ActivityRecord) => {
    if (task.projectId)
      return (
        library.projects.find((item) => item.id === task.projectId)?.name ??
        "—"
      );
    const names = (task.listIds ?? [])
      .map((id) => library.lists.find((item) => item.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    return names.length ? names.join(", ") : "—";
  };
  return (
    <DataTable
      rows={library.activities}
      minWidth="min-w-[900px]"
      selectionMode={selectionMode}
      selectedIds={library.selectedIds}
      selectAllLabel={t("hand.selectAll")}
      getRowLabel={(task) => task.title}
      onSelectAll={library.setSelectedIds}
      onToggleSelect={library.toggleSelected}
      onEnterSelection={onEnterSelection}
      onClick={(task) => {
        if (!task.archivedAt) onEdit(task);
      }}
      onOpenMenu={onOpenMenu}
      onDragStart={(event, task, ids) => {
        library.setDraggedIds(ids);
        event.dataTransfer.setData("text/plain", task.title);
      }}
      onDragEnd={() => library.setDraggedIds([])}
      emptyLabel={t("common.noData")}
      columns={[
        {
          header: t("common.title"),
          className: "max-w-[30%] min-w-[200px] font-semibold",
          render: (task) => (
            <div className="line-clamp-3 break-words leading-6">
              {task.title}
            </div>
          ),
        },
        {
          header: t("hand.category"),
          className: "text-zinc-600 dark:text-zinc-400",
          render: (task) => categoryOf(task),
        },
        {
          header: t("common.status"),
          render: (task) => (
            <Badge tone={task.archivedAt ? "neutral" : statusTone[task.status]}>
              {task.archivedAt ? t(statusLabels.archived) : t(statusLabels[task.status])}
            </Badge>
          ),
        },
        {
          header: t("me.due"),
          className: "whitespace-nowrap",
          render: (task) => formatDate(task.dueDate),
        },
        { header: t("me.importance"), render: (task) => task.importance },
        { header: t("hand.estimate"), render: (task) => task.estimatedMinutes },
      ]}
    />
  );
}
