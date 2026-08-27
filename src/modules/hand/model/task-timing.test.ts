import { describe, expect, it } from "vitest";
import type { ActivityRecord } from "@/shared/model/entities";
import { formatTimingDelta, taskTiming } from "./task-timing";

const task = (changes: Partial<ActivityRecord> = {}): ActivityRecord =>
  ({
    id: "task-1",
    title: "Task",
    description: "",
    startDate: "2026-08-26T10:00",
    dueDate: "2026-08-26T12:00",
    estimatedMinutes: 120,
    actualMinutes: 120,
    status: "done",
    milestone: false,
    expectedOutput: "",
    importance: 1,
    impact: 1,
    goal: 1,
    risk: 1,
    value: 1,
    delayLoss: 1,
    complexity: 1,
    uncertainty: 1,
    priority: "low",
    recurrence: null,
    dependencyIds: [],
    createdAt: "",
    updatedAt: "",
    ...changes,
  }) as ActivityRecord;

describe("taskTiming", () => {
  it("records late start and overdue finish", () => {
    const result = taskTiming(
      task({
        actualStartedAt: "2026-08-26T10:30",
        completedAt: "2026-08-26T13:15",
      }),
    );
    expect(result.startDeltaMinutes).toBe(30);
    expect(result.endDeltaMinutes).toBe(75);
    expect(formatTimingDelta(result.endDeltaMinutes)).toBe("+1h 15m");
  });

  it("records early start and early finish as negative deltas", () => {
    const result = taskTiming(
      task({
        actualStartedAt: "2026-08-26T09:30",
        completedAt: "2026-08-26T11:45",
      }),
    );
    expect(result.startDeltaMinutes).toBe(-30);
    expect(result.endDeltaMinutes).toBe(-15);
  });
});
