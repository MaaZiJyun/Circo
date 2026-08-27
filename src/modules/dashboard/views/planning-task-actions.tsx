"use client";

import { useState } from "react";
import { ArchiveBoxIcon, DocumentDuplicateIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/shared/components/context-menu";
import type { ActivityInput } from "@/modules/hand/view-models/use-hand-view-model";
import type { ActivityConditionDraft } from "@/shared/model/activity-conditions";
import type { ActivityCondition } from "@/shared/model/entities";
import { activityInput } from "@/modules/hand/view-models/use-project-task-actions";
import { TaskDialog } from "@/modules/hand/views/task-dialog";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ActivityRecord } from "@/shared/model/entities";
import { RecurringTaskDeleteDialog } from "@/shared/components/recurring-task-delete-dialog";
import type { RecurringDeleteMode } from "@/shared/model/task-recurrence";

export type PlanningTaskMenu = {
  task: ActivityRecord;
  position: MenuPosition;
} | null;

export function PlanningTaskActions({
  menu,
  onClose,
  activityConditions,
  onUpdate,
  onDuplicate,
  onRemove,
  onCreate,
  onArchive,
}: {
  menu: PlanningTaskMenu;
  onClose: () => void;
  activityConditions: ActivityCondition[];
  onUpdate: (
    task: ActivityRecord,
    input: ActivityInput,
    conditions?: ActivityConditionDraft[],
  ) => void;
  onDuplicate: (task: ActivityRecord) => void;
  onRemove: (task: ActivityRecord, mode?: RecurringDeleteMode) => void;
  onCreate: (
    parent: ActivityRecord,
    input: ActivityInput,
    conditions?: ActivityConditionDraft[],
  ) => void;
  onArchive?: (task: ActivityRecord) => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<ActivityRecord | null>(null);
  const [creatingFor, setCreatingFor] = useState<ActivityRecord | null>(null);
  const [deleting, setDeleting] = useState<ActivityRecord | null>(null);
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
            disabled={Boolean(menu.task.archivedAt)}
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
            disabled={Boolean(menu.task.archivedAt)}
            onClick={() => {
              onArchive?.(menu.task);
              onClose();
            }}
          >
            <ArchiveBoxIcon className="size-4" />
            {t("common.archive")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={Boolean(menu.task.archivedAt)}
            danger
            onClick={() => {
              const task = menu.task;
              onClose();
              if (task.recurrence) setDeleting(task);
              else if (window.confirm(t("common.confirmDelete"))) onRemove(task);
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
          initial={activityInput(editing)}
          initialConditions={activityConditions.filter(
            (item) => item.activityId === editing.id,
          )}
          onClose={() => setEditing(null)}
          onSave={(input, _projectId, conditions) =>
            onUpdate(editing, input, conditions)
          }
        />
      )}
      {creatingFor && (
        <TaskDialog
          key={`new-subtask-${creatingFor.id}`}
          open
          parentId={creatingFor.id}
          onClose={() => setCreatingFor(null)}
          onSave={(input, _projectId, conditions) =>
            onCreate(creatingFor, input, conditions)
          }
        />
      )}
      {deleting && (
        <RecurringTaskDeleteDialog
          task={deleting}
          onClose={() => setDeleting(null)}
          onDelete={(mode) => {
            onRemove(deleting, mode);
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}
