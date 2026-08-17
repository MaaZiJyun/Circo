"use client";
import { useState } from "react";
import {
  ArrowUturnLeftIcon,
  DocumentDuplicateIcon,
  FolderOpenIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/modules/find/views/context-menu";
import { LibrarySortControls } from "@/shared/components/library-sort-controls";
import { TableLibraryWorkspace } from "@/shared/components/table-library-workspace";
import { Button, EmptyState, Tabs } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectList, ProjectRecord, TaskList } from "@/shared/model/entities";
import { useHandViewModel } from "../view-models/use-hand-view-model";
import {
  type ProjectSort,
  useProjectLibrary,
} from "../view-models/use-project-library";
import { useTaskLibrary } from "../view-models/use-task-library";
import { AttachmentDialog } from "./attachment-dialog";
import { ProjectDialog, TaskDialog } from "./hand-dialogs";
import { ProjectLogEditor } from "./project-log-editor";
import {
  ChooseProjectListDialog,
  ProjectListDialog,
} from "./project-list-dialogs";
import { ProjectSidebar } from "./project-sidebar";
import { ProjectTable } from "./project-table";
import { ProjectWorkspace, type ProjectSection } from "./project-workspace";
import { projectInputFromRecord } from "./project-record-input";
import { ProjectTaskActions, type TaskMenu } from "./project-task-actions";
import { StuffView } from "./stuff-view";
import { TaskLibrarySidebar } from "./task-library-sidebar";
import { TaskListDialog } from "./task-library-dialogs";
type DetailDialog = "task" | "log" | "attachment" | null;
type ProjectMenu = { project: ProjectRecord; position: MenuPosition } | null;
export function HandView() {
  const { t } = useI18n();
  const vm = useHandViewModel();
  const library = useProjectLibrary();
  const taskLibrary = useTaskLibrary();
  const [viewing, setViewing] = useState(false);
  const [viewMode, setViewMode] = useState<"project" | "stuff">("project");
  const [projectSection, setProjectSection] =
    useState<ProjectSection>("overview");
  const [dialog, setDialog] = useState<DetailDialog>(null);
  const [taskParentId, setTaskParentId] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ProjectRecord | null>(null);
  const [menu, setMenu] = useState<ProjectMenu>(null);
  const [taskMenu, setTaskMenu] = useState<TaskMenu>(null);
  const [listDialog, setListDialog] = useState<"create" | "choose" | null>(
    null,
  );
  const [editingList, setEditingList] = useState<ProjectList | null>(null);
  const [taskListDialog, setTaskListDialog] = useState<"create" | null>(null);
  const [editingTaskList, setEditingTaskList] = useState<TaskList | null>(null);
  const selectionMode = library.selectedIds.length > 0;
  const sortAscending = library.sortDirection === "ascending";
  const openProject = (project: ProjectRecord) => {
    vm.setSelectedId(project.id);
    setProjectSection("overview");
    setViewing(true);
  };
  const removeProject = (project: ProjectRecord) => {
    setMenu(null);
    if (window.confirm(t("common.confirmDelete"))) vm.deleteProject(project.id);
  };
  const openTaskDialog = (parentId?: string) => {
    setTaskParentId(parentId);
    setDialog("task");
  };
  return (
    <div className="h-full space-y-6">
      {!viewing ? (
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 xl:grid-cols-[240px_minmax(0,1fr)] xl:grid-rows-1">
          <div className="space-y-3">
            <Tabs
              value={viewMode}
              onChange={setViewMode}
              items={[
                { value: "project", label: t("hand.projectsTab") },
                { value: "stuff", label: t("hand.stuffTab") },
              ]}
            />
            {viewMode === "project" ? (
              <ProjectSidebar
                library={library}
                onCreate={() => setListDialog("create")}
                onEdit={setEditingList}
              />
            ) : (
              <TaskLibrarySidebar
                library={taskLibrary}
                onCreate={() => setTaskListDialog("create")}
                onEdit={setEditingTaskList}
              />
            )}
          </div>
          {viewMode === "project" ? (
            <TableLibraryWorkspace
                title={
                  library.selectedList?.system
                    ? t(`hand.list.${library.selectedList.system}`)
                    : library.selectedList?.name || t("hand.projectLibrary")
                }
                controls={
                  <LibrarySortControls
                    label={t("hand.sortBy")}
                    value={library.sortBy}
                    options={[
                      { value: "startDate", label: t("hand.startDate") },
                      { value: "endDate", label: t("hand.endDate") },
                      { value: "score", label: t("hand.projectScore") },
                    ]}
                    ascending={sortAscending}
                    directionLabel={t(
                      sortAscending ? "hand.ascending" : "hand.descending",
                    )}
                    onChange={(value) =>
                      library.setSortBy(value as ProjectSort)
                    }
                    onToggleDirection={() =>
                      library.setSortDirection(
                        sortAscending ? "descending" : "ascending",
                      )
                    }
                  />
                }
                action={
                  <Button
                    className="whitespace-nowrap"
                    onClick={() => setCreating(true)}
                  >
                    <PlusIcon className="size-4" />
                    {t("hand.newProject")}
                  </Button>
                }
                selectionLabel={
                  selectionMode
                    ? t("hand.selectedCount").replace(
                        "{count}",
                        String(library.selectedIds.length),
                      )
                    : undefined
                }
                onCancelSelection={
                  selectionMode ? () => library.setSelectedIds([]) : undefined
                }
                selectionActions={
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setListDialog("choose")}
                    >
                      {t("hand.addToList")}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={library.selectedList?.system !== null}
                      onClick={library.removeFromCurrentList}
                    >
                      {t("hand.removeFromList")}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() =>
                        window.confirm(t("common.confirmDelete")) &&
                        library.deleteSelected()
                      }
                    >
                      {t("common.delete")}
                    </Button>
                  </>
                }
              >
                {library.projects.length ? (
                  <ProjectTable
                    library={library}
                    selectionMode={selectionMode}
                    onEnterSelection={(project) =>
                      library.setSelectedIds([project.id])
                    }
                    onOpen={openProject}
                    onOpenMenu={(project, position) =>
                      setMenu({ project, position })
                    }
                  />
                ) : (
                  <EmptyState
                    title={t("common.noData")}
                    description={t("hand.projectGateHint")}
                  />
                )}
              </TableLibraryWorkspace>
          ) : (
            <StuffView library={taskLibrary} />
          )}
        </div>
      ) : vm.selected ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 p-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="rounded-xl"
                onClick={() => setViewing(false)}
              >
                <ArrowUturnLeftIcon className="size-4" />
                {t("hand.back")}
              </Button>

              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold">
                  {vm.selected.name}
                </h1>
                <p className="mt-1 text-xs text-zinc-500">
                  {vm.selected.status.toUpperCase()}
                </p>
              </div>
            </div>
            <Tabs
              value={projectSection}
              onChange={setProjectSection}
              items={[
                { value: "overview", label: t("hand.projectOverview") },
                { value: "plan", label: t("hand.timeline") },
                { value: "logs", label: t("hand.logs") },
                { value: "attachments", label: t("hand.attachments") },
              ]}
            />
          </div>
          <ProjectWorkspace
            vm={vm}
            openDialog={setDialog}
            onOpenTaskMenu={(task, position) => setTaskMenu({ task, position })}
            onEditProject={() => {
              if (vm.selected) setEditing(vm.selected);
            }}
            section={projectSection}
          />
        </>
      ) : null}
      {creating && (
        <ProjectDialog
          key="create-project"
          open
          onClose={() => setCreating(false)}
          onSave={vm.addProject}
        />
      )}
      {editing && (
        <ProjectDialog
          key={`edit-project-${editing.id}`}
          open
          edit
          initial={projectInputFromRecord(editing)}
          onClose={() => setEditing(null)}
          onSave={(input) => vm.updateProjectById(editing.id, input)}
        />
      )}
      {listDialog === "create" && (
        <ProjectListDialog
          onClose={() => setListDialog(null)}
          onSave={library.createList}
        />
      )}
      {editingList && (
        <ProjectListDialog
          key={editingList.id}
          list={editingList}
          onClose={() => setEditingList(null)}
          onSave={(input) => library.updateList(editingList.id, input)}
        />
      )}
      {taskListDialog === "create" && (
        <TaskListDialog
          onClose={() => setTaskListDialog(null)}
          onSave={taskLibrary.createList}
        />
      )}
      {editingTaskList && (
        <TaskListDialog
          key={editingTaskList.id}
          list={editingTaskList}
          onClose={() => setEditingTaskList(null)}
          onSave={(input) =>
            taskLibrary.updateList(editingTaskList.id, input)
          }
        />
      )}
      {listDialog === "choose" && (
        <ChooseProjectListDialog
          lists={library.lists.filter((item) => !item.system)}
          onClose={() => setListDialog(null)}
          onChoose={(id) => library.addToList(library.selectedIds, id)}
        />
      )}
      <TaskDialog
        key={`new-task-${vm.selected?.id ?? "none"}-${taskParentId ?? "root"}`}
        open={dialog === "task"}
        parentId={taskParentId}
        defaultImportance={vm.selected?.score ?? 50}
        onClose={() => {
          setDialog(null);
          setTaskParentId(undefined);
        }}
        onSave={vm.addTask}
      />
      {dialog === "log" && vm.selected && (
        <ProjectLogEditor
          key={`new-log-${vm.selected.id}`}
          open
          projectId={vm.selected.id}
          onClose={() => setDialog(null)}
          onSave={vm.addLog}
        />
      )}
      <AttachmentDialog
        open={dialog === "attachment"}
        onClose={() => setDialog(null)}
        onSave={vm.addAttachment}
      />
      {menu && (
        <ContextMenu position={menu.position} onClose={() => setMenu(null)}>
          <ContextMenuItem
            onClick={() => {
              openProject(menu.project);
              setMenu(null);
            }}
          >
            <FolderOpenIcon className="size-4" />
            {t("hand.openProject")}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setEditing(menu.project);
              setMenu(null);
            }}
          >
            <PencilSquareIcon className="size-4" />
            {t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              vm.duplicateProject(menu.project);
              setMenu(null);
            }}
          >
            <DocumentDuplicateIcon className="size-4" />
            {t("common.duplicate")}
          </ContextMenuItem>
          <ContextMenuItem danger onClick={() => removeProject(menu.project)}>
            <TrashIcon className="size-4" />
            {t("common.delete")}
          </ContextMenuItem>
        </ContextMenu>
      )}
      <ProjectTaskActions
        vm={vm}
        menu={taskMenu}
        onClose={() => setTaskMenu(null)}
        onCreateSubtask={(task) => openTaskDialog(task.id)}
      />
    </div>
  );
}
