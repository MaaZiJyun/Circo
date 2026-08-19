"use client";

import { useRef } from "react";
import { Checkbox } from "./ui";
import type { MenuPosition } from "./context-menu";
import { useLongPress } from "./use-long-press";

export interface DataTableColumn<T> {
  header: string;
  className?: string;
  render: (item: T) => React.ReactNode;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  selectionMode,
  selectedIds,
  selectAllLabel,
  getRowLabel = (item) => item.id,
  onSelectAll,
  onToggleSelect,
  onEnterSelection,
  onClick,
  onOpenMenu,
  onDragStart,
  onDragEnd,
  getRowClassName,
  stickyHeader = false,
  emptyLabel,
  minWidth = "min-w-[960px]",
}: {
  rows: T[];
  columns: DataTableColumn<T>[];
  selectionMode: boolean;
  selectedIds: string[];
  selectAllLabel: string;
  getRowLabel?: (item: T) => string;
  onSelectAll: (ids: string[]) => void;
  onToggleSelect: (id: string) => void;
  onEnterSelection: (item: T) => void;
  onClick: (item: T) => void;
  onOpenMenu: (item: T, position: MenuPosition) => void;
  onDragStart?: (event: React.DragEvent, item: T, ids: string[]) => void;
  onDragEnd?: () => void;
  getRowClassName?: (item: T) => string;
  stickyHeader?: boolean;
  emptyLabel?: string;
  minWidth?: string;
}) {
  const press = useLongPress<T>((item) => onEnterSelection(item));
  const pointerType = useRef("");
  const allSelected =
    rows.length > 0 && rows.every((item) => selectedIds.includes(item.id));
  return (
    <div className="h-full min-h-0 flex-1 overflow-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <table className={`w-full ${minWidth} text-left text-sm`}>
        <thead
          className={`${stickyHeader ? "sticky top-0 z-10 backdrop-blur " : ""}border-b border-zinc-200 bg-zinc-50/95 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/95`}
        >
          <tr>
            {selectionMode && (
              <th className="w-12 p-3">
                <Checkbox
                  aria-label={selectAllLabel}
                  checked={allSelected}
                  onChange={() =>
                    onSelectAll(allSelected ? [] : rows.map((item) => item.id))
                  }
                />
              </th>
            )}
            {columns.map((column) => (
              <th key={column.header} className={`p-3 ${column.className ?? ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((item) => (
            <tr
              key={item.id}
              draggable
              className={`cursor-grab select-none transition-colors hover:bg-zinc-50 active:cursor-grabbing dark:hover:bg-zinc-900/60 ${selectedIds.includes(item.id) ? "bg-blue-50 dark:bg-blue-950/30" : ""} ${getRowClassName?.(item) ?? ""}`}
              onDragStart={(event) => {
                const ids = selectedIds.includes(item.id)
                  ? selectedIds
                  : [item.id];
                onDragStart?.(event, item, ids);
              }}
              onDragEnd={() => onDragEnd?.()}
              onPointerDown={(event) => {
                pointerType.current = event.pointerType;
                if (selectionMode) return;
                press.onPointerDown(event, item);
              }}
              onPointerUp={press.onPointerUp}
              onPointerCancel={press.onPointerCancel}
              onPointerMove={press.onPointerMove}
              onClickCapture={(event) => {
                if (press.consumePress(item)) {
                  event.preventDefault();
                  event.stopPropagation();
                  return;
                }
                if (!selectionMode) return;
                event.preventDefault();
                event.stopPropagation();
                onToggleSelect(item.id);
              }}
              onClick={(event) => {
                if (selectionMode) return;
                if (
                  event.target instanceof Element &&
                  event.target.closest("button,input,select,a")
                )
                  return;
                onClick(item);
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                press.cancel();
                if (pointerType.current === "touch") return;
                onOpenMenu(item, { x: event.clientX, y: event.clientY });
              }}
            >
              {selectionMode && (
                <td className="p-3">
                  <Checkbox
                    aria-label={getRowLabel(item)}
                    checked={selectedIds.includes(item.id)}
                    onChange={() => undefined}
                  />
                </td>
              )}
              {columns.map((column) => (
                <td key={column.header} className={`p-3 ${column.className ?? ""}`}>
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && emptyLabel && (
        <p className="p-10 text-center text-sm text-zinc-500">{emptyLabel}</p>
      )}
    </div>
  );
}
