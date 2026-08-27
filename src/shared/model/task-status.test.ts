import { describe, expect, it } from "vitest";
import type { ActivityRecord } from "./entities";
import { deadlineTime, taskStatusAt } from "./task-status";

const task = (change: Partial<ActivityRecord> = {}): ActivityRecord => ({
  id: "task_1",
  title: "Task",
  description: "",
  startDate: "2026-08-14T11:30",
  dueDate: "2026-08-14T12:00",
  priority: "medium",
  status: "todo",
  estimatedMinutes: 30,
  actualMinutes: 0,
  milestone: false,
  expectedOutput: "",
  impact: 3,
  goal: 3,
  risk: 3,
  value: 3,
  importance: 12,
  delayLoss: 3,
  dependencyIds: [],
  complexity: 3,
  uncertainty: 3,
  recurrence: null,
  createdAt: "2026-08-14T00:00:00.000Z",
  updatedAt: "2026-08-14T00:00:00.000Z",
  ...change,
});

describe("task overdue status", () => {
  it("marks unfinished work overdue after its deadline", () => {
    expect(taskStatusAt(task(), deadlineTime("2026-08-14T12:01"))).toBe(
      "overdue",
    );
  });

  it("keeps completed work done after its deadline", () => {
    expect(
      taskStatusAt(
        task({ status: "done" }),
        deadlineTime("2026-08-14T12:01"),
      ),
    ).toBe("done");
  });

  it("treats a date-only deadline as the end of that day", () => {
    expect(
      taskStatusAt(
        task({ dueDate: "2026-08-14" }),
        deadlineTime("2026-08-14T12:00"),
      ),
    ).toBe("todo");
  });
});
