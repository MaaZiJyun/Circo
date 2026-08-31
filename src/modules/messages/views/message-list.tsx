"use client";

import { useState } from "react";
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  StarIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/shared/components/context-menu";
import { Checkbox, EmptyState, IconButton } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { FutureMessage } from "@/shared/model/message";
import type { Mailbox } from "./message-sidebar";

export function MessageList({
  rows,
  mailbox,
  selected,
  onSelected,
  onOpen,
  onDelete,
  onFavorite,
  onReply,
  onForward,
  onRestore,
}: {
  rows: FutureMessage[];
  mailbox: Mailbox;
  selected: string[];
  onSelected: (ids: string[]) => void;
  onOpen: (message: FutureMessage) => void;
  onDelete: (ids: string[]) => void;
  onFavorite: (ids: string[], favorite: boolean) => void;
  onReply: (message: FutureMessage) => void;
  onForward: (message: FutureMessage) => void;
  onRestore: (id: string) => void;
}) {
  const { t, formatDate } = useI18n();
  const [menu, setMenu] = useState<{
    message: FutureMessage;
    position: MenuPosition;
  } | null>(null);
  const targets =
    menu && selected.includes(menu.message.id)
      ? selected
      : menu
        ? [menu.message.id]
        : [];
  const one =
    targets.length === 1
      ? rows.find((item) => item.id === targets[0])
      : undefined;
  if (!rows.length)
    return (
      <EmptyState
        title={t(
          mailbox === "inbox"
            ? "messages.emptyInbox"
            : mailbox === "sent"
              ? "messages.emptySent"
              : "messages.emptyBin",
        )}
      />
    );
  return (
    <>
      {selected.length > 0 && (
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50/70 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
          <span className="mr-auto text-sm text-zinc-500">
            {t("messages.selected").replace("{count}", String(selected.length))}
          </span>
          {mailbox === "bin" ? (
            <button
              className="text-sm underline"
              onClick={() => selected.forEach(onRestore)}
            >
              {t("messages.restore")}
            </button>
          ) : (
            <IconButton
              label={t("common.delete")}
              onClick={() => onDelete(selected)}
            >
              <TrashIcon className="size-4" />
            </IconButton>
          )}
          <IconButton
            label={t("messages.favorite")}
            onClick={() => onFavorite(selected, true)}
          >
            <StarIcon className="size-4" />
          </IconButton>
          <IconButton label={t("common.cancel")} onClick={() => onSelected([])}>
            <XMarkIcon className="size-4" />
          </IconButton>
        </div>
      )}
      <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
        {rows.map((message) => {
          const unread = !message.readAt;
          return (
            <div
              key={message.id}
              onContextMenu={(event) => {
                event.preventDefault();
                setMenu({
                  message,
                  position: { x: event.clientX, y: event.clientY },
                });
              }}
              className={`flex items-center gap-3 px-4 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 ${unread ? "text-zinc-950 dark:text-zinc-50" : "text-zinc-500 dark:text-zinc-400"} ${selected.includes(message.id) ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}
            >
              <Checkbox
                checked={selected.includes(message.id)}
                aria-label={t("messages.select")}
                onChange={(checked) =>
                  onSelected(
                    checked
                      ? [...selected, message.id]
                      : selected.filter((id) => id !== message.id),
                  )
                }
              />
              <button
                className={`min-w-0 flex-1 text-left ${unread ? "font-semibold" : "font-normal"} md:grid md:grid-cols-[160px_minmax(0,1fr)_110px] md:items-center md:gap-3`}
                onClick={() => onOpen(message)}
              >
                <span>
                  {t(
                    message.systemGenerated
                      ? "messages.systemSender"
                      : "messages.futureSelf",
                  )}
                </span>
                <span className="block truncate text-sm">
                  {message.subject}
                  <span
                    className={
                      unread
                        ? "text-zinc-500"
                        : "text-zinc-400 dark:text-zinc-500"
                    }
                  >
                    {" "}
                    — {message.body}
                  </span>
                </span>
                <time className="text-xs md:text-right">
                  {formatDate(message.deliverAt)}
                </time>
              </button>
              <StarIcon
                className={`size-5 ${message.favorite ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`}
              />
            </div>
          );
        })}
      </div>
      {menu && (
        <ContextMenu position={menu.position} onClose={() => setMenu(null)}>
          <ContextMenuItem
            onClick={() => {
              if (!selected.includes(menu.message.id))
                onSelected([...selected, menu.message.id]);
              setMenu(null);
            }}
          >
            {t("messages.select")}
          </ContextMenuItem>
          {mailbox === "bin" ? (
            <ContextMenuItem
              onClick={() => {
                onRestore(menu.message.id);
                setMenu(null);
              }}
            >
              {t("messages.restore")}
            </ContextMenuItem>
          ) : (
            <>
              <ContextMenuItem
                onClick={() => {
                  onDelete(targets);
                  setMenu(null);
                }}
              >
                <TrashIcon className="size-4" />
                {t("common.delete")}
              </ContextMenuItem>
              <ContextMenuItem
                disabled={!one}
                onClick={() => {
                  if (one) onReply(one);
                  setMenu(null);
                }}
              >
                <ArrowUturnLeftIcon className="size-4" />
                {t("messages.reply")}
              </ContextMenuItem>
              <ContextMenuItem
                disabled={!one}
                onClick={() => {
                  if (one) onForward(one);
                  setMenu(null);
                }}
              >
                <ArrowUturnRightIcon className="size-4" />
                {t("messages.forward")}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  onFavorite(targets, true);
                  setMenu(null);
                }}
              >
                <StarIcon className="size-4" />
                {t("messages.favorite")}
              </ContextMenuItem>
            </>
          )}
        </ContextMenu>
      )}
    </>
  );
}
