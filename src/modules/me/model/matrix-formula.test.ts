import { describe, expect, it } from "vitest";
import {
  adjustQuadrantDispersion,
  defaultMatrixFormulas,
  evaluateMatrixFormula,
  matrixBubble,
  resolveMatrixFormulas,
} from "./matrix-formula";
import type { DailyTask } from "@/shared/model/entities";

const variables = {
  urgency: 70,
  importance: 80,
  estimatedMinutes: 30,
  maxEstimatedMinutes: 60,
  effort: 18,
  maxEffort: 36,
  priority: 7.11,
  remainingMinutes: 90,
  ageDays: 2,
  createdTimestamp: 1_765_785_600,
  createdHour: 8,
  createdMinute: 30,
  createdSecond: 15,
  quadrantXMin: 52,
  quadrantYMin: 52,
  createdX: 3,
  createdY: -2,
};

describe("matrix formulas", () => {
  it("evaluates arithmetic expressions with known variables", () => {
    expect(evaluateMatrixFormula("urgency + createdX * 2", variables)).toBe(76);
    expect(
      evaluateMatrixFormula(
        "createdHour * 3600 + createdMinute * 60 + createdSecond",
        variables,
      ),
    ).toBe(30_615);
    expect(evaluateMatrixFormula("createdTimestamp % 97", variables)).toBe(
      variables.createdTimestamp % 97,
    );
    expect(
      evaluateMatrixFormula(
        "48 + estimatedMinutes / maxEstimatedMinutes * 80",
        variables,
      ),
    ).toBe(88);
  });

  it("rejects code and unknown variables", () => {
    expect(() => evaluateMatrixFormula("window.alert(1)", variables)).toThrow();
    expect(() => evaluateMatrixFormula("unknown + 1", variables)).toThrow();
  });

  it("clamps custom output to safe visual bounds", () => {
    const task = {
      createdAt: "2026-08-14T08:00:00.000Z",
      dueAt: "2026-08-14T12:00:00.000Z",
      estimatedMinutes: 30,
    } as DailyTask;
    const result = matrixBubble(
      task,
      {
        urgency: 70,
        importance: 80,
        priority: 7.11,
        effort: 18,
        quadrant: "do",
      },
      60,
      { x: "999", y: "-20", size: "500" },
    );
    expect(result).toEqual({ x: 100, y: 0, diameter: 200 });
  });

  it("uses urgency and importance directly as the default coordinates", () => {
    const task = {
      createdAt: "2026-08-14T08:00:00.000Z",
      dueAt: "2026-08-14T12:00:00.000Z",
      estimatedMinutes: 30,
    } as DailyTask;
    const point = {
      urgency: 70,
      importance: 80,
      priority: 7.11,
      effort: 18,
      quadrant: "do" as const,
    };
    const first = matrixBubble(
      task,
      point,
      60,
      undefined,
      Date.parse(task.createdAt),
    );
    const second = matrixBubble(
      { ...task, createdAt: "2026-08-14T08:00:01.000Z" },
      point,
      60,
      undefined,
      Date.parse(task.createdAt),
    );
    expect(first).toEqual(second);
    expect([first.x, first.y]).toEqual([70, 80]);
  });

  it("uses Effort rather than estimated time for default bubble size", () => {
    const point = {
      urgency: 75,
      importance: 75,
      priority: 8,
      effort: 18,
      quadrant: "do" as const,
    };
    const positions = Array.from({ length: 20 }, (_, second) =>
      matrixBubble(
        {
          createdAt: `2026-08-14T08:00:${String(second).padStart(2, "0")}.000Z`,
          dueAt: "2026-08-14T12:00:00.000Z",
          estimatedMinutes: 30,
        } as DailyTask,
        point,
        60,
        undefined,
        Date.parse("2026-08-14T08:00:00.000Z"),
      ),
    );
    positions.forEach((item) => expect(item.diameter).toBeCloseTo(59.52));
  });

  it("migrates the former defaults without replacing custom formulas", () => {
    expect(
      resolveMatrixFormulas({
        x: "urgency + createdX",
        y: "importance + createdY",
        size: "48 + estimatedMinutes / maxEstimatedMinutes * 80",
      }),
    ).toBe(defaultMatrixFormulas);
    expect(
      resolveMatrixFormulas({ ...defaultMatrixFormulas, x: "urgency" }).x,
    ).toBe("urgency");
  });

  it("scales distances around each quadrant geometric median", () => {
    const bubbles = [
      { id: "left", x: 60, y: 70, quadrant: "do" as const },
      { id: "right", x: 80, y: 70, quadrant: "do" as const },
      { id: "bottom", x: 70, y: 60, quadrant: "do" as const },
      { id: "top", x: 70, y: 80, quadrant: "do" as const },
    ];
    const spread = adjustQuadrantDispersion(bubbles, 1.5);
    expect(spread.find((item) => item.id === "left")?.x).toBeCloseTo(55);
    expect(spread.find((item) => item.id === "right")?.x).toBeCloseTo(85);
    expect(spread.find((item) => item.id === "bottom")?.y).toBeCloseTo(55);
    expect(spread.find((item) => item.id === "top")?.y).toBeCloseTo(85);
  });
});
