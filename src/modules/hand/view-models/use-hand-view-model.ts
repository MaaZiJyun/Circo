"use client";

import { useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type {
  Attachment,
  ProjectLog,
  ProjectRecord,
} from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";
import { useProjectTaskActions } from "./use-project-task-actions";
export type { TaskInput } from "./use-project-task-actions";

export type ProjectInput = Pick<
  ProjectRecord,
  "name" | "purpose" | "expected" | "startDate" | "endDate" | "tags" | "score"
>;
export type LogInput = Pick<
  ProjectLog,
  "type" | "period" | "content" | "nextStep" | "tags"
>;

export function useHandViewModel() {
  const { state, mutate, softDelete } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [logError, setLogError] = useState(false);
  const projects = useMemo(
    () =>
      state
        ? activeItems(state.projects)
            .slice()
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        : [],
    [state],
  );
  const selected =
    projects.find((item) => item.id === selectedId) ?? projects[0];
  const tasks = useMemo(
    () =>
      state && selected
        ? activeItems(state.tasks).filter(
            (item) => item.projectId === selected.id,
          )
        : [],
    [state, selected],
  );
  const logs = useMemo(
    () =>
      state && selected
        ? Array.from(
            new Map(
              activeItems(state.logs).map((item) => [item.id, item]),
            ).values(),
          )
            .filter((item) => item.projectId === selected.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [state, selected],
  );
  const attachments = useMemo(
    () =>
      state && selected
        ? activeItems(state.attachments).filter(
            (item) => item.projectId === selected.id,
          )
        : [],
    [state, selected],
  );
  const plannedMinutes = tasks.reduce(
    (total, item) => total + item.estimatedMinutes,
    0,
  );
  const actualMinutes = tasks.reduce(
    (total, item) => total + item.actualMinutes,
    0,
  );
  const progress = tasks.length
    ? Math.round(
        (tasks.filter((item) => item.status === "done").length / tasks.length) *
          100,
      )
    : 0;
  const taskActions = useProjectTaskActions(selected);

  const addProject = (input: ProjectInput) => {
    const stamp = now();
    const project: ProjectRecord = {
      id: createId("project"),
      ...input,
      status: "planning",
      ideaIds: [],
      listIds: [],
      score: input.score,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      projects: [...current.projects, project],
    }));
    setSelectedId(project.id);
  };

  const updateProject = (change: Partial<ProjectRecord>) => {
    if (!selected) return;
    mutate((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        item.id === selected.id
          ? { ...item, ...change, updatedAt: now() }
          : item,
      ),
    }));
  };

  const updateProjectById = (id: string, input: ProjectInput) => {
    mutate((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        item.id === id ? { ...item, ...input, updatedAt: now() } : item,
      ),
    }));
  };


  const addLog = async (input: LogInput, requestedId?: string) => {
    if (!selected) return;
    setLogError(false);
    const stamp = now();
    const id = requestedId ?? createId("log");
    if (state?.logs.some((item) => item.id === id)) {
      setLogError(true);
      throw new Error("A project log with this identifier already exists.");
    }
    const response = await fetch("/api/project-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        projectId: selected.id,
        logId: id,
        createdAt: stamp,
      }),
    });
    const payload = (await response.json()) as { filePath?: string };
    if (!response.ok || !payload.filePath) {
      setLogError(true);
      throw new Error("Unable to save project log.");
    }
    const log: ProjectLog = {
      id,
      projectId: selected.id,
      ...input,
      filePath: payload.filePath,
      sourceIds: [],
      ideaIds: [],
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      logs: Array.from(
        new Map([...current.logs, log].map((item) => [item.id, item])).values(),
      ),
    }));
  };

  const updateLog = async (log: ProjectLog, input: LogInput) => {
    setLogError(false);
    const stamp = now();
    const response = await fetch("/api/project-logs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        projectId: log.projectId,
        logId: log.id,
        createdAt: log.createdAt,
      }),
    });
    if (!response.ok) {
      setLogError(true);
      throw new Error("Unable to update project log.");
    }
    mutate((current) => ({
      ...current,
      logs: current.logs.map((item) =>
        item.id === log.id ? { ...item, ...input, updatedAt: stamp } : item,
      ),
    }));
  };

  const deleteLog = async (log: ProjectLog) => {
    setLogError(false);
    const response = await fetch("/api/project-logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: log.projectId, logId: log.id }),
    });
    if (!response.ok) {
      setLogError(true);
      throw new Error("Unable to delete project log.");
    }
    const stamp = now();
    mutate((current) => ({
      ...current,
      logs: current.logs.map((item) =>
        item.id === log.id
          ? { ...item, deletedAt: stamp, updatedAt: stamp }
          : item,
      ),
    }));
  };

  const addAttachment = async (file: File, description: string) => {
    if (!selected) return;
    setUploading(true);
    setUploadError(false);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/attachments", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as { fileToken?: string };
      if (!response.ok || !payload.fileToken) throw new Error("Upload failed.");
      const stamp = now();
      const attachment: Attachment = {
        id: createId("attachment"),
        projectId: selected.id,
        name: file.name,
        fileToken: payload.fileToken,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        description,
        status: "available",
        createdAt: stamp,
        updatedAt: stamp,
      };
      mutate((current) => ({
        ...current,
        attachments: [...current.attachments, attachment],
      }));
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  };

  return {
    projects,
    selected,
    selectedId,
    setSelectedId,
    tasks,
    logs,
    attachments,
    plannedMinutes,
    actualMinutes,
    progress,
    uploading,
    uploadError,
    logError,
    addProject,
    updateProject,
    updateProjectById,
    ...taskActions,
    addLog,
    updateLog,
    deleteLog,
    addAttachment,
    deleteProject: (id: string) => softDelete("projects", id),
  };
}
