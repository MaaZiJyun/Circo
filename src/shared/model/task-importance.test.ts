import { describe, expect, it } from "vitest";
import { normalizeTaskImportance, taskImportance } from "./task-importance";

describe("task importance", () => {
  it("sums Impact, Goal, Risk, and Value", () => {
    expect(taskImportance({ impact: 5, goal: 4, risk: 3, value: 2 })).toBe(14);
  });

  it("migrates legacy 0–100 importance into four 1–5 dimensions", () => {
    expect(normalizeTaskImportance({}, 80)).toEqual({
      impact: 4,
      goal: 4,
      risk: 4,
      value: 4,
      importance: 16,
    });
  });
});
