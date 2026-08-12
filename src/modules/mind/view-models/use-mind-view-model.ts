"use client";

import { useMemo, useState } from "react";
import { LocalAssistant } from "@/shared/infrastructure/local-assistant";
import { useI18n } from "@/shared/i18n/i18n-context";
import { activeItems } from "@/shared/model/app-state";
import type {
  AIJob,
  Idea,
  ProjectRecord,
  Relation,
} from "@/shared/model/entities";
import { addDays, createId, now, today } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";
import { canPromoteIdea, evaluateIdea } from "../model/idea-evaluation";

const assistant = new LocalAssistant();
const defaultScores = {
  value: 3,
  feasibility: 3,
  novelty: 3,
  cost: 3,
  risk: 3,
};

export interface IdeaInput {
  title: string;
  definition: string;
  reason: string;
  date: string;
  tags: string[];
}

export function useMindViewModel() {
  const { state, mutate, softDelete } = useStore();
  const { locale } = useI18n();
  const [busy, setBusy] = useState(false);
  const ideas = useMemo(
    () =>
      state
        ? activeItems(state.ideas)
            .slice()
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        : [],
    [state],
  );
  const libraryLists = useMemo(
    () => (state ? activeItems(state.libraryLists) : []),
    [state],
  );

  const sourcesForList = (listId: string) => {
    if (!state) return [];
    const list = state.libraryLists.find((item) => item.id === listId);
    const sources = activeItems(state.sources);
    if (list?.system === "default" || list?.system === "recent") return sources;
    if (list?.system === "marked")
      return sources.filter((source) => source.favorite);
    return sources.filter((source) => source.listIds.includes(listId));
  };

  const saveIdea = (
    input: IdeaInput,
    method: Idea["method"] = "capture",
    sourceIds: string[] = [],
  ) => {
    if (!input.title.trim() || !input.definition.trim()) return;
    const stamp = now();
    const idea: Idea = {
      id: createId("idea"),
      title: input.title.trim(),
      content: input.definition.trim(),
      definition: input.definition.trim(),
      reason: input.reason.trim(),
      date: input.date || today(),
      status: method === "capture" ? "spark" : "explore",
      method,
      sourceIds,
      tags: input.tags.filter(Boolean),
      scores: defaultScores,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({ ...current, ideas: [...current.ideas, idea] }));
  };

  const generateIdea = async (
    listId: string,
    method: Idea["method"],
    focus: string,
  ): Promise<IdeaInput | null> => {
    const sources = sourcesForList(listId);
    if (!sources.length) return null;
    setBusy(true);
    try {
      const evidence = sources
        .slice(0, 5)
        .map((source) =>
          `${source.title}: ${source.summary || source.content}`.slice(0, 240),
        )
        .join("\n");
      const prompt = focus.trim() ? `${focus.trim()}\n\n${evidence}` : evidence;
      const output = await assistant.explore(prompt, method, locale);
      const list = libraryLists.find((item) => item.id === listId);
      const title =
        focus.trim() || `${list?.name ?? "Library"} · ${sources[0].title}`;
      const reason =
        locale === "zh-CN"
          ? `基于 Library List「${list?.name ?? ""}」中的 ${sources.length} 篇文献，使用所选推演方式生成。`
          : `Generated from ${sources.length} source(s) in “${list?.name ?? "Library"}” using the selected exploration method.`;
      const draft = {
        title: title.slice(0, 80),
        definition: output,
        reason,
        date: today(),
        tags: [...new Set(sources.flatMap((source) => source.tags))].slice(
          0,
          8,
        ),
      };
      const stamp = now();
      const job: AIJob = {
        id: createId("ai"),
        taskType: "idea",
        entityId: "draft",
        inputLabel: list?.name ?? title,
        output,
        status: "success",
        provider: "local-demo",
        createdAt: stamp,
        updatedAt: stamp,
      };
      mutate((current) => ({ ...current, aiJobs: [...current.aiJobs, job] }));
      return draft;
    } finally {
      setBusy(false);
    }
  };

  const updateIdea = (id: string, input: IdeaInput) => {
    mutate((current) => ({
      ...current,
      ideas: current.ideas.map((idea) =>
        idea.id === id
          ? {
              ...idea,
              title: input.title.trim(),
              content: input.definition.trim(),
              definition: input.definition.trim(),
              reason: input.reason.trim(),
              date: input.date,
              tags: input.tags.filter(Boolean),
              updatedAt: now(),
            }
          : idea,
      ),
    }));
  };

  const updateScores = (id: string, scores: Idea["scores"]) => {
    mutate((current) => ({
      ...current,
      ideas: current.ideas.map((idea) =>
        idea.id === id ? { ...idea, scores, updatedAt: now() } : idea,
      ),
    }));
  };

  const saveEvaluation = (
    id: string,
    answers: number[],
    killCondition: string,
  ) => {
    const evaluation = evaluateIdea(answers, killCondition);
    const status: Idea["status"] =
      evaluation.level === "poor"
        ? "rejected"
        : evaluation.level === "weak"
          ? "park"
          : evaluation.level === "strong" && !evaluation.gateFailures.length
            ? "validate"
            : "explore";
    mutate((current) => ({
      ...current,
      ideas: current.ideas.map((idea) =>
        idea.id === id
          ? { ...idea, evaluation, status, updatedAt: now() }
          : idea,
      ),
    }));
  };

  const convertToProject = (idea: Idea) => {
    if (!canPromoteIdea(idea.evaluation)) return;
    const stamp = now();
    const projectId = createId("project");
    const project: ProjectRecord = {
      id: projectId,
      name: idea.title,
      purpose: idea.definition || idea.content,
      expected: "",
      startDate: stamp.slice(0, 10),
      endDate: addDays(new Date(), 30),
      status: "planning",
      ideaIds: [idea.id],
      tags: idea.tags,
      createdAt: stamp,
      updatedAt: stamp,
    };
    const relation: Relation = {
      id: createId("relation"),
      fromKind: "idea",
      fromId: idea.id,
      toKind: "project",
      toId: projectId,
      relation: "derived",
      createdBy: "user",
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      projects: [...current.projects, project],
      ideas: current.ideas.map((item) =>
        item.id === idea.id
          ? { ...item, status: "promoted", updatedAt: stamp }
          : item,
      ),
      relations: [...current.relations, relation],
    }));
  };

  return {
    ideas,
    libraryLists,
    busy,
    sourcesForList,
    saveIdea,
    generateIdea,
    updateIdea,
    updateScores,
    saveEvaluation,
    convertToProject,
    deleteIdea: (id: string) => softDelete("ideas", id),
  };
}
