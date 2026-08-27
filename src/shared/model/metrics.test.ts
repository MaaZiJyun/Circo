import { describe, expect, it } from "vitest";
import { createSeedState } from "@/shared/infrastructure/seed";
import { calculateMetrics, progressPercent } from "./metrics";

describe("growth metrics", () => {
  it("uses transparent work and task formulas", () => {
    const metrics = calculateMetrics(createSeedState());
    expect(metrics.totalMinutes).toBe(150);
    expect(metrics.effectiveRate).toBe(1);
    expect(metrics.completionRate).toBe(1);
  });

  it("returns no rate when a denominator is zero", () => {
    const state = createSeedState();
    state.focus = [];
    state.activities = [];
    const metrics = calculateMetrics(state);
    expect(metrics.effectiveRate).toBeNull();
    expect(metrics.completionRate).toBeNull();
  });

  it("clamps goal progress", () => {
    expect(progressPercent(12, 10)).toBe(100);
    expect(progressPercent(-1, 10)).toBe(0);
    expect(progressPercent(3, 0)).toBe(0);
  });
});
