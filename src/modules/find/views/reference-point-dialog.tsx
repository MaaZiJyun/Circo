"use client";

import { useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  Field,
  Input,
  Select,
  Textarea,
} from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type {
  PointList,
  ReferencePoint,
  SourceRecord,
} from "@/shared/model/entities";
import { PointTypeControl } from "./point-type-control";

type PointInput = Omit<ReferencePoint, "id" | "createdAt" | "updatedAt">;

export function ReferencePointDialog({
  point,
  sources,
  lists,
  onClose,
  onSave,
}: {
  point?: ReferencePoint;
  sources: SourceRecord[];
  lists: PointList[];
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
  const [listIds, setListIds] = useState(point?.listIds ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (point) {
      onSave({
        sourceId: point.sourceId,
        type: point.type,
        content: point.content,
        contentPath: point.contentPath,
        date: point.date,
        author: point.author,
        note: note.trim(),
        page: point.page,
        location: point.location,
        listIds,
      });
      onClose();
      return;
    }
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
      let contentPath = "";
      let savedContent = type === "image" ? "" : content.trim();
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
        location: { x: 0, y: 0, width: 0, height: 0 },
        listIds,
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
        {point ? (
          <>
            <Field label={t("find.pointNote")}>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
            <PointListChoices
              lists={lists}
              selectedIds={listIds}
              onChange={setListIds}
            />
            <Button onClick={() => void submit()}>{t("common.save")}</Button>
          </>
        ) : (
          <>
            <Field label={t("find.source")}>
              <Select
                value={sourceId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setSourceId(nextId);
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
            <PointTypeControl value={type} onChange={setType} />
            {type === "text" ? (
              <Field label={t("common.content")}>
                <Textarea
                  className="min-h-36"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </Field>
            ) : (
              <Field label={t("find.pointImage")}>
                <Input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(event) =>
                    setImage(event.target.files?.[0] ?? null)
                  }
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
            <PointListChoices
              lists={lists}
              selectedIds={listIds}
              onChange={setListIds}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              disabled={saving || !sources.length}
              onClick={() => void submit()}
            >
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
}

function PointListChoices({
  lists,
  selectedIds,
  onChange,
}: {
  lists: PointList[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useI18n();
  const customLists = lists.filter((list) => !list.system);
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {t("find.pointLists")}
      </legend>
      <div className="grid max-h-44 gap-1 overflow-y-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
        {customLists.map((list) => (
          <label
            key={list.id}
            className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <Checkbox
              checked={selectedIds.includes(list.id)}
              onChange={(checked) =>
                onChange(
                  checked
                    ? [...selectedIds, list.id]
                    : selectedIds.filter((id) => id !== list.id),
                )
              }
            />
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: list.color }}
            />
            <span className="truncate">{list.name}</span>
          </label>
        ))}
        {!customLists.length && (
          <p className="px-2 py-3 text-sm text-zinc-500">
            {t("find.noCustomLists")}
          </p>
        )}
      </div>
    </fieldset>
  );
}
