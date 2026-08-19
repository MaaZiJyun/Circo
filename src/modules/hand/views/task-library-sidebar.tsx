"use client";

import {
  BriefcaseIcon,
  FolderIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { ListSidebar } from "@/shared/components/list-sidebar";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { TaskList } from "@/shared/model/entities";
import type { useTaskLibrary } from "../view-models/use-task-library";

export function TaskLibrarySidebar({
  library,
  onCreate,
  onEdit,
}: {
  library: ReturnType<typeof useTaskLibrary>;
  onCreate: () => void;
  onEdit: (list: TaskList) => void;
}) {
  const { t } = useI18n();
  return (
    <ListSidebar
      title={t("hand.taskLists")}
      createLabel={t("hand.createList")}
      editLabel={t("common.edit")}
      deleteLabel={t("hand.deleteList")}
      confirmDeleteLabel={t("hand.confirmDeleteTaskList")}
      lists={library.lists}
      activeId={library.activeListId}
      note={library.selectedList?.note}
      onSelect={library.selectList}
      onCreate={onCreate}
      onEdit={onEdit}
      onDelete={(id) => library.deleteList(id)}
      getLabel={(list) =>
        list.system ? t(`hand.taskList.${list.system}`) : list.name
      }
      getCount={(list) =>
        list.system === "default"
          ? library.allTasks.length
          : list.system === "formal"
            ? library.formalTasks.length
            : list.system === "casual"
              ? library.casualTasks.length
              : library.casualTasks.filter((task) =>
                  (task.listIds ?? []).includes(list.id),
                ).length
      }
      getIcon={(list) =>
        list.system === "formal" ? (
          <BriefcaseIcon className="size-4" />
        ) : list.system === "casual" ? (
          <FolderIcon className="size-4" />
        ) : (
          <Squares2X2Icon
            className="size-4"
            style={{
              color:
                library.activeListId !== list.id && !list.system
                  ? list.color
                  : undefined,
            }}
          />
        )
      }
      onDrop={(ids, listId) => library.addToList(ids, listId)}
      draggedIds={library.draggedIds}
      setDraggedIds={library.setDraggedIds}
    />
  );
}
