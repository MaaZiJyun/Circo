"use client";

import { useRef, useState } from "react";
import { CheckIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { MarkdownPreview } from "@/modules/find/views/markdown-preview";
import { MarkdownCardPicker } from "@/modules/find/views/markdown-card-picker";
import { MarkdownEditorToolbar } from "@/modules/find/views/markdown-editor-toolbar";
import { Button, Field, Select, Textarea } from "@/shared/components/ui";
import { typeLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import { createId } from "@/shared/model/factories";
import type { LogInput } from "../view-models/use-hand-view-model";
import { ProjectLogSplitPanes } from "./project-log-split-panes";

export function ProjectLogEditor({
  open,
  initial,
  projectId,
  logId,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: LogInput;
  projectId: string;
  logId?: string;
  onClose: () => void;
  onSave: (input: LogInput, logId: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<LogInput>(
    initial ?? {
      type: "progress",
      period: "day",
      content: "# ",
      nextStep: "",
      tags: [],
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [assetLogId] = useState(() => logId ?? createId("log"));
  const fileRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const submittingRef = useRef(false);
  if (!open) return null;
  const submit = async () => {
    if (submittingRef.current || !input.content.replace(/^#+\s*/gm, "").trim())
      return;
    submittingRef.current = true;
    setSaving(true);
    setError(false);
    try {
      await onSave(input, assetLogId);
      onClose();
    } catch {
      setError(true);
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };
  const discard = () => {
    if (logId) return onClose();
    void fetch("/api/project-logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, logId: assetLogId }),
    }).finally(onClose);
  };
  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploadingImage(true);
    setImageError(false);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch(
        `/api/project-logs/${encodeURIComponent(projectId)}/${encodeURIComponent(assetLogId)}/asset`,
        { method: "POST", body: form },
      );
      const payload = (await response.json()) as { url?: string };
      if (!response.ok || !payload.url) throw new Error("Upload failed.");
      insertImage(file, payload.url);
    } catch {
      setImageError(true);
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const insertImage = (file: File, url: string) => {
    const alt = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[\[\]]/g, "")
      .slice(0, 120);
    const { start, end } = selectionRef.current;
    setInput((current) => {
      const before = current.content.slice(0, start);
      const after = current.content.slice(end);
      const prefix = before && !before.endsWith("\n") ? "\n" : "";
      const suffix = after && !after.startsWith("\n") ? "\n" : "";
      return {
        ...current,
        content: `${before}${prefix}![${alt}](${url})${suffix}${after}`,
      };
    });
  };
  const insertCard = (token: string) => {
    const { start, end } = selectionRef.current;
    setInput((current) => ({
      ...current,
      content: `${current.content.slice(0, start)}${start ? "\n" : ""}${token}\n${current.content.slice(end)}`,
    }));
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t("hand.markdownEditor")}
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
      >
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold">
              {t("hand.markdownEditor")}
            </h2>
            <p className="text-xs text-zinc-500">{t("hand.markdownHint")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled={saving} onClick={discard}>
              {t("common.cancel")}
            </Button>
            <Button disabled={saving} onClick={() => void submit()}>
              <CheckIcon className="size-4" />
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </header>
        {(error || imageError) && (
          <p className="px-5 pt-3 text-sm text-red-600">
            {t(error ? "hand.logSaveFailed" : "hand.imageUploadFailed")}
          </p>
        )}
        <ProjectLogSplitPanes
          label={t("hand.resizeEditorPanes")}
          preview={
            <section className="h-full min-h-[520px] min-w-0 overflow-y-auto border-b border-zinc-200 md:border-b-0 dark:border-zinc-800">
              <h3 className="border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                {t("hand.markdownPreview")}
              </h3>
              <div className="p-6">
                <MarkdownPreview content={input.content} />
              </div>
            </section>
          }
          editor={
            <section className="flex h-full min-h-[520px] min-w-0 flex-col">
              <LogMetadata input={input} onChange={setInput} />
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {t("hand.markdownSource")}
                </h3>
                <div className="flex items-center gap-2">
                  <MarkdownCardPicker onInsert={insertCard} />
                  <Button
                    variant="ghost"
                    className="min-h-8 px-2 text-xs"
                    disabled={uploadingImage}
                    onClick={() => fileRef.current?.click()}
                  >
                    <PhotoIcon className="size-4" />
                    {t(
                      uploadingImage
                        ? "hand.uploadingImage"
                        : "hand.insertImage",
                    )}
                  </Button>
                </div>
                <input
                  ref={fileRef}
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) =>
                    void uploadImage(event.target.files?.[0])
                  }
                />
              </div>
              <div className="border-b border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
                <MarkdownEditorToolbar
                  value={input.content}
                  getSelection={() => selectionRef.current}
                  onChange={(content, selection) => {
                    selectionRef.current = selection;
                    setInput({ ...input, content });
                  }}
                />
              </div>
              <Textarea
                autoFocus
                spellCheck
                value={input.content}
                onChange={(event) =>
                  setInput({ ...input, content: event.target.value })
                }
                onSelect={(event) => {
                  selectionRef.current = {
                    start: event.currentTarget.selectionStart,
                    end: event.currentTarget.selectionEnd,
                  };
                }}
                className="min-h-0 flex-1 resize-none rounded-none border-0 font-mono leading-7"
              />
            </section>
          }
        />
      </section>
    </div>
  );
}

function LogMetadata({
  input,
  onChange,
}: {
  input: LogInput;
  onChange: (input: LogInput) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
      <Field label={t("hand.logPeriod")}>
        <Select
          value={input.period}
          onChange={(event) =>
            onChange({
              ...input,
              period: event.target.value as LogInput["period"],
            })
          }
        >
          {(["day", "week", "month", "year"] as const).map((period) => (
            <option key={period} value={period}>
              {t(`hand.logPeriod.${period}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("hand.logType")}>
        <Select
          value={input.type}
          onChange={(event) =>
            onChange({
              ...input,
              type: event.target.value as LogInput["type"],
            })
          }
        >
          {(["progress", "decision", "problem", "conclusion"] as const).map(
            (type) => (
              <option key={type} value={type}>
                {t(typeLabels[type])}
              </option>
            ),
          )}
        </Select>
      </Field>
    </div>
  );
}
