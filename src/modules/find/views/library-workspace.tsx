"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { LibrarySortControls } from "@/shared/components/library-sort-controls";
import { Button } from "@/shared/components/ui";
import { TableLibraryWorkspace } from "@/shared/components/table-library-workspace";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { SourceRecord } from "@/shared/model/entities";
import type {
  LiteratureSort,
  useLibraryManagement,
} from "../view-models/use-library-management";
import type { MenuPosition } from "./context-menu";
import { LiteratureTable } from "./literature-table";

export function LibraryWorkspace({
  library,
  selectionMode,
  operationError,
  onEnterSelection,
  onOpenMenu,
  onRead,
  onAddSelected,
  onDeleteSelected,
  onCloseSelection,
  onImport,
}: {
  library: ReturnType<typeof useLibraryManagement>;
  selectionMode: boolean;
  operationError: string;
  onEnterSelection: (source: SourceRecord) => void;
  onOpenMenu: (source: SourceRecord, position: MenuPosition) => void;
  onRead: (source: SourceRecord) => void;
  onAddSelected: () => void;
  onDeleteSelected: () => void;
  onCloseSelection: () => void;
  onImport: () => void;
}) {
  const { t } = useI18n();
  const title = `${
    library.selectedList?.system
      ? t(`find.list.${library.selectedList.system}`)
      : library.selectedList?.name
  } · ${library.sources.length}`;
  const ascending = library.sortDirection === "ascending";
  return (
    <TableLibraryWorkspace
      title={title}
      controls={
        <LibrarySortControls
          label={t("find.sortBy")}
          value={library.sortBy}
          options={[
            { value: "addedAt", label: t("find.addedAt") },
            { value: "publicationDate", label: t("find.publicationDate") },
            { value: "rating", label: t("find.rating") },
          ]}
          ascending={ascending}
          directionLabel={t(ascending ? "find.ascending" : "find.descending")}
          onChange={(value) => library.setSortBy(value as LiteratureSort)}
          onToggleDirection={() =>
            library.setSortDirection(ascending ? "descending" : "ascending")
          }
        />
      }
      action={
        <Button className="whitespace-nowrap" onClick={onImport}>
          <PlusIcon className="size-4" />
          {t("find.import")}
        </Button>
      }
      selectionLabel={
        selectionMode
          ? t("find.selectedCount").replace(
              "{count}",
              String(library.selectedIds.length),
            )
          : undefined
      }
      onCancelSelection={selectionMode ? onCloseSelection : undefined}
      selectionActions={
        <>
          <Button
            variant="secondary"
            disabled={!library.selectedIds.length}
            onClick={onAddSelected}
          >
            {t("find.addToList")}
          </Button>
          <Button
            variant="secondary"
            disabled={library.selectedList?.system !== null}
            onClick={library.removeFromCurrentList}
          >
            {t("find.removeFromList")}
          </Button>
          <Button
            variant="danger"
            disabled={!library.selectedIds.length}
            onClick={onDeleteSelected}
          >
            {t("find.deleteOriginal")}
          </Button>
        </>
      }
    >
      {operationError && (
        <p className="mb-3 text-sm text-red-600">{operationError}</p>
      )}
      <LiteratureTable
        library={library}
        selectionMode={selectionMode}
        onEnterSelection={onEnterSelection}
        onOpenMenu={onOpenMenu}
        onRead={onRead}
      />
    </TableLibraryWorkspace>
  );
}
