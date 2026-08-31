"use client";

import { Badge } from "@/shared/components/ui";
import { DataTable } from "@/shared/components/data-table";
import type { MenuPosition } from "@/shared/components/context-menu";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectRecord } from "@/shared/model/entities";
import type { useProjectLibrary } from "../view-models/use-project-library";

function truncateIntroduction(value: string) {
  const text = value.trim();
  return text.length > 50 ? `${text.slice(0, 50)}...` : text || "—";
}

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
  return (
    <DataTable
      rows={library.projects}
      minWidth="min-w-[960px]"
      selectionMode={selectionMode}
      selectedIds={library.selectedIds}
      selectAllLabel={t("hand.selectAll")}
      getRowLabel={(project) => project.name}
      onSelectAll={library.setSelectedIds}
      onToggleSelect={library.toggleSelected}
      onEnterSelection={onEnterSelection}
      onClick={onOpen}
      onOpenMenu={onOpenMenu}
      onDragStart={(event, project, ids) => {
        library.setDraggedIds(ids);
        event.dataTransfer.setData("text/plain", project.name);
      }}
      onDragEnd={() => library.setDraggedIds([])}
      columns={[
        {
          header: t("common.title"),
          className: "max-w-[30%] min-w-[200px] font-semibold",
          render: (project) => (
            <div className="line-clamp-4 max-h-24 break-words leading-6">
              {project.name}
            </div>
          ),
        },
        {
          header: t("hand.introduction"),
          className:
            "max-w-[30%] min-w-[300px] text-zinc-600 dark:text-zinc-400",
          render: (project) => truncateIntroduction(project.purpose),
        },
        {
          header: t("common.status"),
          render: (project) => (
            <Badge tone={project.status === "completed" ? "success" : "info"}>
              {t(statusLabels[project.status])}
            </Badge>
          ),
        },
        { header: t("hand.projectScore"), render: (project) => project.score },
        {
          header: t("hand.startDate"),
          className: "whitespace-nowrap",
          render: (project) => formatDate(project.startDate),
        },
        {
          header: t("hand.endDate"),
          className: "whitespace-nowrap",
          render: (project) => formatDate(project.endDate),
        },
        {
          header: t("common.tags"),
          render: (project) => (
            <div className="flex max-h-24 flex-wrap gap-1 overflow-hidden">
              {project.tags.slice(0, 3).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          ),
        },
        {
          header: t("hand.ideaSource"),
          render: (project) => project.ideaIds.length || "—",
        },
      ]}
    />
  );
}
