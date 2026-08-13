"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button, Dialog, Field, Input, Textarea } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ReferencePoint, SourceRecord } from "@/shared/model/entities";
import type { PointCapture } from "./point-capture";
import { PointTypeControl } from "./point-type-control";

export function PointDialog({
  capture,
  source,
  onClose,
  onSave,
}: {
  capture: PointCapture;
  source: SourceRecord;
  onClose: () => void;
  onSave: (
    point: Omit<ReferencePoint, "id" | "createdAt" | "updatedAt">,
  ) => void;
}) {
  const { t } = useI18n();
  const [type, setType] = useState<"text" | "image">(capture.type);
  const [content, setContent] = useState(capture.content);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [author, setAuthor] = useState(source.authors);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const preview = useMemo(
    () => (capture.image ? URL.createObjectURL(capture.image) : ""),
    [capture],
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const submit = async () => {
    if (!date || !author.trim() || (type === "text" && !content.trim())) {
      setError(t("common.required"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      let contentPath = "";
      let savedContent = content;
      if (type === "image") {
        if (!capture.image) throw new Error(t("find.imageRequired"));
        const form = new FormData();
        form.set("file", capture.image, `point-page-${capture.page}.png`);
        const response = await fetch("/api/reference-files", {
          method: "POST",
          body: form,
        });
        const payload = (await response.json()) as {
          contentPath?: string;
          error?: string;
        };
        if (!response.ok || !payload.contentPath)
          throw new Error(payload.error || "Upload failed.");
        contentPath = payload.contentPath;
        savedContent = contentPath;
      }
      onSave({
        sourceId: source.id,
        type,
        content: savedContent,
        contentPath,
        date,
        author: author.trim(),
        note,
        page: capture.page,
        location: capture.location,
        listIds: [],
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
      title={t("find.generatePoint")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <PointTypeControl value={type} onChange={setType} />
        {type === "text" ? (
          <Field label={t("common.content")}>
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-36"
            />
          </Field>
        ) : preview ? (
          <Image
            src={preview}
            alt="Point screenshot"
            width={800}
            height={600}
            unoptimized
            className="max-h-64 rounded-xl border border-zinc-200 object-contain dark:border-zinc-800"
          />
        ) : (
          <p className="text-sm text-red-600">{t("find.imageRequired")}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("common.date")}>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <Field label={t("find.authors")}>
            <Input
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
            />
          </Field>
        </div>
        <Field label={t("find.source")}>
          <Input value={`${source.title} · Page ${capture.page}`} readOnly />
        </Field>
        <Field label={t("find.pointNote")}>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button disabled={saving} onClick={() => void submit()}>
          {saving ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </Dialog>
  );
}
