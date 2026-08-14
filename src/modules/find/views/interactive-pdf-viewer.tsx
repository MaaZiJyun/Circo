"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import { Button } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type {
  PointList,
  ReferencePoint,
  ReferencePointInput,
  SourceRecord,
} from "@/shared/model/entities";
import { ContextMenu, ContextMenuItem } from "./context-menu";
import { PdfPage } from "./pdf-page";
import { PdfZoomControls } from "./pdf-zoom-controls";
import { TranslationDialog } from "./translation-dialog";
import { useSelectionTranslation } from "./use-selection-translation";
import {
  readPointCaptureFromClipboard,
  writePointCaptureToClipboard,
  type PointCapture,
} from "./point-capture";

export type { PointCapture } from "./point-capture";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.mjs",
  import.meta.url,
).toString();

export function InteractivePdfViewer({
  url,
  source,
  points,
  pointLists,
  onCapture,
  onUpdatePoint,
  onDeletePoint,
}: {
  url: string;
  source: SourceRecord;
  points: ReferencePoint[];
  pointLists: PointList[];
  onCapture: (capture: PointCapture) => void;
  onUpdatePoint: (id: string, change: ReferencePointInput) => void;
  onDeletePoint: (id: string) => void;
}) {
  const { t } = useI18n();
  const { translation, translateSelection, closeTranslation } =
    useSelectionTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PDFPageProxy[]>([]);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [pendingText, setPendingText] = useState<PointCapture | null>(null);
  const [stagedCapture, setStagedCapture] = useState<PointCapture | null>(null);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const clipboardWriteRef = useRef<Promise<boolean>>(Promise.resolve(false));
  const dragStart = useRef<{ x: number; y: number; page: HTMLElement } | null>(
    null,
  );
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const stageCapture = (capture: PointCapture) => {
    setStagedCapture(capture);
    clipboardWriteRef.current = writePointCaptureToClipboard(capture);
  };
  useEffect(() => {
    let active = true;
    let document: PDFDocumentProxy | null = null;
    void getDocument(url)
      .promise.then(async (loaded) => {
        document = loaded;
        const loadedPages = await Promise.all(
          Array.from({ length: loaded.numPages }, (_, index) =>
            loaded.getPage(index + 1),
          ),
        );
        if (active) setPages(loadedPages);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : "PDF load failed.");
      });
    return () => {
      active = false;
      void document?.destroy();
    };
  }, [url]);
  const readTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (!selection?.rangeCount || !text) return null;
    const range = selection.getRangeAt(0);
    const page =
      range.commonAncestorContainer.parentElement?.closest<HTMLElement>(
        "[data-pdf-page]",
      );
    if (!page) return null;
    const pageRect = page.getBoundingClientRect();
    const rect = range.getBoundingClientRect();
    return {
      type: "text",
      content: text,
      page: Number(page.dataset.pdfPage),
      location: {
        x: (rect.left - pageRect.left) / zoom,
        y: (rect.top - pageRect.top) / zoom,
        width: rect.width / zoom,
        height: rect.height / zoom,
      },
    } satisfies PointCapture;
  };
  const finishScreenshot = async (event: React.PointerEvent) => {
    const start = dragStart.current;
    if (!start) return;
    const pageRect = start.page.getBoundingClientRect();
    const left = Math.max(0, Math.min(start.x, event.clientX) - pageRect.left);
    const top = Math.max(0, Math.min(start.y, event.clientY) - pageRect.top);
    const width = Math.abs(event.clientX - start.x);
    const height = Math.abs(event.clientY - start.y);
    const canvas = start.page.querySelector("canvas");
    if (!canvas || width < 4 || height < 4) return;
    const scaleX = canvas.width / pageRect.width;
    const scaleY = canvas.height / pageRect.height;
    const target = document.createElement("canvas");
    target.width = width * scaleX;
    target.height = height * scaleY;
    target
      .getContext("2d")
      ?.drawImage(
        canvas,
        left * scaleX,
        top * scaleY,
        width * scaleX,
        height * scaleY,
        0,
        0,
        target.width,
        target.height,
      );
    const image = await new Promise<Blob | null>((resolve) =>
      target.toBlob(resolve, "image/png"),
    );
    if (image)
      stageCapture({
        type: "image",
        content: "",
        image,
        page: Number(start.page.dataset.pdfPage),
        location: {
          x: left / zoom,
          y: top / zoom,
          width: width / zoom,
          height: height / zoom,
        },
      });
    dragStart.current = null;
    setSelectionRect(null);
    setScreenshotMode(false);
  };
  return (
    <div className="relative h-full">
      <div
        ref={rootRef}
        className={`h-full overflow-auto p-4 ${screenshotMode ? "cursor-crosshair select-none" : ""}`}
        onContextMenu={(event) => {
          event.preventDefault();
          setPendingText(readTextSelection());
          setMenu({ x: event.clientX, y: event.clientY });
        }}
        onPointerDown={(event) => {
          if (!screenshotMode) return;
          event.preventDefault();
          const page = (event.target as Element).closest<HTMLElement>(
            "[data-pdf-page]",
          );
          if (!page) return;
          window.getSelection()?.removeAllRanges();
          event.currentTarget.setPointerCapture(event.pointerId);
          dragStart.current = { x: event.clientX, y: event.clientY, page };
        }}
        onPointerMove={(event) => {
          const start = dragStart.current;
          if (!start) return;
          setSelectionRect(
            new DOMRect(
              Math.min(start.x, event.clientX),
              Math.min(start.y, event.clientY),
              Math.abs(event.clientX - start.x),
              Math.abs(event.clientY - start.y),
            ),
          );
        }}
        onPointerUp={(event) => void finishScreenshot(event)}
      >
        {error && <p className="p-4 text-sm text-red-600">{error}</p>}
        <div className="grid gap-4">
          {pages.map((page) => (
            <PdfPage
              key={page.pageNumber}
              page={page}
              zoom={zoom}
              points={points.filter((point) => point.page === page.pageNumber)}
              pointLists={pointLists}
              source={source}
              pointSelectionEnabled={!screenshotMode}
              onUpdatePoint={onUpdatePoint}
              onDeletePoint={onDeletePoint}
            />
          ))}
        </div>
        {selectionRect && (
          <div
            className="pointer-events-none fixed z-30 border-2 border-blue-500 bg-blue-500/15"
            style={{
              left: selectionRect.x,
              top: selectionRect.y,
              width: selectionRect.width,
              height: selectionRect.height,
            }}
          />
        )}
        {menu && (
          <ContextMenu position={menu} onClose={() => setMenu(null)}>
            <ContextMenuItem
              disabled={!pendingText}
              onClick={() => {
                if (pendingText) void translateSelection(pendingText.content);
                setMenu(null);
              }}
            >
              {t("find.translateSelection")}
            </ContextMenuItem>
            <ContextMenuItem
              disabled={!pendingText}
              onClick={() => {
                if (pendingText) stageCapture(pendingText);
                setMenu(null);
              }}
            >
              {t("find.selectText")}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                window.getSelection()?.removeAllRanges();
                setScreenshotMode(true);
                setMenu(null);
              }}
            >
              {t("find.screenshot")}
            </ContextMenuItem>
          </ContextMenu>
        )}
        {translation && (
          <TranslationDialog
            value={translation}
            onClose={closeTranslation}
            onTargetChange={(target) =>
              void translateSelection(translation.source, target)
            }
          />
        )}
      </div>
      {stagedCapture && (
        <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2 rounded-xl bg-zinc-950 p-2 text-white shadow-xl">
          <Button
            onClick={() => {
              void clipboardWriteRef.current.then(async (clipboardReady) => {
                const capture = clipboardReady
                  ? await readPointCaptureFromClipboard(stagedCapture)
                  : stagedCapture;
                onCapture(capture);
                setStagedCapture(null);
              });
            }}
          >
            {t("find.generatePoint")}
          </Button>
          <Button variant="ghost" onClick={() => setStagedCapture(null)}>
            {t("common.cancel")}
          </Button>
        </div>
      )}
      <PdfZoomControls zoom={zoom} onChange={setZoom} />
    </div>
  );
}
