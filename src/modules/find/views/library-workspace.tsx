"use client";

import { PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, Select } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { SourceRecord } from "@/shared/model/entities";
import type {
  LiteratureSort,
  SortDirection,
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
  return (
    <section className="min-w-0 space-y-3">
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">
            {library.selectedList?.system
              ? t(`find.list.${library.selectedList.system}`)
              : library.selectedList?.name}
          </h2>
          <p className="text-xs text-zinc-500">
            {t("find.literatureCount").replace(
              "{count}",
              String(library.sources.length),
            )}
          </p>
        </div>

        {!selectionMode && (
          <div className="flex items-center gap-2">
            <Select
              aria-label={t("find.sortBy")}
              value={library.sortBy}
              onChange={(event) =>
                library.setSortBy(event.target.value as LiteratureSort)
              }
              className="w-36"
            >
              <option value="addedAt">{t("find.addedAt")}</option>
              <option value="publicationDate">
                {t("find.publicationDate")}
              </option>
              <option value="rating">{t("find.rating")}</option>
            </Select>
            <Select
              aria-label={t("find.sortDirection")}
              value={library.sortDirection}
              onChange={(event) =>
                library.setSortDirection(event.target.value as SortDirection)
              }
              className="w-28"
            >
              <option value="ascending">{t("find.ascending")}</option>
              <option value="descending">{t("find.descending")}</option>
            </Select>
            <Button className="shrink-0 whitespace-nowrap" onClick={onImport}>
              <PlusIcon className="size-4" />
              {t("find.import")}
            </Button>
          </div>
        )}
        {selectionMode && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-500">
              {t("find.selectedCount").replace(
                "{count}",
                String(library.selectedIds.length),
              )}
            </span>
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
              <XMarkIcon className="size-4" />
              {t("find.removeFromList")}
            </Button>
            <Button
              variant="danger"
              disabled={!library.selectedIds.length}
              onClick={onDeleteSelected}
            >
              <TrashIcon className="size-4" />
              {t("find.deleteOriginal")}
            </Button>
            <Button variant="ghost" onClick={onCloseSelection}>
              {t("common.close")}
            </Button>
          </div>
        )}
      </div>
      {operationError && (
        <p className="text-sm text-red-600">{operationError}</p>
      )}
      <LiteratureTable
        library={library}
        selectionMode={selectionMode}
        onEnterSelection={onEnterSelection}
        onOpenMenu={onOpenMenu}
        onRead={onRead}
      />
    </section>
  );
}
