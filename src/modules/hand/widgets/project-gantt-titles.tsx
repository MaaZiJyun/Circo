"use client";

import { useI18n } from "@/shared/i18n/i18n-context";
import {
  HEADER_HEIGHT,
  ROW_HEIGHT,
  type GanttRow,
} from "../model/gantt-layout";

export function ProjectGanttTitles({
  rows,
  selectedId,
  onSelect,
}: {
  rows: GanttRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="border-r border-zinc-200/70 dark:border-zinc-800">
      <div
        className="flex items-center border-b border-zinc-200/70 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:border-zinc-800"
        style={{ height: HEADER_HEIGHT }}
      >
        {t("common.title")}
      </div>
      {rows.map((row) => (
        <button
          key={row.task.id}
          type="button"
          className={`flex w-full items-center truncate px-4 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${
            selectedId === row.task.id
              ? "bg-zinc-100 font-medium dark:bg-zinc-900"
              : "text-zinc-700 dark:text-zinc-300"
          }`}
          style={{
            height: ROW_HEIGHT,
            paddingLeft: `${16 + Math.min(row.depth, 4) * 14}px`,
          }}
          onClick={() => onSelect(row.task.id)}
        >
          <span className="truncate">{row.task.title}</span>
        </button>
      ))}
    </div>
  );
}
