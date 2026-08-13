import { describe, expect, it } from "vitest";
import { taskCoordinates } from "./task-quadrant";

describe("task quadrant", () => {
  const now = Date.parse("2026-08-12T00:00:00.000Z");
  it("marks a task urgent when remaining time equals expected work", () => {
    const result = taskCoordinates("2026-08-12T01:00:00.000Z", 60, 80, now);
    expect(result.urgency).toBe(100);
    expect(result.quadrant).toBe("do");
  });
  it("puts a low-importance task with ample slack in eliminate", () => {
    const result = taskCoordinates("2026-08-14T00:00:00.000Z", 60, 20, now);
    expect(result.urgency).toBeLessThan(50);
    expect(result.quadrant).toBe("eliminate");
  });
});
