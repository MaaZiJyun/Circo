import type { AppState } from "./app-state";
import type { ActivityRecord } from "./entities";
import { now } from "./factories";

export function isArchivedTask(task: Pick<ActivityRecord, "archivedAt">) {
  return Boolean(task.archivedAt);
}

export function archiveTask(
  state: AppState,
  taskId: string,
  stamp = now(),
): AppState {
  return {
    ...state,
    activities: state.activities.map((task) =>
      task.id === taskId && !task.archivedAt
        ? { ...task, archivedAt: stamp, updatedAt: stamp }
        : task,
    ),
  };
}

/**
 * Daily settlement is deliberately narrow: only completed activities selected in
 * this day's local cache are archived. Everything else remains editable.
 */
export function archiveSettledTasks(
  state: AppState,
  taskIds: readonly string[],
  stamp = now(),
): AppState {
  const selected = new Set(taskIds);
  if (!selected.size) return state;
  return {
    ...state,
    activities: state.activities.map((task) =>
      selected.has(task.id) && task.status === "done" && !task.archivedAt
        ? { ...task, archivedAt: stamp, updatedAt: stamp }
        : task,
    ),
  };
}
