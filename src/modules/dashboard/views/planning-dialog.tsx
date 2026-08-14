"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { TaskInput } from "@/modules/hand/view-models/use-hand-view-model";
import { Button } from "@/shared/components/ui";
import { CreateDailyTaskDialog } from "@/modules/me/views/daily-task-dialogs";
import type { DailyTaskInput } from "@/modules/me/model/daily-task-input";
import { useI18n } from "@/shared/i18n/i18n-context";
import { activeItems } from "@/shared/model/app-state";
import type { TaskRecord } from "@/shared/model/entities";
import type { DailyPlanItem, FutureMessage } from "@/shared/model/message";
import { addDays, createId, now } from "@/shared/model/factories";
import { priorityFromImportance } from "@/shared/model/task-normalization";
import { taskImportance } from "@/shared/model/task-importance";
import { useStore } from "@/shared/view-models/store-context";
import {
  dayMinutes,
  PlanBasket,
  ProjectTaskPool,
  IndependentTaskPool,
} from "./planning-panels";
import {
  PlanningTaskActions,
  type PlanningTaskMenu,
} from "./planning-task-actions";

export function PlanningDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { state, mutate } = useStore();
  const planDate = addDays(new Date(), 1);
  const existing = state?.messages.find(
    (message) => !message.deletedAt && message.dailyPlan?.date === planDate,
  );
  const [selected, setSelected] = useState<DailyPlanItem[]>(
    existing?.dailyPlan?.items ?? [],
  );
  const [expanded, setExpanded] = useState<string[]>([]);
  const [creatingIndependent, setCreatingIndependent] = useState(false);
  const [taskMenu, setTaskMenu] = useState<PlanningTaskMenu>(null);
  if (!state) return null;
  const projects = activeItems(state.projects);
  const tasks = activeItems(state.tasks);
  const independentTasks = tasks.filter(
    (task) => !task.projectId && task.status !== "done",
  );
  const totalMinutes = selected.reduce(
    (sum, item) => sum + item.estimatedMinutes,
    0,
  );
  const plannedItems = selected.slice().sort(comparePlanDeadline);
  const selectedIds = new Set(
    selected.map((item) => item.id),
  );
  const toggle = (item: DailyPlanItem) => {
    if (selectedIds.has(item.id))
      setSelected((current) =>
        current.filter((entry) => entry.id !== item.id),
      );
    else if (totalMinutes + item.estimatedMinutes <= dayMinutes)
      setSelected((current) => [...current, item]);
  };
  const createIndependent = (input: DailyTaskInput) => {
    const stamp = now();
    const task: TaskRecord = {
      id: createId("task"),
      title: input.title.trim(),
      description: input.description,
      dueDate: input.dueAt,
      estimatedMinutes: input.estimatedMinutes,
      expectedOutput: input.expectedOutput,
      importance: taskImportance(input),
      impact: input.impact,
      goal: input.goal,
      risk: input.risk,
      value: input.value,
      delayLoss: input.delayLoss,
      dependencyIds: input.dependencyIds,
      complexity: input.complexity,
      uncertainty: input.uncertainty,
      recurrence: input.recurrence,
      priority: priorityFromImportance(taskImportance(input)),
      status: "todo",
      actualMinutes: 0,
      milestone: input.milestone,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      tasks: [...current.tasks, task],
    }));
    if (totalMinutes + task.estimatedMinutes <= dayMinutes)
      setSelected((current) => [
        ...current,
        {
          id: task.id,
          kind: "task",
          title: task.title,
          description: task.description,
          estimatedMinutes: task.estimatedMinutes,
          expectedOutput: task.expectedOutput,
          importance: task.importance,
          dueAt: task.dueDate,
          sourceTaskId: task.id,
        },
      ]);
  };
  const removeIndependent = (task: TaskRecord) => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        item.id === task.id
          ? { ...item, deletedAt: stamp, updatedAt: stamp }
          : item,
      ),
    }));
    setSelected((current) =>
      current.filter((item) => item.id !== task.id),
    );
  };
  const updateIndependent = (task: TaskRecord, input: TaskInput) => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              ...input,
              importance: taskImportance(input),
              priority: priorityFromImportance(taskImportance(input)),
              updatedAt: stamp,
            }
          : item,
      ),
    }));
    setSelected((current) => {
      const previous = current.find((item) => item.id === task.id);
      if (!previous) return current;
      const withoutPrevious = current.filter((item) => item.id !== task.id);
      const otherMinutes = withoutPrevious.reduce(
        (sum, item) => sum + item.estimatedMinutes,
        0,
      );
      if (otherMinutes + input.estimatedMinutes > dayMinutes)
        return withoutPrevious;
      return [
        ...withoutPrevious,
        {
          ...previous,
          title: input.title.trim(),
          description: input.description,
          dueAt: input.dueDate,
          estimatedMinutes: input.estimatedMinutes,
          expectedOutput: input.expectedOutput,
          importance: taskImportance(input),
        },
      ];
    });
  };
  const confirm = () => {
    const stamp = now();
    const message: FutureMessage = {
      ...existing,
      id: existing?.id ?? createId("message_plan"),
      subject: t("planning.messageSubject").replace("{date}", planDate),
      body: planBody(plannedItems, planDate, totalMinutes, t),
      recipient: "futureSelf",
      deliveryMode: "scheduled",
      deliverAt: `${planDate}T00:00:00`,
      references: plannedItems.flatMap((item) =>
        item.sourceTaskId
          ? [{ kind: "task" as const, id: item.sourceTaskId, label: item.title }]
          : [],
      ),
      attachments: [],
      systemGenerated: true,
      messageType: "dailyPlan",
      dailyPlan: { date: planDate, items: plannedItems },
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      messages: existing
        ? current.messages.map((item) =>
            item.id === existing.id ? message : item,
          )
        : [...current.messages, message],
    }));
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4">
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold">{t("planning.title")}</h2>
            <p className="text-xs text-zinc-500">{planDate}</p>
          </div>
          <button aria-label={t("common.close")} onClick={onClose}>
            <XMarkIcon className="size-5" />
          </button>
        </header>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(300px,0.9fr)_minmax(420px,1.3fr)]">
          <PlanBasket
            items={plannedItems}
            totalMinutes={totalMinutes}
            onRemove={toggle}
            onCreate={() => setCreatingIndependent(true)}
          />
          <div className="grid min-h-0 grid-rows-2 border-t border-zinc-200 lg:border-l lg:border-t-0 dark:border-zinc-800">
            <ProjectTaskPool
              projects={projects}
              tasks={tasks}
              expanded={expanded}
              onExpanded={setExpanded}
              selectedIds={selectedIds}
              totalMinutes={totalMinutes}
              onToggle={toggle}
            />
            <IndependentTaskPool
              tasks={independentTasks}
              planDate={planDate}
              selectedIds={selectedIds}
              totalMinutes={totalMinutes}
              onContextMenu={(task, x, y) =>
                setTaskMenu({ task, position: { x, y } })
              }
              onToggle={toggle}
            />
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!selected.length} onClick={confirm}>
            {t("planning.confirm")}
          </Button>
        </footer>
      </section>
      <CreateDailyTaskDialog
        open={creatingIndependent}
        title={t("planning.createIndependent")}
        plannedDate={planDate}
        onClose={() => setCreatingIndependent(false)}
        onSave={createIndependent}
      />
      <PlanningTaskActions
        menu={taskMenu}
        onClose={() => setTaskMenu(null)}
        onUpdate={updateIndependent}
        onRemove={removeIndependent}
      />
    </div>
  );
}

function comparePlanDeadline(left: DailyPlanItem, right: DailyPlanItem) {
  if (!left.dueAt) return right.dueAt ? 1 : 0;
  if (!right.dueAt) return -1;
  return left.dueAt.localeCompare(right.dueAt);
}

function planBody(
  items: DailyPlanItem[],
  date: string,
  minutes: number,
  t: ReturnType<typeof useI18n>["t"],
) {
  return [
    t("planning.messageIntro").replace("{date}", date),
    "",
    ...items.map((item) => `• ${item.title} · ${item.estimatedMinutes} min`),
    "",
    t("planning.messageTotal").replace("{minutes}", String(minutes)),
  ].join("\n");
}
