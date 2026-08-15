"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/modules/find/views/context-menu";
import { SectionHeader } from "@/shared/components/page-elements";
import { TaskHierarchyList } from "@/shared/components/task-hierarchy-list";
import { TaskRow } from "@/shared/components/task-row";
import {
  Badge,
  Button,
  EmptyState,
  Tabs,
} from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { DailyTask, TaskRecord } from "@/shared/model/entities";
import { useDailyTaskCache } from "../view-models/use-daily-task-cache";
import {
  CreateDailyTaskDialog,
  RetrieveTaskDialog,
} from "./daily-task-dialogs";
import { TaskQuadrant } from "./task-quadrant";
import { TaskDialog } from "@/modules/hand/views/task-dialog";

export function DailyTaskList() {
  const { t } = useI18n();
  const vm = useDailyTaskCache();
  const [dialog, setDialog] = useState<"retrieve" | "create" | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "diagram">("list");
  const [menu, setMenu] = useState<{
    task: DailyTask;
    position: MenuPosition;
  } | null>(null);
  const [editing, setEditing] = useState<DailyTask | null>(null);
  const [subtaskParent, setSubtaskParent] = useState<TaskRecord | null>(null);
  if (!vm) return null;
  const openDailyTasks = vm.dailyTasks.filter((item) => !item.completed);
  const dailyTaskBySourceId = new Map(
    openDailyTasks.flatMap((item) =>
      item.sourceTaskId ? [[item.sourceTaskId, item] as const] : [],
    ),
  );
  const openSourceTasks = vm.tasks.filter((task) => dailyTaskBySourceId.has(task.id));
  const completed = vm.dailyTasks.filter((item) => item.completed).length;
  return (
    <>
      <SectionHeader
        title={t("me.dailyCache")}
        controls={
          <Tabs
            value={viewMode}
            onChange={setViewMode}
            items={[
              { value: "list", label: t("me.listView") },
              { value: "diagram", label: t("me.diagramView") },
            ]}
          />
        }
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
      <div className="mb-3 flex flex-wrap items-center justify-start gap-3">
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
      {viewMode === "diagram" ? (
        <TaskQuadrant
          tasks={openDailyTasks}
          coordinates={vm.coordinates}
          formulas={vm.profile.matrixFormulas}
        />
      ) : openSourceTasks.length ? (
        <div className="max-h-96 overflow-y-auto">
          <TaskHierarchyList
            tasks={openSourceTasks}
            onSetParent={vm.setTaskParent}
            onDragStart={(task, event) => {
              const item = dailyTaskBySourceId.get(task.id);
              if (!item) return;
              event.dataTransfer.setData("application/x-circo-daily-task", item.id);
              event.dataTransfer.setData("text/plain", item.id);
            }}
            renderTask={(task) => {
              const item = dailyTaskBySourceId.get(task.id);
              if (!item) return null;
              return (
                <TaskRow
                  title={item.title}
                  description={item.description}
                  status={vm.statusFor(item)}
                  dueAt={item.dueAt}
                  completedAt={item.completedAt}
                  estimatedMinutes={item.estimatedMinutes}
                  actualMinutes={item.actualMinutes ?? 0}
                  expectedOutput={item.expectedOutput}
                  deadlineInline
                  source={
                    item.sourceTaskId && item.projectId
                      ? `${t("me.fromProject")}: ${vm.projectName(item.projectId)}`
                      : t("me.independentTask")
                  }
                  onToggle={() => vm.toggle(item)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setMenu({
                      task: item,
                      position: { x: event.clientX, y: event.clientY },
                    });
                  }}
                />
              );
            }}
          />
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
      {menu && (
        <ContextMenu position={menu.position} onClose={() => setMenu(null)}>
          <ContextMenuItem
            disabled={menu.task.completed}
            onClick={() => {
              vm.setCompleted(menu.task, true);
              setMenu(null);
            }}
          >
            <CheckCircleIcon className="size-4" />
            {t("me.markComplete")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={!menu.task.completed}
            onClick={() => {
              vm.setCompleted(menu.task, false);
              setMenu(null);
            }}
          >
            <XCircleIcon className="size-4" />
            {t("me.markIncomplete")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={!menu.task.sourceTaskId}
            onClick={() => {
              const parent = menu.task.sourceTaskId
                ? vm.tasks.find((task) => task.id === menu.task.sourceTaskId)
                : undefined;
              if (parent) setSubtaskParent(parent);
              setMenu(null);
            }}
          >
            <PlusIcon className="size-4" />
            {t("hand.createSubtask")}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setEditing(menu.task);
              setMenu(null);
            }}
          >
            <PencilSquareIcon className="size-4" />
            {t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem
            danger
            onClick={() => {
              const task = menu.task;
              setMenu(null);
              if (window.confirm(t("common.confirmDelete"))) {
                vm.deleteTask(task.id);
              }
            }}
          >
            <TrashIcon className="size-4" />
            {t("common.delete")}
          </ContextMenuItem>
        </ContextMenu>
      )}
      {editing && (
        <CreateDailyTaskDialog
          key={editing.id}
          open
          title={t("common.edit")}
          initial={vm.inputFor(editing)}
          onClose={() => setEditing(null)}
          onSave={(input) => vm.updateTask(editing, input)}
        />
      )}
      {subtaskParent && (
        <TaskDialog
          key={`daily-subtask-${subtaskParent.id}`}
          open
          parentId={subtaskParent.id}
          onClose={() => setSubtaskParent(null)}
          onSave={(input) => vm.addSubtask(subtaskParent, input)}
        />
      )}
    </>
  );
}
