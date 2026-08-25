"use client";

import { useEffect, useRef, useState } from "react";
import {
  DocumentDuplicateIcon,
  DocumentIcon,
  FolderOpenIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { SelectionToolbar } from "@/shared/components/selection-toolbar";
import { Badge, Button, Checkbox, Dialog, Select } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { Attachment, ProjectRecord } from "@/shared/model/entities";
import { MarkdownPreview } from "@/modules/find/views/markdown-preview";
import { ContextMenu, ContextMenuItem, type MenuPosition } from "@/shared/components/context-menu";

type AttachmentMenu = { attachment: Attachment; position: MenuPosition } | null;

export function ProjectAttachmentTable({ attachments, projects, onDuplicate, onMove, onDelete }: {
  attachments: Attachment[];
  projects: ProjectRecord[];
  onDuplicate: (ids: string[]) => void;
  onMove: (ids: string[], projectId: string) => void;
  onDelete: (ids: string[]) => void;
}) {
  const { t, formatDate, formatNumber } = useI18n();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [opened, setOpened] = useState<Attachment | null>(null);
  const [menu, setMenu] = useState<AttachmentMenu>(null);
  const [movingIds, setMovingIds] = useState<string[]>([]);
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const toggle = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const url = (item: Attachment) => item.filePath
    ? `/api/attachments?path=${encodeURIComponent(item.filePath)}`
    : `/api/attachments/${item.fileToken}`;
  const openInFinder = async (item: Attachment, action: "open" | "reveal") => {
    if (!item.filePath) return window.open(url(item), "_blank");
    await fetch("/api/attachments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: item.filePath, action }),
    });
  };
  const actOn = (item: Attachment) => selectedIds.includes(item.id) ? selectedIds : [item.id];

  return (
    <>
      {selectedIds.length > 0 && (
        <SelectionToolbar label={t("hand.attachmentsSelected").replace("{count}", String(selectedIds.length))} onCancel={() => setSelectedIds([])}>
          <Button variant="ghost" onClick={() => { onDuplicate(selectedIds); setSelectedIds([]); }}>{t("common.duplicate")}</Button>
          <Button variant="ghost" onClick={() => setMovingIds(selectedIds)}>{t("hand.moveAttachment")}</Button>
          <Button variant="danger" onClick={() => { if (window.confirm(t("common.confirmDelete"))) { onDelete(selectedIds); setSelectedIds([]); } }}>{t("common.delete")}</Button>
        </SelectionToolbar>
      )}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70">
            <tr><th className="w-14 px-4 py-3" /><th className="px-4 py-3">{t("common.title")}</th><th className="px-4 py-3">{t("common.type")}</th><th className="px-4 py-3">{t("hand.fileSize")}</th><th className="px-4 py-3">{t("common.date")}</th><th className="px-4 py-3">{t("common.details")}</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {attachments.map((item) => (
              <tr
                key={item.id}
                className={`group cursor-pointer select-none transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${selectedIds.includes(item.id) ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}
                onClick={() => {
                  if (longPressed.current) { longPressed.current = false; return; }
                  if (selectedIds.length) toggle(item.id);
                  else setOpened(item);
                }}
                onContextMenu={(event) => { event.preventDefault(); setMenu({ attachment: item, position: { x: event.clientX, y: event.clientY } }); }}
                onPointerDown={() => { longPressed.current = false; longPress.current = setTimeout(() => { longPressed.current = true; toggle(item.id); }, 550); }}
                onPointerUp={() => { if (longPress.current) clearTimeout(longPress.current); }}
                onPointerCancel={() => { if (longPress.current) clearTimeout(longPress.current); }}
                onPointerLeave={() => { if (longPress.current) clearTimeout(longPress.current); }}
              >
                <td className="px-4 py-4">
                  <span className="relative grid size-9 place-items-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-900">
                    <DocumentIcon className={`size-5 transition-opacity ${selectedIds.length ? "opacity-0" : "group-hover:opacity-0"}`} />
                    <span onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        aria-label={item.name}
                        checked={selectedIds.includes(item.id)}
                        className={`absolute inset-0 m-auto ${selectedIds.length ? "opacity-100" : "pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"}`}
                        onChange={() => toggle(item.id)}
                      />
                    </span>
                  </span>
                </td>
                <td className="max-w-72 px-4 py-4"><p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p><p className="mt-1 truncate text-xs text-zinc-400">{item.filePath}</p></td>
                <td className="px-4 py-4"><Badge>{fileType(item)}</Badge></td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{formatNumber(item.size / 1024, { maximumFractionDigits: 1 })} KB</td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{formatDate(item.createdAt)}</td>
                <td className="max-w-64 truncate px-4 py-3 text-zinc-500">{item.description || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {menu && (
        <ContextMenu position={menu.position} onClose={() => setMenu(null)}>
          <ContextMenuItem onClick={() => { void openInFinder(menu.attachment, "open"); setMenu(null); }}><DocumentIcon className="size-4" />{t("hand.openOriginal")}</ContextMenuItem>
          <ContextMenuItem onClick={() => { void openInFinder(menu.attachment, "reveal"); setMenu(null); }}><FolderOpenIcon className="size-4" />{t("hand.openFileLocation")}</ContextMenuItem>
          <ContextMenuItem onClick={() => { onDuplicate(actOn(menu.attachment)); setMenu(null); }}><DocumentDuplicateIcon className="size-4" />{t("common.duplicate")}</ContextMenuItem>
          <ContextMenuItem onClick={() => { setMovingIds(actOn(menu.attachment)); setMenu(null); }}><FolderOpenIcon className="size-4" />{t("hand.moveAttachment")}</ContextMenuItem>
          <ContextMenuItem danger onClick={() => { const ids = actOn(menu.attachment); setMenu(null); if (window.confirm(t("common.confirmDelete"))) { onDelete(ids); setSelectedIds([]); } }}><TrashIcon className="size-4" />{t("common.delete")}</ContextMenuItem>
        </ContextMenu>
      )}
      {opened && <AttachmentViewer attachment={opened} src={url(opened)} onClose={() => setOpened(null)} />}
      <MoveAttachmentDialog open={movingIds.length > 0} projects={projects} onClose={() => setMovingIds([])} onChoose={(projectId) => { onMove(movingIds, projectId); setMovingIds([]); setSelectedIds([]); }} />
    </>
  );
}

function fileType(item: Attachment) {
  return item.name.split(".").pop()?.toUpperCase() || item.mimeType;
}

function AttachmentViewer({ attachment, src, onClose }: { attachment: Attachment; src: string; onClose: () => void }) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const extension = attachment.name.split(".").pop()?.toLowerCase();
  useEffect(() => {
    if (!["md", "markdown", "txt", "csv"].includes(extension ?? "")) return;
    void fetch(src).then((response) => response.text()).then(setText);
  }, [extension, src]);
  return (
    <Dialog open title={attachment.name} closeLabel={t("common.close")} onClose={onClose}>
      {/* Local file previews cannot use the Next image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {attachment.mimeType.startsWith("image/") && <img src={src} alt={attachment.name} className="max-h-[70vh] w-full object-contain" />}
      {attachment.mimeType.startsWith("video/") && <video src={src} controls className="max-h-[70vh] w-full" />}
      {attachment.mimeType.startsWith("audio/") && <audio src={src} controls className="w-full" />}
      {extension === "pdf" && <iframe src={src} title={attachment.name} className="h-[70vh] w-full rounded-lg" />}
      {(extension === "md" || extension === "markdown") && <MarkdownPreview content={text} />}
      {extension === "csv" && <CsvPreview content={text} />}
      {extension === "txt" && <pre className="whitespace-pre-wrap text-sm">{text}</pre>}
      {!attachment.mimeType.startsWith("image/") && !attachment.mimeType.startsWith("video/") && !attachment.mimeType.startsWith("audio/") && !["pdf", "md", "markdown", "csv", "txt"].includes(extension ?? "") && <p className="text-sm text-zinc-500">{t("hand.previewUnavailable")}</p>}
    </Dialog>
  );
}

function CsvPreview({ content }: { content: string }) {
  const rows = content.split(/\r?\n/).filter(Boolean).map((line) => line.split(","));
  return <div className="overflow-auto"><table className="w-full text-left text-sm"><tbody>{rows.map((row, index) => <tr key={index} className="border-b border-zinc-200 dark:border-zinc-800">{row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-3 py-2">{cell}</td>)}</tr>)}</tbody></table></div>;
}

function MoveAttachmentDialog({ open, projects, onClose, onChoose }: { open: boolean; projects: ProjectRecord[]; onClose: () => void; onChoose: (id: string) => void }) {
  const { t } = useI18n();
  const [projectId, setProjectId] = useState("");
  return <Dialog open={open} title={t("hand.moveAttachment")} closeLabel={t("common.close")} onClose={onClose}><div className="grid gap-4"><Select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">{t("hand.selectProject")}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select><Button disabled={!projectId} onClick={() => onChoose(projectId)}>{t("hand.moveAttachment")}</Button></div></Dialog>;
}
