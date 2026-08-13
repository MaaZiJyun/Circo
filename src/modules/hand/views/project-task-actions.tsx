"use client";

import { useState } from "react";
import { ArrowsRightLeftIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ContextMenu, ContextMenuItem, type MenuPosition } from "@/modules/find/views/context-menu";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { TaskRecord } from "@/shared/model/entities";
import type { TaskInput } from "../view-models/use-hand-view-model";
import { useHandViewModel } from "../view-models/use-hand-view-model";
import { TaskDialog } from "./hand-dialogs";
import { TaskMoveDialog } from "./task-move-dialog";

export type TaskMenu = { task: TaskRecord; position: MenuPosition } | null;
const taskInput = (task: TaskRecord): TaskInput => ({
  title: task.title, description: task.description, dueDate: task.dueDate,
  estimatedMinutes: task.estimatedMinutes,
  expectedOutput: task.expectedOutput, milestone: task.milestone,
  importance: task.importance,
  recurrence: task.recurrence,
});

export function ProjectTaskActions({
  vm, menu, onClose,
}: {
  vm: ReturnType<typeof useHandViewModel>;
  menu: TaskMenu;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<TaskRecord | null>(null);
  const [moving, setMoving] = useState<TaskRecord | null>(null);
  return (
    <>
      {menu && (
        <ContextMenu position={menu.position} onClose={onClose}>
          <ContextMenuItem onClick={() => { setEditing(menu.task); onClose(); }}>
            <PencilSquareIcon className="size-4" />{t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem disabled={vm.projects.length < 2} onClick={() => { setMoving(menu.task); onClose(); }}>
            <ArrowsRightLeftIcon className="size-4" />{t("hand.moveTask")}
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
        <TaskDialog key={editing.id} open edit initial={taskInput(editing)}
          onClose={() => setEditing(null)}
          onSave={(input) => vm.updateTask(editing.id, input)} />
      )}
      {moving && (
        <TaskMoveDialog key={moving.id} task={moving} projects={vm.projects}
          onClose={() => setMoving(null)}
          onMove={(projectId) => vm.moveTask(moving.id, projectId)} />
      )}
    </>
  );
}
