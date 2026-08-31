import type { DailyTask, TaskImportanceDimensions, ActivityRecord } from "@/shared/model/entities";

export type DailyTaskInput = Pick<
  DailyTask,
  "title" | "description" | "dueAt" | "estimatedMinutes" | "expectedOutput" |
  "importance" | "delayLoss" | "dependencyIds" | "complexity" | "uncertainty" | keyof TaskImportanceDimensions
> & Pick<ActivityRecord, "milestone" | "recurrence">;
