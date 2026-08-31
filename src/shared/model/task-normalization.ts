import type { AppState } from "./app-state";
import type { BaseEntity, ActivityRecord } from "./entities";
import { addDays, startDateFromDue } from "./factories";
import { normalizeTaskImportance } from "./task-importance";
import { normalizeTaskUrgency } from "./task-urgency";
import { normalizeTaskEffort } from "./task-effort";

type LegacyRoutineTask = BaseEntity &
  Pick<
    ActivityRecord,
    | "title"
    | "description"
    | "estimatedMinutes"
    | "expectedOutput"
    | "importance"
  >;
type StateWithLegacyTasks = AppState & { routineTasks?: LegacyRoutineTask[] };

export function withoutLegacyRoutineTasks(state: AppState): AppState {
  const normalized = { ...state } as StateWithLegacyTasks;
  delete normalized.routineTasks;
  return normalized;
}

export function normalizeTasks(state: AppState): ActivityRecord[] {
  const legacy = (state as StateWithLegacyTasks).routineTasks ?? [];
  const activities = state.activities ?? [];
  const existingIds = new Set(activities.map((task) => task.id));
  const projectScore = (projectId?: string) =>
    state.projects.find((project) => project.id === projectId)?.score ?? 50;
  return [
    ...activities.map((task) => {
      const scores = normalizeTaskImportance(
        task,
        task.importance ?? projectScore(task.projectId),
      );
      return {
        ...task,
        description: task.description ?? "",
        expectedOutput: task.expectedOutput ?? "",
        actualMinutes: task.actualMinutes ?? 0,
        listIds: task.listIds ?? [],
        startDate:
          task.startDate ??
          startDateFromDue(task.dueDate, task.estimatedMinutes ?? 0),
        ...scores,
        ...normalizeTaskUrgency(task),
        ...normalizeTaskEffort(task),
        priority: priorityFromImportance(scores.importance),
        recurrence: task.recurrence ?? null,
        activityType: task.activityType ?? "task",
      };
    }),
    ...legacy
      .filter((task) => !existingIds.has(task.id))
      .map((task): ActivityRecord => {
        const dueDate = `${addDays(new Date(), 1)}T23:59`;
        return {
          ...task,
          ...normalizeTaskImportance({}, task.importance),
          ...normalizeTaskUrgency({}),
          ...normalizeTaskEffort({}),
          dueDate,
          startDate: startDateFromDue(dueDate, task.estimatedMinutes ?? 0),
          priority: priorityFromImportance(
            normalizeTaskImportance({}, task.importance).importance,
          ),
          status: "todo",
          actualMinutes: 0,
          milestone: false,
          recurrence: null,
          activityType: "task",
          listIds: [],
        };
      }),
  ];
}

export function priorityFromImportance(
  importance: number,
): ActivityRecord["priority"] {
  return importance >= 15 ? "high" : importance >= 9 ? "medium" : "low";
}
