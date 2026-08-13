"use client";

import { useState } from "react";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/modules/find/views/context-menu";
import type { TaskInput } from "@/modules/hand/view-models/use-hand-view-model";
import { TaskDialog } from "@/modules/hand/views/task-dialog";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { TaskRecord } from "@/shared/model/entities";

export type PlanningTaskMenu = {
  task: TaskRecord;
  position: MenuPosition;
} | null;

export function PlanningTaskActions({
  menu,
  onClose,
  onUpdate,
  onRemove,
}: {
  menu: PlanningTaskMenu;
  onClose: () => void;
  onUpdate: (task: TaskRecord, input: TaskInput) => void;
  onRemove: (task: TaskRecord) => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<TaskRecord | null>(null);
  return (
    <>
      {menu && (
        <ContextMenu position={menu.position} onClose={onClose}>
          <ContextMenuItem
            onClick={() => {
              setEditing(menu.task);
              onClose();
            }}
          >
            <PencilSquareIcon className="size-4" />
            {t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem
            danger
            onClick={() => {
              const task = menu.task;
              onClose();
              if (window.confirm(t("common.confirmDelete"))) onRemove(task);
            }}
          >
            <TrashIcon className="size-4" />
            {t("common.delete")}
          </ContextMenuItem>
        </ContextMenu>
      )}
      {editing && (
        <TaskDialog
          key={editing.id}
          open
          edit
          initial={taskInput(editing)}
          onClose={() => setEditing(null)}
          onSave={(input) => onUpdate(editing, input)}
        />
      )}
    </>
  );
}

function taskInput(task: TaskRecord): TaskInput {
  return {
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    estimatedMinutes: task.estimatedMinutes,
    expectedOutput: task.expectedOutput,
    milestone: task.milestone,
    importance: task.importance,
    recurrence: task.recurrence,
  };
}
