"use client";

import type { ActivityType, ProjectRecord, ActivityRecord } from "@/shared/model/entities";
import type { ActivityConditionDraft } from "@/shared/model/activity-conditions";
import {
  replaceActivityConditions,
  setActivityConditionSatisfied,
} from "@/shared/model/activity-conditions";
import { createId, now } from "@/shared/model/factories";
import {
  deleteRecurringTasks,
  type RecurringDeleteMode,
} from "@/shared/model/task-recurrence";
import { priorityFromImportance } from "@/shared/model/task-normalization";
import { taskImportance } from "@/shared/model/task-importance";
import { setTaskParents } from "@/shared/model/task-hierarchy";
import { completeTask } from "@/shared/model/task-lifecycle";
import { archiveTask, isArchivedTask, unarchiveTask } from "@/shared/model/task-archive";
import { useStore } from "@/shared/view-models/store-context";

export type ActivityInput = Pick<
  ActivityRecord,
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
> & { activityType?: ActivityType };

export type GanttTaskPatch = Partial<
  Pick<
    ActivityRecord,
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

export function activityInput(task: ActivityRecord): ActivityInput {
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
    activityType: task.activityType ?? "task",
  };
}

export function useProjectTaskActions(selected?: ProjectRecord) {
  const { mutate } = useStore();
  const createTask = (
    input: ActivityInput,
    projectId?: string,
    conditionDrafts: ActivityConditionDraft[] = [],
  ) => {
    const stamp = now();
    const task: ActivityRecord = {
      id: createId("task"),
      ...(projectId ? { projectId } : {}),
      ...input,
      activityType: input.activityType ?? "task",
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
    mutate((current) => ({
      ...current,
      activities: [...current.activities, task],
      activityConditions: [
        ...current.activityConditions,
        ...replaceActivityConditions([], task.id, conditionDrafts),
      ],
    }));
  };
  const addTask = (
    input: ActivityInput,
    conditionDrafts: ActivityConditionDraft[] = [],
  ) => {
    if (!selected) return;
    createTask(input, selected.id, conditionDrafts);
  };
  const duplicateTask = (task: ActivityRecord) => {
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
      activityType: task.activityType ?? "task",
    });
  };
  const advanceTask = (task: ActivityRecord) => {
    if (isArchivedTask(task)) return;
    const status: ActivityRecord["status"] =
      task.status === "todo"
        ? "doing"
        : task.status === "doing"
          ? "done"
          : task.status === "overdue"
            ? "done"
            : "todo";
    const stamp = now();
    mutate((current) => {
      const activities = current.activities.map((item) =>
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
      if (status === "done") {
        const completed = completeTask({ ...current, activities }, task.id, stamp);
        return {
          ...completed,
        };
      }
      return {
        ...current,
        activities,
      };
    });
  };
  const updateTask = (
    id: string,
    input: ActivityInput,
    conditionDrafts?: ActivityConditionDraft[],
  ) =>
    mutate((current) => {
      const task = current.activities.find((item) => item.id === id);
      if (!task || task.archivedAt) return current;
      const stamp = now();
      return {
        ...current,
        activities: current.activities.map((item) =>
          item.id === id
            ? {
                ...item,
                ...input,
                estimatedMinutes: input.estimatedMinutes,
                importance: taskImportance(input),
                priority: priorityFromImportance(taskImportance(input)),
                updatedAt: stamp,
              }
            : item,
        ),
        ...(conditionDrafts
          ? {
              activityConditions: replaceActivityConditions(
                current.activityConditions,
                id,
                conditionDrafts,
              ),
            }
          : {}),
      };
    });
  const toggleActivityCondition = (id: string, satisfied: boolean) =>
    mutate((current) => {
      const condition = current.activityConditions.find((item) => item.id === id);
      const task = current.activities.find((item) => item.id === condition?.activityId);
      if (!condition || !task || task.archivedAt) return current;
      return {
        ...current,
        activityConditions: setActivityConditionSatisfied(
          current.activityConditions,
          id,
          satisfied,
          now(),
        ),
      };
    });
  const updateActivityConditions = (
    activityId: string,
    conditionDrafts: ActivityConditionDraft[],
  ) =>
    mutate((current) => {
      const task = current.activities.find((item) => item.id === activityId);
      if (!task || task.archivedAt) return current;
      return {
        ...current,
        activityConditions: replaceActivityConditions(
          current.activityConditions,
          activityId,
          conditionDrafts,
        ),
      };
    });
  const updateTaskFromGantt = (id: string, patch: GanttTaskPatch) => {
    const stamp = now();
    mutate((current) => {
      const previous = current.activities.find((task) => task.id === id);
      if (!previous || previous.archivedAt) return current;

      const nextStatus = patch.status ?? previous.status;
      const completedAt =
        nextStatus === "done" ? previous.completedAt ?? stamp : undefined;
      const actualStartedAt =
        patch.actualStartedAt ??
        (nextStatus !== "todo" ||
        (patch.actualMinutes ?? previous.actualMinutes) > 0
          ? previous.actualStartedAt ?? stamp
          : previous.actualStartedAt);
      const nextImportance = taskImportance({ ...previous, ...patch });
      const updatedTasks = current.activities.map((task) =>
        task.id === id
          ? {
              ...task,
              ...patch,
              importance: nextImportance,
              priority: priorityFromImportance(nextImportance),
              actualStartedAt,
              completedAt,
              updatedAt: stamp,
            }
          : task,
      );
      if (nextStatus === "done") {
        const completed = completeTask({ ...current, activities: updatedTasks }, id, stamp);
        return {
          ...completed,
        };
      }

      return {
        ...current,
        activities: updatedTasks,
      };
    });
  };
  const moveTask = (id: string, projectId?: string) => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      activities: current.activities.map((item) =>
        item.id === id && !item.archivedAt
          ? { ...item, projectId, updatedAt: stamp }
          : item,
      ),
    }));
  };
  const deleteTask = (id: string, mode: RecurringDeleteMode = "series") => {
    const stamp = now();
    mutate((current) => {
      if (current.activities.find((task) => task.id === id)?.archivedAt) return current;
      const result = deleteRecurringTasks(current.activities, id, mode, stamp);
      return {
        ...current,
        activities: result.activities,
      };
    });
  };
  const archive = (id: string) =>
    mutate((current) => archiveTask(current, id, now()));
  const unarchive = (id: string) =>
    mutate((current) => unarchiveTask(current, id, now()));
  const setTaskParent = (ids: string[], parentId: string | null) =>
    mutate((current) => {
      const editableIds = ids.filter(
        (id) => !current.activities.find((task) => task.id === id)?.archivedAt,
      );
      return {
        ...current,
        activities: setTaskParents(current.activities, editableIds, parentId, now()),
      };
    });
  return {
    createTask,
    addTask,
    duplicateTask,
    advanceTask,
    updateTask,
    toggleActivityCondition,
    updateActivityConditions,
    updateTaskFromGantt,
    moveTask,
    deleteTask,
    archiveTask: archive,
    unarchiveTask: unarchive,
    setTaskParent,
  };
}
