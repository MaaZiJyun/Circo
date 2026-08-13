"use client";

import { useRef, useState } from "react";
import { ClockIcon, FolderIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/modules/find/views/context-menu";
import {
  Button,
  Dialog,
  Field,
  IconButton,
  Input,
} from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { IdeaList } from "@/shared/model/entities";
import type {
  IdeaListInput,
  useIdeaLibrary,
} from "../view-models/use-idea-library";

export function IdeaSidebar({
  library,
  onCreate,
  onEdit,
}: {
  library: ReturnType<typeof useIdeaLibrary>;
  onCreate: () => void;
  onEdit: (list: IdeaList) => void;
}) {
  const { t } = useI18n();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menu, setMenu] = useState<{
    list: IdeaList;
    position: MenuPosition;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  return (
    <aside className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between px-2">
        <h2 className="font-semibold">{t("mind.lists")}</h2>
        <IconButton label={t("mind.createList")} onClick={onCreate}>
          <PlusIcon className="size-4" />
        </IconButton>
      </div>
      <nav className="grid gap-1">
        {library.lists.map((list) => {
          const count =
            list.system === "default"
              ? library.allIdeas.length
              : list.system === "recent"
                ? library.recentIdeas.length
                : library.allIdeas.filter((item) =>
                    item.listIds.includes(list.id),
                  ).length;
          return (
            <button
              key={list.id}
              className={`flex min-h-10 items-center gap-2 rounded-xl px-3 text-left text-sm ${library.activeListId === list.id ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950" : "hover:bg-zinc-200 dark:hover:bg-zinc-900"}`}
              style={{
                backgroundColor:
                  dropTarget === list.id ? `${list.color}26` : undefined,
              }}
              onClick={() => library.selectList(list.id)}
              onPointerDown={(event) => {
                if (event.button || list.system) return;
                cancel();
                timer.current = setTimeout(
                  () =>
                    setMenu({
                      list,
                      position: { x: event.clientX, y: event.clientY },
                    }),
                  550,
                );
              }}
              onPointerUp={cancel}
              onPointerCancel={cancel}
              onPointerMove={cancel}
              onContextMenu={(event) => {
                event.preventDefault();
                cancel();
                if (!list.system)
                  setMenu({
                    list,
                    position: { x: event.clientX, y: event.clientY },
                  });
              }}
              onDragOver={(event) => {
                if (!list.system) {
                  event.preventDefault();
                  setDropTarget(list.id);
                }
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(event) => {
                event.preventDefault();
                if (!list.system)
                  library.addToList(library.draggedIds, list.id);
                library.setDraggedIds([]);
                setDropTarget(null);
              }}
            >
              {list.system === "recent" ? (
                <ClockIcon className="size-4" />
              ) : (
                <FolderIcon
                  className="size-4"
                  style={{
                    color:
                      !list.system && library.activeListId !== list.id
                        ? list.color
                        : undefined,
                  }}
                />
              )}
              <span className="truncate">
                {list.system ? t(`mind.list.${list.system}`) : list.name}
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
              if (window.confirm(t("mind.confirmDeleteList")))
                library.deleteList(menu.list.id);
              setMenu(null);
            }}
          >
            {t("mind.deleteList")}
          </ContextMenuItem>
        </ContextMenu>
      )}
    </aside>
  );
}

export function IdeaListDialog({
  list,
  onClose,
  onSave,
}: {
  list?: IdeaList;
  onClose: () => void;
  onSave: (input: IdeaListInput) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(list?.name ?? "");
  const [note, setNote] = useState(list?.note ?? "");
  const [color, setColor] = useState(list?.color ?? "#2563eb");
  return (
    <Dialog
      open
      title={list ? t("mind.editList") : t("mind.createList")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("mind.listName")}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label={t("mind.listNote")}>
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        <Field label={t("mind.listColor")}>
          <Input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
        </Field>
        <Button
          disabled={!name.trim()}
          onClick={() => {
            onSave({ name: name.trim(), note, color });
            onClose();
          }}
        >
          {t("common.save")}
        </Button>
      </div>
    </Dialog>
  );
}

export function ChooseIdeaListDialog({
  lists,
  onClose,
  onChoose,
}: {
  lists: IdeaList[];
  onClose: () => void;
  onChoose: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog
      open
      title={t("mind.addToList")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-2">
        {lists.map((list) => (
          <button
            key={list.id}
            className="flex min-h-11 items-center gap-3 rounded-xl border border-zinc-200 px-3 text-left text-sm dark:border-zinc-800"
            onClick={() => {
              onChoose(list.id);
              onClose();
            }}
          >
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: list.color }}
            />
            {list.name}
          </button>
        ))}
      </div>
    </Dialog>
  );
}
