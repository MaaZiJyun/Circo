"use client";

import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { LibrarySortControls } from "@/shared/components/library-sort-controls";
import { TableLibraryWorkspace } from "@/shared/components/table-library-workspace";
import { Button, EmptyState } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ActivityRecord } from "@/shared/model/entities";
import {
  type TaskSort,
  useTaskLibrary,
} from "../view-models/use-task-library";
import { ChooseListDialog } from "@/shared/components/list-dialogs";
import { TaskLibraryTable } from "./task-library-table";
import {
  TaskLibraryActions,
  type TaskLibraryMenu,
} from "./task-library-actions";
import { activityInput } from "../view-models/use-project-task-actions";
import { TaskDialog } from "./task-dialog";

export function StuffView({
  library,
}: {
  library: ReturnType<typeof useTaskLibrary>;
}) {
  const { t } = useI18n();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ActivityRecord | null>(null);
  const [menu, setMenu] = useState<TaskLibraryMenu>(null);
  const [addingIds, setAddingIds] = useState<string[]>([]);
  const selectionMode = library.selectedIds.length > 0;
  return (
    <>
      <TableLibraryWorkspace
        title={
          library.selectedList?.system
            ? t(`hand.taskList.${library.selectedList.system}`)
            : library.selectedList?.name || t("hand.taskLists")
        }
        controls={
          <LibrarySortControls
            label={t("hand.sortBy")}
            value={`${library.sortBy}:${library.sortDirection}`}
            options={[
              {
                value: "createdAt:ascending",
                label: t("hand.sortCreatedAscending"),
              },
              {
                value: "createdAt:descending",
                label: t("hand.sortCreatedDescending"),
              },
              { value: "dueDate:ascending", label: t("hand.sortDueAscending") },
              {
                value: "dueDate:descending",
                label: t("hand.sortDueDescending"),
              },
            ]}
            onChange={(value) => {
              const [sortBy, sortDirection] = value.split(":") as [
                TaskSort,
                typeof library.sortDirection,
              ];
              library.setSortBy(sortBy);
              library.setSortDirection(sortDirection);
            }}
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
        {library.activities.length ? (
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
        key={`new-stuff-task-${creating ? "open" : "closed"}`}
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
          initial={activityInput(editing)}
          onClose={() => setEditing(null)}
          onSave={(input) => library.updateTask(editing.id, input)}
        />
      )}
      {addingIds.length > 0 && (
        <ChooseListDialog
          title={t("hand.addToList")}
          emptyLabel={t("hand.noCustomTaskLists")}
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
    </>
  );
}
