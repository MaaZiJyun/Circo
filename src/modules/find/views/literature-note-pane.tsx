"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { Button, Textarea } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import { MarkdownPreview } from "./markdown-preview";
import { ReaderSwitch } from "./reader-switch";

export interface LiteratureNoteHandle {
  save: () => Promise<void>;
}

export const LiteratureNotePane = forwardRef<
  LiteratureNoteHandle,
  { noteId: string; onDirtyChange: (dirty: boolean) => void }
>(function LiteratureNotePane({ noteId, onDirtyChange }, ref) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  useEffect(() => {
    let active = true;
    void fetch(`/api/notes/${encodeURIComponent(noteId)}`)
      .then(async (response) => {
        const payload = (await response.json()) as {
          content?: string;
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error);
        if (active) {
          setContent(payload.content ?? "");
          setDirty(false);
        }
      })
      .catch(
        (cause: unknown) =>
          active &&
          setError(
            cause instanceof Error ? cause.message : t("find.noteLoadFailed"),
          ),
      );
    return () => {
      active = false;
    };
  }, [noteId, t]);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  const save = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(noteId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error();
      setDirty(false);
    } catch {
      setError(t("find.noteSaveFailed"));
    } finally {
      setBusy(false);
    }
  }, [content, noteId, t]);
  useImperativeHandle(ref, () => ({ save }), [save]);
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch(
        `/api/notes/${encodeURIComponent(noteId)}/asset`,
        { method: "POST", body: form },
      );
      const payload = (await response.json()) as { url?: string };
      if (!response.ok || !payload.url) throw new Error();
      const alt = file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[\[\]]/g, "")
        .slice(0, 120);
      const { start, end } = selectionRef.current;
      setContent(
        (current) =>
          `${current.slice(0, start)}${start ? "\n" : ""}![${alt}](${payload.url})\n${current.slice(end)}`,
      );
      setDirty(true);
    } catch {
      setError(t("find.noteImageFailed"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  return (
    <section className="flex h-[calc(100dvh-12rem)] max-h-dvh min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">{t("find.note")}</h2>
        <div className="flex items-center gap-2">
          <ReaderSwitch
            value={mode}
            onChange={setMode}
            items={[
              { value: "view", label: t("find.viewMode") },
              { value: "edit", label: t("find.editMode") },
            ]}
          />
          {mode === "edit" && (
            <Button
              variant="ghost"
              className="min-h-8 px-2 text-xs"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <PhotoIcon className="size-4" />
              {t("find.insertImage")}
            </Button>
          )}
          <input
            ref={fileRef}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => void upload(event.target.files?.[0])}
          />
        </div>
      </header>
      {error && <p className="px-4 py-2 text-xs text-red-600">{error}</p>}
      {mode === "edit" ? (
        <Textarea
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setDirty(true);
          }}
          onSelect={(event) => {
            selectionRef.current = {
              start: event.currentTarget.selectionStart,
              end: event.currentTarget.selectionEnd,
            };
          }}
          className="min-h-0 flex-1 resize-none rounded-none border-0 font-mono leading-7"
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <MarkdownPreview content={content} />
        </div>
      )}
    </section>
  );
});
