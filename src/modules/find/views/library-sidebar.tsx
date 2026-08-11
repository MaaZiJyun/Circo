"use client";

import { useRef, useState } from "react";
import {
  ClockIcon,
  FlagIcon,
  FolderIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { IconButton } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { LibraryList } from "@/shared/model/entities";
import type { useLibraryManagement } from "../view-models/use-library-management";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "./context-menu";
import { readDraggedLiterature } from "./library-drag";

export function LibrarySidebar({
  library,
  onCreate,
  onEdit,
}: {
  library: ReturnType<typeof useLibraryManagement>;
  onCreate: () => void;
  onEdit: (list: LibraryList) => void;
}) {
  const { t } = useI18n();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menu, setMenu] = useState<{
    list: LibraryList;
    position: MenuPosition;
  } | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };
  const openMenu = (list: LibraryList, position: MenuPosition) => {
    if (!list.system) setMenu({ list, position });
  };
  const resolveDropTarget = (event: React.DragEvent) =>
    document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-library-drop-id]")?.dataset.libraryDropId ??
    null;
  return (
    <aside
      onDragEnterCapture={(event) => {
        const listId = resolveDropTarget(event);
        if (!listId) return;
        event.preventDefault();
        setDropTargetId(listId);
      }}
      onDragOverCapture={(event) => {
        const listId = resolveDropTarget(event);
        if (!listId) {
          setDropTargetId(null);
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setDropTargetId(listId);
      }}
      onDragLeave={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          event.currentTarget.contains(event.relatedTarget)
        )
          return;
        setDropTargetId(null);
      }}
      onDropCapture={(event) => {
        const listId = resolveDropTarget(event);
        if (!listId) return;
        event.preventDefault();
        event.stopPropagation();
        const ids = library.draggedIds.length
          ? library.draggedIds
          : readDraggedLiterature(event);
        if (ids.length) library.addToList(ids, listId);
        library.setDraggedIds([]);
        setDropTargetId(null);
      }}
      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="mb-3 flex items-center justify-between px-2">
        <h2 className="font-semibold">{t("find.lists")}</h2>
        <IconButton label={t("find.createList")} onClick={onCreate}>
          <PlusIcon className="size-4" />
        </IconButton>
      </div>
      <nav className="grid gap-1">
        {library.lists.map((list) => {
          const active = list.id === library.activeListId;
          const items =
            list.system === "default"
              ? library.allSources
              : list.system === "recent"
                ? library.recentSources
                : list.system === "marked"
                  ? library.allSources.filter((item) => item.favorite)
                  : library.allSources.filter((item) =>
                      item.listIds.includes(list.id),
                    );
          const count = items.length;
          const hasUnread = items.some((item) => item.readingStatus !== "read");
          return (
            <div
              key={list.id}
              data-library-drop-id={!list.system ? list.id : undefined}
            >
              <button
                onClick={() => library.setActiveListId(list.id)}
                onPointerDown={(event) => {
                  if (event.button !== 0 || list.system) return;
                  cancelPress();
                  pressTimer.current = setTimeout(
                    () =>
                      openMenu(list, {
                        x: event.clientX,
                        y: event.clientY,
                      }),
                    550,
                  );
                }}
                onPointerUp={cancelPress}
                onPointerCancel={cancelPress}
                onPointerMove={cancelPress}
                onContextMenu={(event) => {
                  event.preventDefault();
                  cancelPress();
                  openMenu(list, { x: event.clientX, y: event.clientY });
                }}
                className={`relative flex min-h-10 w-full min-w-0 items-center gap-2 rounded-xl px-3 text-left text-sm ${active ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950" : "hover:bg-zinc-200 dark:hover:bg-zinc-900"}`}
                style={{
                  backgroundColor:
                    dropTargetId === list.id ? `${list.color}26` : undefined,
                }}
              >
                {list.system === "recent" ? (
                  <ClockIcon className="size-4 shrink-0" />
                ) : list.system === "marked" ? (
                  <FlagIcon className="size-4 shrink-0" />
                ) : (
                  <FolderIcon
                    className={`size-4 shrink-0 ${!active && list.system === "default" ? "text-zinc-700 dark:text-zinc-300" : ""}`}
                    style={{
                      color: !active && !list.system ? list.color : undefined,
                    }}
                  />
                )}
                <span className="truncate">
                  {list.system ? t(`find.list.${list.system}`) : list.name}
                </span>
                <span className="ml-auto text-xs opacity-60">{count}</span>
                {hasUnread && (
                  <span
                    className="absolute right-1 top-1 size-2 rounded-full bg-red-500 shadow-sm ring-2 ring-zinc-50 dark:ring-zinc-950"
                    aria-label={t("find.unread")}
                  />
                )}
              </button>
            </div>
          );
        })}
      </nav>
      {library.selectedList?.note && (
        <p className="mt-4 border-t border-zinc-200 px-2 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
          {library.selectedList.note}
        </p>
      )}
      {menu && (
        <ContextMenu position={menu.position} onClose={() => setMenu(null)}>
          <ContextMenuItem
            onClick={() => {
              onEdit(menu.list);
              setMenu(null);
            }}
          >
            {t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem
            danger
            onClick={() => {
              if (window.confirm(t("find.confirmDeleteList")))
                library.deleteList(menu.list.id);
              setMenu(null);
            }}
          >
            {t("find.deleteList")}
          </ContextMenuItem>
        </ContextMenu>
      )}
    </aside>
  );
}
