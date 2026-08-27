import type { AppState } from "./app-state";
import { now } from "./factories";
import { appendNextRecurringTask } from "./task-recurrence";
import { isArchivedTask } from "./task-archive";

export function completeTask(
  state: AppState,
  taskId: string,
  stamp = now(),
): AppState {
  const source = state.activities.find((task) => task.id === taskId);
  if (!source || isArchivedTask(source)) return state;
  const completed = {
    ...source,
    status: "done" as const,
    actualMinutes: source.actualMinutes || source.estimatedMinutes,
    actualStartedAt: source.actualStartedAt ?? stamp,
    completedAt: source.completedAt ?? stamp,
    updatedAt: stamp,
  };
  const updatedTasks = state.activities.map((task) =>
    task.id === taskId ? completed : task,
  );
  return {
    ...state,
    activities: appendNextRecurringTask(updatedTasks, taskId, stamp),
  };
}
