"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/shared/components/page-elements";
import { Button } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { LibraryList, SourceRecord } from "@/shared/model/entities";
import { useFindViewModel } from "../view-models/use-find-view-model";
import { useLibraryManagement } from "../view-models/use-library-management";
import { ImportDialog } from "./find-dialogs";
import {
  ChooseListDialog,
  EditLiteratureDialog,
  ListDialog,
} from "./library-dialogs";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "./context-menu";
import { LibrarySidebar } from "./library-sidebar";
import { LiteratureTable } from "./literature-table";

export function FindView() {
  const { t } = useI18n();
  const find = useFindViewModel();
  const library = useLibraryManagement();
  const [dialog, setDialog] = useState<"import" | "list" | null>(null);
  const [editing, setEditing] = useState<SourceRecord | null>(null);
  const [editingList, setEditingList] = useState<LibraryList | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [addingIds, setAddingIds] = useState<string[]>([]);
  const [documentMenu, setDocumentMenu] = useState<{
    source: SourceRecord;
    position: MenuPosition;
  } | null>(null);
  const [operationError, setOperationError] = useState("");
  const customLists = library.lists.filter((item) => !item.system);
  const deleteSources = async (ids: string[]) => {
    if (!window.confirm(t("find.confirmDeleteFiles"))) return;
    setOperationError("");
    try {
      await library.deleteSources(ids);
    } catch (error) {
      setOperationError(
        error instanceof Error ? error.message : t("common.error"),
      );
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("find.eyebrow")}
        title={t("find.title")}
        subtitle={t("find.subtitle")}
        actions={
          <Button onClick={() => setDialog("import")}>
            <PlusIcon className="size-4" />
            {t("find.import")}
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <LibrarySidebar
          library={library}
          onCreate={() => setDialog("list")}
          onEdit={setEditingList}
        />
        <section className="min-w-0 space-y-3">
          <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">
                {library.selectedList?.system
                  ? t(`find.list.${library.selectedList.system}`)
                  : library.selectedList?.name}
              </h2>
              <p className="text-xs text-zinc-500">
                {t("find.literatureCount").replace(
                  "{count}",
                  String(library.sources.length),
                )}
              </p>
            </div>
            {selectionMode && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-zinc-500">
                  {t("find.selectedCount").replace(
                    "{count}",
                    String(library.selectedIds.length),
                  )}
                </span>
                <Button
                  variant="secondary"
                  disabled={!library.selectedIds.length}
                  onClick={() => setAddingIds(library.selectedIds)}
                >
                  {t("find.addToList")}
                </Button>
                <Button
                  variant="secondary"
                  disabled={library.selectedList?.system !== null}
                  onClick={library.removeFromCurrentList}
                >
                  <XMarkIcon className="size-4" />
                  {t("find.removeFromList")}
                </Button>
                <Button
                  variant="danger"
                  disabled={!library.selectedIds.length}
                  onClick={() => void deleteSources(library.selectedIds)}
                >
                  <TrashIcon className="size-4" />
                  {t("find.deleteOriginal")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectionMode(false);
                    library.setSelectedIds([]);
                  }}
                >
                  {t("common.close")}
                </Button>
              </div>
            )}
          </div>
          {operationError && (
            <p className="text-sm text-red-600">{operationError}</p>
          )}
          <LiteratureTable
            library={library}
            selectionMode={selectionMode}
            onEnterSelection={(source) => {
              setSelectionMode(true);
              library.setSelectedIds([source.id]);
            }}
            onOpenMenu={(source, position) =>
              setDocumentMenu({ source, position })
            }
          />
        </section>
      </div>
      <ImportDialog
        open={dialog === "import"}
        onClose={() => setDialog(null)}
        onImport={find.importSource}
      />
      <ListDialog
        open={dialog === "list"}
        onClose={() => setDialog(null)}
        onSave={library.createList}
      />
      {editingList && (
        <ListDialog
          key={editingList.id}
          open
          list={editingList}
          onClose={() => setEditingList(null)}
          onSave={(input) => library.updateList(editingList.id, input)}
        />
      )}
      <ChooseListDialog
        open={addingIds.length > 0}
        lists={customLists}
        onClose={() => setAddingIds([])}
        onChoose={(listId) => library.addToList(addingIds, listId)}
      />
      {editing && (
        <EditLiteratureDialog
          key={editing.id}
          source={editing}
          onClose={() => setEditing(null)}
          onSave={library.updateSource}
        />
      )}
      {documentMenu && (
        <ContextMenu
          position={documentMenu.position}
          onClose={() => setDocumentMenu(null)}
        >
          <ContextMenuItem
            onClick={() => {
              setEditing(documentMenu.source);
              setDocumentMenu(null);
            }}
          >
            {t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setAddingIds([documentMenu.source.id]);
              setDocumentMenu(null);
            }}
          >
            {t("find.addToList")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={library.selectedList?.system !== null}
            onClick={() => {
              library.removeFromList([documentMenu.source.id]);
              setDocumentMenu(null);
            }}
          >
            {t("find.removeFromList")}
          </ContextMenuItem>
          <ContextMenuItem
            danger
            onClick={() => {
              const id = documentMenu.source.id;
              setDocumentMenu(null);
              void deleteSources([id]);
            }}
          >
            {t("find.deleteOriginal")}
          </ContextMenuItem>
        </ContextMenu>
      )}
    </div>
  );
}
