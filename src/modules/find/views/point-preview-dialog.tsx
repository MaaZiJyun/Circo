"use client";

import { useState } from "react";
import Image from "next/image";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Badge, Button, DescriptionList, Dialog } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type {
  PointList,
  ReferencePoint,
  ReferencePointInput,
  SourceRecord,
} from "@/shared/model/entities";
import { ReferencePointDialog } from "./reference-point-dialog";

export function PointPreviewDialog({
  point,
  source,
  lists,
  onClose,
  onUpdate,
  onDelete,
}: {
  point: ReferencePoint;
  source: SourceRecord;
  lists: PointList[];
  onClose: () => void;
  onUpdate: (change: ReferencePointInput) => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const imageToken = point.contentPath.split(/[\\/]/).pop();
  const pointLists = point.listIds.flatMap((id) => {
    const list = lists.find((item) => item.id === id);
    return list ? [list] : [];
  });
  if (editing)
    return (
      <ReferencePointDialog
        point={point}
        sources={[source]}
        lists={lists}
        onClose={() => setEditing(false)}
        onSave={onUpdate}
      />
    );
  return (
    <Dialog
      open
      title={t("find.viewPoint")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-5">
        <DescriptionList
          variant="stacked"
          columns={2}
          items={[
            { label: t("find.source"), value: source.title },
            {
              label: t("find.pointType"),
              value: t(`find.pointType.${point.type}`),
            },
            { label: t("find.authors"), value: point.author || "—" },
            { label: t("common.date"), value: point.date },
            {
              label: t("find.pointLists"),
              value: pointLists.length ? (
                <div className="flex flex-wrap gap-1">
                  {pointLists.map((list) => (
                    <Badge key={list.id} color={list.color}>
                      {list.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                "—"
              ),
            },
          ]}
        />
        <section>
          <h3 className="mb-2 text-xs font-medium text-zinc-500">
            {t("common.content")}
          </h3>
          {point.type === "image" && imageToken ? (
            <Image
              src={`/api/reference-files/${imageToken}`}
              alt={point.note || t("find.viewPoint")}
              width={800}
              height={600}
              unoptimized
              className="max-h-[45vh] w-full rounded-xl object-contain"
            />
          ) : (
            <blockquote className="whitespace-pre-wrap border-l-2 border-zinc-300 pl-4 text-sm leading-7 dark:border-zinc-700">
              {point.content}
            </blockquote>
          )}
        </section>
        <section>
          <h3 className="mb-2 text-xs font-medium text-zinc-500">
            {t("find.pointNote")}
          </h3>
          <p className="rounded-xl bg-zinc-100 p-3 text-sm leading-6 dark:bg-zinc-900">
            {point.note || "—"}
          </p>
        </section>
        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <PencilSquareIcon className="size-4" />
            {t("common.edit")}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!window.confirm(t("find.confirmDeletePoint"))) return;
              onDelete();
              onClose();
            }}
          >
            <TrashIcon className="size-4" />
            {t("common.delete")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
