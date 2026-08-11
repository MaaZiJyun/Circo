"use client";

import {
  ClockIcon,
  FolderIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { IconButton } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { useLibraryManagement } from "../view-models/use-library-management";

export function LibrarySidebar({
  library,
  onCreate,
}: {
  library: ReturnType<typeof useLibraryManagement>;
  onCreate: () => void;
}) {
  const { t } = useI18n();
  return (
    <aside className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between px-2">
        <h2 className="font-semibold">{t("find.lists")}</h2>
        <IconButton label={t("find.createList")} onClick={onCreate}>
          <PlusIcon className="size-4" />
        </IconButton>
      </div>
      <nav className="grid gap-1">
        {library.lists.map((list) => {
          const active = list.id === library.activeListId;
          const count =
            list.system === "default" || list.system === "recent"
              ? library.allSources.length
              : library.allSources.filter((item) =>
                  item.listIds.includes(list.id),
                ).length;
          return (
            <div key={list.id} className="group flex items-center gap-1">
              <button
                onClick={() => library.setActiveListId(list.id)}
                className={`flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 text-left text-sm ${active ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950" : "hover:bg-zinc-200 dark:hover:bg-zinc-900"}`}
              >
                {list.system === "recent" ? (
                  <ClockIcon className="size-4 shrink-0" />
                ) : (
                  <FolderIcon
                    className="size-4 shrink-0"
                    style={{ color: active ? undefined : list.color }}
                  />
                )}
                <span className="truncate">
                  {list.system ? t(`find.list.${list.system}`) : list.name}
                </span>
                <span className="ml-auto text-xs opacity-60">{count}</span>
              </button>
              {!list.system && (
                <IconButton
                  label={t("find.deleteList")}
                  className="size-8 opacity-0 group-hover:opacity-100"
                  onClick={() =>
                    window.confirm(t("find.confirmDeleteList")) &&
                    library.deleteList(list.id)
                  }
                >
                  <TrashIcon className="size-4" />
                </IconButton>
              )}
            </div>
          );
        })}
      </nav>
      {library.selectedList?.note && (
        <p className="mt-4 border-t border-zinc-200 px-2 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
          {library.selectedList.note}
        </p>
      )}
    </aside>
  );
}
