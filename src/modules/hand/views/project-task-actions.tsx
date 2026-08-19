"use client";

import { useState } from "react";
import { ArrowsRightLeftIcon, DocumentDuplicateIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ContextMenu, ContextMenuItem, type MenuPosition } from "@/shared/components/context-menu";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { TaskRecord } from "@/shared/model/entities";
import type { TaskInput } from "../view-models/use-hand-view-model";
import { useHandViewModel } from "../view-models/use-hand-view-model";
import { TaskDialog } from "./hand-dialogs";
import { TaskMoveDialog } from "./task-move-dialog";
import { today } from "@/shared/model/factories";

export type TaskMenu = { task: TaskRecord; position: MenuPosition } | null;
export const isLockedCompletedPastTask = (task: TaskRecord) =>
  task.status === "done" && task.dueDate.slice(0, 10) < today();
export const taskInput = (task: TaskRecord): TaskInput => ({
  title: task.title, description: task.description, startDate: task.startDate, dueDate: task.dueDate,
  expectedOutput: task.expectedOutput, milestone: task.milestone,
  importance: task.importance,
  impact: task.impact, goal: task.goal, risk: task.risk, value: task.value,
  delayLoss: task.delayLoss, dependencyIds: task.dependencyIds,
  complexity: task.complexity, uncertainty: task.uncertainty,
  recurrence: task.recurrence,
  parentId: task.parentId,
});

export function ProjectTaskActions({
  vm, menu, onClose,
  onCreateSubtask,
}: {
  vm: ReturnType<typeof useHandViewModel>;
  menu: TaskMenu;
  onClose: () => void;
  onCreateSubtask: (task: TaskRecord) => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<TaskRecord | null>(null);
  const [moving, setMoving] = useState<TaskRecord | null>(null);
  const locked = menu ? isLockedCompletedPastTask(menu.task) : false;
  return (
    <>
      {menu && (
        <ContextMenu position={menu.position} onClose={onClose}>
          <ContextMenuItem disabled={locked} onClick={() => { setEditing(menu.task); onClose(); }}>
            <PencilSquareIcon className="size-4" />{t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => { onCreateSubtask(menu.task); onClose(); }}>
            <PlusIcon className="size-4" />{t("hand.createSubtask")}
          </ContextMenuItem>
          <ContextMenuItem disabled={locked || vm.projects.length < 2} onClick={() => { setMoving(menu.task); onClose(); }}>
            <ArrowsRightLeftIcon className="size-4" />{t("hand.moveTask")}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => { vm.duplicateTask(menu.task); onClose(); }}>
            <DocumentDuplicateIcon className="size-4" />{t("common.duplicate")}
          </ContextMenuItem>
          <ContextMenuItem danger onClick={() => {
            const task = menu.task;
            onClose();
            if (window.confirm(t("common.confirmDelete"))) vm.deleteTask(task.id);
          }}>
            <TrashIcon className="size-4" />{t("common.delete")}
          </ContextMenuItem>
        </ContextMenu>
      )}
      {editing && (
        <TaskDialog key={`edit-task-${editing.id}`} open edit taskId={editing.id} initial={taskInput(editing)}
          onClose={() => setEditing(null)}
          onSave={(input) => vm.updateTask(editing.id, input)} />
      )}
      {moving && (
        <TaskMoveDialog key={`move-task-${moving.id}`} task={moving} projects={vm.projects}
          onClose={() => setMoving(null)}
          onMove={(projectId) => vm.moveTask(moving.id, projectId)} />
      )}
    </>
  );
}
