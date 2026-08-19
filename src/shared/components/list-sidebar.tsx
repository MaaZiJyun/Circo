"use client";

import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "./context-menu";
import { IconButton } from "./ui";
import { useLongPress } from "./use-long-press";

export interface ListSidebarItem {
  id: string;
  name: string;
  color: string;
  system: string | null;
}

export function ListSidebar<T extends ListSidebarItem>({
  title,
  createLabel,
  editLabel,
  deleteLabel,
  confirmDeleteLabel,
  lists,
  activeId,
  note,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  getLabel,
  getCount,
  getIcon,
  onDrop,
  draggedIds,
  setDraggedIds,
}: {
  title: string;
  createLabel: string;
  editLabel: string;
  deleteLabel: string;
  confirmDeleteLabel: string;
  lists: T[];
  activeId: string;
  note?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onEdit: (list: T) => void;
  onDelete: (id: string) => void;
  getLabel: (list: T) => string;
  getCount: (list: T) => number;
  getIcon: (list: T) => React.ReactNode;
  onDrop: (ids: string[], listId: string) => void;
  draggedIds: string[];
  setDraggedIds: (ids: string[]) => void;
}) {
  const [menu, setMenu] = useState<{ list: T; position: MenuPosition } | null>(
    null,
  );
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const press = useLongPress<T>((list, position) => {
    if (!list.system) setMenu({ list, position });
  });
  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between px-2">
        <h2 className="font-semibold">{title}</h2>
        <IconButton label={createLabel} onClick={onCreate}>
          <PlusIcon className="size-4" />
        </IconButton>
      </div>
      <nav className="grid gap-1">
        {lists.map((list) => (
          <button
            key={list.id}
            className={`flex min-h-10 items-center gap-2 rounded-xl px-3 text-left text-sm transition-colors ${activeId === list.id ? "bg-zinc-950 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-950" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}
            onClick={() => onSelect(list.id)}
            onPointerDown={(event) => {
              if (list.system) return;
              press.onPointerDown(event, list);
            }}
            onPointerUp={press.onPointerUp}
            onPointerCancel={press.onPointerCancel}
            onPointerMove={press.onPointerMove}
            onContextMenu={(event) => {
              event.preventDefault();
              press.cancel();
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
              if (!list.system) onDrop(draggedIds, list.id);
              setDraggedIds([]);
              setDropTarget(null);
            }}
            style={{
              backgroundColor:
                dropTarget === list.id ? `${list.color}26` : undefined,
            }}
          >
            {getIcon(list)}
            <span className="truncate">{getLabel(list)}</span>
            <span className="ml-auto text-xs opacity-60">{getCount(list)}</span>
          </button>
        ))}
      </nav>
      {note && (
        <p className="mt-4 border-t border-zinc-200 px-2 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
          {note}
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
            {editLabel}
          </ContextMenuItem>
          <ContextMenuItem
            danger
            onClick={() => {
              if (window.confirm(confirmDeleteLabel)) onDelete(menu.list.id);
              setMenu(null);
            }}
          >
            {deleteLabel}
          </ContextMenuItem>
        </ContextMenu>
      )}
    </aside>
  );
}
