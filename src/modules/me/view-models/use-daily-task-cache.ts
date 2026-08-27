"use client";

import { useEffect, useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type { DailyTask, TaskRecord } from "@/shared/model/entities";
import { createId, estimateMinutes, now, startDateFromDue, today } from "@/shared/model/factories";
import { calculateMetrics } from "@/shared/model/metrics";
import { readDailyTaskIds, writeDailyTaskIds } from "@/shared/model/daily-task-local-storage";
import { priorityFromImportance } from "@/shared/model/task-normalization";
import { taskImportance, taskImportanceDimensions } from "@/shared/model/task-importance";
import { normalizeTaskFactors } from "@/shared/model/task-factors";
import { dailyTaskStatusAt } from "@/shared/model/task-status";
import { completeTask } from "@/shared/model/task-history";
import { useStore } from "@/shared/view-models/store-context";
import { taskCoordinatesFromFormula } from "../model/task-coordinate-formula";
import { setTaskParents } from "@/shared/model/task-hierarchy";
import type { DailyTaskInput } from "../model/daily-task-input";
import type { TaskInput } from "@/modules/hand/view-models/use-hand-view-model";

function taskAsDaily(task: TaskRecord, date: string): DailyTask {
  return {
    ...task,
    id: task.id,
    date,
    completed: task.status === "done",
    dueAt: task.dueDate.length === 10 ? task.dueDate + "T23:59" : task.dueDate,
    sourceTaskId: task.id,
    projectId: task.projectId,
  };
}

export function useDailyTaskCache() {
  const { state, mutate } = useStore();
  const [date, setDate] = useState(today());
  const [taskIds, setTaskIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = readDailyTaskIds(date);
    const legacy = state?.dailyTasks
      ?.filter((item) => item.date === date && !item.deletedAt)
      .map((item) => item.sourceTaskId ?? item.id) ?? [];
    const ids = stored.length ? stored : legacy;
    const timer = window.setTimeout(() => setTaskIds(ids), 0);
    if (ids.length && !stored.length) writeDailyTaskIds(date, ids);
    return () => window.clearTimeout(timer);
  }, [date, state]);

  useEffect(() => {
    const refresh = () => setTaskIds(readDailyTaskIds(date));
    window.addEventListener("circo-daily-cache-changed", refresh);
    return () => window.removeEventListener("circo-daily-cache-changed", refresh);
  }, [date]);

  useEffect(() => {
    let timer = 0;
    const scheduleReset = () => {
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      timer = window.setTimeout(() => {
        setDate(today());
        scheduleReset();
      }, nextMidnight.getTime() - Date.now() + 50);
    };
    scheduleReset();
    return () => window.clearTimeout(timer);
  }, []);

  const view = useMemo(() => {
    if (!state) return null;
    const tasks = activeItems(state.tasks);
    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const dailyTasks = taskIds
      .map((id) => taskById.get(id))
      .filter((task): task is TaskRecord => Boolean(task))
      .map((task) => taskAsDaily(task, date));
    const currentTime = Date.parse(date);
    const sorted = dailyTasks.slice().sort((a, b) => {
      const priorityA = taskCoordinatesFromFormula(a, state.profile.matrixFormulas, currentTime, dailyTasks).priority;
      const priorityB = taskCoordinatesFromFormula(b, state.profile.matrixFormulas, currentTime, dailyTasks).priority;
      return priorityB - priorityA || a.createdAt.localeCompare(b.createdAt);
    });
    return {
      projects: activeItems(state.projects),
      tasks,
      dailyTasks: sorted,
      profile: state.profile,
      metrics: calculateMetrics(state),
    };
  }, [date, state, taskIds]);

  const saveIds = (next: string[]) => {
    const unique = [...new Set(next)];
    setTaskIds(unique);
    writeDailyTaskIds(date, unique);
  };

  const retrieve = (task: TaskRecord) => {
    if (task.status === "done" || taskIds.includes(task.id)) return;
    saveIds([...taskIds, task.id]);
  };

  const addIndependent = (input: DailyTaskInput) => {
    if (!input.title.trim()) return;
    const stamp = now();
    const source: TaskRecord = {
      id: createId("task"),
      title: input.title.trim(),
      description: input.description,
      startDate: startDateFromDue(input.dueAt, input.estimatedMinutes),
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
    mutate((current) => ({ ...current, tasks: [...current.tasks, source] }));
    saveIds([...taskIds, source.id]);
  };

  const addSubtask = (parent: TaskRecord, input: TaskInput) => {
    const stamp = now();
    const task: TaskRecord = {
      id: createId("task"),
      projectId: parent.projectId,
      parentId: parent.id,
      ...input,
      estimatedMinutes: estimateMinutes(input.startDate, input.dueDate),
      importance: taskImportance(input),
      priority: priorityFromImportance(taskImportance(input)),
      status: "todo",
      actualMinutes: 0,
      completedAt: undefined,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({ ...current, tasks: [...current.tasks, task] }));
    saveIds([...taskIds, task.id]);
  };

  const setTaskParent = (ids: string[], parentId: string | null) =>
    mutate((current) => ({ ...current, tasks: setTaskParents(current.tasks, ids, parentId, now()) }));

  const setCompleted = (item: DailyTask, completed: boolean) => {
    if (item.completed === completed || !item.sourceTaskId) return;
    const stamp = now();
    if (completed) {
      mutate((current) => completeTask(current, item.sourceTaskId!, stamp));
      saveIds(taskIds.filter((id) => id !== item.sourceTaskId));
      return;
    }
    mutate((current) => {
      const history = (current.taskHistory ?? []).find((task) => task.id === item.sourceTaskId);
      if (!history) return current;
      return {
        ...current,
        tasks: [...current.tasks, { ...history, status: "todo" as const, completedAt: undefined, updatedAt: stamp }],
        taskHistory: current.taskHistory.filter((task) => task.id !== history.id),
      };
    });
  };

  const updateTask = (item: DailyTask, input: DailyTaskInput) => {
    if (!input.title.trim() || !item.sourceTaskId) return;
    const stamp = now();
    mutate((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === item.sourceTaskId
          ? {
              ...task,
              title: input.title.trim(),
              description: input.description,
              startDate: startDateFromDue(input.dueAt, input.estimatedMinutes),
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
      ),
    }));
  };

  const inputFor = (item: DailyTask): DailyTaskInput => ({
    title: item.title,
    description: item.description,
    dueAt: item.dueAt,
    estimatedMinutes: item.estimatedMinutes,
    expectedOutput: item.expectedOutput,
    importance: item.importance,
    ...taskImportanceDimensions(item),
    ...normalizeTaskFactors(item),
    milestone: false,
    recurrence: null,
  });

  if (!view) return null;
  return {
    ...view,
    addIndependent,
    addSubtask,
    setTaskParent,
    retrieve,
    setCompleted,
    toggle: (item: DailyTask) => setCompleted(item, !item.completed),
    updateTask,
    inputFor,
    statusFor: (item: DailyTask): TaskRecord["status"] => dailyTaskStatusAt(item),
    deleteTask: (id: string) => saveIds(taskIds.filter((item) => item !== id)),
    projectName: (id?: string) => view.projects.find((project) => project.id === id)?.name ?? "",
    coordinates: (item: DailyTask) => taskCoordinatesFromFormula(item, state?.profile.matrixFormulas, Date.now(), view.dailyTasks),
  };
}
