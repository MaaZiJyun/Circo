"use client";

import { useRef, useState } from "react";
import { Button, Dialog, Field, Input, Switch } from "@/shared/components/ui";
import { ColorPalette } from "@/shared/components/color-palette";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { LibraryList, SourceRecord } from "@/shared/model/entities";
import { parseTags } from "@/shared/model/tags";
import type { LibraryListInput } from "../view-models/use-library-management";

export function ListDialog({
  open,
  list,
  onClose,
  onSave,
}: {
  open: boolean;
  list?: LibraryList;
  onClose: () => void;
  onSave: (input: LibraryListInput) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(list?.name ?? "");
  const [note, setNote] = useState(list?.note ?? "");
  const [tags, setTags] = useState(list?.tags.join(", ") ?? "");
  const [color, setColor] = useState(list?.color ?? "#2563eb");
  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), note, tags: parseTags(tags), color });
    setName("");
    setNote("");
    setTags("");
    onClose();
  };
  return (
    <Dialog
      open={open}
      title={list ? t("find.editList") : t("find.createList")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("find.listName")}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label={t("find.listNote")}>
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        <Field label={t("common.tags")}>
          <Input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </Field>
        <Field label={t("find.listColor")}>
          <ColorPalette value={color} onChange={setColor} />
        </Field>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}

export function ChooseListDialog({
  open,
  lists,
  onClose,
  onChoose,
}: {
  open: boolean;
  lists: LibraryList[];
  onClose: () => void;
  onChoose: (listId: string) => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog
      open={open}
      title={t("find.addToList")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
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
          <p className="py-6 text-center text-sm text-zinc-500">
            {t("find.noCustomLists")}
          </p>
        )}
      </div>
    </Dialog>
  );
}

export function EditLiteratureDialog({
  source,
  onClose,
  onSave,
  onReplaceFile,
}: {
  source: SourceRecord;
  onClose: () => void;
  onSave: (id: string, change: Partial<SourceRecord>) => void;
  onReplaceFile: (id: string, file: File) => Promise<void>;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState({
    title: source.title,
    authors: source.authors,
    origin: source.origin,
    citation: source.citation,
    category: source.category,
    publicationDate: source.publicationDate,
    addedAt: source.createdAt.slice(0, 16),
    tags: source.tags.join(", "),
    rating: String(source.rating),
  });
  const [favorite, setFavorite] = useState(source.favorite);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const submit = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const file = fileRef.current?.files?.[0];
      if (file) await onReplaceFile(source.id, file);
      onSave(source.id, {
        title: draft.title.trim(),
        authors: draft.authors,
        origin: draft.origin,
        citation: draft.citation,
        category: draft.category,
        publicationDate: draft.publicationDate,
        createdAt: new Date(draft.addedAt).toISOString(),
        year: draft.publicationDate.slice(0, 4),
        tags: parseTags(draft.tags),
        rating: Math.min(5, Math.max(0, Number(draft.rating) || 0)),
        favorite,
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };
  const field = (key: keyof typeof draft, label: string, type = "text") => (
    <Field label={label}>
      <Input
        type={type}
        value={draft[key]}
        onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
      />
    </Field>
  );
  return (
    <Dialog
      open
      title={t("find.editLiterature")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {field("title", t("common.title"))}
        {field("authors", t("find.authors"))}
        {field("origin", t("find.origin"))}
        {field("citation", t("find.citation"))}
        {field("category", t("find.category"))}
        {field("publicationDate", t("find.publicationDate"))}
        {field("addedAt", t("find.addedAt"), "datetime-local")}
        {field("tags", t("common.tags"))}
        {field("rating", t("find.rating"), "number")}
        <Field label={t("find.favorite")}>
          <Switch
            checked={favorite}
            onChange={setFavorite}
          />
        </Field>
        <Field label={t("find.replaceFile")} hint={t("find.replaceFileHint")}>
          <Input ref={fileRef} type="file" accept=".pdf,.md,.markdown,.txt" />
        </Field>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <Button
          className="sm:col-span-2"
          disabled={saving}
          onClick={() => void submit()}
        >
          {saving ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </Dialog>
  );
}
