"use client";

import {
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  FolderMinusIcon,
  FolderPlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/shared/components/context-menu";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { SourceRecord } from "@/shared/model/entities";

export type LiteratureMenu = {
  source: SourceRecord;
  position: MenuPosition;
};

export function LiteratureContextMenu({
  menu,
  canRemoveFromList,
  onClose,
  onEdit,
  onAddToList,
  onRemoveFromList,
  onDelete,
  onError,
}: {
  menu: LiteratureMenu;
  canRemoveFromList: boolean;
  onClose: () => void;
  onEdit: () => void;
  onAddToList: () => void;
  onRemoveFromList: () => void;
  onDelete: () => void;
  onError: (message: string) => void;
}) {
  const { t } = useI18n();
  const source = menu.source;
  return (
    <ContextMenu position={menu.position} onClose={onClose}>
      <ContextMenuItem
        disabled={!source.fileToken}
        onClick={() => {
          window.open(
            `/api/files/${source.fileToken}`,
            "_blank",
            "noopener,noreferrer",
          );
          onClose();
        }}
      >
        <ArrowTopRightOnSquareIcon className="size-4" />
        {t("find.openOriginal")}
      </ContextMenuItem>
      <ContextMenuItem
        disabled={!source.citation.trim()}
        onClick={() => {
          onClose();
          const copy = navigator.clipboard?.writeText(source.citation);
          if (!copy) return onError(t("find.copyCitationFailed"));
          void copy.catch(() => onError(t("find.copyCitationFailed")));
        }}
      >
        <ClipboardDocumentIcon className="size-4" />
        {t("find.cite")}
      </ContextMenuItem>
      <ContextMenuItem onClick={onEdit}>
        <PencilSquareIcon className="size-4" />
        {t("common.edit")}
      </ContextMenuItem>
      <ContextMenuItem onClick={onAddToList}>
        <FolderPlusIcon className="size-4" />
        {t("find.addToList")}
      </ContextMenuItem>
      <ContextMenuItem disabled={!canRemoveFromList} onClick={onRemoveFromList}>
        <FolderMinusIcon className="size-4" />
        {t("find.removeFromList")}
      </ContextMenuItem>
      <ContextMenuItem danger onClick={onDelete}>
        <TrashIcon className="size-4" />
        {t("find.deleteOriginal")}
      </ContextMenuItem>
    </ContextMenu>
  );
}
