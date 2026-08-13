"use client";

import { useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type {
  Attachment,
  ProjectLog,
  ProjectRecord,
  TaskRecord,
} from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";

export type ProjectInput = Pick<
  ProjectRecord,
  "name" | "purpose" | "expected" | "startDate" | "endDate" | "tags" | "score"
>;
export type TaskInput = Pick<
  TaskRecord,
  | "title"
  | "description"
  | "dueDate"
  | "estimatedMinutes"
  | "expectedOutput"
  | "milestone"
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
        ? activeItems(state.logs)
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

  const addTask = (input: TaskInput) => {
    if (!selected) return;
    const stamp = now();
    const task: TaskRecord = {
      id: createId("task"),
      projectId: selected.id,
      ...input,
      priority: "medium",
      status: "todo",
      actualMinutes: 0,
      completedAt: undefined,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({ ...current, tasks: [...current.tasks, task] }));
  };

  const advanceTask = (task: TaskRecord) => {
    const status =
      task.status === "todo"
        ? "doing"
        : task.status === "doing"
          ? "done"
          : "todo";
    const stamp = now();
    mutate((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status,
              actualMinutes:
                status === "done" && !item.actualMinutes
                  ? item.estimatedMinutes
                  : item.actualMinutes,
              updatedAt: stamp,
              completedAt: status === "done" ? stamp : undefined,
            }
          : item,
      ),
      dailyTasks: current.dailyTasks.map((item) =>
        item.sourceTaskId === task.id
          ? {
              ...item,
              completed: status === "done",
              completedAt: status === "done" ? stamp : undefined,
              updatedAt: stamp,
            }
          : item,
      ),
    }));
  };

  const addLog = async (input: LogInput) => {
    if (!selected) return;
    setLogError(false);
    const stamp = now();
    const id = createId("log");
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
    mutate((current) => ({ ...current, logs: [...current.logs, log] }));
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
    addTask,
    advanceTask,
    addLog,
    addAttachment,
    deleteProject: (id: string) => softDelete("projects", id),
  };
}
