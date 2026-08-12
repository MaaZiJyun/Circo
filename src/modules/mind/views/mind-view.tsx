"use client";

import { useMemo, useState } from "react";
import {
  ArrowUturnLeftIcon,
  BeakerIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/modules/find/views/context-menu";
import { PageHeader, SectionHeader } from "@/shared/components/page-elements";
import {
  Alert,
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Select,
} from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { Idea } from "@/shared/model/entities";
import { canPromoteIdea } from "../model/idea-evaluation";
import { sortIdeas, type IdeaSort } from "../model/idea-sorting";
import type { IdeaInput } from "../view-models/use-mind-view-model";
import { useMindViewModel } from "../view-models/use-mind-view-model";
import { IdeaComposer, IdeaFields } from "./idea-form";
import {
  EvaluationSummary,
  IdeaEvaluationDialog,
} from "./idea-evaluation-dialog";

const inputFromIdea = (idea: Idea): IdeaInput => ({
  title: idea.title,
  definition: idea.definition || idea.content,
  reason: idea.reason || "",
  date: idea.date || idea.createdAt.slice(0, 10),
  tags: idea.tags,
});

function IdeaCard({
  idea,
  onEdit,
  onDelete,
  onConvert,
  onEvaluate,
}: {
  idea: Idea;
  onEdit: () => void;
  onDelete: () => void;
  onConvert: () => void;
  onEvaluate: () => void;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const runMenuAction = (action: () => void) => {
    setMenu(null);
    action();
  };
  return (
    <article
      className="flex flex-col rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
      onContextMenu={(event) => {
        event.preventDefault();
        setMenu({ x: event.clientX, y: event.clientY });
      }}
    >
      <h3>
        <button
          className="w-full cursor-pointer rounded-md text-left font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-50"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {idea.title}
        </button>
      </h3>
      <div className="mt-2 space-y-3 text-sm leading-6">
        <div>
          <p className="text-xs font-medium text-zinc-400">
            {t("mind.definition")}
          </p>
          <p
            className={`${expanded ? "" : "line-clamp-3"} text-zinc-600 dark:text-zinc-300`}
          >
            {idea.definition || idea.content}
          </p>
        </div>
        {expanded && (idea.reason || "").trim() && (
          <div>
            <p className="text-xs font-medium text-zinc-400">
              {t("mind.reason")}
            </p>
            <p className="line-clamp-3 text-zinc-600 dark:text-zinc-300">
              {idea.reason}
            </p>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">
          {idea.date || idea.createdAt.slice(0, 10)}
        </span>
        {idea.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
        <Badge tone={idea.evaluation ? "info" : "neutral"}>
          {t("mind.scoreLabel")}: {idea.evaluation?.totalScore ?? "—"}
        </Badge>
      </div>
      {expanded && (
        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Badge
            tone={
              idea.status === "promoted" || idea.status === "converted"
                ? "success"
                : "neutral"
            }
          >
            {t(statusLabels[idea.status])}
          </Badge>
          <EvaluationSummary idea={idea} />
        </div>
      )}
      {menu && (
        <ContextMenu position={menu} onClose={() => setMenu(null)}>
          <ContextMenuItem onClick={() => runMenuAction(onEdit)}>
            <PencilSquareIcon className="size-4" />
            {t("common.edit")}
          </ContextMenuItem>
          <ContextMenuItem danger onClick={() => runMenuAction(onDelete)}>
            <TrashIcon className="size-4" />
            {t("common.delete")}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => runMenuAction(onEvaluate)}>
            <ArrowUturnLeftIcon className="size-4" />
            {idea.evaluation ? t("mind.reevaluate") : t("mind.evaluate")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={
              !canPromoteIdea(idea.evaluation) ||
              idea.status === "promoted" ||
              idea.status === "converted"
            }
            title={
              !canPromoteIdea(idea.evaluation)
                ? t("mind.notEvaluated")
                : undefined
            }
            onClick={() => runMenuAction(onConvert)}
          >
            <BeakerIcon className="size-4" />
            {t("mind.toProject")}
          </ContextMenuItem>
        </ContextMenu>
      )}
    </article>
  );
}

export function MindView() {
  const { t } = useI18n();
  const vm = useMindViewModel();
  const [composing, setComposing] = useState(false);
  const [evaluating, setEvaluating] = useState<Idea | null>(null);
  const [editing, setEditing] = useState<Idea | null>(null);
  const [editInput, setEditInput] = useState<IdeaInput | null>(null);
  const [sort, setSort] = useState<IdeaSort>("dateDesc");
  const sortedIdeas = useMemo(
    () => sortIdeas(vm.ideas, sort),
    [sort, vm.ideas],
  );

  const edit = (idea: Idea) => {
    setEditing(idea);
    setEditInput(inputFromIdea(idea));
  };
  const saveEdit = () => {
    if (!editing || !editInput) return;
    vm.updateIdea(editing.id, editInput);
    setEditing(null);
    setEditInput(null);
  };

  return (
    <div className="space-y-8">
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
      <Card>
        <SectionHeader
          title={t("mind.library")}
          action={
            <div className="w-28 shrink-0">
              <Select
                aria-label={t("mind.sort")}
                value={sort}
                onChange={(event) => setSort(event.target.value as IdeaSort)}
              >
                <option value="dateDesc">{t("mind.sortDateDesc")}</option>
                <option value="dateAsc">{t("mind.sortDateAsc")}</option>
                <option value="scoreDesc">{t("mind.sortScoreDesc")}</option>
                <option value="scoreAsc">{t("mind.sortScoreAsc")}</option>
              </Select>
            </div>
          }
        />
        {vm.ideas.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onEdit={() => edit(idea)}
                onDelete={() =>
                  window.confirm(t("common.confirmDelete")) &&
                  vm.deleteIdea(idea.id)
                }
                onConvert={() => vm.convertToProject(idea)}
                onEvaluate={() => setEvaluating(idea)}
              />
            ))}
          </div>
        ) : (
          <EmptyState title={t("common.noData")} />
        )}
      </Card>
      <Alert>{t("find.aiNotice")}</Alert>
      <Dialog
        open={composing}
        title={t("mind.quickCapture")}
        closeLabel={t("common.close")}
        onClose={() => setComposing(false)}
      >
        <IdeaComposer
          lists={vm.libraryLists}
          busy={vm.busy}
          sourceCount={(listId) => vm.sourcesForList(listId).length}
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
          onSave={(id, answers, killCondition) => {
            vm.saveEvaluation(id, answers, killCondition);
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
    </div>
  );
}
