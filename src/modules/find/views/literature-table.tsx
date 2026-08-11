"use client";

import { useRef } from "react";
import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { IconButton } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { SourceRecord } from "@/shared/model/entities";
import type { useLibraryManagement } from "../view-models/use-library-management";
import type { MenuPosition } from "./context-menu";

export function LiteratureTable({
  library,
  selectionMode,
  onEnterSelection,
  onOpenMenu,
}: {
  library: ReturnType<typeof useLibraryManagement>;
  selectionMode: boolean;
  onEnterSelection: (source: SourceRecord) => void;
  onOpenMenu: (source: SourceRecord, position: MenuPosition) => void;
}) {
  const { t, locale } = useI18n();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedId = useRef<string | null>(null);
  const pointerType = useRef("");
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };
  const allSelected =
    library.sources.length > 0 &&
    library.sources.every((item) => library.selectedIds.includes(item.id));
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-900">
          <tr>
            {selectionMode && (
              <th className="w-12 p-3">
                <input
                  type="checkbox"
                  aria-label={t("find.selectAll")}
                  checked={allSelected}
                  onChange={() =>
                    library.setSelectedIds(
                      allSelected ? [] : library.sources.map((item) => item.id),
                    )
                  }
                />
              </th>
            )}
            <th className="p-3">{t("common.title")}</th>
            <th className="p-3">{t("find.authors")}</th>
            <th className="p-3">{t("find.addedAt")}</th>
            <th className="p-3">{t("find.origin")}</th>
            <th className="p-3">{t("find.publicationDate")}</th>
            <th className="p-3">{t("common.tags")}</th>
            <th className="p-3">{t("find.favorite")}</th>
            <th className="p-3">{t("find.rating")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {library.sources.map((source) => (
            <tr
              key={source.id}
              onPointerDown={(event) => {
                pointerType.current = event.pointerType;
                if (event.button !== 0 || selectionMode) return;
                cancelPress();
                pressTimer.current = setTimeout(() => {
                  longPressedId.current = source.id;
                  onEnterSelection(source);
                }, 550);
              }}
              onPointerUp={cancelPress}
              onPointerCancel={cancelPress}
              onPointerMove={cancelPress}
              onContextMenu={(event) => {
                event.preventDefault();
                cancelPress();
                if (pointerType.current === "touch") return;
                onOpenMenu(source, { x: event.clientX, y: event.clientY });
              }}
              onClickCapture={(event) => {
                if (longPressedId.current === source.id) {
                  event.preventDefault();
                  event.stopPropagation();
                  longPressedId.current = null;
                  return;
                }
                if (!selectionMode) return;
                event.preventDefault();
                event.stopPropagation();
                library.toggleSelected(source.id);
              }}
              className={`select-none hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${library.selectedIds.includes(source.id) ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}
            >
              {selectionMode && (
                <td className="p-3">
                  <input
                    type="checkbox"
                    aria-label={source.title}
                    checked={library.selectedIds.includes(source.id)}
                    readOnly
                  />
                </td>
              )}
              <td className="max-w-64 p-3 font-medium">
                {source.fileToken ? (
                  <a
                    href={`/api/files/${source.fileToken}`}
                    target="_blank"
                    className="hover:underline"
                  >
                    {source.title}
                  </a>
                ) : (
                  source.title
                )}
              </td>
              <td className="p-3 text-zinc-600 dark:text-zinc-400">
                {source.authors || "—"}
              </td>
              <td className="whitespace-nowrap p-3 text-zinc-500">
                {new Intl.DateTimeFormat(locale).format(
                  new Date(source.createdAt),
                )}
              </td>
              <td className="max-w-48 p-3">{source.origin || "—"}</td>
              <td className="p-3">{source.publicationDate || "—"}</td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  {source.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="p-3">
                <IconButton
                  label={t("find.favorite")}
                  onClick={() =>
                    library.updateSource(source.id, {
                      favorite: !source.favorite,
                    })
                  }
                >
                  {source.favorite ? (
                    <StarSolidIcon className="size-5 text-amber-400" />
                  ) : (
                    <StarIcon className="size-5" />
                  )}
                </IconButton>
              </td>
              <td className="p-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      aria-label={`${rating}/5`}
                      onClick={() =>
                        library.updateSource(source.id, { rating })
                      }
                    >
                      {rating <= source.rating ? (
                        <StarSolidIcon className="size-4 text-amber-400" />
                      ) : (
                        <StarIcon className="size-4 text-zinc-300" />
                      )}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!library.sources.length && (
        <p className="p-10 text-center text-sm text-zinc-500">
          {t("common.noData")}
        </p>
      )}
    </div>
  );
}
