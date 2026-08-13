"use client";

import { useMemo, useState } from "react";
import { ArrowLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader, SectionHeader } from "@/shared/components/page-elements";
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Select,
} from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { Idea, IdeaList } from "@/shared/model/entities";
import { sortIdeas, type IdeaSort } from "../model/idea-sorting";
import { useIdeaLibrary } from "../view-models/use-idea-library";
import type { IdeaInput } from "../view-models/use-mind-view-model";
import { useMindViewModel } from "../view-models/use-mind-view-model";
import {
  EvaluationSummary,
  IdeaEvaluationDialog,
} from "./idea-evaluation-dialog";
import { IdeaComposer, IdeaFields } from "./idea-form";
import { IdeaGrid } from "./idea-grid";
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
  const [viewing, setViewing] = useState<Idea | null>(null);
  const [composing, setComposing] = useState(false);
  const [evaluating, setEvaluating] = useState<Idea | null>(null);
  const [editing, setEditing] = useState<Idea | null>(null);
  const [editInput, setEditInput] = useState<IdeaInput | null>(null);
  const [sort, setSort] = useState<IdeaSort>("dateDesc");
  const [listDialog, setListDialog] = useState<"create" | "choose" | null>(
    null,
  );
  const [editingList, setEditingList] = useState<IdeaList | null>(null);
  const selectionMode = library.selectedIds.length > 0;
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
    <div className="space-y-8">
      {!viewing && (
        <PageHeader
          eyebrow={t("mind.eyebrow")}
          title={t("mind.title")}
          subtitle={t("mind.subtitle")}
          actions={
            <Button onClick={() => setComposing(true)}>
              <PlusIcon className="size-4" />
              {t("dashboard.addIdea")}
            </Button>
          }
        />
      )}
      {viewing ? (
        <>
          <Button variant="ghost" onClick={() => setViewing(null)}>
            <ArrowLeftIcon className="size-4" />
            {t("mind.backToLibrary")}
          </Button>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge>{t(statusLabels[viewing.status])}</Badge>
                <h1 className="mt-3 text-2xl font-semibold">{viewing.title}</h1>
              </div>
              <Badge tone={viewing.evaluation ? "info" : "neutral"}>
                {t("mind.scoreLabel")}: {viewing.evaluation?.totalScore ?? "—"}
              </Badge>
            </div>
            <div className="mt-6 grid gap-5">
              <section>
                <h2 className="text-sm font-semibold">
                  {t("mind.definition")}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  {viewing.definition || viewing.content}
                </p>
              </section>
              <section>
                <h2 className="text-sm font-semibold">{t("mind.reason")}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  {viewing.reason || "—"}
                </p>
              </section>
              <EvaluationSummary idea={viewing} />
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-zinc-500">{viewing.date}</span>
                {viewing.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </div>
            
          </Card>
        </>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
          <IdeaSidebar
            library={library}
            onCreate={() => setListDialog("create")}
            onEdit={setEditingList}
          />
          <Card>
            <SectionHeader
              title={
                library.selectedList?.system
                  ? t(`mind.list.${library.selectedList.system}`)
                  : library.selectedList?.name || t("mind.library")
              }
              action={
                !selectionMode ? (
                  <div className="w-28">
                    <Select
                      aria-label={t("mind.sort")}
                      value={sort}
                      onChange={(event) =>
                        setSort(event.target.value as IdeaSort)
                      }
                    >
                      <option value="dateDesc">{t("mind.sortDateDesc")}</option>
                      <option value="dateAsc">{t("mind.sortDateAsc")}</option>
                      <option value="scoreDesc">
                        {t("mind.sortScoreDesc")}
                      </option>
                      <option value="scoreAsc">{t("mind.sortScoreAsc")}</option>
                    </Select>
                  </div>
                ) : undefined
              }
            />
            {selectionMode && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-zinc-500">
                  {t("mind.selectedCount").replace(
                    "{count}",
                    String(library.selectedIds.length),
                  )}
                </span>
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
                <Button
                  variant="ghost"
                  onClick={() => library.setSelectedIds([])}
                >
                  {t("common.close")}
                </Button>
              </div>
            )}
            {sortedIdeas.length ? (
              <IdeaGrid
                library={library}
                ideas={sortedIdeas}
                selectionMode={selectionMode}
                onOpen={setViewing}
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
