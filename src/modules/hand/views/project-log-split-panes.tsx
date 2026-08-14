"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const ratioKey = "circo-project-log-preview-ratio";
const clampRatio = (value: number) => Math.min(0.75, Math.max(0.25, value));

export function ProjectLogSplitPanes({
  label,
  preview,
  editor,
}: {
  label: string;
  preview: ReactNode;
  editor: ReactNode;
}) {
  const panesRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0.5);
  const [resizing, setResizing] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = Number(window.localStorage.getItem(ratioKey));
      if (Number.isFinite(saved) && saved > 0) setRatio(clampRatio(saved));
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);
  const resizeAt = (clientX: number) => {
    const bounds = panesRef.current?.getBoundingClientRect();
    if (!bounds?.width) return ratio;
    const next = clampRatio((clientX - bounds.left) / bounds.width);
    setRatio(next);
    return next;
  };
  const finishResize = (next = ratio) => {
    setResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.localStorage.setItem(ratioKey, String(next));
  };
  return (
    <div
      ref={panesRef}
      className={`grid min-h-0 flex-1 md:flex ${resizing ? "select-none [&_*]:!select-none" : ""}`}
      style={{ "--preview-pane": `${ratio * 100}%` } as CSSProperties}
    >
      <div className="min-w-0 md:w-[var(--preview-pane)]">{preview}</div>
      <div
        role="separator"
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={25}
        aria-valuemax={75}
        aria-valuenow={Math.round(ratio * 100)}
        tabIndex={0}
        className="group hidden w-3 shrink-0 cursor-col-resize touch-none items-stretch justify-center md:flex"
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
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            resizeAt(event.clientX);
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
          const next = clampRatio(
            ratio + (event.key === "ArrowRight" ? 0.02 : -0.02),
          );
          setRatio(next);
          finishResize(next);
        }}
      >
        <span className="w-px bg-zinc-200 transition-all group-hover:w-1 group-hover:bg-zinc-400 group-focus:w-1 group-focus:bg-zinc-500 dark:bg-zinc-800 dark:group-hover:bg-zinc-600" />
      </div>
      <div className="min-w-0 md:flex-1">{editor}</div>
    </div>
  );
}
