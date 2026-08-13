"use client";

import { useState } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  PageHeader,
  SectionHeader,
  StatCard,
} from "@/shared/components/page-elements";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
} from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useDailyTaskCache } from "../view-models/use-daily-task-cache";
import {
  CreateDailyTaskDialog,
  RetrieveTaskDialog,
} from "./daily-task-dialogs";
import { TaskQuadrant } from "./task-quadrant";

export function MeView() {
  const { t, formatNumber } = useI18n();
  const vm = useDailyTaskCache();
  const [dialog, setDialog] = useState<"retrieve" | "create" | null>(null);
  if (!vm) return null;
  const rate = (value: number | null) =>
    value === null
      ? t("common.noData")
      : formatNumber(value, { style: "percent", maximumFractionDigits: 0 });
  const completed = vm.dailyTasks.filter((item) => item.completed).length;
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("me.eyebrow")}
        title={t("me.profileTitle")}
        subtitle={t("me.profileSubtitle")}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("dashboard.totalTime")}
          value={`${formatNumber(vm.metrics.totalMinutes / 60, { maximumFractionDigits: 1 })} ${t("common.hours")}`}
        />
        <StatCard
          label={t("dashboard.effectiveRate")}
          value={rate(vm.metrics.effectiveRate)}
          hint={t("dashboard.metricEffective")}
        />
        <StatCard
          label={t("dashboard.completionRate")}
          value={rate(vm.metrics.completionRate)}
          hint={t("dashboard.metricCompletion")}
        />
      </div>
      <Card>
        <SectionHeader
          title={t("me.dailyCache")}
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setDialog("retrieve")}>
                <MagnifyingGlassIcon className="size-4" />
                {t("me.dailyRetrieve")}
              </Button>
              <Button onClick={() => setDialog("create")}>
                <PlusIcon className="size-4" />
                {t("me.dailyCreate")}
              </Button>
            </div>
          }
        />
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Input
            className="w-44"
            type="date"
            value={vm.date}
            onChange={(event) => vm.setDate(event.target.value)}
          />
          <Badge
            tone={
              completed === vm.dailyTasks.length && completed > 0
                ? "success"
                : "neutral"
            }
          >
            {completed} / {vm.dailyTasks.length}
          </Badge>
        </div>
        {vm.dailyTasks.length ? (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {vm.dailyTasks.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <input
                  className="size-5"
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => vm.toggle(item)}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${item.completed ? "text-zinc-400 line-through" : ""}`}
                  >
                    {item.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {item.sourceTaskId
                      ? `${t("me.fromProject")}: ${vm.projectName(item.projectId)}`
                      : t("me.independentTask")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {t("me.taskDueAt")}: {item.dueAt.replace("T", " ")} ·{" "}
                    {t("me.taskEstimate")}: {item.estimatedMinutes}{" "}
                    {t("common.minutes")}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.description}
                    </p>
                  )}
                  {item.expectedOutput && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {t("me.taskExpectedOutput")}: {item.expectedOutput}
                    </p>
                  )}
                </div>
                <IconButton
                  label={t("common.delete")}
                  onClick={() => vm.deleteTask(item.id)}
                >
                  <TrashIcon className="size-4" />
                </IconButton>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t("me.dailyEmpty")}
            description={t("me.dailyEmptyHint")}
          />
        )}
      </Card>
      <Card>
        <SectionHeader title={t("me.taskQuadrant")} />
        <TaskQuadrant tasks={vm.dailyTasks} coordinates={vm.coordinates} />
      </Card>
      <RetrieveTaskDialog
        open={dialog === "retrieve"}
        tasks={vm.tasks}
        projectName={vm.projectName}
        existingIds={vm.dailyTasks.flatMap((item) =>
          item.sourceTaskId ? [item.sourceTaskId] : [],
        )}
        onClose={() => setDialog(null)}
        onChoose={(task) => vm.retrieve(task)}
      />
      <CreateDailyTaskDialog
        open={dialog === "create"}
        onClose={() => setDialog(null)}
        onSave={vm.addIndependent}
      />
    </div>
  );
}
