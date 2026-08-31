"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowUturnLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { Alert, Button } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import { completeReading } from "../model/reading-record";
import { LiteratureDetailsPanel } from "./literature-details-panel";
import { ReadingReviewDialog } from "./reading-review-dialog";
import type { PointCapture } from "./interactive-pdf-viewer";
import { PointDialog } from "./point-dialog";
import { CitationButton } from "./citation-button";
import { clampReaderRatio, readerRatioKey } from "./reader-layout";
import type { LiteratureReaderProps } from "./literature-reader-types";
import { LiteratureViewerPane } from "./literature-viewer-pane";
import {
  LiteratureNotePane,
  type LiteratureNoteHandle,
} from "./literature-note-pane";

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
  const [viewerKind, setViewerKind] = useState<"pdf" | "md">(
    source.fileToken && source.fileType === "pdf" ? "pdf" : "md",
  );
  const [viewerMode, setViewerMode] = useState<"view" | "edit">("view");
  const [content, setContent] = useState(source.content);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [noteDirty, setNoteDirty] = useState(false);
  const [error, setError] = useState("");
  const [conversionNotice, setConversionNotice] = useState(
    source.conversionStatus === "degraded" ? source.conversionMessage : "",
  );
  const [showDetails, setShowDetails] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [capture, setCapture] = useState<PointCapture | null>(null);
  const noteRef = useRef<LiteratureNoteHandle>(null);
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
      if (dirty) await onSave(content);
      if (noteDirty) await noteRef.current?.save();
      if (dirty) setDirty(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };
  const convert = async () => {
    setConverting(true);
    setError("");
    setConversionNotice("");
    try {
      const converted = await onConvert();
      setContent(converted.content);
      setConversionNotice(converted.warning ?? "");
      setDirty(false);
      setViewerKind("md");
      setViewerMode("view");
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
            <ArrowUturnLeftIcon className="size-4" />
            <span className="hidden md:inline">{t("hand.back")}</span>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{source.title}</h1>
            <p className="mt-1 text-xs text-zinc-500">
              {t("find.pointCount").replace("{count}", String(points.length))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => void save()}
            disabled={(!dirty && !noteDirty) || saving}
          >
            <CheckIcon className="size-4" />
            {saving
              ? t("common.saving")
              : dirty || noteDirty
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
      {conversionNotice && (
        <Alert tone="warning">{conversionNotice}</Alert>
      )}
      {showDetails && (
        <LiteratureDetailsPanel
          source={source}
          onSave={onUpdate}
          onConvert={() => void convert()}
          converting={converting}
          convertDisabled={dirty || saving}
        />
      )}
      <div
        ref={panesRef}
        className={`relative grid gap-4 xl:flex xl:gap-0 ${resizing ? "select-none [&_*]:!select-none" : ""}`}
        style={{ "--pdf-pane": `${pdfRatio * 100}%` } as CSSProperties}
      >
        <div className="xl:w-[var(--pdf-pane)] xl:min-w-0">
          <LiteratureViewerPane
            source={source}
            content={content}
            kind={viewerKind}
            mode={viewerMode}
            points={points}
            pointLists={pointLists}
            onKindChange={(kind) => {
              setViewerKind(kind);
              if (kind === "pdf") setViewerMode("view");
            }}
            onModeChange={setViewerMode}
            onContentChange={(value) => {
              setContent(value);
              setDirty(true);
            }}
            onCapture={setCapture}
            onUpdatePoint={onUpdatePoint}
            onDeletePoint={onDeletePoint}
          />
        </div>
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
        <div className="xl:min-w-0 xl:flex-1">
          <LiteratureNotePane
            ref={noteRef}
            noteId={source.id}
            onDirtyChange={setNoteDirty}
          />
        </div>
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
