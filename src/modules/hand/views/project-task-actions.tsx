"use client";

import { useState } from "react";
import { ArrowsRightLeftIcon, DocumentDuplicateIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ContextMenu, ContextMenuItem, type MenuPosition } from "@/shared/components/context-menu";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ActivityRecord } from "@/shared/model/entities";
import { activityInput } from "../view-models/use-project-task-actions";
import { useHandViewModel } from "../view-models/use-hand-view-model";
import { TaskDialog } from "./hand-dialogs";
import { TaskMoveDialog } from "./task-move-dialog";
import { today } from "@/shared/model/factories";
import { isArchivedTask } from "@/shared/model/task-archive";
import { RecurringTaskDeleteDialog } from "@/shared/components/recurring-task-delete-dialog";
import type { RecurringDeleteMode } from "@/shared/model/task-recurrence";
import { ArchiveBoxIcon } from "@heroicons/react/24/outline";

export type TaskMenu = { task: ActivityRecord; position: MenuPosition } | null;
export const isLockedCompletedPastTask = (task: ActivityRecord) =>
  isArchivedTask(task) || (task.status === "done" && task.dueDate.slice(0, 10) < today());

export function ProjectTaskActions({
  vm, menu, onClose,
  onCreateSubtask,
}: {
  vm: ReturnType<typeof useHandViewModel>;
  menu: TaskMenu;
  onClose: () => void;
  onCreateSubtask: (task: ActivityRecord) => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<ActivityRecord | null>(null);
  const [moving, setMoving] = useState<ActivityRecord | null>(null);
  const [deleting, setDeleting] = useState<ActivityRecord | null>(null);
  const locked = menu ? isLockedCompletedPastTask(menu.task) : false;
  return (
    <>
      {menu && (
        <ContextMenu position={menu.position} onClose={onClose}>
          <ContextMenuItem disabled={locked} onClick={() => { setEditing(menu.task); onClose(); }}>
            <PencilSquareIcon className="size-4" />{t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem disabled={locked} onClick={() => { onCreateSubtask(menu.task); onClose(); }}>
            <PlusIcon className="size-4" />{t("hand.createSubtask")}
          </ContextMenuItem>
          <ContextMenuItem disabled={locked || vm.projects.length < 2} onClick={() => { setMoving(menu.task); onClose(); }}>
            <ArrowsRightLeftIcon className="size-4" />{t("hand.moveTask")}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => { vm.duplicateTask(menu.task); onClose(); }}>
            <DocumentDuplicateIcon className="size-4" />{t("common.duplicate")}
          </ContextMenuItem>
          <ContextMenuItem disabled={Boolean(menu.task.archivedAt)} onClick={() => { vm.archiveTask(menu.task.id); onClose(); }}>
            <ArchiveBoxIcon className="size-4" />{t("common.archive")}
          </ContextMenuItem>
          <ContextMenuItem disabled={locked} danger onClick={() => {
            const task = menu.task;
            onClose();
            if (task.recurrence) setDeleting(task);
            else if (window.confirm(t("common.confirmDelete"))) vm.deleteTask(task.id);
          }}>
            <TrashIcon className="size-4" />{t("common.delete")}
          </ContextMenuItem>
        </ContextMenu>
      )}
      {editing && (
        <TaskDialog key={`edit-task-${editing.id}`} open edit taskId={editing.id} initial={activityInput(editing)}
          initialConditions={vm.activityConditions.filter((item) => item.activityId === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(input, _projectId, conditions) => vm.updateTask(editing.id, input, conditions)} />
      )}
      {moving && (
        <TaskMoveDialog key={`move-task-${moving.id}`} task={moving} projects={vm.projects}
          onClose={() => setMoving(null)}
          onMove={(projectId) => vm.moveTask(moving.id, projectId)} />
      )}
      {deleting && (
        <RecurringTaskDeleteDialog
          task={deleting}
          onClose={() => setDeleting(null)}
          onDelete={(mode: RecurringDeleteMode) => {
            vm.deleteTask(deleting.id, mode);
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}
