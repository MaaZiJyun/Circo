"use client";

import { useState } from "react";
import {
  ArrowsRightLeftIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/shared/components/context-menu";
import { Button, Dialog, Field, Select } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectRecord, ActivityRecord } from "@/shared/model/entities";
import type { useTaskLibrary } from "../view-models/use-task-library";
import { isArchivedTask } from "@/shared/model/task-archive";
import { RecurringTaskDeleteDialog } from "@/shared/components/recurring-task-delete-dialog";
import type { RecurringDeleteMode } from "@/shared/model/task-recurrence";

export type TaskLibraryMenu = {
  task: ActivityRecord;
  position: MenuPosition;
} | null;

export function TaskLibraryActions({
  library,
  menu,
  onClose,
  onEdit,
  onAddToList,
}: {
  library: ReturnType<typeof useTaskLibrary>;
  menu: TaskLibraryMenu;
  onClose: () => void;
  onEdit: (task: ActivityRecord) => void;
  onAddToList: (task: ActivityRecord) => void;
}) {
  const { t } = useI18n();
  const [assigning, setAssigning] = useState<ActivityRecord | null>(null);
  const [deleting, setDeleting] = useState<ActivityRecord | null>(null);
  const task = menu?.task;
  const locked = task ? isArchivedTask(task) : false;
  const canRemoveFromList = Boolean(
    task &&
      !task.projectId &&
      library.selectedList?.system === null &&
      (task.listIds ?? []).includes(library.activeListId),
  );
  return (
    <>
      {menu && task && (
        <ContextMenu position={menu.position} onClose={onClose}>
          <ContextMenuItem
            disabled={locked}
            onClick={() => {
              onEdit(task);
              onClose();
            }}
          >
            <PencilSquareIcon className="size-4" />
            {t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={locked}
            onClick={() => {
              setAssigning(task);
              onClose();
            }}
          >
            <ArrowsRightLeftIcon className="size-4" />
            {t("hand.assignProject")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={Boolean(task.projectId) || locked}
            onClick={() => {
              onAddToList(task);
              onClose();
            }}
          >
            <PlusIcon className="size-4" />
            {t("hand.addToList")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={!canRemoveFromList}
            onClick={() => {
              library.removeFromList([task.id]);
              onClose();
            }}
          >
            <TrashIcon className="size-4" />
            {t("hand.removeFromList")}
          </ContextMenuItem>
          {task.archivedAt ? (
            <ContextMenuItem onClick={() => { library.unarchiveTask(task.id); onClose(); }}>
              <ArchiveBoxIcon className="size-4" />
              {t("common.unarchive")}
            </ContextMenuItem>
          ) : (
            <ContextMenuItem onClick={() => { library.archiveTask(task.id); onClose(); }}>
              <ArchiveBoxIcon className="size-4" />
              {t("common.archive")}
            </ContextMenuItem>
          )}
          <ContextMenuItem
            disabled={locked}
            danger
            onClick={() => {
              const id = task.id;
              onClose();
              if (task.recurrence) setDeleting(task);
              else if (window.confirm(t("common.confirmDelete")))
                library.deleteTask(id);
            }}
          >
            <TrashIcon className="size-4" />
            {t("common.delete")}
          </ContextMenuItem>
        </ContextMenu>
      )}
      {assigning && (
        <TaskAssignDialog
          key={`assign-task-${assigning.id}`}
          task={assigning}
          projects={library.projects}
          onClose={() => setAssigning(null)}
          onAssign={(projectId) => library.moveTask(assigning.id, projectId)}
        />
      )}
      {deleting && (
        <RecurringTaskDeleteDialog
          task={deleting}
          onClose={() => setDeleting(null)}
          onDelete={(mode: RecurringDeleteMode) => {
            library.deleteTask(deleting.id, mode);
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}

function TaskAssignDialog({
  task,
  projects,
  onClose,
  onAssign,
}: {
  task: ActivityRecord;
  projects: ProjectRecord[];
  onClose: () => void;
  onAssign: (projectId?: string) => void;
}) {
  const { t } = useI18n();
  const [projectId, setProjectId] = useState(task.projectId ?? "");
  return (
    <Dialog
      open
      title={t("hand.assignProject")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <p className="text-sm text-zinc-500">{task.title}</p>
        <Field label={t("hand.targetProject")}>
          <Select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">{t("hand.noProject")}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>
        <Button
          onClick={() => {
            onAssign(projectId || undefined);
            onClose();
          }}
        >
          {t("common.save")}
        </Button>
      </div>
    </Dialog>
  );
}
