"use client";

import { FlagIcon, StarIcon } from "@heroicons/react/24/outline";
import {
  FlagIcon as FlagSolidIcon,
  StarIcon as StarSolidIcon,
} from "@heroicons/react/24/solid";
import { Badge, IconButton } from "@/shared/components/ui";
import { DataTable } from "@/shared/components/data-table";
import type { MenuPosition } from "@/shared/components/context-menu";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { SourceRecord } from "@/shared/model/entities";
import type { useLibraryManagement } from "../view-models/use-library-management";
import { literatureDragType } from "./library-drag";

export function LiteratureTable({
  library,
  selectionMode,
  onEnterSelection,
  onOpenMenu,
  onRead,
}: {
  library: ReturnType<typeof useLibraryManagement>;
  selectionMode: boolean;
  onEnterSelection: (source: SourceRecord) => void;
  onOpenMenu: (source: SourceRecord, position: MenuPosition) => void;
  onRead: (source: SourceRecord) => void;
}) {
  const { t, locale } = useI18n();
  return (
    <DataTable
      rows={library.sources}
      minWidth="min-w-[1100px]"
      stickyHeader
      selectionMode={selectionMode}
      selectedIds={library.selectedIds}
      selectAllLabel={t("find.selectAll")}
      getRowLabel={(source) => source.title}
      onSelectAll={library.setSelectedIds}
      onToggleSelect={library.toggleSelected}
      onEnterSelection={onEnterSelection}
      onClick={onRead}
      onOpenMenu={onOpenMenu}
      onDragStart={(event, source, ids) => {
        library.setDraggedIds(ids);
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData(literatureDragType, JSON.stringify(ids));
        event.dataTransfer.setData("text/plain", source.title);
      }}
      onDragEnd={() => library.setDraggedIds([])}
      getRowClassName={(source) =>
        source.readingStatus === "read"
          ? "text-zinc-500 dark:text-zinc-400"
          : ""
      }
      emptyLabel={t("common.noData")}
      columns={[
        {
          header: t("common.title"),
          render: (source) => (
            <span
              className={
                source.readingStatus === "read"
                  ? "font-normal text-zinc-500 dark:text-zinc-400"
                  : "font-semibold text-zinc-950 dark:text-zinc-50"
              }
            >
              {source.title}
            </span>
          ),
        },
        {
          header: t("find.authors"),
          className: "text-zinc-600 dark:text-zinc-400",
          render: (source) => source.authors || "—",
        },
        {
          header: t("find.addedAt"),
          className: "whitespace-nowrap text-zinc-500",
          render: (source) =>
            new Intl.DateTimeFormat(locale).format(new Date(source.createdAt)),
        },
        { header: t("find.origin"), render: (source) => source.origin || "—" },
        {
          header: t("find.publicationDate"),
          render: (source) => source.publicationDate || "—",
        },
        {
          header: t("common.tags"),
          render: (source) => (
            <div className="flex flex-wrap gap-1">
              {source.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="solid">
                  {tag}
                </Badge>
              ))}
            </div>
          ),
        },
        {
          header: t("find.favorite"),
          render: (source) => (
            <IconButton
              label={t("find.favorite")}
              onClick={() =>
                library.updateSource(source.id, { favorite: !source.favorite })
              }
            >
              {source.favorite ? (
                <FlagSolidIcon className="size-5 text-red-500" />
              ) : (
                <FlagIcon className="size-5" />
              )}
            </IconButton>
          ),
        },
        {
          header: t("find.rating"),
          render: (source) => (
            <div className="flex">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  aria-label={`${rating}/5`}
                  onClick={() => library.updateSource(source.id, { rating })}
                >
                  {rating <= source.rating ? (
                    <StarSolidIcon className="size-4 text-amber-400" />
                  ) : (
                    <StarIcon className="size-4 text-zinc-300" />
                  )}
                </button>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
