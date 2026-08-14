"use client";

import { Textarea } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { LiteratureReaderProps } from "./literature-reader-types";
import {
  InteractivePdfViewer,
  type PointCapture,
} from "./interactive-pdf-viewer";
import { MarkdownPreview } from "./markdown-preview";
import { ReaderSwitch } from "./reader-switch";

export function LiteratureViewerPane({
  source,
  content,
  kind,
  mode,
  points,
  pointLists,
  onKindChange,
  onModeChange,
  onContentChange,
  onCapture,
  onUpdatePoint,
  onDeletePoint,
}: Pick<
  LiteratureReaderProps,
  "source" | "points" | "pointLists" | "onUpdatePoint" | "onDeletePoint"
> & {
  content: string;
  kind: "pdf" | "md";
  mode: "view" | "edit";
  onKindChange: (kind: "pdf" | "md") => void;
  onModeChange: (mode: "view" | "edit") => void;
  onContentChange: (content: string) => void;
  onCapture: (capture: PointCapture) => void;
}) {
  const { t } = useI18n();
  const hasPdf = Boolean(source.fileToken && source.fileType === "pdf");
  return (
    <section className="flex h-[calc(100dvh-12rem)] max-h-dvh min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">{t("find.reader")}</h2>
        <div className="flex items-center gap-2">
          <ReaderSwitch
            value={kind}
            onChange={onKindChange}
            items={[
              { value: "pdf", label: "PDF", disabled: !hasPdf },
              { value: "md", label: "MD" },
            ]}
          />
          <ReaderSwitch
            value={mode}
            onChange={(next) => {
              if (next === "edit" && kind === "pdf") onKindChange("md");
              onModeChange(next);
            }}
            items={[
              { value: "view", label: t("find.viewMode") },
              { value: "edit", label: t("find.editMode") },
            ]}
          />
        </div>
      </header>
      <div className="min-h-0 flex-1">
        {kind === "pdf" && hasPdf ? (
          <InteractivePdfViewer
            url={`/api/files/${source.fileToken}`}
            source={source}
            points={points}
            pointLists={pointLists}
            onCapture={onCapture}
            onUpdatePoint={onUpdatePoint}
            onDeletePoint={onDeletePoint}
          />
        ) : mode === "edit" ? (
          <Textarea
            autoFocus
            spellCheck
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            className="h-full min-h-0 resize-none rounded-none border-0 font-mono leading-7"
          />
        ) : (
          <div className="h-full overflow-y-auto p-6">
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>
    </section>
  );
}
