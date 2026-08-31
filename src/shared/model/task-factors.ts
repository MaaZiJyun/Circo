import { normalizeTaskEffort } from "./task-effort";
import type { TaskEffortInputs } from "./task-effort-types";
import { normalizeTaskUrgency } from "./task-urgency";
import type { TaskUrgencyInputs } from "./task-urgency-types";

export function normalizeTaskFactors(value: Partial<TaskEffortInputs & TaskUrgencyInputs>) {
  return { ...normalizeTaskUrgency(value), ...normalizeTaskEffort(value) };
}
