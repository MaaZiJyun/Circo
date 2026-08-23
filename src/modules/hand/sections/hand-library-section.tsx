"use client";

import {
  PlusIcon,
} from "@heroicons/react/24/outline";
import { LibrarySortControls } from "@/shared/components/library-sort-controls";
import { TableLibraryWorkspace } from "@/shared/components/table-library-workspace";
import { Button, EmptyState } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import { ProjectTable } from "../widgets";
import type { useProjectLibrary } from "../view-models/use-project-library";

type ProjectLibrary = ReturnType<typeof useProjectLibrary>;

export function HandProjectLibrarySection({
  library,
  onCreate,
  onChooseList,
  onDeleteSelected,
  onOpen,
  onOpenMenu,
}: {
  library: ProjectLibrary;
  onCreate: () => void;
  onChooseList: () => void;
  onDeleteSelected: () => void;
  onOpen: (project: ProjectLibrary["projects"][number]) => void;
  onOpenMenu: (
    project: ProjectLibrary["projects"][number],
    position: { x: number; y: number },
  ) => void;
}) {
  const { t } = useI18n();
  const selectionMode = library.selectedIds.length > 0;
  const ascending = library.sortDirection === "ascending";

  return (
    <TableLibraryWorkspace
      title={
        library.selectedList?.system
          ? t(`hand.list.${library.selectedList.system}`)
          : library.selectedList?.name || t("hand.projectLibrary")
      }
      controls={
        <LibrarySortControls
          label={t("hand.sortBy")}
          value={library.sortBy}
          options={[
            { value: "startDate", label: t("hand.startDate") },
            { value: "endDate", label: t("hand.endDate") },
            { value: "score", label: t("hand.projectScore") },
          ]}
          ascending={ascending}
          directionLabel={t(
            ascending ? "hand.ascending" : "hand.descending",
          )}
          onChange={(value) => library.setSortBy(value as typeof library.sortBy)}
          onToggleDirection={() =>
            library.setSortDirection(
              ascending ? "descending" : "ascending",
            )
          }
        />
      }
      action={
        <Button className="whitespace-nowrap" onClick={onCreate}>
          <PlusIcon className="size-4" />
          {t("hand.newProject")}
        </Button>
      }
      selectionLabel={
        selectionMode
          ? t("hand.selectedCount").replace(
              "{count}",
              String(library.selectedIds.length),
            )
          : undefined
      }
      onCancelSelection={
        selectionMode ? () => library.setSelectedIds([]) : undefined
      }
      selectionActions={
        <>
          <Button variant="secondary" onClick={onChooseList}>
            {t("hand.addToList")}
          </Button>
          <Button
            variant="secondary"
            disabled={library.selectedList?.system !== null}
            onClick={library.removeFromCurrentList}
          >
            {t("hand.removeFromList")}
          </Button>
          <Button variant="danger" onClick={onDeleteSelected}>
            {t("common.delete")}
          </Button>
        </>
      }
    >
      {library.projects.length ? (
        <ProjectTable
          library={library}
          selectionMode={selectionMode}
          onEnterSelection={(project) => library.setSelectedIds([project.id])}
          onOpen={onOpen}
          onOpenMenu={onOpenMenu}
        />
      ) : (
        <EmptyState
          title={t("common.noData")}
          description={t("hand.projectGateHint")}
        />
      )}
    </TableLibraryWorkspace>
  );
}

