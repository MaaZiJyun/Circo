"use client";
import { useState } from "react";
import {
  ArrowLeftIcon,
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
import { Button, EmptyState, Select } from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectList, ProjectRecord } from "@/shared/model/entities";
import { useHandViewModel } from "../view-models/use-hand-view-model";
import {
  type ProjectSort,
  useProjectLibrary,
} from "../view-models/use-project-library";
import { AttachmentDialog } from "./attachment-dialog";
import { ProjectDialog, TaskDialog } from "./hand-dialogs";
import { ProjectLogEditor } from "./project-log-editor";
import {
  ChooseProjectListDialog,
  ProjectListDialog,
} from "./project-list-dialogs";
import { ProjectSidebar } from "./project-sidebar";
import { ProjectTable } from "./project-table";
import { ProjectWorkspace } from "./project-workspace";
import { projectInputFromRecord } from "./project-record-input";
import { ProjectTaskActions, type TaskMenu } from "./project-task-actions";

type DetailDialog = "task" | "log" | "attachment" | null;
type ProjectMenu = { project: ProjectRecord; position: MenuPosition } | null;

export function HandView() {
  const { t } = useI18n();
  const vm = useHandViewModel();
  const library = useProjectLibrary();
  const [viewing, setViewing] = useState(false);
  const [dialog, setDialog] = useState<DetailDialog>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ProjectRecord | null>(null);
  const [menu, setMenu] = useState<ProjectMenu>(null);
  const [taskMenu, setTaskMenu] = useState<TaskMenu>(null);
  const [listDialog, setListDialog] = useState<"create" | "choose" | null>(
    null,
  );
  const [editingList, setEditingList] = useState<ProjectList | null>(null);
  const selectionMode = library.selectedIds.length > 0;
  const sortAscending = library.sortDirection === "ascending";
  const openProject = (project: ProjectRecord) => {
    vm.setSelectedId(project.id);
    setViewing(true);
  };
  const removeProject = (project: ProjectRecord) => {
    setMenu(null);
    if (window.confirm(t("common.confirmDelete"))) vm.deleteProject(project.id);
  };

  return (
    <div className="space-y-8">
      {!viewing ? (
        <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
          <ProjectSidebar
            library={library}
            onCreate={() => setListDialog("create")}
            onEdit={setEditingList}
          />
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
                onChange={(value) => library.setSortBy(value as ProjectSort)}
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
        </div>
      ) : vm.selected ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Button variant="ghost" onClick={() => setViewing(false)}>
              <ArrowLeftIcon className="size-4" />
              {t("hand.backToProjects")}
            </Button>
            <label className="grid min-w-44 gap-1 text-sm font-medium">
              <span>{t("hand.projectStatus")}</span>
              <Select
                value={vm.selected.status}
                onChange={(event) =>
                  vm.updateProject({
                    status: event.target.value as ProjectRecord["status"],
                  })
                }
              >
                {[
                  "concept",
                  "planning",
                  "active",
                  "paused",
                  "completed",
                  "archived",
                ].map((item) => (
                  <option key={item} value={item}>
                    {t(statusLabels[item])}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <ProjectWorkspace
            vm={vm}
            openDialog={setDialog}
            onOpenTaskMenu={(task, position) => setTaskMenu({ task, position })}
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
          key={editing.id}
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
      {listDialog === "choose" && (
        <ChooseProjectListDialog
          lists={library.lists.filter((item) => !item.system)}
          onClose={() => setListDialog(null)}
          onChoose={(id) => library.addToList(library.selectedIds, id)}
        />
      )}
      <TaskDialog
        key={vm.selected?.id ?? "task"}
        open={dialog === "task"}
        defaultImportance={vm.selected?.score ?? 50}
        onClose={() => setDialog(null)}
        onSave={vm.addTask}
      />
      <ProjectLogEditor
        open={dialog === "log"}
        onClose={() => setDialog(null)}
        onSave={vm.addLog}
      />
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
      />
    </div>
  );
}
