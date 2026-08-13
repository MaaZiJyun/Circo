"use client";

import { useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type { DailyTask, TaskRecord } from "@/shared/model/entities";
import { createId, now, today } from "@/shared/model/factories";
import { calculateMetrics } from "@/shared/model/metrics";
import { useStore } from "@/shared/view-models/store-context";
import { taskCoordinates } from "../model/task-quadrant";

export type DailyTaskInput = Pick<
  DailyTask,
  | "title"
  | "description"
  | "dueAt"
  | "estimatedMinutes"
  | "expectedOutput"
  | "importance"
>;

export function useDailyTaskCache() {
  const { state, mutate, softDelete } = useStore();
  const [date, setDate] = useState(today());
  const view = useMemo(() => {
    if (!state) return null;
    const projects = activeItems(state.projects);
    const tasks = activeItems(state.tasks);
    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const projectById = new Map(
      projects.map((project) => [project.id, project]),
    );
    const dailyTasks = activeItems(state.dailyTasks)
      .filter((item) => item.date === date)
      .map((item) => {
        const source = item.sourceTaskId
          ? taskById.get(item.sourceTaskId)
          : undefined;
        if (!source) return item;
        return {
          ...item,
          title: source.title,
          description: source.description,
          completed: source.status === "done",
          completedAt: source.completedAt,
          dueAt:
            source.dueDate.length === 10
              ? `${source.dueDate}T23:59`
              : source.dueDate,
          estimatedMinutes: source.estimatedMinutes,
          expectedOutput: source.expectedOutput,
          importance:
            projectById.get(source.projectId)?.score ?? item.importance,
          projectId: source.projectId,
        };
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { projects, tasks, dailyTasks, metrics: calculateMetrics(state) };
  }, [date, state]);

  const add = (
    input: DailyTaskInput & Pick<DailyTask, "sourceTaskId" | "projectId">,
  ) => {
    if (!input.title.trim()) return;
    const stamp = now();
    const source = input.sourceTaskId
      ? view?.tasks.find((task) => task.id === input.sourceTaskId)
      : undefined;
    const item: DailyTask = {
      id: createId("daily_task"),
      date,
      title: input.title.trim(),
      description: input.description,
      completed: source?.status === "done",
      completedAt: source?.completedAt,
      dueAt: input.dueAt,
      estimatedMinutes: input.estimatedMinutes,
      expectedOutput: input.expectedOutput,
      importance: input.importance,
      sourceTaskId: input.sourceTaskId,
      projectId: input.projectId,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      dailyTasks: [...current.dailyTasks, item],
    }));
  };
  const retrieve = (task: TaskRecord) => {
    if (view?.dailyTasks.some((item) => item.sourceTaskId === task.id)) return;
    add({
      title: task.title,
      description: task.description,
      dueAt:
        task.dueDate.length === 10 ? `${task.dueDate}T23:59` : task.dueDate,
      estimatedMinutes: task.estimatedMinutes,
      expectedOutput: task.expectedOutput,
      importance:
        view?.projects.find((item) => item.id === task.projectId)?.score ?? 50,
      sourceTaskId: task.id,
      projectId: task.projectId,
    });
  };
  const toggle = (item: DailyTask) => {
    const completed = !item.completed;
    const stamp = now();
    mutate((current) => ({
      ...current,
      tasks: item.sourceTaskId
        ? current.tasks.map((task) =>
            task.id === item.sourceTaskId
              ? {
                  ...task,
                  status: completed ? "done" : "todo",
                  completedAt: completed ? stamp : undefined,
                  updatedAt: stamp,
                }
              : task,
          )
        : current.tasks,
      dailyTasks: current.dailyTasks.map((task) =>
        (item.sourceTaskId && task.sourceTaskId === item.sourceTaskId) ||
        task.id === item.id
          ? {
              ...task,
              completed,
              completedAt: completed ? stamp : undefined,
              updatedAt: stamp,
            }
          : task,
      ),
    }));
  };

  if (!view) return null;
  return {
    ...view,
    date,
    setDate,
    addIndependent: (input: DailyTaskInput) => add(input),
    retrieve,
    toggle,
    deleteTask: (id: string) => softDelete("dailyTasks", id),
    projectName: (id?: string) =>
      view.projects.find((item) => item.id === id)?.name ?? "",
    coordinates: (item: DailyTask) =>
      taskCoordinates(item.dueAt, item.estimatedMinutes, item.importance),
  };
}
