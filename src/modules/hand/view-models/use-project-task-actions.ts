"use client";

import type { ProjectRecord, TaskRecord } from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { today } from "@/shared/model/factories";
import { appendNextRecurringTask } from "@/shared/model/task-recurrence";
import { priorityFromImportance } from "@/shared/model/task-normalization";
import { taskImportance } from "@/shared/model/task-importance";
import { setTaskParents } from "@/shared/model/task-hierarchy";
import { useStore } from "@/shared/view-models/store-context";

export type TaskInput = Pick<
  TaskRecord,
  | "title"
  | "description"
  | "startDate"
  | "dueDate"
  | "estimatedMinutes"
  | "expectedOutput"
  | "milestone"
  | "importance"
  | "impact"
  | "goal"
  | "risk"
  | "value"
  | "delayLoss"
  | "dependencyIds"
  | "complexity"
  | "uncertainty"
  | "recurrence"
  | "parentId"
>;

export type GanttTaskPatch = Partial<
  Pick<
    TaskRecord,
    | "title"
    | "description"
    | "startDate"
    | "dueDate"
    | "estimatedMinutes"
    | "actualMinutes"
    | "actualStartedAt"
    | "status"
    | "milestone"
    | "expectedOutput"
    | "dependencyIds"
  >
>;

export function taskInput(task: TaskRecord): TaskInput {
  return {
    title: task.title,
    description: task.description,
    startDate: task.startDate,
    dueDate: task.dueDate,
    estimatedMinutes: task.estimatedMinutes,
    expectedOutput: task.expectedOutput,
    milestone: task.milestone,
    importance: task.importance,
    impact: task.impact,
    goal: task.goal,
    risk: task.risk,
    value: task.value,
    delayLoss: task.delayLoss,
    dependencyIds: task.dependencyIds,
    complexity: task.complexity,
    uncertainty: task.uncertainty,
    recurrence: task.recurrence,
    parentId: task.parentId,
  };
}

const isLockedCompletedPastTask = (task: TaskRecord) =>
  task.status === "done" && task.dueDate.slice(0, 10) < today();

export function useProjectTaskActions(selected?: ProjectRecord) {
  const { mutate } = useStore();
  const createTask = (input: TaskInput, projectId?: string) => {
    const stamp = now();
    const task: TaskRecord = {
      id: createId("task"),
      ...(projectId ? { projectId } : {}),
      ...input,
      listIds: [],
      estimatedMinutes: input.estimatedMinutes,
      importance: taskImportance(input),
      priority: priorityFromImportance(taskImportance(input)),
      status: "todo",
      actualMinutes: 0,
      actualStartedAt: undefined,
      completedAt: undefined,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({ ...current, tasks: [...current.tasks, task] }));
  };
  const addTask = (input: TaskInput) => {
    if (!selected) return;
    createTask(input, selected.id);
  };
  const duplicateTask = (task: TaskRecord) => {
    if (!selected) return;
    addTask({
      title: task.title,
      description: task.description,
      startDate: task.startDate,
      dueDate: "",
      estimatedMinutes: task.estimatedMinutes,
      expectedOutput: task.expectedOutput,
      milestone: task.milestone,
      importance: task.importance,
      impact: task.impact,
      goal: task.goal,
      risk: task.risk,
      value: task.value,
      delayLoss: task.delayLoss,
      dependencyIds: task.dependencyIds,
      complexity: task.complexity,
      uncertainty: task.uncertainty,
      recurrence: task.recurrence,
      parentId: task.parentId,
    });
  };
  const advanceTask = (task: TaskRecord) => {
    if (isLockedCompletedPastTask(task)) return;
    const status: TaskRecord["status"] =
      task.status === "todo"
        ? "doing"
        : task.status === "doing"
          ? "done"
          : task.status === "overdue"
            ? "done"
            : "todo";
    const stamp = now();
    mutate((current) => {
      const tasks = current.tasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status,
              actualMinutes:
                status === "done" && !item.actualMinutes
                  ? item.estimatedMinutes
                  : item.actualMinutes,
              actualStartedAt:
                status !== "todo" || item.actualMinutes > 0
                  ? item.actualStartedAt ?? stamp
                  : item.actualStartedAt,
              updatedAt: stamp,
              completedAt: status === "done" ? stamp : undefined,
            }
          : item,
      );
      return {
        ...current,
        tasks:
          status === "done"
            ? appendNextRecurringTask(tasks, task.id, stamp)
            : tasks,
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
      };
    });
  };
  const updateTask = (id: string, input: TaskInput) =>
    mutate((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        item.id === id && !isLockedCompletedPastTask(item)
          ? {
              ...item,
              ...input,
              estimatedMinutes: input.estimatedMinutes,
              importance: taskImportance(input),
              priority: priorityFromImportance(taskImportance(input)),
              updatedAt: now(),
            }
          : item,
      ),
    }));
  const updateTaskFromGantt = (id: string, patch: GanttTaskPatch) => {
    const stamp = now();
    mutate((current) => {
      const previous = current.tasks.find((task) => task.id === id);
      if (!previous || isLockedCompletedPastTask(previous)) return current;

      const nextStatus = patch.status ?? previous.status;
      const completedAt =
        nextStatus === "done" ? previous.completedAt ?? stamp : undefined;
      const actualStartedAt =
        patch.actualStartedAt ??
        (nextStatus !== "todo" ||
        (patch.actualMinutes ?? previous.actualMinutes) > 0
          ? previous.actualStartedAt ?? stamp
          : previous.actualStartedAt);
      const updatedTasks = current.tasks.map((task) =>
        task.id === id
          ? { ...task, ...patch, actualStartedAt, completedAt, updatedAt: stamp }
          : task,
      );

      return {
        ...current,
        tasks:
          previous.status !== "done" && nextStatus === "done"
            ? appendNextRecurringTask(updatedTasks, id, stamp)
            : updatedTasks,
        dailyTasks: current.dailyTasks.map((task) =>
          task.sourceTaskId === id && task.date === today()
            ? {
                ...task,
                completed: nextStatus === "done",
                completedAt: nextStatus === "done" ? completedAt : undefined,
                updatedAt: stamp,
              }
            : task,
        ),
      };
    });
  };
  const moveTask = (id: string, projectId?: string) => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        item.id === id && !isLockedCompletedPastTask(item)
          ? { ...item, projectId, updatedAt: stamp }
          : item,
      ),
      dailyTasks: current.dailyTasks.map((item) =>
        item.sourceTaskId === id &&
        !current.tasks.some(
          (task) => task.id === id && isLockedCompletedPastTask(task),
        )
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
  const setTaskParent = (ids: string[], parentId: string | null) =>
    mutate((current) => {
      return {
        ...current,
        tasks: setTaskParents(current.tasks, ids, parentId, now()),
      };
    });
  return {
    createTask,
    addTask,
    duplicateTask,
    advanceTask,
    updateTask,
    updateTaskFromGantt,
    moveTask,
    deleteTask,
    setTaskParent,
  };
}
