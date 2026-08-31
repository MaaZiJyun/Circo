import { describe, expect, it } from "vitest";
import type { DailyTask } from "@/shared/model/entities";
import { calculateDailyScore } from "./daily-score";

const task = (change: Partial<DailyTask> = {}): DailyTask => ({
  id: "daily_1",
  date: "2026-08-13",
  title: "Task",
  description: "",
  completed: true,
  dueAt: "2026-08-13T23:59",
  estimatedMinutes: 60,
  actualMinutes: 60,
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
  createdAt: "2026-08-13T00:00:00.000Z",
  updatedAt: "2026-08-13T00:00:00.000Z",
  ...change,
});

describe("daily score", () => {
  it("awards 100 for completing the plan with sufficient time", () => {
    expect(calculateDailyScore([task()], "2026-08-13").score).toBe(100);
  });

  it("keeps unfinished priority work from receiving completion points", () => {
    const score = calculateDailyScore(
      [task(), task({ id: "daily_2", completed: false, actualMinutes: 0 })],
      "2026-08-13",
    );
    expect(score.completed).toBe(1);
    expect(score.incomplete).toBe(1);
    expect(score.overdue).toBe(1);
    expect(score.overdueDiscount).toBe(10);
    expect(score.score).toBe(45);
  });

  it("does not discount unfinished work before its deadline", () => {
    const score = calculateDailyScore(
      [
        task({
          completed: false,
          actualMinutes: 60,
          dueAt: "2026-08-14T12:00",
        }),
      ],
      "2026-08-13",
    );
    expect(score.overdue).toBe(0);
    expect(score.overdueDiscount).toBe(0);
    expect(score.score).toBe(30);
  });
});
