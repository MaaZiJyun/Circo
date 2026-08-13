"use client";

import Image from "next/image";
import { PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Card, EmptyState, IconButton } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ReferencePoint, SourceRecord } from "@/shared/model/entities";

export function ReferenceSidebar({ points }: { points: ReferencePoint[] }) {
  const { t } = useI18n();
  const text = points.filter((item) => item.type === "text").length;
  const images = points.length - text;
  return (
    <aside className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="font-semibold">{t("find.points")}</h2>
      <div className="mt-4 grid gap-2 text-sm">
        <p className="flex justify-between">
          <span>{t("find.allPoints")}</span>
          <span>{points.length}</span>
        </p>
        <p className="flex justify-between">
          <span>{t("find.pointType.text")}</span>
          <span>{text}</span>
        </p>
        <p className="flex justify-between">
          <span>{t("find.pointType.image")}</span>
          <span>{images}</span>
        </p>
      </div>
    </aside>
  );
}

export function ReferenceWorkspace({
  points,
  sources,
  onEdit,
  onDelete,
  onAdd,
}: {
  points: ReferencePoint[];
  sources: SourceRecord[];
  onEdit: (point: ReferencePoint) => void;
  onDelete: (point: ReferencePoint) => void;
  onAdd: () => void;
}) {
  const { t } = useI18n();
  const sourceName = (id: string) =>
    sources.find((item) => item.id === id)?.title ?? t("find.unknownSource");
  return (
    <section className="space-y-3">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2 className="font-semibold">{t("find.points")}</h2>
        <Button disabled={!sources.length} onClick={onAdd}>
          <PlusIcon className="size-4" />{t("find.addPoint")}
        </Button>
      </div>
      {!points.length ? <Card><EmptyState title={t("find.noPoints")} /></Card> :
      <div className="grid gap-4 md:grid-cols-2">
      {points
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((point) => {
          const token = point.contentPath.split(/[\\/]/).pop();
          return (
            <Card key={point.id} className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
                  {t(`find.pointType.${point.type}`)}
                </span>
                <div className="flex items-center gap-1">
                  <span className="mr-1 text-xs text-zinc-500">
                    {point.date}
                  </span>
                  <IconButton
                    label={t("common.edit")}
                    onClick={() => onEdit(point)}
                    className="size-8"
                  >
                    <PencilSquareIcon className="size-4" />
                  </IconButton>
                  <IconButton
                    label={t("common.delete")}
                    onClick={() => onDelete(point)}
                    className="size-8 text-red-600"
                  >
                    <TrashIcon className="size-4" />
                  </IconButton>
                </div>
              </div>
              {point.type === "image" && token ? (
                <Image
                  src={`/api/reference-files/${token}`}
                  alt={point.note || "Reference Point"}
                  width={800}
                  height={600}
                  unoptimized
                  className="max-h-72 w-full rounded-xl object-contain"
                />
              ) : (
                <blockquote className="whitespace-pre-wrap border-l-2 border-zinc-300 pl-4 text-sm leading-6">
                  {point.content}
                </blockquote>
              )}
              <div className="mt-4 grid gap-1 text-xs">
                <p className="text-sm text-center">
                  {sourceName(point.sourceId)}
                </p>
                {point.note && (
                  <p>
                    {t("find.pointNote")}: {point.note}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>}
    </section>
  );
}
