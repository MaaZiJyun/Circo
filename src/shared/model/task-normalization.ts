import type { AppState } from "./app-state";
import type { BaseEntity, TaskRecord } from "./entities";
import { addDays } from "./factories";

type LegacyRoutineTask = BaseEntity &
  Pick<
    TaskRecord,
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

export function normalizeTasks(state: AppState): TaskRecord[] {
  const legacy = (state as StateWithLegacyTasks).routineTasks ?? [];
  const existingIds = new Set(state.tasks.map((task) => task.id));
  const projectScore = (projectId?: string) =>
    state.projects.find((project) => project.id === projectId)?.score ?? 50;
  return [
    ...state.tasks.map((task) => ({
      ...task,
      description: task.description ?? "",
      expectedOutput: task.expectedOutput ?? "",
      actualMinutes: task.actualMinutes ?? 0,
      importance: task.importance ?? projectScore(task.projectId),
      recurrence: task.recurrence ?? null,
    })),
    ...legacy
      .filter((task) => !existingIds.has(task.id))
      .map((task): TaskRecord => ({
        ...task,
        dueDate: `${addDays(new Date(), 1)}T23:59`,
        priority: priorityFromImportance(task.importance),
        status: "todo",
        actualMinutes: 0,
        milestone: false,
        recurrence: null,
      })),
  ];
}

export function priorityFromImportance(
  importance: number,
): TaskRecord["priority"] {
  return importance >= 67 ? "high" : importance >= 34 ? "medium" : "low";
}
