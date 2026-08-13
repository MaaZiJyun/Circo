"use client";

import { useState } from "react";

import {
  ArrowDownTrayIcon,
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

type DialogName = "task" | "log" | "attachment" | null;
type LogMenu = { log: ProjectLog; position: MenuPosition } | null;

export function ProjectWorkspace({
  vm,
  openDialog,
  onOpenTaskMenu,
}: {
  vm: ReturnType<typeof useHandViewModel>;
  openDialog: (dialog: DialogName) => void;
  onOpenTaskMenu: (task: TaskRecord, position: MenuPosition) => void;
}) {
  const { t, formatDate, formatNumber } = useI18n();
  const [logPeriod, setLogPeriod] = useState<"day" | "week" | "month" | "year">(
    "day",
  );
  const [openedLog, setOpenedLog] = useState<ProjectLog | null>(null);
  const [logMenu, setLogMenu] = useState<LogMenu>(null);
  const [editingLog, setEditingLog] = useState<ProjectLog | null>(null);
  if (!vm.selected) return null;
  return (
    <>
      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge
              tone={vm.selected.status === "completed" ? "success" : "info"}
            >
              {t(statusLabels[vm.selected.status])}
            </Badge>
            <h2 className="mt-3 text-2xl font-semibold">{vm.selected.name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              {vm.selected.purpose}
            </p>
            <p className="mt-3 text-xs text-zinc-500">
              {formatDate(vm.selected.startDate)} –{" "}
              {formatDate(vm.selected.endDate)}
            </p>
          </div>
          <div className="min-w-64">
            <ProgressBar value={vm.progress} label={t("common.progress")} />
            <p className="mt-3 text-xs text-zinc-500">
              {t("hand.actualVsPlan")}: {vm.plannedMinutes} / {vm.actualMinutes}{" "}
              {t("common.minutes")}
            </p>
          </div>
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
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
                  onToggle={() => vm.advanceTask(task)}
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
        <Card>
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
            <div className="mt-2 grid gap-3">
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
            <EmptyState title={t("common.noData")} />
          )}
        </Card>
      </div>
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
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vm.attachments.map((item) => (
              <a
                key={item.id}
                href={`/api/attachments/${item.fileToken}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <ArrowDownTrayIcon className="size-5" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-zinc-500">
                    {formatNumber(item.size / 1024, {
                      maximumFractionDigits: 1,
                    })}{" "}
                    KB · {item.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState title={t("common.noData")} />
        )}
      </Card>
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
