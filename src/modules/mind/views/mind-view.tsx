"use client";

import { useMemo, useState } from "react";
import { ArrowLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { LibrarySortControls } from "@/shared/components/library-sort-controls";
import { SectionHeader } from "@/shared/components/page-elements";
import { SelectionToolbar } from "@/shared/components/selection-toolbar";
import { Button, Card, Dialog, EmptyState } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { Idea, IdeaList } from "@/shared/model/entities";
import { sortIdeas, type IdeaSort } from "../model/idea-sorting";
import { useIdeaLibrary } from "../view-models/use-idea-library";
import type { IdeaInput } from "../view-models/use-mind-view-model";
import { useMindViewModel } from "../view-models/use-mind-view-model";
import { IdeaEvaluationDialog } from "./idea-evaluation-dialog";
import { IdeaComposer, IdeaFields } from "./idea-form";
import { IdeaGrid } from "./idea-grid";
import { IdeaReader } from "./idea-reader";
import {
  ChooseIdeaListDialog,
  IdeaListDialog,
  IdeaSidebar,
} from "./idea-list-ui";

const inputFromIdea = (idea: Idea): IdeaInput => ({
  title: idea.title,
  definition: idea.definition || idea.content,
  reason: idea.reason || "",
  date: idea.date || idea.createdAt.slice(0, 10),
  tags: idea.tags,
});

export function MindView() {
  const { t } = useI18n();
  const vm = useMindViewModel();
  const library = useIdeaLibrary();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [evaluating, setEvaluating] = useState<Idea | null>(null);
  const [editing, setEditing] = useState<Idea | null>(null);
  const [editInput, setEditInput] = useState<IdeaInput | null>(null);
  const [sortType, setSortType] = useState<"date" | "score">("date");
  const [sortAscending, setSortAscending] = useState(false);
  const sort: IdeaSort =
    `${sortType}${sortAscending ? "Asc" : "Desc"}` as IdeaSort;
  const [listDialog, setListDialog] = useState<"create" | "choose" | null>(
    null,
  );
  const [editingList, setEditingList] = useState<IdeaList | null>(null);
  const selectionMode = library.selectedIds.length > 0;
  const viewing = vm.ideas.find((idea) => idea.id === viewingId) ?? null;
  const sortedIdeas = useMemo(
    () => sortIdeas(library.ideas, sort),
    [library.ideas, sort],
  );
  const edit = (idea: Idea) => {
    setEditing(idea);
    setEditInput(inputFromIdea(idea));
  };
  const remove = (idea: Idea) => {
    if (window.confirm(t("common.confirmDelete"))) vm.deleteIdea(idea.id);
  };
  const saveEdit = () => {
    if (!editing || !editInput) return;
    vm.updateIdea(editing.id, editInput);
    setEditing(null);
    setEditInput(null);
  };

  return (
    <div className="h-full space-y-6">
      {viewing ? (
        <>
          <Button variant="ghost" onClick={() => setViewingId(null)}>
            <ArrowLeftIcon className="size-4" />
            {t("mind.backToLibrary")}
          </Button>
          <IdeaReader
            idea={viewing}
            busy={vm.busy}
            onSend={(message) => vm.continueIdea(viewing.id, message)}
            onDeleteMessage={(messageId) =>
              vm.deleteIdeaMessage(viewing.id, messageId)
            }
          />
        </>
      ) : (
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 xl:grid-cols-[240px_minmax(0,1fr)] xl:grid-rows-1">
          <div className="space-y-3">
            <IdeaSidebar
              library={library}
              onCreate={() => setListDialog("create")}
              onEdit={setEditingList}
            />
          </div>
          <Card className="h-full shadow-sm">
            <SectionHeader
              title={
                library.selectedList?.system
                  ? t(`mind.list.${library.selectedList.system}`)
                  : library.selectedList?.name || t("mind.library")
              }
              controls={
                !selectionMode ? (
                  <LibrarySortControls
                    label={t("mind.sort")}
                    value={sortType}
                    options={[
                      { value: "date", label: t("mind.sortDate") },
                      { value: "score", label: t("mind.sortScore") },
                    ]}
                    ascending={sortAscending}
                    directionLabel={t(
                      sortAscending ? "find.ascending" : "find.descending",
                    )}
                    selectClassName="w-28"
                    onChange={(value) => setSortType(value as "date" | "score")}
                    onToggleDirection={() =>
                      setSortAscending((value) => !value)
                    }
                  />
                ) : undefined
              }
              action={
                !selectionMode ? (
                  <Button
                    className="whitespace-nowrap"
                    onClick={() => setComposing(true)}
                  >
                    <PlusIcon className="size-4" />
                    {t("dashboard.addIdea")}
                  </Button>
                ) : undefined
              }
            />
            {selectionMode && (
              <SelectionToolbar
                label={t("mind.selectedCount").replace(
                  "{count}",
                  String(library.selectedIds.length),
                )}
                onCancel={() => library.setSelectedIds([])}
              >
                <Button
                  variant="secondary"
                  onClick={() => setListDialog("choose")}
                >
                  {t("mind.addToList")}
                </Button>
                <Button
                  variant="secondary"
                  disabled={library.selectedList?.system !== null}
                  onClick={library.removeFromCurrentList}
                >
                  {t("mind.removeFromList")}
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
              </SelectionToolbar>
            )}
            {sortedIdeas.length ? (
              <IdeaGrid
                library={library}
                ideas={sortedIdeas}
                selectionMode={selectionMode}
                onOpen={(idea) => setViewingId(idea.id)}
                onEdit={edit}
                onDelete={remove}
                onEvaluate={setEvaluating}
                onConvert={vm.convertToProject}
              />
            ) : (
              <EmptyState title={t("common.noData")} />
            )}
          </Card>
        </div>
      )}
      <Dialog
        open={composing}
        title={t("mind.quickCapture")}
        closeLabel={t("common.close")}
        onClose={() => setComposing(false)}
      >
        <IdeaComposer
          lists={vm.libraryLists}
          busy={vm.busy}
          sourceCount={(id) => vm.sourcesForList(id).length}
          onGenerate={vm.generateIdea}
          onSave={(input, method, listId) =>
            vm.saveIdea(
              input,
              method,
              listId
                ? vm.sourcesForList(listId).map((source) => source.id)
                : [],
            )
          }
          onSaved={() => setComposing(false)}
        />
      </Dialog>
      {evaluating && (
        <IdeaEvaluationDialog
          key={evaluating.id}
          idea={evaluating}
          onClose={() => setEvaluating(null)}
          onSave={(id, answers, kill) => {
            vm.saveEvaluation(id, answers, kill);
            setEvaluating(null);
          }}
        />
      )}
      <Dialog
        open={!!editing}
        title={t("mind.edit")}
        closeLabel={t("common.close")}
        onClose={() => setEditing(null)}
      >
        {editInput && <IdeaFields value={editInput} onChange={setEditInput} />}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditing(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!editInput?.title.trim() || !editInput.definition.trim()}
            onClick={saveEdit}
          >
            {t("common.save")}
          </Button>
        </div>
      </Dialog>
      {listDialog === "create" && (
        <IdeaListDialog
          onClose={() => setListDialog(null)}
          onSave={library.createList}
        />
      )}
      {editingList && (
        <IdeaListDialog
          key={editingList.id}
          list={editingList}
          onClose={() => setEditingList(null)}
          onSave={(input) => library.updateList(editingList.id, input)}
        />
      )}
      {listDialog === "choose" && (
        <ChooseIdeaListDialog
          lists={library.lists.filter((item) => !item.system)}
          onClose={() => setListDialog(null)}
          onChoose={(id) => library.addToList(library.selectedIds, id)}
        />
      )}
    </div>
  );
}
