"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  Field,
  Input,
  Select,
  Textarea,
} from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ReferencePoint, SourceRecord } from "@/shared/model/entities";

type PointInput = Omit<ReferencePoint, "id" | "createdAt" | "updatedAt">;

export function ReferencePointDialog({
  point,
  sources,
  onClose,
  onSave,
}: {
  point?: ReferencePoint;
  sources: SourceRecord[];
  onClose: () => void;
  onSave: (point: PointInput) => void;
}) {
  const { t } = useI18n();
  const initialSource =
    sources.find((source) => source.id === point?.sourceId) ?? sources[0];
  const [sourceId, setSourceId] = useState(initialSource?.id ?? "");
  const [type, setType] = useState<"text" | "image">(point?.type ?? "text");
  const [content, setContent] = useState(
    point?.type === "text" ? point.content : "",
  );
  const [image, setImage] = useState<File | null>(null);
  const [date, setDate] = useState(
    point?.date ?? new Date().toISOString().slice(0, 10),
  );
  const [author, setAuthor] = useState(
    point?.author ?? initialSource?.authors ?? "",
  );
  const [note, setNote] = useState(point?.note ?? "");
  const [page, setPage] = useState(String(point?.page ?? 1));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (
      !sourceId ||
      !date ||
      !author.trim() ||
      (type === "text" && !content.trim())
    ) {
      setError(t("common.required"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      let contentPath = type === "image" ? (point?.contentPath ?? "") : "";
      let savedContent =
        type === "image" ? (point?.content ?? "") : content.trim();
      if (type === "image" && image) {
        const form = new FormData();
        form.set("file", image);
        const response = await fetch("/api/reference-files", {
          method: "POST",
          body: form,
        });
        const payload = (await response.json()) as {
          contentPath?: string;
          error?: string;
        };
        if (!response.ok || !payload.contentPath)
          throw new Error(payload.error || t("common.error"));
        contentPath = payload.contentPath;
        savedContent = payload.contentPath;
      }
      if (type === "image" && !contentPath)
        throw new Error(t("find.imageRequiredUpload"));
      onSave({
        sourceId,
        type,
        content: savedContent,
        contentPath,
        date,
        author: author.trim(),
        note: note.trim(),
        page: Math.max(1, Number(page) || 1),
        location: point?.location ?? { x: 0, y: 0, width: 0, height: 0 },
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      title={t(point ? "find.editPoint" : "find.addPoint")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("find.source")}>
          <Select
            value={sourceId}
            onChange={(event) => {
              const nextId = event.target.value;
              setSourceId(nextId);
              if (!point)
                setAuthor(
                  sources.find((item) => item.id === nextId)?.authors ?? "",
                );
            }}
          >
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("find.pointType")}>
          <Select
            value={type}
            onChange={(event) =>
              setType(event.target.value as "text" | "image")
            }
          >
            <option value="text">{t("find.pointType.text")}</option>
            <option value="image">{t("find.pointType.image")}</option>
          </Select>
        </Field>
        {type === "text" ? (
          <Field label={t("common.content")}>
            <Textarea
              className="min-h-36"
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </Field>
        ) : (
          <Field
            label={t("find.pointImage")}
            hint={
              point?.contentPath && !image
                ? t("find.currentImageKept")
                : undefined
            }
          >
            <Input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("common.date")}>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <Field label={t("find.page")}>
            <Input
              type="number"
              min="1"
              value={page}
              onChange={(event) => setPage(event.target.value)}
            />
          </Field>
        </div>
        <Field label={t("find.authors")}>
          <Input
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
          />
        </Field>
        <Field label={t("find.pointNote")}>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          disabled={saving || !sources.length}
          onClick={() => void submit()}
        >
          {saving ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </Dialog>
  );
}
