import { describe, expect, it } from "vitest";
import { createSeedState } from "@/shared/infrastructure/seed";
import { completeTask } from "./task-lifecycle";
import { archiveSettledTasks, archiveTask, isArchivedTask } from "./task-archive";

describe("task lifecycle", () => {
  it("keeps a completed task active until daily settlement", () => {
    const state = createSeedState();
    const completed = completeTask(state, "task_test", "2026-08-27T10:00:00.000Z");
    const task = completed.activities.find((item) => item.id === "task_test");

    expect(task?.status).toBe("done");
    expect(task?.archivedAt).toBeUndefined();
    expect(completed.activities.filter((item) => item.status === "done")).toHaveLength(2);
  });

  it("keeps completed tasks editable until they are archived", () => {
    const completed = completeTask(
      createSeedState(),
      "task_test",
      "2026-08-27T10:00:00.000Z",
    );
    expect(isArchivedTask(completed.activities.find((item) => item.id === "task_test")!)).toBe(
      false,
    );

    const archived = archiveTask(completed, "task_test", "2026-08-27T11:00:00.000Z");
    expect(isArchivedTask(archived.activities.find((item) => item.id === "task_test")!)).toBe(
      true,
    );
  });

  it("archives only completed activities selected for settlement", () => {
    const state = createSeedState();
    const completed = completeTask(state, "task_test", "2026-08-27T10:00:00.000Z");
    const settled = archiveSettledTasks(completed, ["task_test"], "2026-08-27T23:59:00.000Z");

    expect(settled.activities.find((item) => item.id === "task_test")?.archivedAt).toBe(
      "2026-08-27T23:59:00.000Z",
    );
    expect(settled.activities.find((item) => item.id === "task_scope")?.archivedAt).toBeUndefined();
  });

  it("allows explicit archive for an unfinished task", () => {
    const state = createSeedState();
    const archived = archiveTask(state, "task_test", "2026-08-27T11:00:00.000Z");

    expect(archived.activities.find((item) => item.id === "task_test")?.archivedAt).toBe(
      "2026-08-27T11:00:00.000Z",
    );
  });
});
