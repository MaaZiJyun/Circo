import { describe, expect, it } from "vitest";
import { taskEffort, taskTimeScore } from "./task-effort";

describe("task effort", () => {
  it("maps estimated working time to a 1–5 score", () => {
    expect([59, 60, 241, 1441, 2401].map(taskTimeScore)).toEqual([1, 2, 3, 4, 5]);
  });

  it("multiplies time, complexity, and uncertainty", () => {
    expect(taskEffort({ estimatedMinutes: 480, complexity: 4, uncertainty: 5 }))
      .toEqual({ time: 3, complexity: 4, uncertainty: 5, effort: 60 });
  });
});
