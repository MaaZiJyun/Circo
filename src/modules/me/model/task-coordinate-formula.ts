import type { MatrixFormulaSettings } from "@/shared/model/app-state";
import type { DailyTask } from "@/shared/model/entities";
import { taskUrgency } from "@/shared/model/task-urgency";
import { taskEffort } from "@/shared/model/task-effort";
import {
  defaultMatrixFormulas,
  evaluateMatrixFormula,
  resolveMatrixFormulas,
} from "./matrix-formula";
import { taskCoordinates, type TaskCoordinates } from "./task-quadrant";

export const taskFormulaVariables = [
  "date",
  "completed",
  "dueAt",
  "completedAt",
  "estimatedMinutes",
  "actualMinutes",
  "impact",
  "goal",
  "risk",
  "value",
  "importance",
  "deadline",
  "delayLoss",
  "blocking",
  "urgency",
  "complexity",
  "uncertainty",
  "time",
  "effort",
  "createdAt",
  "updatedAt",
  "currentTime",
] as const;

type TaskVariables = Record<(typeof taskFormulaVariables)[number], number>;
const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));
const timestamp = (value?: string) => {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};

export function taskFormulaContext(
  task: DailyTask,
  currentTime: number,
  activities: DailyTask[] = [task],
) {
  const urgency = taskUrgency(task, activities, currentTime);
  const effort = taskEffort(task);
  return {
    date: timestamp(task.date),
    completed: task.completed ? 1 : 0,
    dueAt: timestamp(task.dueAt),
    completedAt: timestamp(task.completedAt),
    estimatedMinutes: task.estimatedMinutes,
    actualMinutes: task.actualMinutes,
    impact: task.impact,
    goal: task.goal,
    risk: task.risk,
    value: task.value,
    importance: task.importance,
    ...urgency,
    ...effort,
    createdAt: timestamp(task.createdAt),
    updatedAt: timestamp(task.updatedAt),
    currentTime,
  } satisfies TaskVariables;
}

export function taskCoordinatesFromFormula(
  task: DailyTask,
  formulas?: MatrixFormulaSettings,
  currentTime = Date.now(),
  activities: DailyTask[] = [task],
): TaskCoordinates {
  const selected = resolveMatrixFormulas(formulas);
  const variables = taskFormulaContext(task, currentTime, activities);
  const calculate = (formula: string | undefined, fallback: string) => {
    try {
      return evaluateMatrixFormula(formula ?? fallback, variables);
    } catch {
      return evaluateMatrixFormula(fallback, variables);
    }
  };
  const urgency = clamp(
    calculate(selected.urgency, defaultMatrixFormulas.urgency!),
  );
  const importance = clamp(
    calculate(selected.importance, defaultMatrixFormulas.importance!),
  );
  return {
    ...taskCoordinates(task.importance, variables.urgency, variables.effort),
    urgency,
    importance,
  };
}

export function validateTaskCoordinateFormulas(
  formulas: MatrixFormulaSettings,
) {
  const variables = Object.fromEntries(
    taskFormulaVariables.map((name) => [name, 1]),
  ) as TaskVariables;
  evaluateMatrixFormula(
    formulas.urgency ?? defaultMatrixFormulas.urgency!,
    variables,
  );
  evaluateMatrixFormula(
    formulas.importance ?? defaultMatrixFormulas.importance!,
    variables,
  );
}
