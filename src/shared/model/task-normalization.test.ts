import { describe, expect, it } from "vitest";
import { createSeedState } from "@/shared/infrastructure/seed";
import {
  normalizeTasks,
  priorityFromImportance,
  withoutLegacyRoutineTasks,
} from "./task-normalization";

describe("task normalization", () => {
  it("migrates legacy reusable tasks into the shared task collection", () => {
    const state = Object.assign(createSeedState(), {
      routineTasks: [
        {
          id: "routine_meal",
          title: "吃饭",
          description: "午餐",
          estimatedMinutes: 45,
          expectedOutput: "",
          importance: 30,
          createdAt: "2026-08-13T00:00:00.000Z",
          updatedAt: "2026-08-13T00:00:00.000Z",
        },
      ],
    });

    expect(normalizeTasks(state)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "routine_meal",
          priority: "low",
          status: "todo",
        }),
      ]),
    );
    expect(
      normalizeTasks(state).find((task) => task.id === "routine_meal")
        ?.projectId,
    ).toBeUndefined();
    expect(withoutLegacyRoutineTasks(state)).not.toHaveProperty(
      "routineTasks",
    );
  });

  it("derives the task priority from numeric importance", () => {
    expect(priorityFromImportance(20)).toBe("low");
    expect(priorityFromImportance(50)).toBe("medium");
    expect(priorityFromImportance(80)).toBe("high");
  });
});
