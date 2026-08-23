"use client";

import { useState } from "react";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { Button, Tabs } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectList, ProjectRecord, TaskList } from "@/shared/model/entities";
import { HandDialogSection } from "../sections/hand-dialog-section";
import { HandProjectLibrarySection } from "../sections/hand-library-section";
import { useHandViewModel } from "../view-models/use-hand-view-model";
import { useProjectLibrary } from "../view-models/use-project-library";
import { useTaskLibrary } from "../view-models/use-task-library";
import { ProjectSidebar, StuffView, TaskLibrarySidebar } from "../widgets";
import { ProjectWorkspace, type ProjectSection } from "./project-workspace";

type DetailDialog = "task" | "log" | "attachment" | null;
type ProjectMenu = Parameters<typeof HandDialogSection>[0]["menu"];
type TaskMenu = Parameters<typeof HandDialogSection>[0]["taskMenu"];

export function HandView() {
  const { t } = useI18n();
  const vm = useHandViewModel();
  const library = useProjectLibrary();
  const taskLibrary = useTaskLibrary();
  const [viewing, setViewing] = useState(false);
  const [viewMode, setViewMode] = useState<"project" | "stuff">("project");
  const [projectSection, setProjectSection] = useState<ProjectSection>("overview");
  const [dialog, setDialog] = useState<DetailDialog>(null);
  const [taskParentId, setTaskParentId] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ProjectRecord | null>(null);
  const [menu, setMenu] = useState<ProjectMenu>(null);
  const [taskMenu, setTaskMenu] = useState<TaskMenu>(null);
  const [listDialog, setListDialog] = useState<"create" | "choose" | null>(null);
  const [editingList, setEditingList] = useState<ProjectList | null>(null);
  const [taskListDialog, setTaskListDialog] = useState<"create" | null>(null);
  const [editingTaskList, setEditingTaskList] = useState<TaskList | null>(null);

  const openProject = (project: ProjectRecord) => {
    vm.setSelectedId(project.id);
    setProjectSection("overview");
    setViewing(true);
  };
  const removeProject = (project: ProjectRecord) => {
    setMenu(null);
    if (window.confirm(t("common.confirmDelete"))) vm.deleteProject(project.id);
  };
  const closeProjectDialog = () => {
    setCreating(false);
    setEditing(null);
    setMenu(null);
  };
  const closeTaskDialog = () => {
    setDialog(null);
    setTaskParentId(undefined);
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
            <HandProjectLibrarySection
              library={library}
              onCreate={() => setCreating(true)}
              onChooseList={() => setListDialog("choose")}
              onDeleteSelected={() => {
                if (window.confirm(t("common.confirmDelete"))) library.deleteSelected();
              }}
              onOpen={openProject}
              onOpenMenu={(project, position) => setMenu({ project, position })}
            />
          ) : (
            <StuffView library={taskLibrary} />
          )}
        </div>
      ) : vm.selected ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 p-2">
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="rounded-xl" onClick={() => setViewing(false)}>
                <ArrowUturnLeftIcon className="size-4" />
                {t("hand.back")}
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold">{vm.selected.name}</h1>
                <p className="mt-1 text-xs text-zinc-500">{vm.selected.status.toUpperCase()}</p>
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

      <HandDialogSection
        vm={vm}
        library={library}
        taskLibrary={taskLibrary}
        creating={creating}
        editing={editing}
        listDialog={listDialog}
        editingList={editingList}
        taskListDialog={taskListDialog}
        editingTaskList={editingTaskList}
        dialog={dialog}
        taskParentId={taskParentId}
        menu={menu}
        taskMenu={taskMenu}
        onCloseDialog={closeProjectDialog}
        onCloseTaskDialog={closeTaskDialog}
        onCloseLog={() => setDialog(null)}
        onCloseAttachment={() => setDialog(null)}
        onCloseList={() => {
          setListDialog(null);
          setEditingList(null);
        }}
        onCloseTaskList={() => {
          setTaskListDialog(null);
          setEditingTaskList(null);
        }}
        onOpenProject={openProject}
        onEditProject={setEditing}
        onRemoveProject={removeProject}
        onChooseList={(id) => library.addToList(library.selectedIds, id)}
        onCreateTask={openTaskDialog}
        onCloseTaskMenu={() => setTaskMenu(null)}
      />
    </div>
  );
}
