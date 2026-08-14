import type { TaskEffortInputs } from "./task-effort-types";

export const defaultTaskEffort: TaskEffortInputs = { complexity: 3, uncertainty: 3 };
const score = (value: unknown) => Math.max(1, Math.min(5, Math.round(Number(value) || 3)));

export function taskTimeScore(estimatedMinutes: number): number {
  const minutes = Math.max(0, Number(estimatedMinutes) || 0);
  if (minutes < 60) return 1;
  if (minutes <= 4 * 60) return 2;
  if (minutes <= 3 * 8 * 60) return 3;
  if (minutes <= 5 * 8 * 60) return 4;
  return 5;
}

export function taskEffort(value: TaskEffortInputs & { estimatedMinutes: number }) {
  const time = taskTimeScore(value.estimatedMinutes);
  const complexity = score(value.complexity);
  const uncertainty = score(value.uncertainty);
  return { time, complexity, uncertainty, effort: time * complexity * uncertainty };
}

export function normalizeTaskEffort(value: Partial<TaskEffortInputs>): TaskEffortInputs {
  return { complexity: score(value.complexity), uncertainty: score(value.uncertainty) };
}
