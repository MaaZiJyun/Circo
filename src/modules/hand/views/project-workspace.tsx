"use client";

import { useState } from "react";

import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  DocumentPlusIcon,
  PlusIcon,
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
import { statusLabels, typeLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useHandViewModel } from "../view-models/use-hand-view-model";

type DialogName = "task" | "log" | "attachment" | null;

export function ProjectWorkspace({
  vm,
  openDialog,
}: {
  vm: ReturnType<typeof useHandViewModel>;
  openDialog: (dialog: DialogName) => void;
}) {
  const { t, formatDate, formatNumber } = useI18n();
  const [logPeriod, setLogPeriod] = useState<"day" | "week" | "month" | "year">(
    "day",
  );
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
                <button
                  key={task.id}
                  onClick={() => vm.advanceTask(task)}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <CheckCircleIcon
                    className={`size-5 ${task.status === "done" ? "text-green-500" : task.status === "doing" ? "text-blue-500" : "text-zinc-300 dark:text-zinc-700"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${task.status === "done" ? "line-through text-zinc-400" : ""}`}
                    >
                      {task.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(task.dueDate)} · {task.estimatedMinutes}{" "}
                      {t("common.minutes")}
                    </p>
                    {task.description && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {task.description}
                      </p>
                    )}
                    {task.expectedOutput && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {t("hand.expectedOutput")}: {task.expectedOutput}
                      </p>
                    )}
                    {task.completedAt && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {t("me.finish")}: {formatDate(task.completedAt)}
                      </p>
                    )}
                  </div>
                  {task.milestone && (
                    <Badge tone="warning">{t("hand.milestone")}</Badge>
                  )}
                  <Badge
                    tone={
                      task.status === "done"
                        ? "success"
                        : task.status === "doing"
                          ? "info"
                          : "neutral"
                    }
                  >
                    {t(statusLabels[task.status])}
                  </Badge>
                </button>
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
            <div className="grid gap-3">
              {vm.logs
                .filter((log) => log.period === logPeriod)
                .map((log) => (
                  <article
                    key={log.id}
                    className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <div className="flex justify-between gap-2">
                      <Badge
                        tone={
                          log.type === "problem"
                            ? "danger"
                            : log.type === "conclusion"
                              ? "success"
                              : "info"
                        }
                      >
                        {t(typeLabels[log.type])}
                      </Badge>
                      <span className="text-xs text-zinc-500">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6">{log.content}</p>
                    {log.nextStep && (
                      <p className="mt-2 text-xs text-zinc-500">
                        {t("hand.nextStep")}: {log.nextStep}
                      </p>
                    )}
                  </article>
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
    </>
  );
}
