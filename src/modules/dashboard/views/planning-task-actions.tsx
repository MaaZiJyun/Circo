"use client";

import { useState } from "react";
import { DocumentDuplicateIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/shared/components/context-menu";
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
  onDuplicate,
  onRemove,
  onCreate,
}: {
  menu: PlanningTaskMenu;
  onClose: () => void;
  onUpdate: (task: TaskRecord, input: TaskInput) => void;
  onDuplicate: (task: TaskRecord) => void;
  onRemove: (task: TaskRecord) => void;
  onCreate: (parent: TaskRecord, input: TaskInput) => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<TaskRecord | null>(null);
  const [creatingFor, setCreatingFor] = useState<TaskRecord | null>(null);
  return (
    <>
      {menu && (
        <ContextMenu position={menu.position} onClose={onClose}>
          <ContextMenuItem
            onClick={() => {
              setCreatingFor(menu.task);
              onClose();
            }}
          >
            <PlusIcon className="size-4" />
            {t("hand.createSubtask")}
          </ContextMenuItem>
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
            onClick={() => {
              onDuplicate(menu.task);
              onClose();
            }}
          >
            <DocumentDuplicateIcon className="size-4" />
            {t("common.duplicate")}
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
      {creatingFor && (
        <TaskDialog
          key={`new-subtask-${creatingFor.id}`}
          open
          parentId={creatingFor.id}
          onClose={() => setCreatingFor(null)}
          onSave={(input) => onCreate(creatingFor, input)}
        />
      )}
    </>
  );
}

function taskInput(task: TaskRecord): TaskInput {
  return {
    title: task.title,
    description: task.description,
    startDate: task.startDate,
    dueDate: task.dueDate,
    expectedOutput: task.expectedOutput,
    milestone: task.milestone,
    importance: task.importance,
    impact: task.impact,
    goal: task.goal,
    risk: task.risk,
    value: task.value,
    delayLoss: task.delayLoss,
    dependencyIds: task.dependencyIds,
    complexity: task.complexity,
    uncertainty: task.uncertainty,
    recurrence: task.recurrence,
    parentId: task.parentId,
  };
}
