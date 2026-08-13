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
  importance: 80,
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
    expect(score.score).toBe(50);
  });
});
