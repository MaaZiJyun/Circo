"use client";

import { useEffect, useRef } from "react";
import type { PDFPageProxy } from "pdfjs-dist";
import { Util } from "pdfjs-dist/legacy/build/pdf.mjs";
import type {
  PointList,
  ReferencePoint,
  ReferencePointInput,
  SourceRecord,
} from "@/shared/model/entities";
import { PdfPointLayer } from "./pdf-point-layer";

export function PdfPage({
  page,
  points,
  pointLists,
  source,
  pointSelectionEnabled,
  onUpdatePoint,
  onDeletePoint,
}: {
  page: PDFPageProxy;
  points: ReferencePoint[];
  pointLists: PointList[];
  source: SourceRecord;
  pointSelectionEnabled: boolean;
  onUpdatePoint: (id: string, change: ReferencePointInput) => void;
  onDeletePoint: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<ReturnType<PDFPageProxy["render"]> | null>(null);
  useEffect(() => {
    let active = true;
    const render = async () => {
      const previousTask = renderTaskRef.current;
      if (previousTask) {
        previousTask.cancel();
        try {
          await previousTask.promise;
        } catch {
          // PDF.js rejects cancelled render tasks by design.
        }
      }
      if (!active) return;
      const viewport = page.getViewport({ scale: 1.35 });
      const canvas = canvasRef.current;
      const layer = textLayerRef.current;
      if (!canvas || !layer) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = viewport.width * ratio;
      canvas.height = viewport.height * ratio;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const context = canvas.getContext("2d");
      if (!context) return;
      const renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
      });
      renderTaskRef.current = renderTask;
      try {
        await renderTask.promise;
      } catch (cause) {
        if (
          !active ||
          (cause instanceof Error &&
            cause.name === "RenderingCancelledException")
        )
          return;
        throw cause;
      } finally {
        if (renderTaskRef.current === renderTask) renderTaskRef.current = null;
      }
      const text = await page.getTextContent();
      if (!active) return;
      layer.replaceChildren();
      layer.style.width = `${viewport.width}px`;
      layer.style.height = `${viewport.height}px`;
      for (const raw of text.items) {
        if (!("str" in raw)) continue;
        const transform = Util.transform(viewport.transform, raw.transform);
        const span = document.createElement("span");
        const fontSize = Math.hypot(transform[2], transform[3]);
        span.textContent = raw.str;
        span.style.left = `${transform[4]}px`;
        span.style.top = `${transform[5] - fontSize}px`;
        span.style.fontSize = `${fontSize}px`;
        span.style.fontFamily = "sans-serif";
        if (raw.dir === "rtl") span.dir = "rtl";
        layer.append(span);
      }
    };
    void render();
    return () => {
      active = false;
      renderTaskRef.current?.cancel();
    };
  }, [page]);
  return (
    <div
      data-pdf-page={page.pageNumber}
      className="pdf-interactive-page relative mx-auto w-fit bg-white shadow"
    >
      <canvas ref={canvasRef} />
      <div ref={textLayerRef} className="absolute inset-0 overflow-hidden" />
      <PdfPointLayer
        points={points}
        lists={pointLists}
        source={source}
        interactive={pointSelectionEnabled}
        onUpdatePoint={onUpdatePoint}
        onDeletePoint={onDeletePoint}
      />
    </div>
  );
}
