"use client";

import {
  FolderMinusIcon,
  FolderPlusIcon,
  LightBulbIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ReferencePoint } from "@/shared/model/entities";
import {
  ContextMenu,
  ContextMenuItem,
  MoveToTrashContextMenuItem,
  type MenuPosition,
} from "@/shared/components/context-menu";

export interface PointMenu {
  point: ReferencePoint;
  position: MenuPosition;
}

export function PointContextMenu({
  menu,
  canRemoveFromList,
  onClose,
  onEdit,
  onAddToList,
  onRemoveFromList,
  onDelete,
  onConvertToIdea,
}: {
  menu: PointMenu;
  canRemoveFromList: boolean;
  onClose: () => void;
  onEdit: () => void;
  onAddToList: () => void;
  onRemoveFromList: () => void;
  onDelete: () => void;
  onConvertToIdea: () => void;
}) {
  const { t } = useI18n();
  return (
    <ContextMenu position={menu.position} onClose={onClose}>
      <ContextMenuItem onClick={onEdit}>
        <PencilSquareIcon className="size-4" />
        {t("common.edit")}
      </ContextMenuItem>
      <ContextMenuItem onClick={onAddToList}>
        <FolderPlusIcon className="size-4" />
        {t("find.addPointToList")}
      </ContextMenuItem>
      <ContextMenuItem disabled={!canRemoveFromList} onClick={onRemoveFromList}>
        <FolderMinusIcon className="size-4" />
        {t("find.removeFromList")}
      </ContextMenuItem>
      <MoveToTrashContextMenuItem
        label={t("common.delete")}
        onMoveToTrash={onDelete}
      />
      <ContextMenuItem onClick={onConvertToIdea}>
        <LightBulbIcon className="size-4" />
        {t("find.pointToIdea")}
      </ContextMenuItem>
    </ContextMenu>
  );
}
