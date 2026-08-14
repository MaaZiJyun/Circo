"use client";
import { useEffect, useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type { DailyTask, TaskRecord } from "@/shared/model/entities";
import { createId, now, today } from "@/shared/model/factories";
import { calculateMetrics } from "@/shared/model/metrics";
import { isDailyCacheCleared } from "@/shared/model/daily-cache";
import { priorityFromImportance } from "@/shared/model/task-normalization";
import { taskImportance, taskImportanceDimensions } from "@/shared/model/task-importance";
import { normalizeTaskFactors } from "@/shared/model/task-factors";
import { appendNextRecurringTask } from "@/shared/model/task-recurrence";
import { dailyTaskStatusAt, isOverdue } from "@/shared/model/task-status";
import { useStore } from "@/shared/view-models/store-context";
import { taskCoordinatesFromFormula } from "../model/task-coordinate-formula";
import type { DailyTaskInput } from "../model/daily-task-input";
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
      .filter((item) => item.date === date && !isDailyCacheCleared(state, date))
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
          ...taskImportanceDimensions(source),
          ...normalizeTaskFactors(source),
          projectId: source.projectId,
        };
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { projects, tasks, dailyTasks, profile: state.profile, metrics: calculateMetrics(state) };
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
      importance: taskImportance(input),
      ...taskImportanceDimensions(input),
      ...normalizeTaskFactors(input),
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
    if (task.status === "done" || view?.dailyTasks.some((item) => item.sourceTaskId === task.id)) return;
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
      ...taskImportanceDimensions(task),
      ...normalizeTaskFactors(task),
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
      priority: priorityFromImportance(taskImportance(input)),
      status: "todo",
      estimatedMinutes: input.estimatedMinutes,
      actualMinutes: 0,
      milestone: input.milestone,
      expectedOutput: input.expectedOutput,
      importance: taskImportance(input),
      ...taskImportanceDimensions(input),
      ...normalizeTaskFactors(input),
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
      ...taskImportanceDimensions(source),
      ...normalizeTaskFactors(source),
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
  const setCompleted = (item: DailyTask, completed: boolean) => {
    if (item.completed === completed) return;
    const sourceStatus: TaskRecord["status"] = completed
      ? "done"
      : isOverdue(item.dueAt, false)
        ? "overdue"
        : "todo";
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
  const updateTask = (item: DailyTask, input: DailyTaskInput) => {
    if (!input.title.trim()) return;
    const stamp = now();
    mutate((current) => ({
      ...current,
      tasks: item.sourceTaskId
        ? current.tasks.map((task) =>
            task.id === item.sourceTaskId
              ? {
                  ...task,
                  title: input.title.trim(),
                  description: input.description,
                  dueDate: input.dueAt,
                  estimatedMinutes: input.estimatedMinutes,
                  expectedOutput: input.expectedOutput,
                  importance: taskImportance(input),
                  ...taskImportanceDimensions(input),
                  ...normalizeTaskFactors(input),
                  priority: priorityFromImportance(taskImportance(input)),
                  milestone: input.milestone,
                  recurrence: input.recurrence,
                  updatedAt: stamp,
                }
              : task,
          )
        : current.tasks,
      dailyTasks: current.dailyTasks.map((task) =>
        task.id === item.id
          ? {
              ...task,
              title: input.title.trim(),
              description: input.description,
              dueAt: input.dueAt,
              estimatedMinutes: input.estimatedMinutes,
              expectedOutput: input.expectedOutput,
              importance: taskImportance(input),
              ...taskImportanceDimensions(input),
              ...normalizeTaskFactors(input),
              updatedAt: stamp,
            }
          : task,
      ),
    }));
  };
  const inputFor = (item: DailyTask): DailyTaskInput => {
    const source = item.sourceTaskId
      ? view?.tasks.find((task) => task.id === item.sourceTaskId)
      : undefined;
    return {
      title: item.title,
      description: item.description,
      dueAt: item.dueAt,
      estimatedMinutes: item.estimatedMinutes,
      expectedOutput: item.expectedOutput,
      importance: item.importance,
      ...taskImportanceDimensions(item),
      ...normalizeTaskFactors(source ?? item),
      milestone: source?.milestone ?? false,
      recurrence: source?.recurrence ?? null,
    };
  };
  if (!view) return null;
  return {
    ...view,
    addIndependent,
    retrieve,
    setCompleted,
    toggle: (item: DailyTask) => setCompleted(item, !item.completed),
    updateTask,
    inputFor,
    statusFor: (item: DailyTask): TaskRecord["status"] => {
      const deadlineStatus = dailyTaskStatusAt(item);
      if (deadlineStatus !== "todo") return deadlineStatus;
      return item.sourceTaskId &&
        view.tasks.find((task) => task.id === item.sourceTaskId)?.status ===
          "doing"
        ? "doing"
        : "todo";
    },
    deleteTask: (id: string) => softDelete("dailyTasks", id),
    projectName: (id?: string) =>
      view.projects.find((item) => item.id === id)?.name ?? "",
    coordinates: (item: DailyTask) => taskCoordinatesFromFormula(item, state?.profile.matrixFormulas, Date.now(), view.dailyTasks),
  };
}
