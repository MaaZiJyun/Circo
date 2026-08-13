"use client";

import { useState } from "react";
import { useI18n } from "@/shared/i18n/i18n-context";
import type {
  PointList,
  ReferencePoint,
  ReferencePointInput,
  SourceRecord,
} from "@/shared/model/entities";
import { pointTraceColor } from "../model/point-list";
import { PointPreviewDialog } from "./point-preview-dialog";

export function PdfPointLayer({
  points,
  lists,
  source,
  interactive,
  onUpdatePoint,
  onDeletePoint,
}: {
  points: ReferencePoint[];
  lists: PointList[];
  source: SourceRecord;
  interactive: boolean;
  onUpdatePoint: (id: string, change: ReferencePointInput) => void;
  onDeletePoint: (id: string) => void;
}) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = points.find((point) => point.id === selectedId) ?? null;
  return (
    <>
      {points
        .filter(
          (point) => point.location.width > 0 && point.location.height > 0,
        )
        .map((point) => {
          const color = pointTraceColor(point, lists);
          return (
            <button
              key={point.id}
              type="button"
              disabled={!interactive}
              aria-label={t("find.viewPoint")}
              title={
                point.type === "text"
                  ? point.content.slice(0, 120)
                  : point.note || t("find.pointType.image")
              }
              className="absolute z-20 rounded-sm border-2 opacity-50 transition-opacity hover:opacity-75 disabled:pointer-events-none"
              style={{
                left: point.location.x,
                top: point.location.y,
                width: point.location.width,
                height: point.location.height,
                borderColor: color,
                backgroundColor: `${color}55`,
              }}
              onClick={() => setSelectedId(point.id)}
            />
          );
        })}
      {selected && (
        <PointPreviewDialog
          point={selected}
          source={source}
          lists={lists}
          onClose={() => setSelectedId(null)}
          onUpdate={(change) => onUpdatePoint(selected.id, change)}
          onDelete={() => onDeletePoint(selected.id)}
        />
      )}
    </>
  );
}
