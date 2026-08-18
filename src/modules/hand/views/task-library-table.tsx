"use client";

import { useRef } from "react";
import { Badge, Checkbox } from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { TaskRecord } from "@/shared/model/entities";
import type { MenuPosition } from "@/modules/find/views/context-menu";
import type { useTaskLibrary } from "../view-models/use-task-library";

const statusTone: Record<
  TaskRecord["status"],
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
  onEnterSelection: (task: TaskRecord) => void;
  onEdit: (task: TaskRecord) => void;
  onOpenMenu: (task: TaskRecord, position: MenuPosition) => void;
}) {
  const { t, formatDate } = useI18n();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedId = useRef<string | null>(null);
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };
  const allSelected =
    library.tasks.length > 0 &&
    library.tasks.every((item) => library.selectedIds.includes(item.id));
  const categoryOf = (task: TaskRecord) => {
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
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          <tr>
            {selectionMode && (
              <th className="h-8 w-12 px-3 py-0">
                <Checkbox
                  aria-label={t("hand.selectAll")}
                  checked={allSelected}
                  onChange={() =>
                    library.setSelectedIds(
                      allSelected ? [] : library.tasks.map((item) => item.id),
                    )
                  }
                />
              </th>
            )}
            <th className="h-8 px-3 py-0">{t("common.title")}</th>
            <th className="h-8 px-3 py-0">{t("hand.category")}</th>
            <th className="h-8 px-3 py-0">{t("common.status")}</th>
            <th className="h-8 px-3 py-0">{t("me.due")}</th>
            <th className="h-8 px-3 py-0">{t("me.importance")}</th>
            <th className="h-8 px-3 py-0">{t("hand.estimate")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {library.tasks.map((task) => (
            <tr
              key={task.id}
              draggable
              className={`${library.selectedIds.includes(task.id) ? "bg-blue-50 dark:bg-blue-950/30" : ""} cursor-grab select-none transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60`}
              onDragStart={(event) => {
                cancelPress();
                const ids = library.selectedIds.includes(task.id)
                  ? library.selectedIds
                  : [task.id];
                library.setDraggedIds(ids);
                event.dataTransfer.setData("text/plain", task.title);
              }}
              onDragEnd={() => library.setDraggedIds([])}
              onPointerDown={(event) => {
                if (event.button !== 0 || selectionMode) return;
                cancelPress();
                pressTimer.current = setTimeout(() => {
                  longPressedId.current = task.id;
                  onEnterSelection(task);
                }, 550);
              }}
              onPointerUp={cancelPress}
              onPointerCancel={cancelPress}
              onPointerMove={cancelPress}
              onClick={(event) => {
                if (longPressedId.current === task.id) {
                  event.preventDefault();
                  longPressedId.current = null;
                  return;
                }
                if (selectionMode) {
                  event.preventDefault();
                  library.toggleSelected(task.id);
                };
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                cancelPress();
                onOpenMenu(task, { x: event.clientX, y: event.clientY });
              }}
            >
              {selectionMode && (
                <td className="px-3 py-3 align-top">
                  <Checkbox
                    aria-label={task.title}
                    checked={library.selectedIds.includes(task.id)}
                    onChange={() => undefined}
                  />
                </td>
              )}
              <td className="max-w-[30%] min-w-[200px] px-3 py-3 align-top font-semibold">
                <div className="line-clamp-3 break-words leading-6">
                  {task.title}
                </div>
              </td>
              <td className="px-3 py-3 align-top text-zinc-600 dark:text-zinc-400">
                {categoryOf(task)}
              </td>
              <td className="px-3 py-3 align-top">
                <Badge tone={statusTone[task.status]}>
                  {t(statusLabels[task.status])}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-3 py-3 align-top">
                {formatDate(task.dueDate)}
              </td>
              <td className="px-3 py-3 align-top">{task.importance}</td>
              <td className="px-3 py-3 align-top">{task.estimatedMinutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
