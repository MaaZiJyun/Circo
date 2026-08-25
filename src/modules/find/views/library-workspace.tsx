"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { LibrarySortControls } from "@/shared/components/library-sort-controls";
import { Button } from "@/shared/components/ui";
import { TableLibraryWorkspace } from "@/shared/components/table-library-workspace";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { SourceRecord } from "@/shared/model/entities";
import type {
  LiteratureSort,
  SortDirection,
  useLibraryManagement,
} from "../view-models/use-library-management";
import type { MenuPosition } from "@/shared/components/context-menu";
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
  return (
    <TableLibraryWorkspace
      title={title}
      controls={
        <LibrarySortControls
          label={t("find.sortBy")}
          value={`${library.sortBy}:${library.sortDirection}`}
          options={[
            {
              value: "addedAt:ascending",
              label: t("find.sortCreatedAscending"),
            },
            {
              value: "addedAt:descending",
              label: t("find.sortCreatedDescending"),
            },
            {
              value: "publicationDate:ascending",
              label: t("find.sortPublishedAscending"),
            },
            {
              value: "publicationDate:descending",
              label: t("find.sortPublishedDescending"),
            },
            { value: "title:ascending", label: t("find.sortTitleAscending") },
            {
              value: "title:descending",
              label: t("find.sortTitleDescending"),
            },
          ]}
          onChange={(value) => {
            const [sortBy, sortDirection] = value.split(":") as [
              LiteratureSort,
              SortDirection,
            ];
            library.setSortBy(sortBy);
            library.setSortDirection(sortDirection);
          }}
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
