"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";

export const PDF_MIN_ZOOM = 0.5;
export const PDF_MAX_ZOOM = 2;
export const PDF_ZOOM_STEP = 0.25;

export function PdfZoomControls({
  zoom,
  onChange,
}: {
  zoom: number;
  onChange: (zoom: number) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-2">
      <IconButton
        label={t("find.zoomIn")}
        className="rounded-full border border-zinc-200 bg-white shadow-md disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950"
        disabled={zoom >= PDF_MAX_ZOOM}
        onClick={() => onChange(Math.min(PDF_MAX_ZOOM, zoom + PDF_ZOOM_STEP))}
      >
        <PlusIcon className="size-4" />
      </IconButton>
      <IconButton
        label={t("find.zoomOut")}
        className="rounded-full border border-zinc-200 bg-white shadow-md disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950"
        disabled={zoom <= PDF_MIN_ZOOM}
        onClick={() => onChange(Math.max(PDF_MIN_ZOOM, zoom - PDF_ZOOM_STEP))}
      >
        <MinusIcon className="size-4" />
      </IconButton>
    </div>
  );
}
