"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input } from "@/shared/components/ui";
import { ColorPalette } from "@/shared/components/color-palette";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectList } from "@/shared/model/entities";
import type { ProjectListInput } from "../view-models/use-project-library";

export function ProjectListDialog({
  list,
  onClose,
  onSave,
}: {
  list?: ProjectList;
  onClose: () => void;
  onSave: (input: ProjectListInput) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(list?.name ?? "");
  const [note, setNote] = useState(list?.note ?? "");
  const [color, setColor] = useState(list?.color ?? "#2563eb");
  return (
    <Dialog
      open
      title={list ? t("hand.editList") : t("hand.createList")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("hand.listName")}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label={t("hand.listNote")}>
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        <Field label={t("hand.listColor")}>
          <ColorPalette value={color} onChange={setColor} />
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

export function ChooseProjectListDialog({
  lists,
  onClose,
  onChoose,
}: {
  lists: ProjectList[];
  onClose: () => void;
  onChoose: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog
      open
      title={t("hand.addToList")}
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
        {!lists.length && (
          <p className="py-6 text-center text-sm text-zinc-500">
            {t("hand.noCustomLists")}
          </p>
        )}
      </div>
    </Dialog>
  );
}
