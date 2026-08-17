"use client";

import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { LibrarySortControls } from "@/shared/components/library-sort-controls";
import { TableLibraryWorkspace } from "@/shared/components/table-library-workspace";
import { Button, EmptyState } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { TaskList, TaskRecord } from "@/shared/model/entities";
import {
  type TaskSort,
  useTaskLibrary,
} from "../view-models/use-task-library";
import { ChooseTaskListDialog, TaskListDialog } from "./task-library-dialogs";
import { TaskLibrarySidebar } from "./task-library-sidebar";
import { TaskLibraryTable } from "./task-library-table";
import {
  TaskLibraryActions,
  type TaskLibraryMenu,
} from "./task-library-actions";
import { taskInput } from "./project-task-actions";
import { TaskDialog } from "./task-dialog";

export function StuffView() {
  const { t } = useI18n();
  const library = useTaskLibrary();
  const [listDialog, setListDialog] = useState<"create" | "choose" | null>(
    null,
  );
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TaskRecord | null>(null);
  const [menu, setMenu] = useState<TaskLibraryMenu>(null);
  const [addingIds, setAddingIds] = useState<string[]>([]);
  const selectionMode = library.selectedIds.length > 0;
  const sortAscending = library.sortDirection === "ascending";
  return (
    <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-5 xl:grid-cols-[240px_minmax(0,1fr)] xl:grid-rows-1">
      <div className="space-y-3">
        <TaskLibrarySidebar
          library={library}
          onCreate={() => setListDialog("create")}
          onEdit={setEditingList}
        />
      </div>
      <TableLibraryWorkspace
        title={
          library.selectedList?.system
            ? t(`hand.taskList.${library.selectedList.system}`)
            : library.selectedList?.name || t("hand.taskLists")
        }
        controls={
          <LibrarySortControls
            label={t("hand.sortBy")}
            value={library.sortBy}
            options={[
              { value: "dueDate", label: t("me.due") },
              { value: "importance", label: t("me.importance") },
              { value: "title", label: t("common.title") },
              { value: "startDate", label: t("hand.startDate") },
            ]}
            ascending={sortAscending}
            directionLabel={t(
              sortAscending ? "hand.ascending" : "hand.descending",
            )}
            onChange={(value) => library.setSortBy(value as TaskSort)}
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
            {t("hand.newTask")}
          </Button>
        }
        selectionLabel={
          selectionMode
            ? t("hand.selectedTasksCount").replace(
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
              onClick={() => setAddingIds(library.selectedIds)}
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
        {library.tasks.length ? (
          <TaskLibraryTable
            library={library}
            selectionMode={selectionMode}
            onEnterSelection={(task) => library.setSelectedIds([task.id])}
            onEdit={setEditing}
            onOpenMenu={(task, position) => setMenu({ task, position })}
          />
        ) : (
          <EmptyState
            title={t("common.noData")}
            description={t("hand.stuffEmptyHint")}
          />
        )}
      </TableLibraryWorkspace>

      <TaskDialog
        key="new-stuff-task"
        open={creating}
        projects={library.projects}
        onClose={() => setCreating(false)}
        onSave={(input, projectId) => library.createTask(input, projectId)}
      />
      {editing && (
        <TaskDialog
          key={`edit-stuff-task-${editing.id}`}
          open
          edit
          taskId={editing.id}
          initial={taskInput(editing)}
          onClose={() => setEditing(null)}
          onSave={(input) => library.updateTask(editing.id, input)}
        />
      )}
      {listDialog === "create" && (
        <TaskListDialog
          onClose={() => setListDialog(null)}
          onSave={library.createList}
        />
      )}
      {editingList && (
        <TaskListDialog
          key={editingList.id}
          list={editingList}
          onClose={() => setEditingList(null)}
          onSave={(input) => library.updateList(editingList.id, input)}
        />
      )}
      {addingIds.length > 0 && (
        <ChooseTaskListDialog
          lists={library.lists.filter((list) => !list.system)}
          onClose={() => setAddingIds([])}
          onChoose={(id) => {
            library.addToList(addingIds, id);
            setAddingIds([]);
          }}
        />
      )}
      <TaskLibraryActions
        library={library}
        menu={menu}
        onClose={() => setMenu(null)}
        onEdit={setEditing}
        onAddToList={(task) => setAddingIds([task.id])}
      />
    </div>
  );
}
