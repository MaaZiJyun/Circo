import { describe, expect, it } from "vitest";
import { canPromoteIdea, evaluateIdea } from "./idea-evaluation";

describe("idea evaluation", () => {
  it("converts the 15 answers to overall and dimension scores", () => {
    const result = evaluateIdea(
      Array(15).fill(5),
      "A core assumption is disproved.",
      "2026-08-12T00:00:00.000Z",
    );
    expect(result.totalScore).toBe(100);
    expect(result.dimensionScores.value).toBe(100);
    expect(result.level).toBe("strong");
    expect(canPromoteIdea(result)).toBe(true);
  });

  it("blocks promotion when a core dimension is below 40", () => {
    const answers = [
      ...Array(6).fill(5),
      ...Array(3).fill(1),
      ...Array(6).fill(5),
    ];
    const result = evaluateIdea(answers, "The minimum test fails.");
    expect(result.totalScore).toBe(80);
    expect(result.gateFailures).toEqual(["feasibility"]);
    expect(canPromoteIdea(result)).toBe(false);
  });
});
