"use client";

import {
  DocumentDuplicateIcon,
  FolderOpenIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/shared/components/context-menu";
import { ChooseListDialog, ListFormDialog } from "@/shared/components/list-dialogs";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectList, ProjectRecord, TaskList } from "@/shared/model/entities";
import type { useHandViewModel } from "../view-models/use-hand-view-model";
import type { useProjectLibrary } from "../view-models/use-project-library";
import type { useTaskLibrary } from "../view-models/use-task-library";
import {
  AttachmentDialog,
  ProjectDialog,
  ProjectLogEditor,
  TaskDialog,
  ProjectTaskActions,
} from "../widgets";
import { projectInputFromRecord } from "../views/project-record-input";
import type { TaskMenu } from "../views/project-task-actions";

type HandViewModel = ReturnType<typeof useHandViewModel>;
type ProjectLibrary = ReturnType<typeof useProjectLibrary>;
type TaskLibrary = ReturnType<typeof useTaskLibrary>;
type ProjectMenu = { project: ProjectRecord; position: MenuPosition } | null;

export function HandDialogSection({
  vm,
  library,
  taskLibrary,
  creating,
  editing,
  listDialog,
  editingList,
  taskListDialog,
  editingTaskList,
  dialog,
  taskParentId,
  menu,
  taskMenu,
  onCloseDialog,
  onCloseTaskDialog,
  onCloseLog,
  onCloseAttachment,
  onCloseList,
  onCloseTaskList,
  onOpenProject,
  onEditProject,
  onRemoveProject,
  onChooseList,
  onCreateTask,
  onCloseTaskMenu,
}: {
  vm: HandViewModel;
  library: ProjectLibrary;
  taskLibrary: TaskLibrary;
  creating: boolean;
  editing: ProjectRecord | null;
  listDialog: "create" | "choose" | null;
  editingList: ProjectList | null;
  taskListDialog: "create" | null;
  editingTaskList: TaskList | null;
  dialog: "task" | "log" | "attachment" | null;
  taskParentId?: string;
  menu: ProjectMenu;
  taskMenu: TaskMenu;
  onCloseDialog: () => void;
  onCloseTaskDialog: () => void;
  onCloseLog: () => void;
  onCloseAttachment: () => void;
  onCloseList: () => void;
  onCloseTaskList: () => void;
  onOpenProject: (project: ProjectRecord) => void;
  onEditProject: (project: ProjectRecord) => void;
  onRemoveProject: (project: ProjectRecord) => void;
  onChooseList: (id: string) => void;
  onCreateTask: (parentId?: string) => void;
  onCloseTaskMenu: () => void;
}) {
  const { t } = useI18n();
  return (
    <>
      {creating && (
        <ProjectDialog key="create-project" open onClose={onCloseDialog} onSave={vm.addProject} />
      )}
      {editing && (
        <ProjectDialog
          key={`edit-project-${editing.id}`}
          open
          edit
          initial={projectInputFromRecord(editing)}
          onClose={onCloseDialog}
          onSave={(input) => vm.updateProjectById(editing.id, input)}
        />
      )}
      {(listDialog === "create" || editingList) && (
        <ListFormDialog
          key={editingList?.id ?? "new-project-list"}
          title={editingList ? t("hand.editList") : t("hand.createList")}
          nameLabel={t("hand.listName")}
          noteLabel={t("hand.listNote")}
          colorLabel={t("hand.listColor")}
          initial={
            editingList
              ? { name: editingList.name, note: editingList.note, color: editingList.color, tags: [] }
              : undefined
          }
          onClose={onCloseList}
          onSave={({ name, note, color }) =>
            editingList
              ? library.updateList(editingList.id, { name, note, color })
              : library.createList({ name, note, color })
          }
        />
      )}
      {taskListDialog === "create" || editingTaskList ? (
        <ListFormDialog
          key={editingTaskList?.id ?? "new-task-list"}
          title={editingTaskList ? t("hand.editList") : t("hand.createList")}
          nameLabel={t("hand.listName")}
          noteLabel={t("hand.listNote")}
          colorLabel={t("hand.listColor")}
          initial={
            editingTaskList
              ? { name: editingTaskList.name, note: editingTaskList.note, color: editingTaskList.color, tags: [] }
              : undefined
          }
          onClose={onCloseTaskList}
          onSave={({ name, note, color }) =>
            editingTaskList
              ? taskLibrary.updateList(editingTaskList.id, { name, note, color })
              : taskLibrary.createList({ name, note, color })
          }
        />
      ) : null}
      {listDialog === "choose" && (
        <ChooseListDialog
          title={t("hand.addToList")}
          emptyLabel={t("hand.noCustomLists")}
          lists={library.lists.filter((item) => !item.system)}
          onClose={onCloseList}
          onChoose={onChooseList}
        />
      )}
      <TaskDialog
        key={`new-task-${vm.selected?.id ?? "none"}-${taskParentId ?? "root"}`}
        open={dialog === "task"}
        parentId={taskParentId}
        defaultImportance={vm.selected?.score ?? 50}
        onClose={onCloseTaskDialog}
        onSave={vm.addTask}
      />
      {dialog === "log" && vm.selected && (
        <ProjectLogEditor
          open
          projectId={vm.selected.id}
          onClose={onCloseLog}
          onSave={vm.addLog}
        />
      )}
      <AttachmentDialog
        open={dialog === "attachment"}
        onClose={onCloseAttachment}
        onSave={vm.addAttachment}
      />
      {menu && (
        <ContextMenu position={menu.position} onClose={onCloseDialog}>
          <ContextMenuItem onClick={() => { onOpenProject(menu.project); onCloseDialog(); }}>
            <FolderOpenIcon className="size-4" />
            {t("hand.openProject")}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => { onEditProject(menu.project); onCloseDialog(); }}>
            <PencilSquareIcon className="size-4" />
            {t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => { vm.duplicateProject(menu.project); onCloseDialog(); }}>
            <DocumentDuplicateIcon className="size-4" />
            {t("common.duplicate")}
          </ContextMenuItem>
          <ContextMenuItem danger onClick={() => onRemoveProject(menu.project)}>
            <TrashIcon className="size-4" />
            {t("common.delete")}
          </ContextMenuItem>
        </ContextMenu>
      )}
      <ProjectTaskActions
        vm={vm}
        menu={taskMenu}
        onClose={onCloseTaskMenu}
        onCreateSubtask={(task) => onCreateTask(task.id)}
      />
    </>
  );
}
