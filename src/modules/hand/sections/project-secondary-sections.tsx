"use client";

import { useState } from "react";
import {
  DocumentPlusIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { SectionHeader } from "@/shared/components/page-elements";
import {
  Alert,
  Button,
  Card,
  ContextMenu,
  ContextMenuItem,
  EmptyState,
  Tabs,
  type MenuPosition,
} from "@/shared/components";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectLog } from "@/shared/model/entities";
import { projectLogTitle } from "../model/project-log";
import type { useHandViewModel } from "../view-models/use-hand-view-model";
import { ProjectAttachmentTable } from "../views/project-attachment-table";
import { ProjectLogEditor } from "../views/project-log-editor";
import { ProjectLogViewer } from "../views/project-log-viewer";

type ViewModel = ReturnType<typeof useHandViewModel>;
type LogMenu = { log: ProjectLog; position: MenuPosition } | null;

export function ProjectSecondarySections({
  vm,
  section,
  openDialog,
}: {
  vm: ViewModel;
  section: "logs" | "attachments";
  openDialog: (dialog: "log" | "attachment") => void;
}) {
  const { t, formatDate } = useI18n();
  const [logPeriod, setLogPeriod] = useState<"day" | "week" | "month" | "year">("day");
  const [openedLog, setOpenedLog] = useState<ProjectLog | null>(null);
  const [logMenu, setLogMenu] = useState<LogMenu>(null);
  const [editingLog, setEditingLog] = useState<ProjectLog | null>(null);
  const periodLogs = vm.logs.filter((log) => log.period === logPeriod);

  return (
    <>
      {section === "logs" && (
        <Card className="shadow-sm">
          <SectionHeader
            title={t("hand.logs")}
            action={
              <Button variant="ghost" onClick={() => openDialog("log")}>
                <DocumentPlusIcon className="size-4" />
                {t("hand.newLog")}
              </Button>
            }
          />
          <Tabs
            value={logPeriod}
            onChange={setLogPeriod}
            items={(["day", "week", "month", "year"] as const).map((period) => ({
              value: period,
              label: t(`hand.logPeriod.${period}`),
            }))}
          />
          {vm.logError && (
            <div className="mt-3">
              <Alert tone="danger">{t("hand.logSaveFailed")}</Alert>
            </div>
          )}
          {periodLogs.length ? (
            <div className="mt-3 grid gap-3">
              {periodLogs.map((log) => (
                <button
                  key={log.id}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-zinc-200 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  onClick={() => setOpenedLog(log)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setLogMenu({ log, position: { x: event.clientX, y: event.clientY } });
                  }}
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{projectLogTitle(log)}</span>
                  <time className="shrink-0 text-xs text-zinc-500">{formatDate(log.createdAt)}</time>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3"><EmptyState title={t("common.noData")} /></div>
          )}
        </Card>
      )}
      {section === "attachments" && (
        <Card>
          <SectionHeader
            title={t("hand.attachments")}
            action={
              <Button variant="secondary" onClick={() => openDialog("attachment")}>
                <PlusIcon className="size-4" />
                {t("hand.addAttachment")}
              </Button>
            }
          />
          {vm.uploadError && <Alert tone="danger">{t("hand.uploadFailed")}</Alert>}
          {vm.attachments.length ? (
            <div className="mt-3">
              <ProjectAttachmentTable
                attachments={vm.attachments}
                projects={vm.projects}
                onDuplicate={vm.duplicateAttachments}
                onMove={vm.moveAttachments}
                onDelete={vm.deleteAttachments}
              />
            </div>
          ) : <EmptyState title={t("common.noData")} />}
        </Card>
      )}
      {openedLog && <ProjectLogViewer log={openedLog} onClose={() => setOpenedLog(null)} />}
      {logMenu && (
        <ContextMenu position={logMenu.position} onClose={() => setLogMenu(null)}>
          <ContextMenuItem onClick={() => { setEditingLog(logMenu.log); setLogMenu(null); }}>
            <PencilSquareIcon className="size-4" />
            {t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem danger onClick={() => {
            const log = logMenu.log;
            setLogMenu(null);
            if (window.confirm(t("common.confirmDelete"))) void vm.deleteLog(log);
          }}>
            <TrashIcon className="size-4" />
            {t("common.delete")}
          </ContextMenuItem>
        </ContextMenu>
      )}
      {editingLog && (
        <ProjectLogEditor
          open
          initial={logInput(editingLog)}
          projectId={editingLog.projectId}
          logId={editingLog.id}
          onClose={() => setEditingLog(null)}
          onSave={(input) => vm.updateLog(editingLog, input)}
        />
      )}
    </>
  );
}

function logInput(log: ProjectLog) {
  return {
    type: log.type,
    period: log.period,
    content: log.content,
    nextStep: log.nextStep,
    tags: log.tags,
  };
}
