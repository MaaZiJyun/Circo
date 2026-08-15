"use client";

import { useRef, useState } from "react";
import {
  ArrowUturnLeftIcon,
  BeakerIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/modules/find/views/context-menu";
import { Badge } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { Idea } from "@/shared/model/entities";
import { canPromoteIdea } from "../model/idea-evaluation";
import type { useIdeaLibrary } from "../view-models/use-idea-library";

export function IdeaGrid({
  library,
  ideas,
  selectionMode,
  onOpen,
  onEdit,
  onDelete,
  onEvaluate,
  onConvert,
}: {
  library: ReturnType<typeof useIdeaLibrary>;
  ideas: Idea[];
  selectionMode: boolean;
  onOpen: (idea: Idea) => void;
  onEdit: (idea: Idea) => void;
  onDelete: (idea: Idea) => void;
  onEvaluate: (idea: Idea) => void;
  onConvert: (idea: Idea) => void;
}) {
  const { t } = useI18n();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef<string | null>(null);
  const [menu, setMenu] = useState<{
    idea: Idea;
    position: MenuPosition;
  } | null>(null);
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {ideas.map((idea) => (
        <article
          key={idea.id}
          draggable
          className={`${library.selectedIds.includes(idea.id) ? "border-blue-500 bg-blue-50 shadow-md dark:bg-blue-950/30" : "border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"} cursor-pointer rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md`}
          onDragStart={(event) => {
            cancel();
            const ids = library.selectedIds.includes(idea.id)
              ? library.selectedIds
              : [idea.id];
            library.setDraggedIds(ids);
            event.dataTransfer.setData("text/plain", idea.title);
          }}
          onDragEnd={() => library.setDraggedIds([])}
          onPointerDown={(event) => {
            if (event.button || selectionMode) return;
            cancel();
            timer.current = setTimeout(() => {
              longPressed.current = idea.id;
              library.setSelectedIds([idea.id]);
            }, 550);
          }}
          onPointerUp={cancel}
          onPointerCancel={cancel}
          onPointerMove={cancel}
          onClick={() => {
            if (longPressed.current === idea.id) {
              longPressed.current = null;
              return;
            }
            if (selectionMode) library.toggleSelected(idea.id);
            else onOpen(idea);
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            cancel();
            setMenu({ idea, position: { x: event.clientX, y: event.clientY } });
          }}
        >
          <h3 className="font-semibold">{idea.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {idea.definition || idea.content}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">
              {idea.date || idea.createdAt.slice(0, 10)}
            </span>
            {idea.tags.slice(0, 3).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
            <Badge tone={idea.evaluation ? "info" : "neutral"}>
              {t("mind.scoreLabel")}: {idea.evaluation?.totalScore ?? "—"}
            </Badge>
          </div>
        </article>
      ))}
      {menu && (
        <ContextMenu position={menu.position} onClose={() => setMenu(null)}>
          <ContextMenuItem
            onClick={() => {
              onEdit(menu.idea);
              setMenu(null);
            }}
          >
            <PencilSquareIcon className="size-4" />
            {t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem
            danger
            onClick={() => {
              onDelete(menu.idea);
              setMenu(null);
            }}
          >
            <TrashIcon className="size-4" />
            {t("common.delete")}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              onEvaluate(menu.idea);
              setMenu(null);
            }}
          >
            <ArrowUturnLeftIcon className="size-4" />
            {menu.idea.evaluation ? t("mind.reevaluate") : t("mind.evaluate")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={
              !canPromoteIdea(menu.idea.evaluation) ||
              ["promoted", "converted"].includes(menu.idea.status)
            }
            onClick={() => {
              onConvert(menu.idea);
              setMenu(null);
            }}
          >
            <BeakerIcon className="size-4" />
            {t("mind.toProject")}
          </ContextMenuItem>
        </ContextMenu>
      )}
    </div>
  );
}
