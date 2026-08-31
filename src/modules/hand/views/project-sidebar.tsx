"use client";

import { ClockIcon, FolderIcon } from "@heroicons/react/24/outline";
import { ListSidebar } from "@/shared/components/list-sidebar";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectList } from "@/shared/model/entities";
import type { useProjectLibrary } from "../view-models/use-project-library";

export function ProjectSidebar({
  library,
  onCreate,
  onEdit,
}: {
  library: ReturnType<typeof useProjectLibrary>;
  onCreate: () => void;
  onEdit: (list: ProjectList) => void;
}) {
  const { t } = useI18n();
  return (
    <ListSidebar
      title={t("hand.lists")}
      createLabel={t("hand.createList")}
      editLabel={t("common.edit")}
      deleteLabel={t("hand.deleteList")}
      confirmDeleteLabel={t("hand.confirmDeleteList")}
      lists={library.lists}
      activeId={library.activeListId}
      note={library.selectedList?.note}
      onSelect={library.selectList}
      onCreate={onCreate}
      onEdit={onEdit}
      onDelete={(id) => library.deleteList(id)}
      getLabel={(list) =>
        list.system ? t(`hand.list.${list.system}`) : list.name
      }
      getCount={(list) =>
        list.system === "default"
          ? library.allProjects.length
          : list.system === "recent"
            ? library.recentProjects.length
            : library.allProjects.filter((item) =>
                item.listIds.includes(list.id),
              ).length
      }
      getIcon={(list) =>
        list.system === "recent" ? (
          <ClockIcon className="size-4" />
        ) : (
          <FolderIcon
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
