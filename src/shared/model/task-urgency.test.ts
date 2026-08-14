import { describe, expect, it } from "vitest";
import { taskBlocking, taskDueRange, taskUrgency } from "./task-urgency";

describe("task urgency", () => {
  const now = new Date("2026-08-14T12:00:00+08:00").getTime();

  it("scores the due range from the real deadline", () => {
    expect(taskDueRange("", now)).toBe(1);
    expect(taskDueRange("2026-11-14T12:00:00+08:00", now)).toBe(2);
    expect(taskDueRange("2026-09-04T12:00:00+08:00", now)).toBe(3);
    expect(taskDueRange("2026-08-17T12:00:00+08:00", now)).toBe(4);
    expect(taskDueRange("2026-08-14T18:00:00+08:00", now)).toBe(5);
  });

  it("scores reverse dependencies and sums urgency", () => {
    const target = {
      id: "target",
      dueDate: "",
      delayLoss: 5,
      dependencyIds: [],
    };
    const tasks = [
      target,
      ...Array.from({ length: 4 }, (_, index) => ({
        id: `task-${index}`,
        dueDate: "",
        delayLoss: 1,
        dependencyIds: ["target"],
      })),
    ];
    expect(taskBlocking("target", tasks)).toBe(4);
    expect(taskUrgency(target, tasks, now)).toEqual({
      deadline: 1,
      delayLoss: 5,
      blocking: 4,
      urgency: 10,
    });
  });

  it("gives B one Blocking point when A depends on B", () => {
    const b = { id: "B", dueDate: "", delayLoss: 1, dependencyIds: [] };
    const a = { id: "A", dueDate: "", delayLoss: 1, dependencyIds: ["B"] };
    expect(taskBlocking("B", [a, b])).toBe(1);
    expect(taskBlocking("A", [a, b])).toBe(0);
  });
});
