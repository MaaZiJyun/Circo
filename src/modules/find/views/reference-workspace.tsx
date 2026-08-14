"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FolderPlusIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button, Card, EmptyState, IconButton } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type {
  PointList,
  ReferencePoint,
  SourceRecord,
} from "@/shared/model/entities";
import { PointContextMenu, type PointMenu } from "./point-context-menu";

export function ReferenceWorkspace({
  points,
  lists,
  sources,
  onEdit,
  onDelete,
  onAdd,
  onAddToList,
  onRemoveFromList,
  onDragStart,
  onConvertToIdea,
  canRemoveFromList,
}: {
  points: ReferencePoint[];
  lists: PointList[];
  sources: SourceRecord[];
  onEdit: (point: ReferencePoint) => void;
  onDelete: (point: ReferencePoint) => void;
  onAdd: () => void;
  onAddToList: (point: ReferencePoint) => void;
  onRemoveFromList: (point: ReferencePoint) => void;
  onDragStart: (point: ReferencePoint) => void;
  onConvertToIdea: (point: ReferencePoint) => void;
  canRemoveFromList: boolean;
}) {
  const { t } = useI18n();
  const [menu, setMenu] = useState<PointMenu | null>(null);
  const sourceName = (id: string) =>
    sources.find((item) => item.id === id)?.title ?? t("find.unknownSource");
  return (
    <section className="space-y-3">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2 className="font-semibold">{t("find.points")}</h2>
        <Button disabled={!sources.length} onClick={onAdd}>
          <PlusIcon className="size-4" />
          {t("find.addPoint")}
        </Button>
      </div>
      {!points.length ? (
        <Card>
          <EmptyState title={t("find.noPoints")} />
        </Card>
      ) : (
        <div className="columns-1 gap-4 md:columns-2 2xl:columns-3">
          {points
            .slice()
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((point) => {
              const token = point.contentPath.split(/[\\/]/).pop();
              return (
                <div
                  key={point.id}
                  draggable
                  className="mb-4 inline-block w-full break-inside-avoid align-top"
                  onDragStart={(event) => {
                    onDragStart(point);
                    event.dataTransfer.setData("text/plain", point.id);
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setMenu({
                      point,
                      position: { x: event.clientX, y: event.clientY },
                    });
                  }}
                >
                  <Card className="min-w-0 cursor-grab">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
                        {t(`find.pointType.${point.type}`)}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="mr-1 text-xs text-zinc-500">
                          {point.date}
                        </span>
                        <IconButton
                          label={t("find.addPointToList")}
                          onClick={() => onAddToList(point)}
                          className="size-8"
                        >
                          <FolderPlusIcon className="size-4" />
                        </IconButton>
                        {canRemoveFromList && (
                          <IconButton
                            label={t("find.removeFromList")}
                            onClick={() => onRemoveFromList(point)}
                            className="size-8"
                          >
                            <XMarkIcon className="size-4" />
                          </IconButton>
                        )}
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
                      {!!point.listIds.length && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {point.listIds.map((id) => {
                            const list = lists.find((item) => item.id === id);
                            return list ? (
                              <span
                                key={id}
                                className="rounded-full border px-2 py-0.5"
                                style={{
                                  borderColor: list.color,
                                  color: list.color,
                                }}
                              >
                                {list.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}
        </div>
      )}
      {menu && (
        <PointContextMenu
          menu={menu}
          canRemoveFromList={canRemoveFromList}
          onClose={() => setMenu(null)}
          onEdit={() => {
            onEdit(menu.point);
            setMenu(null);
          }}
          onAddToList={() => {
            onAddToList(menu.point);
            setMenu(null);
          }}
          onRemoveFromList={() => {
            onRemoveFromList(menu.point);
            setMenu(null);
          }}
          onDelete={() => {
            onDelete(menu.point);
            setMenu(null);
          }}
          onConvertToIdea={() => {
            onConvertToIdea(menu.point);
            setMenu(null);
          }}
        />
      )}
    </section>
  );
}
