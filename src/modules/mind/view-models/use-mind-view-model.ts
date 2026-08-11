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
import { addDays, createId, now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";

const assistant = new LocalAssistant();
const defaultScores = {
  value: 3,
  feasibility: 3,
  novelty: 3,
  cost: 3,
  risk: 3,
};

export function useMindViewModel() {
  const { state, mutate, softDelete } = useStore();
  const { locale } = useI18n();
  const [candidate, setCandidate] = useState("");
  const [candidateInput, setCandidateInput] = useState("");
  const [candidateMethod, setCandidateMethod] =
    useState<Idea["method"]>("combine");
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

  const addIdea = (
    content: string,
    method: Idea["method"] = "capture",
    tags: string[] = [],
  ) => {
    if (!content.trim()) return;
    const stamp = now();
    const idea: Idea = {
      id: createId("idea"),
      title: content.trim().slice(0, 42),
      content: content.trim(),
      status: method === "capture" ? "inbox" : "candidate",
      method,
      sourceIds: [],
      tags,
      scores: defaultScores,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({ ...current, ideas: [...current.ideas, idea] }));
  };

  const explore = async (input: string, method: Idea["method"]) => {
    if (!input.trim()) return;
    setBusy(true);
    const output = await assistant.explore(input, method, locale);
    setCandidate(output);
    setCandidateInput(input);
    setCandidateMethod(method);
    const stamp = now();
    const job: AIJob = {
      id: createId("ai"),
      taskType: "idea",
      entityId: "candidate",
      inputLabel: input,
      output,
      status: "success",
      provider: "local-demo",
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({ ...current, aiJobs: [...current.aiJobs, job] }));
    setBusy(false);
  };

  const acceptCandidate = () => {
    addIdea(candidate, candidateMethod);
    setCandidate("");
    setCandidateInput("");
  };

  const updateScores = (id: string, scores: Idea["scores"]) => {
    mutate((current) => ({
      ...current,
      ideas: current.ideas.map((idea) =>
        idea.id === id ? { ...idea, scores, updatedAt: now() } : idea,
      ),
    }));
  };

  const convertToProject = (idea: Idea) => {
    const stamp = now();
    const projectId = createId("project");
    const project: ProjectRecord = {
      id: projectId,
      name: idea.title,
      purpose: idea.content,
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
          ? { ...item, status: "converted", updatedAt: stamp }
          : item,
      ),
      relations: [...current.relations, relation],
    }));
  };

  return {
    ideas,
    candidate,
    candidateInput,
    busy,
    addIdea,
    explore,
    acceptCandidate,
    updateScores,
    convertToProject,
    deleteIdea: (id: string) => softDelete("ideas", id),
  };
}
