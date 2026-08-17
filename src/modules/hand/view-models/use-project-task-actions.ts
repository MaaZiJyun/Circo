"use client";

import type { ProjectRecord, TaskRecord } from "@/shared/model/entities";
import { createId, estimateMinutes, now } from "@/shared/model/factories";
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

const isLockedCompletedPastTask = (task: TaskRecord) =>
  task.status === "done" && task.dueDate.slice(0, 10) < today();

export function useProjectTaskActions(selected?: ProjectRecord) {
  const { mutate } = useStore();
  const addTask = (input: TaskInput) => {
    if (!selected) return;
    const stamp = now();
    const task: TaskRecord = {
      id: createId("task"),
      projectId: selected.id,
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
  };
  const duplicateTask = (task: TaskRecord) => {
    if (!selected) return;
    addTask({
      title: task.title,
      description: task.description,
      startDate: task.startDate,
      dueDate: "",
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
              estimatedMinutes: estimateMinutes(input.startDate, input.dueDate),
              importance: taskImportance(input),
              priority: priorityFromImportance(taskImportance(input)),
              updatedAt: now(),
            }
          : item,
      ),
    }));
  const moveTask = (id: string, projectId: string) => {
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
  return { addTask, duplicateTask, advanceTask, updateTask, moveTask, deleteTask, setTaskParent };
}
