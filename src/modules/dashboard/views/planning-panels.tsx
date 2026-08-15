"use client";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button, ProgressBar } from "@/shared/components/ui";
import { TaskHierarchyList } from "@/shared/components/task-hierarchy-list";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectRecord, TaskRecord } from "@/shared/model/entities";
import type { DailyPlanItem } from "@/shared/model/message";

export const dayMinutes = 1440;
type PoolProps = {
  selectedIds: Set<string>;
  totalMinutes: number;
  onToggle: (item: DailyPlanItem) => void;
};

export function PlanBasket({
  items,
  totalMinutes,
  onRemove,
  onCreate,
}: {
  items: DailyPlanItem[];
  totalMinutes: number;
  onRemove: (item: DailyPlanItem) => void;
  onCreate: () => void;
}) {
  const { t } = useI18n();
  return (
    <section className="flex min-h-[360px] min-w-0 flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{t("planning.planArea")}</h3>
        <Button onClick={onCreate}>
          <PlusIcon className="size-4" />
        </Button>
      </div>
      <div className="my-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {items.map((item) => (
          <button
            key={`${item.kind}-${item.id}`}
            className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left dark:border-zinc-800"
            onClick={() => onRemove(item)}
          >
            <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
            <span className="text-xs text-zinc-500">
              {item.estimatedMinutes} min
            </span>
            <XMarkIcon className="size-4" />
          </button>
        ))}
        {!items.length && (
          <p className="py-12 text-center text-sm text-zinc-500">
            {t("planning.empty")}
          </p>
        )}
      </div>
      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <div className="mb-2 flex justify-between text-sm font-medium">
          <span>{t("planning.capacity")}</span>
          <span>{totalMinutes} / 1440 min</span>
        </div>
        <ProgressBar value={(totalMinutes / dayMinutes) * 100} label="24h" />
      </div>
    </section>
  );
}

export function ProjectTaskPool({
  projects,
  tasks,
  expanded,
  onExpanded,
  onContextMenu,
  onSetParent,
  ...pool
}: PoolProps & {
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  expanded: string[];
  onExpanded: (ids: string[]) => void;
  onContextMenu: (task: TaskRecord, x: number, y: number) => void;
  onSetParent: (ids: string[], parentId: string | null) => void;
}) {
  const { t } = useI18n();
  return (
    <section className="min-h-0 overflow-y-auto p-5">
      <h3 className="mb-3 font-semibold">{t("planning.projectTasks")}</h3>
      <div className="space-y-2">
        {projects.map((project) => {
          const projectTasks = tasks.filter(
            (task) => task.projectId === project.id,
          );
          const done = projectTasks.filter(
            (task) => task.status === "done",
          ).length;
          const progress = projectTasks.length
            ? Math.round((done / projectTasks.length) * 100)
            : 0;
          const open = expanded.includes(project.id);
          return (
            <div
              key={project.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800"
            >
              <button
                className="flex w-full items-center gap-2 p-3 text-left"
                onClick={() =>
                  onExpanded(
                    open
                      ? expanded.filter((id) => id !== project.id)
                      : [...expanded, project.id],
                  )
                }
              >
                {open ? (
                  <ChevronDownIcon className="size-4" />
                ) : (
                  <ChevronRightIcon className="size-4" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {project.name}
                </span>
                <span className="text-xs text-zinc-500">{progress}%</span>
              </button>
              {open && (
                <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
                  <TaskHierarchyList
                    tasks={projectTasks}
                    onSetParent={onSetParent}
                    renderTask={(task) => (
                      <PlanChoice
                        item={{
                          id: task.id,
                          kind: "task",
                          title: task.title,
                          description: task.description,
                          estimatedMinutes: task.estimatedMinutes,
                          expectedOutput: task.expectedOutput,
                          importance: task.importance ?? project.score,
                          dueAt: task.dueDate,
                          sourceTaskId: task.id,
                          projectId: project.id,
                        }}
                        disabled={task.status === "done"}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          onContextMenu(task, event.clientX, event.clientY);
                        }}
                        {...pool}
                      />
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function IndependentTaskPool({
  tasks,
  planDate,
  onContextMenu,
  onSetParent,
  ...pool
}: PoolProps & {
  tasks: TaskRecord[];
  planDate: string;
  onContextMenu: (task: TaskRecord, x: number, y: number) => void;
  onSetParent: (ids: string[], parentId: string | null) => void;
}) {
  const { t } = useI18n();
  return (
    <section className="min-h-0 overflow-y-auto border-t border-zinc-200 p-5 dark:border-zinc-800">
      <h3 className="mb-3 font-semibold">{t("planning.routineTasks")}</h3>
      <TaskHierarchyList
        tasks={tasks}
        onSetParent={onSetParent}
        renderTask={(task) => (
          <PlanChoice
            item={{
              id: task.id,
              kind: "task",
              title: task.title,
              description: task.description,
              estimatedMinutes: task.estimatedMinutes,
              expectedOutput: task.expectedOutput,
              importance: task.importance,
              dueAt: `${planDate}T${task.dueDate.split("T")[1] ?? "23:59"}`,
              sourceTaskId: task.id,
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              onContextMenu(task, event.clientX, event.clientY);
            }}
            {...pool}
          />
        )}
      />
    </section>
  );
}

function PlanChoice({
  item,
  selectedIds,
  totalMinutes,
  onToggle,
  disabled = false,
  onContextMenu,
}: PoolProps & { item: DailyPlanItem; disabled?: boolean; onContextMenu?: React.MouseEventHandler<HTMLButtonElement> }) {
  const selected = selectedIds.has(item.id);
  const full = !selected && totalMinutes + item.estimatedMinutes > dayMinutes;
  return (
    <button
      disabled={disabled || full}
      className={`flex min-h-10 w-full min-w-0 items-center gap-3 rounded-lg px-3 text-left text-sm disabled:opacity-40 ${selected ? " bg-zinc-50 text-black dark:text-zinc-50" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}
      onClick={() => onToggle(item)}
      onContextMenu={onContextMenu}
    >
      <span className="min-w-0 flex-1 py-2">
        <span className="block truncate">{item.title}</span>
        {item.description && (
          <span className="block truncate text-xs opacity-60">
            {item.description}
          </span>
        )}
      </span>
      <span className="shrink-0 text-right text-xs opacity-60">
        {item.dueAt?.split("T")[1] && (
          <span className="block">{item.dueAt.split("T")[1]}</span>
        )}
        <span>{item.estimatedMinutes} min</span>
      </span>
    </button>
  );
}
