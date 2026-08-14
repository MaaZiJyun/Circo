import type { TaskImportanceDimensions } from "./task-importance-types";

export const defaultTaskImportance: TaskImportanceDimensions = {
  impact: 3,
  goal: 3,
  risk: 3,
  value: 3,
};

const score = (value: number) => Math.min(5, Math.max(1, Math.round(value)));

export function taskImportance(dimensions: TaskImportanceDimensions) {
  return (
    score(dimensions.impact) +
    score(dimensions.goal) +
    score(dimensions.risk) +
    score(dimensions.value)
  );
}

export const taskImportanceDimensions = (value: TaskImportanceDimensions) => ({
  impact: value.impact,
  goal: value.goal,
  risk: value.risk,
  value: value.value,
});

export function normalizeTaskImportance(
  value: Partial<TaskImportanceDimensions>,
  legacyImportance = 50,
) {
  const legacyScore = score(legacyImportance / 20);
  const dimensions = {
    impact: score(value.impact ?? legacyScore),
    goal: score(value.goal ?? legacyScore),
    risk: score(value.risk ?? legacyScore),
    value: score(value.value ?? legacyScore),
  };
  return { ...dimensions, importance: taskImportance(dimensions) };
}
