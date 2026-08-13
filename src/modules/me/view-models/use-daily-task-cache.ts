"use client";

import { useEffect, useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type { DailyTask, TaskRecord } from "@/shared/model/entities";
import { createId, now, today } from "@/shared/model/factories";
import { calculateMetrics } from "@/shared/model/metrics";
import { priorityFromImportance } from "@/shared/model/task-normalization";
import { appendNextRecurringTask } from "@/shared/model/task-recurrence";
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
> &
  Pick<TaskRecord, "milestone" | "recurrence">;

export function useDailyTaskCache() {
  const { state, mutate, softDelete } = useStore();
  const [date, setDate] = useState(today());
  useEffect(() => {
    let timer = 0;
    const scheduleReset = () => {
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      timer = window.setTimeout(
        () => {
          setDate(today());
          scheduleReset();
        },
        nextMidnight.getTime() - Date.now() + 50,
      );
    };
    scheduleReset();
    return () => window.clearTimeout(timer);
  }, []);
  const view = useMemo(() => {
    if (!state) return null;
    const projects = activeItems(state.projects);
    const tasks = activeItems(state.tasks);
    const taskById = new Map(tasks.map((task) => [task.id, task]));
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
          completed: source.projectId
            ? source.status === "done"
            : item.completed,
          completedAt: source.projectId ? source.completedAt : item.completedAt,
          dueAt:
            source.projectId
              ? source.dueDate.length === 10
                ? `${source.dueDate}T23:59`
                : source.dueDate
              : item.dueAt,
          estimatedMinutes: source.estimatedMinutes,
          expectedOutput: source.expectedOutput,
          importance: source.importance,
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
      completed: source?.projectId ? source.status === "done" : false,
      completedAt: source?.projectId ? source.completedAt : undefined,
      dueAt: input.dueAt,
      estimatedMinutes: input.estimatedMinutes,
      actualMinutes: 0,
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
      dueAt: task.projectId
        ? task.dueDate.length === 10
          ? `${task.dueDate}T23:59`
          : task.dueDate
        : `${date}T${task.dueDate.split("T")[1] ?? "23:59"}`,
      estimatedMinutes: task.estimatedMinutes,
      expectedOutput: task.expectedOutput,
      importance:
        task.importance ??
        view?.projects.find((item) => item.id === task.projectId)?.score ??
        50,
      sourceTaskId: task.id,
      projectId: task.projectId,
      milestone: task.milestone,
      recurrence: task.recurrence,
    });
  };
  const addIndependent = (input: DailyTaskInput) => {
    if (!input.title.trim()) return;
    const stamp = now();
    const source: TaskRecord = {
      id: createId("task"),
      title: input.title.trim(),
      description: input.description,
      dueDate: input.dueAt,
      priority: priorityFromImportance(input.importance),
      status: "todo",
      estimatedMinutes: input.estimatedMinutes,
      actualMinutes: 0,
      milestone: input.milestone,
      expectedOutput: input.expectedOutput,
      importance: input.importance,
      recurrence: input.recurrence,
      createdAt: stamp,
      updatedAt: stamp,
    };
    const dailyTask: DailyTask = {
      id: createId("daily_task"),
      date,
      title: source.title,
      description: source.description,
      completed: false,
      dueAt: source.dueDate,
      estimatedMinutes: source.estimatedMinutes,
      actualMinutes: 0,
      expectedOutput: source.expectedOutput,
      importance: source.importance,
      sourceTaskId: source.id,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      tasks: [...current.tasks, source],
      dailyTasks: [...current.dailyTasks, dailyTask],
    }));
  };
  const toggle = (item: DailyTask) => {
    const completed = !item.completed;
    const sourceStatus: TaskRecord["status"] = completed ? "done" : "todo";
    const stamp = now();
    mutate((current) => {
      const tasks = item.sourceTaskId
        ? current.tasks.map((task) =>
            task.id === item.sourceTaskId
              ? {
                  ...task,
                  status: sourceStatus,
                  completedAt: completed ? stamp : undefined,
                  updatedAt: stamp,
                }
              : task,
          )
        : current.tasks;
      const nextTasks =
        completed && item.sourceTaskId
          ? appendNextRecurringTask(tasks, item.sourceTaskId, stamp)
          : tasks;
      return {
        ...current,
        tasks: nextTasks,
        dailyTasks: current.dailyTasks.map((task) =>
          task.id === item.id
            ? {
                ...task,
                completed,
                completedAt: completed ? stamp : undefined,
                updatedAt: stamp,
              }
            : task,
        ),
      };
    });
  };

  if (!view) return null;
  return {
    ...view,
    date,
    setDate,
    addIndependent,
    retrieve,
    toggle,
    deleteTask: (id: string) => softDelete("dailyTasks", id),
    projectName: (id?: string) =>
      view.projects.find((item) => item.id === id)?.name ?? "",
    coordinates: (item: DailyTask) =>
      taskCoordinates(item.dueAt, item.estimatedMinutes, item.importance),
  };
}
