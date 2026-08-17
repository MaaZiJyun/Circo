import { describe, expect, it } from "vitest";
import type { TaskRecord } from "./entities";
import { activeTaskReminders, taskReminderTime } from "./task-reminder";

const task: TaskRecord = {
  id: "task_1",
  title: "Prepare report",
  description: "",
  startDate: "2026-08-14T11:00",
  dueDate: "2026-08-14T12:00",
  priority: "high",
  status: "todo",
  estimatedMinutes: 30,
  actualMinutes: 0,
  milestone: false,
  expectedOutput: "",
  impact: 4,
  goal: 4,
  risk: 4,
  value: 4,
  importance: 16,
  delayLoss: 3,
  dependencyIds: [],
  complexity: 3,
  uncertainty: 3,
  recurrence: null,
  createdAt: "2026-08-14T00:00:00.000Z",
  updatedAt: "2026-08-14T00:00:00.000Z",
};

describe("task reminders", () => {
  it("notifies one minute before the expected start", () => {
    expect(new Date(taskReminderTime(task, "expectedStart")).getHours()).toBe(
      11,
    );
    expect(new Date(taskReminderTime(task, "expectedStart")).getMinutes()).toBe(
      29,
    );
  });

  it("keeps expected-start and deadline reminders separate", () => {
    const current = new Date("2026-08-14T11:29:30").getTime();
    const reminders = activeTaskReminders([task], current, new Set());
    expect(reminders.map((item) => item.kind)).toEqual(["expectedStart"]);
  });
});
