"use client";

import { useState } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { SectionHeader } from "@/shared/components/page-elements";
import { TaskRow } from "@/shared/components/task-row";
import {
  Badge,
  Button,
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

export function DailyTaskList() {
  const { t } = useI18n();
  const vm = useDailyTaskCache();
  const [dialog, setDialog] = useState<"retrieve" | "create" | null>(null);
  if (!vm) return null;
  const completed = vm.dailyTasks.filter((item) => item.completed).length;
  return (
    <>
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Input
          className="w-40"
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
        <div className="max-h-96 divide-y divide-zinc-200 overflow-y-auto dark:divide-zinc-800">
          {vm.dailyTasks.map((item) => (
            <TaskRow
              key={item.id}
              title={item.title}
              description={item.description}
              status={item.completed ? "done" : "todo"}
              dueAt={item.dueAt}
              completedAt={item.completedAt}
              estimatedMinutes={item.estimatedMinutes}
              actualMinutes={item.actualMinutes ?? 0}
              expectedOutput={item.expectedOutput}
              source={
                item.sourceTaskId
                  ? `${t("me.fromProject")}: ${vm.projectName(item.projectId)}`
                  : t("me.independentTask")
              }
              onToggle={() => vm.toggle(item)}
              action={
                <IconButton
                  label={t("common.delete")}
                  onClick={() => vm.deleteTask(item.id)}
                >
                  <TrashIcon className="size-4" />
                </IconButton>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("me.dailyEmpty")}
          description={t("me.dailyEmptyHint")}
        />
      )}
      <RetrieveTaskDialog
        open={dialog === "retrieve"}
        tasks={vm.tasks}
        projectName={vm.projectName}
        existingIds={vm.dailyTasks.flatMap((item) =>
          item.sourceTaskId ? [item.sourceTaskId] : [],
        )}
        onClose={() => setDialog(null)}
        onChoose={vm.retrieve}
      />
      <CreateDailyTaskDialog
        open={dialog === "create"}
        onClose={() => setDialog(null)}
        onSave={vm.addIndependent}
      />
    </>
  );
}
