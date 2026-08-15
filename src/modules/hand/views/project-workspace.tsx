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
  Badge,
  Button,
  Card,
  EmptyState,
  ProgressBar,
  Tabs,
} from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useHandViewModel } from "../view-models/use-hand-view-model";
import { TaskRow } from "@/shared/components/task-row";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/modules/find/views/context-menu";
import type { ProjectLog, TaskRecord } from "@/shared/model/entities";
import { projectLogTitle } from "../model/project-log";
import type { LogInput } from "../view-models/use-hand-view-model";
import { ProjectLogEditor } from "./project-log-editor";
import { ProjectLogViewer } from "./project-log-viewer";
import { isLockedCompletedPastTask } from "./project-task-actions";
import { ProjectAttachmentTable } from "./project-attachment-table";

type DialogName = "task" | "log" | "attachment" | null;
type LogMenu = { log: ProjectLog; position: MenuPosition } | null;
export type ProjectSection = "overview" | "plan" | "logs" | "attachments";

export function ProjectWorkspace({
  vm,
  openDialog,
  onOpenTaskMenu,
  onEditProject,
  section,
}: {
  vm: ReturnType<typeof useHandViewModel>;
  openDialog: (dialog: DialogName) => void;
  onOpenTaskMenu: (task: TaskRecord, position: MenuPosition) => void;
  onEditProject: () => void;
  section: ProjectSection;
}) {
  const { t, formatDate } = useI18n();
  const [logPeriod, setLogPeriod] = useState<"day" | "week" | "month" | "year">(
    "day",
  );
  const [openedLog, setOpenedLog] = useState<ProjectLog | null>(null);
  const [logMenu, setLogMenu] = useState<LogMenu>(null);
  const [editingLog, setEditingLog] = useState<ProjectLog | null>(null);
  if (!vm.selected) return null;
  return (
    <>
      {section === "overview" && (
        <Card className="shadow-sm">
          <SectionHeader
            title={t("hand.projectInformation")}
            action={
              <Button variant="secondary" onClick={onEditProject}>
                <PencilSquareIcon className="size-4" />
                {t("common.edit")}
              </Button>
            }
          />
          <div className="flex flex-col gap-5 pb-5 dark:border-zinc-800 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{vm.selected.name}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {vm.selected.purpose}
              </p>
              <p className="mt-3 text-xs text-zinc-500">
                {formatDate(vm.selected.startDate)} –{" "}
                {formatDate(vm.selected.endDate)}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)]">
              <div className="grid gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {t("common.tags")}
                  </p>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {vm.selected.tags.length
                      ? vm.selected.tags.join(" · ")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {t("common.progress")}
                  </p>
                  <div className="mt-2 text-xs text-zinc-500">
                    <ProgressBar value={vm.progress} />
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {t("hand.projectStatus")}
                  </p>
                  <div className="mt-2">
                    <Badge
                      tone={
                        vm.selected.status === "completed" ? "success" : "info"
                      }
                    >
                      {t(statusLabels[vm.selected.status])}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {t("hand.expected")}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {vm.selected.expected || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
      {section === "plan" && (
        <div className="grid gap-5">
          <Card className="shadow-sm">
            <SectionHeader
              title={t("hand.timeline")}
              action={
                <Button variant="ghost" onClick={() => openDialog("task")}>
                  <PlusIcon className="size-4" />
                  {t("hand.newTask")}
                </Button>
              }
            />
            {vm.tasks.length ? (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {vm.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    title={task.title}
                    description={task.description}
                    status={task.status}
                    dueAt={task.dueDate}
                    completedAt={task.completedAt}
                    estimatedMinutes={task.estimatedMinutes}
                    actualMinutes={task.actualMinutes}
                    expectedOutput={task.expectedOutput}
                    milestone={task.milestone}
                    toggleDisabled={isLockedCompletedPastTask(task)}
                    onToggle={() => vm.advanceTask(task)}
                    deadlineInline
                    onContextMenu={(event) => {
                      event.preventDefault();
                      onOpenTaskMenu(task, {
                        x: event.clientX,
                        y: event.clientY,
                      });
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title={t("common.noData")} />
            )}
          </Card>
        </div>
      )}
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
            items={(["day", "week", "month", "year"] as const).map(
              (period) => ({
                value: period,
                label: t(`hand.logPeriod.${period}`),
              }),
            )}
          />
          {vm.logError && (
            <div className="mt-3">
              <Alert tone="danger">{t("hand.logSaveFailed")}</Alert>
            </div>
          )}
          {vm.logs.some((log) => log.period === logPeriod) ? (
            <div className="mt-3 grid gap-3">
              {vm.logs
                .filter((log) => log.period === logPeriod)
                .map((log) => (
                  <button
                    key={log.id}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-zinc-200 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    onClick={() => setOpenedLog(log)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setLogMenu({
                        log,
                        position: { x: event.clientX, y: event.clientY },
                      });
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {projectLogTitle(log)}
                    </span>
                    <time className="shrink-0 text-xs text-zinc-500">
                      {formatDate(log.createdAt)}
                    </time>
                  </button>
                ))}
            </div>
          ) : (
            <div className="mt-3">
              <EmptyState title={t("common.noData")} />
            </div>
          )}
        </Card>
      )}
      {section === "attachments" && (
        <Card>
          <SectionHeader
            title={t("hand.attachments")}
            action={
              <Button
                variant="secondary"
                onClick={() => openDialog("attachment")}
              >
                <PlusIcon className="size-4" />
                {t("hand.addAttachment")}
              </Button>
            }
          />
          {vm.uploadError && (
            <Alert tone="danger">{t("hand.uploadFailed")}</Alert>
          )}
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
          ) : (
            <EmptyState title={t("common.noData")} />
          )}
        </Card>
      )}
      {openedLog && (
        <ProjectLogViewer log={openedLog} onClose={() => setOpenedLog(null)} />
      )}
      {logMenu && (
        <ContextMenu
          position={logMenu.position}
          onClose={() => setLogMenu(null)}
        >
          <ContextMenuItem
            onClick={() => {
              setEditingLog(logMenu.log);
              setLogMenu(null);
            }}
          >
            <PencilSquareIcon className="size-4" />
            {t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem
            danger
            onClick={() => {
              const log = logMenu.log;
              setLogMenu(null);
              if (window.confirm(t("common.confirmDelete")))
                void vm.deleteLog(log);
            }}
          >
            <TrashIcon className="size-4" />
            {t("common.delete")}
          </ContextMenuItem>
        </ContextMenu>
      )}
      {editingLog && (
        <ProjectLogEditor
          key={editingLog.id}
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

function logInput(log: ProjectLog): LogInput {
  return {
    type: log.type,
    period: log.period,
    content: log.content,
    nextStep: log.nextStep,
    tags: log.tags,
  };
}
