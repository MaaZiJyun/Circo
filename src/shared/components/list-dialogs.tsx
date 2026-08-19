"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input } from "./ui";
import { ColorPalette } from "./color-palette";
import { useI18n } from "../i18n/i18n-context";
import { parseTags } from "../model/tags";

export interface ListFormResult {
  name: string;
  note: string;
  color: string;
  tags: string[];
}

export function ListFormDialog({
  title,
  nameLabel,
  noteLabel,
  colorLabel,
  initial,
  withTags = false,
  onClose,
  onSave,
}: {
  title: string;
  nameLabel: string;
  noteLabel: string;
  colorLabel: string;
  initial?: ListFormResult;
  withTags?: boolean;
  onClose: () => void;
  onSave: (input: ListFormResult) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(initial?.name ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [color, setColor] = useState(initial?.color ?? "#2563eb");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  return (
    <Dialog open title={title} closeLabel={t("common.close")} onClose={onClose}>
      <div className="grid gap-4">
        <Field label={nameLabel}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label={noteLabel}>
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        {withTags && (
          <Field label={t("common.tags")}>
            <Input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
          </Field>
        )}
        <Field label={colorLabel}>
          <ColorPalette value={color} onChange={setColor} />
        </Field>
        <Button
          disabled={!name.trim()}
          onClick={() => {
            onSave({
              name: name.trim(),
              note,
              color,
              tags: withTags ? parseTags(tags) : [],
            });
            onClose();
          }}
        >
          {t("common.save")}
        </Button>
      </div>
    </Dialog>
  );
}

export function ChooseListDialog({
  title,
  emptyLabel,
  lists,
  onClose,
  onChoose,
}: {
  title: string;
  emptyLabel: string;
  lists: { id: string; name: string; color: string }[];
  onClose: () => void;
  onChoose: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open title={title} closeLabel={t("common.close")} onClose={onClose}>
      <div className="grid gap-2">
        {lists.map((list) => (
          <button
            key={list.id}
            className="flex min-h-11 items-center gap-3 rounded-xl border border-zinc-200 px-3 text-left text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
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
        {!lists.length && (
          <p className="py-6 text-center text-sm text-zinc-500">{emptyLabel}</p>
        )}
      </div>
    </Dialog>
  );
}
