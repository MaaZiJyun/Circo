"use client";

import { useState } from "react";
import { useI18n } from "@/shared/i18n/i18n-context";
import type {
  LibraryList,
  ReferencePoint,
  SourceRecord,
} from "@/shared/model/entities";
import { useFindViewModel } from "../view-models/use-find-view-model";
import { startReading } from "../model/reading-record";
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
import { LibraryWorkspace } from "./library-workspace";
import { ActiveLiteratureReader } from "./active-literature-reader";
import { FindModeSwitch, type FindMode } from "./find-mode-switch";
import { ReferenceSidebar, ReferenceWorkspace } from "./reference-workspace";
import { ReferencePointDialog } from "./reference-point-dialog";

export function FindView() {
  const { t } = useI18n();
  const find = useFindViewModel();
  const library = useLibraryManagement();
  const [dialog, setDialog] = useState<"import" | "list" | null>(null);
  const [editing, setEditing] = useState<SourceRecord | null>(null);
  const [reading, setReading] = useState<SourceRecord | null>(null);
  const [editingList, setEditingList] = useState<LibraryList | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [addingIds, setAddingIds] = useState<string[]>([]);
  const [documentMenu, setDocumentMenu] = useState<{
    source: SourceRecord;
    position: MenuPosition;
  } | null>(null);
  const [operationError, setOperationError] = useState("");
  const [mode, setMode] = useState<FindMode>("library");
  const [pointDialog, setPointDialog] = useState<ReferencePoint | "new" | null>(
    null,
  );
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
  if (reading)
    return (
      <ActiveLiteratureReader
        source={reading}
        onBack={() => setReading(null)}
        onUpdate={(change) => {
          library.updateSource(reading.id, change);
          setReading({ ...reading, ...change });
        }}
        pointCount={
          library.points.filter((point) => point.sourceId === reading.id).length
        }
        onCreatePoint={library.createPoint}
      />
    );
  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-3">
          <FindModeSwitch mode={mode} onChange={setMode} />
          {mode === "library" ? (
            <LibrarySidebar
              library={library}
              onCreate={() => setDialog("list")}
              onEdit={setEditingList}
            />
          ) : (
            <ReferenceSidebar points={library.points} />
          )}
        </div>
        {mode === "library" ? (
          <LibraryWorkspace
            library={library}
            selectionMode={selectionMode}
            operationError={operationError}
            onEnterSelection={(source) => {
              setSelectionMode(true);
              library.setSelectedIds([source.id]);
            }}
            onOpenMenu={(source, position) =>
              setDocumentMenu({ source, position })
            }
            onRead={(source) => {
              const started = startReading(source, new Date().toISOString());
              if (started !== source)
                library.updateSource(source.id, {
                  readingStartedAt: started.readingStartedAt,
                });
              setReading(started);
            }}
            onAddSelected={() => setAddingIds(library.selectedIds)}
            onDeleteSelected={() => void deleteSources(library.selectedIds)}
            onCloseSelection={() => {
              setSelectionMode(false);
              library.setSelectedIds([]);
            }}
            onImport={() => setDialog("import")}
          />
        ) : (
          <ReferenceWorkspace
            points={library.points}
            sources={library.allSources}
            onAdd={() => setPointDialog("new")}
            onEdit={setPointDialog}
            onDelete={(point) => {
              if (window.confirm(t("find.confirmDeletePoint")))
                library.deletePoint(point.id);
            }}
          />
        )}
      </div>
      <ImportDialog
        open={dialog === "import"}
        onClose={() => setDialog(null)}
        onImport={find.importSource}
      />
      {pointDialog && (
        <ReferencePointDialog
          key={pointDialog === "new" ? "new" : pointDialog.id}
          point={pointDialog === "new" ? undefined : pointDialog}
          sources={library.allSources}
          onClose={() => setPointDialog(null)}
          onSave={(input) => {
            if (pointDialog === "new") library.createPoint(input);
            else library.updatePoint(pointDialog.id, input);
          }}
        />
      )}
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
          onReplaceFile={library.replaceSourceFile}
        />
      )}
      {documentMenu && (
        <ContextMenu
          position={documentMenu.position}
          onClose={() => setDocumentMenu(null)}
        >
          <ContextMenuItem
            disabled={!documentMenu.source.fileToken}
            onClick={() => {
              window.open(
                `/api/files/${documentMenu.source.fileToken}`,
                "_blank",
                "noopener,noreferrer",
              );
              setDocumentMenu(null);
            }}
          >
            {t("find.openOriginal")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={!documentMenu.source.citation.trim()}
            onClick={() => {
              const citation = documentMenu.source.citation;
              setDocumentMenu(null);
              const copy = navigator.clipboard?.writeText(citation);
              if (!copy) {
                setOperationError(t("find.copyCitationFailed"));
                return;
              }
              void copy.catch(() =>
                setOperationError(t("find.copyCitationFailed")),
              );
            }}
          >
            {t("find.cite")}
          </ContextMenuItem>
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
