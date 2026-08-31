"use client";

import { useRef, useState } from "react";
import { Button, Dialog, Field, Input, Switch } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { SourceRecord } from "@/shared/model/entities";
import { parseTags } from "@/shared/model/tags";

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
          <Switch checked={favorite} onChange={setFavorite} />
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
