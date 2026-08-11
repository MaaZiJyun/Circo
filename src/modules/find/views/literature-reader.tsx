"use client";

import { useState } from "react";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Button, Textarea } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { SourceRecord } from "@/shared/model/entities";
import type { ReferencePoint } from "@/shared/model/entities";
import { completeReading } from "../model/reading-record";
import { LiteratureDetailsPanel } from "./literature-details-panel";
import { MarkdownPreview } from "./markdown-preview";
import { ReadingReviewDialog } from "./reading-review-dialog";
import {
  InteractivePdfViewer,
  type PointCapture,
} from "./interactive-pdf-viewer";
import { PointDialog } from "./point-dialog";

export function LiteratureReader({
  source,
  onBack,
  onSave,
  onUpdate,
  pointCount,
  onCreatePoint,
}: {
  source: SourceRecord;
  onBack: () => void;
  onSave: (content: string) => Promise<void>;
  onUpdate: (change: Partial<SourceRecord>) => void;
  pointCount: number;
  onCreatePoint: (
    point: Omit<ReferencePoint, "id" | "createdAt" | "updatedAt">,
  ) => void;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [content, setContent] = useState(source.content);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [capture, setCapture] = useState<PointCapture | null>(null);
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
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 md:w-2/3">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeftIcon className="size-4" />
            {/* {t("common.back")} */}
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{source.title}</h1>
            {/* <p className="text-xs text-zinc-500">{t("find.markdownHint")}</p> */}
            <p className="mt-1 text-xs text-zinc-500">
              {t("find.pointCount").replace("{count}", String(pointCount))}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void save()} disabled={!dirty || saving}>
            <CheckIcon className="size-4" />
            {saving
              ? t("common.saving")
              : dirty
                ? t("common.save")
                : t("common.saved")}
          </Button>
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
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="h-[calc(100dvh-12rem)] max-h-dvh overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 bg-white px-4 py-2 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-950">
            {t("find.pdfReference")}
          </div>
          {source.fileToken && source.fileType === "pdf" ? (
            <div className="h-[calc(100%-2.5rem)]">
              <InteractivePdfViewer
                url={`/api/files/${source.fileToken}`}
                onCapture={setCapture}
              />
            </div>
          ) : (
            <p className="grid h-full place-items-center p-8 text-sm text-zinc-500">
              {t("find.originalUnavailable")}
            </p>
          )}
        </section>
        <section className="flex h-[calc(100dvh-12rem)] max-h-dvh flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
            <span className="text-sm font-medium">{t("find.markdown")}</span>
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
