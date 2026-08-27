import type { AppState } from "./app-state";
import { now } from "./factories";
import { appendNextRecurringTask } from "./task-recurrence";

export function completeTask(
  state: AppState,
  taskId: string,
  stamp = now(),
): AppState {
  const source = state.tasks.find((task) => task.id === taskId);
  if (!source) return state;
  const completed = {
    ...source,
    status: "done" as const,
    actualMinutes: source.actualMinutes || source.estimatedMinutes,
    actualStartedAt: source.actualStartedAt ?? stamp,
    completedAt: source.completedAt ?? stamp,
    updatedAt: stamp,
  };
  const nextTasks = appendNextRecurringTask(state.tasks, taskId, stamp).filter(
    (task) => task.id !== taskId,
  );
  return {
    ...state,
    tasks: nextTasks,
    taskHistory: [
      ...(state.taskHistory ?? []).filter((item) => item.id !== taskId),
      completed,
    ],
  };
}
