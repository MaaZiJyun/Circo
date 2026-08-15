"use client";

import { useRef, useState } from "react";
import { ClockIcon, FolderIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/modules/find/views/context-menu";
import { IconButton } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectList } from "@/shared/model/entities";
import type { useProjectLibrary } from "../view-models/use-project-library";

export function ProjectSidebar({
  library,
  onCreate,
  onEdit,
}: {
  library: ReturnType<typeof useProjectLibrary>;
  onCreate: () => void;
  onEdit: (list: ProjectList) => void;
}) {
  const { t } = useI18n();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menu, setMenu] = useState<{
    list: ProjectList;
    position: MenuPosition;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };
  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between px-2">
        <h2 className="font-semibold">{t("hand.lists")}</h2>
        <IconButton label={t("hand.createList")} onClick={onCreate}>
          <PlusIcon className="size-4" />
        </IconButton>
      </div>
      <nav className="grid gap-1">
        {library.lists.map((list) => {
          const count =
            list.system === "default"
              ? library.allProjects.length
              : list.system === "recent"
                ? library.recentProjects.length
                : library.allProjects.filter((item) =>
                    item.listIds.includes(list.id),
                  ).length;
          return (
            <button
              key={list.id}
              className={`flex min-h-10 items-center gap-2 rounded-xl px-3 text-left text-sm transition-colors ${library.activeListId === list.id ? "bg-zinc-950 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-950" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}
              onClick={() => library.selectList(list.id)}
              onPointerDown={(event) => {
                if (event.button !== 0 || list.system) return;
                cancelPress();
                pressTimer.current = setTimeout(
                  () =>
                    setMenu({
                      list,
                      position: { x: event.clientX, y: event.clientY },
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
                if (!list.system)
                  setMenu({
                    list,
                    position: { x: event.clientX, y: event.clientY },
                  });
              }}
              onDragOver={(event) => {
                if (list.system) return;
                event.preventDefault();
                setDropTarget(list.id);
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(event) => {
                event.preventDefault();
                if (!list.system)
                  library.addToList(library.draggedIds, list.id);
                library.setDraggedIds([]);
                setDropTarget(null);
              }}
              style={{
                backgroundColor:
                  dropTarget === list.id ? `${list.color}26` : undefined,
              }}
            >
              {list.system === "recent" ? (
                <ClockIcon className="size-4" />
              ) : (
                <FolderIcon
                  className="size-4"
                  style={{
                    color:
                      library.activeListId !== list.id && !list.system
                        ? list.color
                        : undefined,
                  }}
                />
              )}
              <span className="truncate">
                {list.system ? t(`hand.list.${list.system}`) : list.name}
              </span>
              <span className="ml-auto text-xs opacity-60">{count}</span>
            </button>
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
              if (window.confirm(t("hand.confirmDeleteList")))
                library.deleteList(menu.list.id);
              setMenu(null);
            }}
          >
            {t("hand.deleteList")}
          </ContextMenuItem>
        </ContextMenu>
      )}
    </aside>
  );
}
