import type { AppState } from "./app-state";
import type { BaseEntity, TaskRecord } from "./entities";
import { addDays } from "./factories";
import { normalizeTaskImportance } from "./task-importance";
import { normalizeTaskUrgency } from "./task-urgency";
import { normalizeTaskEffort } from "./task-effort";

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
    ...state.tasks.map((task) => {
      const scores = normalizeTaskImportance(
        task,
        task.importance ?? projectScore(task.projectId),
      );
      return {
        ...task,
        description: task.description ?? "",
        expectedOutput: task.expectedOutput ?? "",
        actualMinutes: task.actualMinutes ?? 0,
        ...scores,
        ...normalizeTaskUrgency(task),
        ...normalizeTaskEffort(task),
        priority: priorityFromImportance(scores.importance),
        recurrence: task.recurrence ?? null,
      };
    }),
    ...legacy
      .filter((task) => !existingIds.has(task.id))
      .map((task): TaskRecord => ({
        ...task,
        ...normalizeTaskImportance({}, task.importance),
        ...normalizeTaskUrgency({}),
        ...normalizeTaskEffort({}),
        dueDate: `${addDays(new Date(), 1)}T23:59`,
        priority: priorityFromImportance(
          normalizeTaskImportance({}, task.importance).importance,
        ),
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
  return importance >= 15 ? "high" : importance >= 9 ? "medium" : "low";
}
