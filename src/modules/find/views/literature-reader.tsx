"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { Button, Textarea } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import { completeReading } from "../model/reading-record";
import { LiteratureDetailsPanel } from "./literature-details-panel";
import { MarkdownPreview } from "./markdown-preview";
import { ReadingReviewDialog } from "./reading-review-dialog";
import {
  InteractivePdfViewer,
  type PointCapture,
} from "./interactive-pdf-viewer";
import { PointDialog } from "./point-dialog";
import { CitationButton } from "./citation-button";
import { clampReaderRatio, readerRatioKey } from "./reader-layout";
import type { LiteratureReaderProps } from "./literature-reader-types";

export function LiteratureReader({
  source,
  onBack,
  onSave,
  onConvert,
  onUpdate,
  points,
  pointLists,
  onCreatePoint,
  onUpdatePoint,
  onDeletePoint,
}: LiteratureReaderProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [content, setContent] = useState(source.content);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [capture, setCapture] = useState<PointCapture | null>(null);
  const panesRef = useRef<HTMLDivElement>(null);
  const [pdfRatio, setPdfRatio] = useState(2 / 3);
  const [resizing, setResizing] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = Number(window.localStorage.getItem(readerRatioKey));
      if (Number.isFinite(saved) && saved > 0)
        setPdfRatio(clampReaderRatio(saved));
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);
  const resizeAt = (clientX: number) => {
    const bounds = panesRef.current?.getBoundingClientRect();
    if (!bounds?.width) return pdfRatio;
    const next = clampReaderRatio((clientX - bounds.left) / bounds.width);
    setPdfRatio(next);
    return next;
  };
  const finishResize = (ratio = pdfRatio) => {
    setResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.localStorage.setItem(readerRatioKey, String(ratio));
  };
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave(content);
      setDirty(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };
  const convert = async () => {
    setConverting(true);
    setError("");
    try {
      const converted = await onConvert();
      setContent(converted);
      setDirty(false);
      setMode("read");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.error"));
    } finally {
      setConverting(false);
    }
  };
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 md:w-2/3">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{source.title}</h1>
            <p className="mt-1 text-xs text-zinc-500">
              {t("find.pointCount").replace("{count}", String(points.length))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => void save()} disabled={!dirty || saving}>
            <CheckIcon className="size-4" />
            {saving
              ? t("common.saving")
              : dirty
                ? t("common.save")
                : t("common.saved")}
          </Button>
          <CitationButton citation={source.citation} onError={setError} />
          <Button
            variant="secondary"
            onClick={() => {
              if (source.readingStatus === "read")
                onUpdate({
                  readingStatus: "unread",
                  readingStartedAt: new Date().toISOString(),
                  readingCompletedAt: undefined,
                  studyDurationMinutes: 0,
                });
              else setShowReview(true);
            }}
          >
            <EyeIcon className="size-4" />
            {t(
              source.readingStatus === "read"
                ? "find.markAsUnread"
                : "find.markAsRead",
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowDetails((value) => !value)}
          >
            {t(showDetails ? "find.collapse" : "find.expand")}
            <ChevronDownIcon
              className={`size-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </header>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {showDetails && (
        <LiteratureDetailsPanel source={source} onSave={onUpdate} />
      )}
      <div
        ref={panesRef}
        className={`relative grid gap-4 xl:flex xl:gap-0 ${resizing ? "select-none [&_*]:!select-none" : ""}`}
        style={{ "--pdf-pane": `${pdfRatio * 100}%` } as CSSProperties}
      >
        <section className="h-[calc(100dvh-12rem)] max-h-dvh overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 xl:w-[var(--pdf-pane)] xl:min-w-0">
          {source.fileToken && source.fileType === "pdf" ? (
            <div className="h-full">
              <InteractivePdfViewer
                url={`/api/files/${source.fileToken}`}
                source={source}
                points={points}
                pointLists={pointLists}
                onCapture={setCapture}
                onUpdatePoint={onUpdatePoint}
                onDeletePoint={onDeletePoint}
              />
            </div>
          ) : (
            <p className="grid h-full place-items-center p-8 text-sm text-zinc-500">
              {t("find.originalUnavailable")}
            </p>
          )}
        </section>
        <div
          role="separator"
          aria-label={t("find.resizePanes")}
          aria-orientation="vertical"
          aria-valuemin={25}
          aria-valuemax={75}
          aria-valuenow={Math.round(pdfRatio * 100)}
          tabIndex={0}
          className="group hidden w-4 shrink-0 cursor-col-resize touch-none items-center justify-center xl:flex"
          onPointerDown={(event) => {
            event.preventDefault();
            window.getSelection()?.removeAllRanges();
            setResizing(true);
            event.currentTarget.setPointerCapture(event.pointerId);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
            resizeAt(event.clientX);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.preventDefault();
              resizeAt(event.clientX);
            }
          }}
          onPointerUp={(event) => {
            const next = resizeAt(event.clientX);
            event.currentTarget.releasePointerCapture(event.pointerId);
            finishResize(next);
          }}
          onPointerCancel={() => finishResize()}
          onLostPointerCapture={() => {
            setResizing(false);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
          }}
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const next = clampReaderRatio(
              pdfRatio + (event.key === "ArrowRight" ? 0.02 : -0.02),
            );
            setPdfRatio(next);
            finishResize(next);
          }}
        >
          <span className="h-16 w-1 rounded-full bg-zinc-300 transition-colors group-hover:bg-zinc-500 group-focus:bg-zinc-700 dark:bg-zinc-700 dark:group-hover:bg-zinc-500" />
        </div>
        <section className="flex h-[calc(100dvh-12rem)] max-h-dvh min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 xl:flex-1">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
            <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
              {(["read", "edit"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${mode === item ? "bg-white shadow-sm dark:bg-zinc-800" : "text-zinc-500"}`}
                >
                  {t(item === "read" ? "find.readMode" : "find.editMode")}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {source.fileToken && source.fileType === "pdf" && (
                <Button
                  variant="ghost"
                  className="min-h-8 px-2 text-xs"
                  disabled={dirty || saving || converting}
                  onClick={() => void convert()}
                >
                  <ArrowPathIcon
                    className={`size-4 ${converting ? "animate-spin" : ""}`}
                  />
                  {t(converting ? "find.reconverting" : "find.reconvert")}
                </Button>
              )}
            </div>
          </div>
          {mode === "edit" ? (
            <Textarea
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setDirty(true);
              }}
              className="min-h-0 flex-1 resize-none rounded-none border-0 font-mono leading-7"
            />
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <MarkdownPreview content={content} />
            </div>
          )}
        </section>
      </div>
      <ReadingReviewDialog
        open={showReview}
        initial={source.readingReview}
        onClose={() => setShowReview(false)}
        onSubmit={(review) =>
          onUpdate(completeReading(source, review, new Date().toISOString()))
        }
      />
      {capture && (
        <PointDialog
          capture={capture}
          source={source}
          onClose={() => setCapture(null)}
          onSave={onCreatePoint}
        />
      )}
    </div>
  );
}
