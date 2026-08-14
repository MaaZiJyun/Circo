"use client";

import { useMemo, useState } from "react";
import { RectangleStackIcon } from "@heroicons/react/24/outline";
import { Button, Dialog, Input, Select } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useStore } from "@/shared/view-models/store-context";
import {
  markdownCardKinds,
  markdownCardToken,
  type MarkdownCardKind,
} from "../model/markdown-card";

export function MarkdownCardPicker({
  onInsert,
}: {
  onInsert: (token: string) => void;
}) {
  const { t } = useI18n();
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<MarkdownCardKind>("point");
  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    if (!state) return [];
    const rows =
      kind === "point"
        ? state.points.map((item) => ({
            id: item.id,
            label: item.note || item.content || "Point",
            deletedAt: item.deletedAt,
          }))
        : kind === "idea"
          ? state.ideas.map((item) => ({
              id: item.id,
              label: item.title,
              deletedAt: item.deletedAt,
            }))
          : kind === "task"
            ? state.tasks.map((item) => ({
                id: item.id,
                label: item.title,
                deletedAt: item.deletedAt,
              }))
            : kind === "project"
              ? state.projects.map((item) => ({
                  id: item.id,
                  label: item.name,
                  deletedAt: item.deletedAt,
                }))
              : kind === "message"
                ? state.messages.map((item) => ({
                    id: item.id,
                    label: item.subject,
                    deletedAt: item.deletedAt,
                  }))
                : state.sources.map((item) => ({
                    id: item.id,
                    label: item.title,
                    deletedAt: item.deletedAt,
                  }));
    const normalized = query.trim().toLowerCase();
    return rows.filter(
      (item) =>
        !item.deletedAt &&
        (!normalized || item.label.toLowerCase().includes(normalized)),
    );
  }, [kind, query, state]);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="min-h-8 px-2 text-xs"
        onClick={() => setOpen(true)}
      >
        <RectangleStackIcon className="size-4" />
        {t("find.insertCard")}
      </Button>
      {open && (
        <Dialog
          open
          title={t("find.insertCard")}
          closeLabel={t("common.close")}
          onClose={() => setOpen(false)}
        >
          <div className="grid gap-3">
            <Select
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as MarkdownCardKind)
              }
            >
              {markdownCardKinds.map((value) => (
                <option key={value} value={value}>
                  {t(`find.cardType.${value}`)}
                </option>
              ))}
            </Select>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("find.searchCards")}
            />
            <div className="grid max-h-80 gap-2 overflow-y-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-xl border border-zinc-200 p-3 text-left text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  onClick={() => {
                    onInsert(markdownCardToken({ kind, id: item.id }));
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span className="line-clamp-2">{item.label}</span>
                </button>
              ))}
              {!items.length && (
                <p className="p-4 text-center text-sm text-zinc-500">
                  {t("common.noData")}
                </p>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
