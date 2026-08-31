import { describe, expect, it } from "vitest";
import { createSeedState } from "@/shared/infrastructure/seed";
import { replaceActivityFocus } from "./focus";

describe("replaceActivityFocus", () => {
  it("updates focus records and recalculates activity actual time", () => {
    const state = createSeedState();
    const existing = state.focus.find((item) => item.focusOn === "task_scope")!;
    const updated = replaceActivityFocus(
      state,
      "task_scope",
      [
        { ...existing, duration: 45, endedAt: "2026-08-10T01:45:00.000Z" },
        {
          ...existing,
          id: "focus_added",
          startedAt: "2026-08-10T03:00:00.000Z",
          endedAt: "2026-08-10T03:30:00.000Z",
          duration: 30,
        },
      ],
      "2026-08-31T01:00:00.000Z",
    );

    const task = updated.activities.find((item) => item.id === "task_scope");
    expect(updated.focus.filter((item) => item.focusOn === "task_scope")).toHaveLength(2);
    expect(task?.actualMinutes).toBe(75);
    expect(task?.actualStartedAt).toBe("2026-08-10T01:00:00.000Z");
  });

  it("removes omitted focus records and resets actual time", () => {
    const updated = replaceActivityFocus(createSeedState(), "task_scope", []);
    const task = updated.activities.find((item) => item.id === "task_scope");

    expect(updated.focus.some((item) => item.focusOn === "task_scope")).toBe(false);
    expect(task?.actualMinutes).toBe(0);
    expect(task?.actualStartedAt).toBeUndefined();
  });

  it("keeps archived activities immutable", () => {
    const state = createSeedState();
    state.activities = state.activities.map((item) =>
      item.id === "task_scope" ? { ...item, archivedAt: item.updatedAt } : item,
    );

    expect(replaceActivityFocus(state, "task_scope", [])).toBe(state);
  });
});
