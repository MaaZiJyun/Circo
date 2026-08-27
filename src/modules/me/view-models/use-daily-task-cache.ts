"use client";

import { useEffect, useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type { DailyTask, ActivityRecord } from "@/shared/model/entities";
import { createId, estimateMinutes, now, startDateFromDue, today } from "@/shared/model/factories";
import { calculateMetrics } from "@/shared/model/metrics";
import {
  clearCompletedDueDailyTaskDate,
  isDailyTaskDateCleared,
  readDailyTaskIds,
  writeDailyTaskIds,
} from "@/shared/model/daily-task-local-storage";
import { priorityFromImportance } from "@/shared/model/task-normalization";
import { taskImportance, taskImportanceDimensions } from "@/shared/model/task-importance";
import { normalizeTaskFactors } from "@/shared/model/task-factors";
import { dailyTaskStatusAt } from "@/shared/model/task-status";
import { completeTask } from "@/shared/model/task-lifecycle";
import { archiveTask as archiveTaskRecord } from "@/shared/model/task-archive";
import { useStore } from "@/shared/view-models/store-context";
import { taskCoordinatesFromFormula } from "../model/task-coordinate-formula";
import { setTaskParents } from "@/shared/model/task-hierarchy";
import type { DailyTaskInput } from "../model/daily-task-input";
import type { ActivityInput } from "@/modules/hand/view-models/use-hand-view-model";

function taskAsDaily(task: ActivityRecord, date: string): DailyTask {
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
    const ids = stored.length || isDailyTaskDateCleared(date) ? stored : legacy;
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
        const settledDate = date;
        const nextDate = today();
        const activitiesById = new Map(
          (state?.activities ?? []).map((activity) => [activity.id, activity]),
        );
        const idsToKeep = taskIds.filter((id) => {
          const activity = activitiesById.get(id);
          if (!activity || activity.archivedAt) return false;
          const dueDate = activity.dueDate.slice(0, 10);
          return activity.status !== "done" || dueDate > settledDate;
        });
        clearCompletedDueDailyTaskDate(settledDate, idsToKeep);
        setDate(nextDate);
        scheduleReset();
      }, nextMidnight.getTime() - Date.now() + 50);
    };
    scheduleReset();
    return () => window.clearTimeout(timer);
  }, [date, state, taskIds]);

  const view = useMemo(() => {
    if (!state) return null;
    const activities = activeItems(state.activities).filter((task) => !task.archivedAt);
    const taskById = new Map(activities.map((task) => [task.id, task]));
    const dailyTasks = taskIds
      .map((id) => taskById.get(id))
      .filter((task): task is ActivityRecord => Boolean(task))
      .map((task) => taskAsDaily(task, date));
    const currentTime = Date.parse(date);
    const sorted = dailyTasks.slice().sort((a, b) => {
      const priorityA = taskCoordinatesFromFormula(a, state.profile.matrixFormulas, currentTime, dailyTasks).priority;
      const priorityB = taskCoordinatesFromFormula(b, state.profile.matrixFormulas, currentTime, dailyTasks).priority;
      return priorityB - priorityA || a.createdAt.localeCompare(b.createdAt);
    });
    return {
      projects: activeItems(state.projects),
      activities,
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

  const retrieve = (task: ActivityRecord) => {
    if (task.archivedAt || task.status === "done" || taskIds.includes(task.id)) return;
    saveIds([...taskIds, task.id]);
  };

  const addIndependent = (input: DailyTaskInput) => {
    if (!input.title.trim()) return;
    const stamp = now();
    const source: ActivityRecord = {
      id: createId("task"),
      title: input.title.trim(),
      description: input.description,
      startDate: startDateFromDue(input.dueAt, input.estimatedMinutes),
      dueDate: input.dueAt,
      priority: priorityFromImportance(taskImportance(input)),
      status: "todo",
      activityType: "task",
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
    mutate((current) => ({ ...current, activities: [...current.activities, source] }));
    saveIds([...taskIds, source.id]);
  };

  const addSubtask = (parent: ActivityRecord, input: ActivityInput) => {
    const stamp = now();
    const task: ActivityRecord = {
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
    mutate((current) => ({ ...current, activities: [...current.activities, task] }));
    saveIds([...taskIds, task.id]);
  };

  const setTaskParent = (ids: string[], parentId: string | null) =>
    mutate((current) => ({
      ...current,
      activities: setTaskParents(
        current.activities,
        ids.filter((id) => !current.activities.find((task) => task.id === id)?.archivedAt),
        parentId,
        now(),
      ),
    }));

  const setCompleted = (item: DailyTask, completed: boolean) => {
    if (item.completed === completed || !item.sourceTaskId) return;
    const stamp = now();
    if (completed) {
      mutate((current) => completeTask(current, item.sourceTaskId!, stamp));
      return;
    }
    mutate((current) => {
      return {
        ...current,
        activities: current.activities.map((task) =>
          task.id === item.sourceTaskId && !task.archivedAt
            ? { ...task, status: "todo" as const, completedAt: undefined, updatedAt: stamp }
            : task,
        ),
      };
    });
  };

  const updateTask = (item: DailyTask, input: DailyTaskInput) => {
    if (!input.title.trim() || !item.sourceTaskId) return;
    const stamp = now();
    mutate((current) => ({
      ...current,
      activities: current.activities.map((task) =>
        task.id === item.sourceTaskId && !task.archivedAt
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
    archiveTask: (id: string) =>
      mutate((current) => archiveTaskRecord(current, id, now())),
    statusFor: (item: DailyTask): ActivityRecord["status"] => dailyTaskStatusAt(item),
    deleteTask: (id: string) => saveIds(taskIds.filter((item) => item !== id)),
    projectName: (id?: string) => view.projects.find((project) => project.id === id)?.name ?? "",
    coordinates: (item: DailyTask) => taskCoordinatesFromFormula(item, state?.profile.matrixFormulas, Date.now(), view.dailyTasks),
  };
}
