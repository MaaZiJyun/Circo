import { describe, expect, it } from "vitest";
import {
  quadrantAxis,
  taskBubbleDiameter,
  taskCoordinates,
} from "./task-quadrant";

describe("task quadrant", () => {
  it("maps raw Importance and Urgency to coordinates and quadrants", () => {
    const result = taskCoordinates(16, 12, 24);
    expect(result.urgency).toBe(77);
    expect(result.importance).toBe(75);
    expect(result.quadrant).toBe("do");
    expect(result.priority).toBe(8);
  });
  it("puts low-importance and low-urgency work in eliminate", () => {
    const result = taskCoordinates(4, 2, 1);
    expect(result.urgency).toBeLessThan(50);
    expect(result.quadrant).toBe("eliminate");
  });
  it("scales to the largest value while keeping edge points visible", () => {
    const axis = quadrantAxis([20, 70, 100]);
    expect(axis.maximum).toBe(100);
    expect(axis.position(0)).toBe(5);
    expect(axis.position(100)).toBe(95);
    expect(axis.threshold).toBe(axis.position(50));
  });
  it("uses expected time to size task bubbles", () => {
    expect(taskBubbleDiameter(120, 120)).toBe(128);
    expect(taskBubbleDiameter(30, 120)).toBe(68);
    expect(taskBubbleDiameter(0, 120)).toBe(48);
  });
});
