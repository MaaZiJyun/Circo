import { describe, expect, it } from "vitest";
import { createSeedState } from "@/shared/infrastructure/seed";
import { appendNextRecurringTask, nextDeadline } from "./task-recurrence";

describe("task recurrence", () => {
  it("advances deadlines while preserving the local deadline time", () => {
    expect(
      nextDeadline("2026-01-31T08:30", { interval: 1, unit: "month" }),
    ).toBe("2026-02-28T08:30");
    expect(
      nextDeadline("2026-08-13T23:59", { interval: 2, unit: "week" }),
    ).toBe("2026-08-27T23:59");
  });

  it("creates one distinct next occurrence for a completed task", () => {
    const source = {
      ...createSeedState().tasks[0],
      recurrence: { interval: 1, unit: "month" as const },
    };
    const first = appendNextRecurringTask(
      [source],
      source.id,
      "2026-08-13T12:00:00.000Z",
    );
    const next = first.find((task) => task.recurrenceSourceId === source.id);
    expect(next).toMatchObject({
      status: "todo",
      actualMinutes: 0,
      recurrenceSourceId: source.id,
    });
    expect(next?.id).not.toBe(source.id);
    expect(appendNextRecurringTask(first, source.id, "later")).toHaveLength(2);
  });
});
