"use client";

import { useMemo, useState } from "react";
import { LocalAssistant } from "@/shared/infrastructure/local-assistant";
import { useI18n } from "@/shared/i18n/i18n-context";
import { activeItems } from "@/shared/model/app-state";
import type { AIJob, Artifact, Relation } from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";

const assistant = new LocalAssistant();
export type ArtifactInput = Pick<Artifact, "title" | "type" | "tags"> & {
  projectId: string;
};

export function useLandViewModel() {
  const { state, mutate, softDelete } = useStore();
  const { locale } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const projects = useMemo(
    () => (state ? activeItems(state.projects) : []),
    [state],
  );
  const artifacts = useMemo(
    () =>
      state
        ? activeItems(state.artifacts)
            .slice()
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        : [],
    [state],
  );
  const selected =
    artifacts.find((item) => item.id === selectedId) ?? artifacts[0];

  const addArtifact = (input: ArtifactInput) => {
    const stamp = now();
    const project = projects.find((item) => item.id === input.projectId);
    const ideaIds = project?.ideaIds ?? [];
    const logs = state
      ? activeItems(state.logs).filter(
          (item) => item.projectId === input.projectId,
        )
      : [];
    const sourceIds = [...new Set(logs.flatMap((item) => item.sourceIds))];
    const content =
      locale === "zh-CN"
        ? `# ${input.title}\n\n## 背景与问题\n\n## 方法\n\n## 结果\n\n## 局限与下一步\n`
        : `# ${input.title}\n\n## Context and problem\n\n## Method\n\n## Outcome\n\n## Limitations and next step\n`;
    const artifact: Artifact = {
      id: createId("artifact"),
      title: input.title,
      type: input.type,
      status: "draft",
      content,
      projectIds: input.projectId ? [input.projectId] : [],
      sourceIds,
      ideaIds,
      materials: [
        project?.name ?? input.title,
        ...logs.map((item) => item.content.slice(0, 80)),
      ],
      tags: input.tags,
      channel: "",
      externalUrl: "",
      feedback: "",
      createdAt: stamp,
      updatedAt: stamp,
    };
    const relation: Relation | null = project
      ? {
          id: createId("relation"),
          fromKind: "project",
          fromId: project.id,
          toKind: "artifact",
          toId: artifact.id,
          relation: "produces",
          createdBy: "user",
          createdAt: stamp,
          updatedAt: stamp,
        }
      : null;
    mutate((current) => ({
      ...current,
      artifacts: [...current.artifacts, artifact],
      relations: relation
        ? [...current.relations, relation]
        : current.relations,
    }));
    setSelectedId(artifact.id);
  };

  const updateArtifact = (change: Partial<Artifact>) => {
    if (!selected) return;
    const completedAt =
      change.status && ["final", "published"].includes(change.status)
        ? now()
        : selected.completedAt;
    mutate((current) => ({
      ...current,
      artifacts: current.artifacts.map((item) =>
        item.id === selected.id
          ? { ...item, ...change, completedAt, updatedAt: now() }
          : item,
      ),
    }));
  };

  const generateDraft = async () => {
    if (!selected || !state) return;
    setBusy(true);
    const project = activeItems(state.projects).find(
      (item) => item.id === selected.projectIds[0],
    );
    const logs = activeItems(state.logs).filter(
      (item) => item.projectId === project?.id,
    );
    const output = await assistant.draft(project, logs, selected, locale);
    updateArtifact({
      content: output,
      materials: [
        project?.name ?? selected.title,
        ...logs.map((item) => item.content.slice(0, 80)),
      ],
    });
    const stamp = now();
    const job: AIJob = {
      id: createId("ai"),
      taskType: "artifact",
      entityId: selected.id,
      inputLabel: project?.name ?? selected.title,
      output,
      status: "success",
      provider: "local-demo",
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({ ...current, aiJobs: [...current.aiJobs, job] }));
    setBusy(false);
    return output;
  };

  const exportMarkdown = (draft?: string) => {
    if (!selected) return;
    const blob = new Blob([draft ?? selected.content], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selected.title.replace(/[^a-z0-9\u4e00-\u9fa5_-]/gi, "-")}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return {
    projects,
    artifacts,
    selected,
    selectedId,
    setSelectedId,
    busy,
    addArtifact,
    updateArtifact,
    generateDraft,
    exportMarkdown,
    deleteArtifact: (id: string) => softDelete("artifacts", id),
  };
}
