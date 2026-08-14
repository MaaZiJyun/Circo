"use client";

import { useState } from "react";
import { useI18n } from "@/shared/i18n/i18n-context";
import type {
  LibraryList,
  PointList,
  ReferencePoint,
  SourceRecord,
} from "@/shared/model/entities";
import { useFindViewModel } from "../view-models/use-find-view-model";
import { startReading } from "../model/reading-record";
import { useLibraryManagement } from "../view-models/use-library-management";
import { usePointLibrary } from "../view-models/use-point-library";
import { ImportDialog } from "./find-dialogs";
import {
  ChooseListDialog,
  EditLiteratureDialog,
  ListDialog,
} from "./library-dialogs";
import { LibrarySidebar } from "./library-sidebar";
import { LibraryWorkspace } from "./library-workspace";
import { ActiveLiteratureReader } from "./active-literature-reader";
import { FindModeSwitch, type FindMode } from "./find-mode-switch";
import { ReferenceWorkspace } from "./reference-workspace";
import { ReferencePointDialog } from "./reference-point-dialog";
import {
  ChoosePointListDialog,
  PointListDialog,
  PointListSidebar,
} from "./point-list-ui";
import {
  LiteratureContextMenu,
  type LiteratureMenu,
} from "./literature-context-menu";

export function FindView() {
  const { t } = useI18n();
  const find = useFindViewModel();
  const library = useLibraryManagement();
  const pointLibrary = usePointLibrary();
  const [dialog, setDialog] = useState<"import" | "list" | null>(null);
  const [editing, setEditing] = useState<SourceRecord | null>(null);
  const [reading, setReading] = useState<SourceRecord | null>(null);
  const [editingList, setEditingList] = useState<LibraryList | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [addingIds, setAddingIds] = useState<string[]>([]);
  const [documentMenu, setDocumentMenu] = useState<LiteratureMenu | null>(null);
  const [operationError, setOperationError] = useState("");
  const [mode, setMode] = useState<FindMode>("library");
  const [pointDialog, setPointDialog] = useState<ReferencePoint | "new" | null>(
    null,
  );
  const [pointListDialog, setPointListDialog] = useState<"create" | null>(null);
  const [editingPointList, setEditingPointList] = useState<PointList | null>(
    null,
  );
  const [pointForList, setPointForList] = useState<ReferencePoint | null>(null);
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
        points={pointLibrary.points.filter(
          (point) => point.sourceId === reading.id,
        )}
        pointLists={pointLibrary.lists}
        onCreatePoint={pointLibrary.createPoint}
        onUpdatePoint={pointLibrary.updatePoint}
        onDeletePoint={pointLibrary.deletePoint}
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
            <PointListSidebar
              library={pointLibrary}
              onCreate={() => setPointListDialog("create")}
              onEdit={setEditingPointList}
            />
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
            points={pointLibrary.filteredPoints}
            lists={pointLibrary.lists}
            sources={library.allSources}
            onAdd={() => setPointDialog("new")}
            onEdit={setPointDialog}
            onDelete={(point) => {
              if (window.confirm(t("find.confirmDeletePoint")))
                pointLibrary.deletePoint(point.id);
            }}
            onAddToList={setPointForList}
            onRemoveFromList={(point) =>
              pointLibrary.removeFromCurrentList(point.id)
            }
            onDragStart={(point) => pointLibrary.setDraggedIds([point.id])}
            onConvertToIdea={pointLibrary.convertToIdea}
            canRemoveFromList={
              pointLibrary.lists.find(
                (list) => list.id === pointLibrary.activeListId,
              )?.system === null
            }
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
          lists={pointLibrary.lists}
          onClose={() => setPointDialog(null)}
          onSave={(input) => {
            if (pointDialog === "new") pointLibrary.createPoint(input);
            else pointLibrary.updatePoint(pointDialog.id, input);
          }}
        />
      )}
      {pointListDialog === "create" && (
        <PointListDialog
          onClose={() => setPointListDialog(null)}
          onSave={pointLibrary.createList}
        />
      )}
      {editingPointList && (
        <PointListDialog
          key={editingPointList.id}
          list={editingPointList}
          onClose={() => setEditingPointList(null)}
          onSave={(input) =>
            pointLibrary.updateList(editingPointList.id, input)
          }
        />
      )}
      {pointForList && (
        <ChoosePointListDialog
          lists={pointLibrary.lists.filter((list) => !list.system)}
          onClose={() => setPointForList(null)}
          onChoose={(listId) =>
            pointLibrary.addToList([pointForList.id], listId)
          }
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
        <LiteratureContextMenu
          menu={documentMenu}
          canRemoveFromList={library.selectedList?.system === null}
          onClose={() => setDocumentMenu(null)}
          onEdit={() => {
            setEditing(documentMenu.source);
            setDocumentMenu(null);
          }}
          onAddToList={() => {
            setAddingIds([documentMenu.source.id]);
            setDocumentMenu(null);
          }}
          onRemoveFromList={() => {
            library.removeFromList([documentMenu.source.id]);
            setDocumentMenu(null);
          }}
          onDelete={() => {
            const id = documentMenu.source.id;
            setDocumentMenu(null);
            void deleteSources([id]);
          }}
          onError={setOperationError}
        />
      )}
    </div>
  );
}
