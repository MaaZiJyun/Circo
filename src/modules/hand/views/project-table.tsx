"use client";

import { useRef } from "react";
import { Badge, Checkbox } from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectRecord } from "@/shared/model/entities";
import type { MenuPosition } from "@/modules/find/views/context-menu";
import type { useProjectLibrary } from "../view-models/use-project-library";

export function ProjectTable({
  library,
  selectionMode,
  onEnterSelection,
  onOpen,
  onOpenMenu,
}: {
  library: ReturnType<typeof useProjectLibrary>;
  selectionMode: boolean;
  onEnterSelection: (project: ProjectRecord) => void;
  onOpen: (project: ProjectRecord) => void;
  onOpenMenu: (project: ProjectRecord, position: MenuPosition) => void;
}) {
  const { t, formatDate } = useI18n();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedId = useRef<string | null>(null);
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };
  const allSelected =
    library.projects.length > 0 &&
    library.projects.every((item) => library.selectedIds.includes(item.id));
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-900">
          <tr>
            {selectionMode && (
              <th className="h-8 w-12 px-3 py-0">
                <Checkbox
                  aria-label={t("hand.selectAll")}
                  checked={allSelected}
                  onChange={() =>
                    library.setSelectedIds(
                      allSelected
                        ? []
                        : library.projects.map((item) => item.id),
                    )
                  }
                />
              </th>
            )}
            <th className="h-8 px-3 py-0">
              {t("common.title")}
            </th>
            <th className="h-8 px-3 py-0">{t("common.status")}</th>
            <th className="h-8 px-3 py-0">{t("hand.projectScore")}</th>
            <th className="h-8 px-3 py-0">{t("hand.startDate")}</th>
            <th className="h-8 px-3 py-0">{t("hand.endDate")}</th>
            <th className="h-8 px-3 py-0">{t("common.tags")}</th>
            <th className="h-8 px-3 py-0">{t("hand.ideaSource")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {library.projects.map((project) => (
            <tr
              key={project.id}
              draggable
              className={`${library.selectedIds.includes(project.id) ? "bg-blue-50 dark:bg-blue-950/30" : ""} max-h-[120px] cursor-grab select-none hover:bg-zinc-50 dark:hover:bg-zinc-900/60`}
              onDragStart={(event) => {
                cancelPress();
                const ids = library.selectedIds.includes(project.id)
                  ? library.selectedIds
                  : [project.id];
                library.setDraggedIds(ids);
                event.dataTransfer.setData("text/plain", project.name);
              }}
              onDragEnd={() => library.setDraggedIds([])}
              onPointerDown={(event) => {
                if (event.button !== 0 || selectionMode) return;
                cancelPress();
                pressTimer.current = setTimeout(() => {
                  longPressedId.current = project.id;
                  onEnterSelection(project);
                }, 550);
              }}
              onPointerUp={cancelPress}
              onPointerCancel={cancelPress}
              onPointerMove={cancelPress}
              onClick={(event) => {
                if (longPressedId.current === project.id) {
                  event.preventDefault();
                  longPressedId.current = null;
                  return;
                }
                if (selectionMode) {
                  event.preventDefault();
                  library.toggleSelected(project.id);
                } else onOpen(project);
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                cancelPress();
                onOpenMenu(project, { x: event.clientX, y: event.clientY });
              }}
            >
              {selectionMode && (
                <td className="px-3 py-3 align-top">
                  <Checkbox
                    aria-label={project.name}
                    checked={library.selectedIds.includes(project.id)}
                    onChange={() => undefined}
                  />
                </td>
              )}
              <td className="max-w-[30%] min-w-[200px] px-3 py-3 align-top font-semibold">
                <div className="line-clamp-4 max-h-24 break-words leading-6">
                  {project.name}
                </div>
              </td>
              <td className="px-3 py-3 align-top">
                <Badge
                  tone={project.status === "completed" ? "success" : "info"}
                >
                  {t(statusLabels[project.status])}
                </Badge>
              </td>
              <td className="px-3 py-3 align-top">{project.score}</td>
              <td className="whitespace-nowrap px-3 py-3 align-top">
                {formatDate(project.startDate)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 align-top">
                {formatDate(project.endDate)}
              </td>
              <td className="px-3 py-3 align-top">
                <div className="flex max-h-24 flex-wrap gap-1 overflow-hidden">
                  {project.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </td>
              <td className="px-3 py-3 align-top">
                {project.ideaIds.length || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
