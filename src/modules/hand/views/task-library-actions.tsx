"use client";

import { useState } from "react";
import {
  ArrowsRightLeftIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/shared/components/context-menu";
import { Button, Dialog, Field, Select } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectRecord, TaskRecord } from "@/shared/model/entities";
import type { useTaskLibrary } from "../view-models/use-task-library";
import { isLockedCompletedPastTask } from "./project-task-actions";

export type TaskLibraryMenu = {
  task: TaskRecord;
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
  onEdit: (task: TaskRecord) => void;
  onAddToList: (task: TaskRecord) => void;
}) {
  const { t } = useI18n();
  const [assigning, setAssigning] = useState<TaskRecord | null>(null);
  const task = menu?.task;
  const locked = task ? isLockedCompletedPastTask(task) : false;
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
            disabled={Boolean(task.projectId)}
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
          <ContextMenuItem
            danger
            onClick={() => {
              const id = task.id;
              onClose();
              if (window.confirm(t("common.confirmDelete")))
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
    </>
  );
}

function TaskAssignDialog({
  task,
  projects,
  onClose,
  onAssign,
}: {
  task: TaskRecord;
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
