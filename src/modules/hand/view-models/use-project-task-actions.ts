"use client";

import type { ProjectRecord, TaskRecord } from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { today } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";

export type TaskInput = Pick<
  TaskRecord,
  | "title"
  | "description"
  | "dueDate"
  | "estimatedMinutes"
  | "expectedOutput"
  | "milestone"
>;

export function useProjectTaskActions(selected?: ProjectRecord) {
  const { mutate } = useStore();
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
        item.sourceTaskId === task.id && item.date === today()
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
  const updateTask = (id: string, input: TaskInput) =>
    mutate((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        item.id === id ? { ...item, ...input, updatedAt: now() } : item,
      ),
    }));
  const moveTask = (id: string, projectId: string) => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        item.id === id ? { ...item, projectId, updatedAt: stamp } : item,
      ),
      dailyTasks: current.dailyTasks.map((item) =>
        item.sourceTaskId === id
          ? { ...item, projectId, updatedAt: stamp }
          : item,
      ),
    }));
  };
  const deleteTask = (id: string) => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        item.id === id ? { ...item, deletedAt: stamp, updatedAt: stamp } : item,
      ),
      dailyTasks: current.dailyTasks.map((item) =>
        item.sourceTaskId === id
          ? { ...item, deletedAt: stamp, updatedAt: stamp }
          : item,
      ),
    }));
  };
  return { addTask, advanceTask, updateTask, moveTask, deleteTask };
}
