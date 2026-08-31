import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import type { AppState } from "@/shared/model/app-state";
import { createSeedState } from "./seed";
import { SqliteAppRepository } from "./sqlite-repository";

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("SQLite repository", () => {
  it("seeds, saves, and reloads one atomic snapshot", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "circo-test-"));
    directories.push(directory);
    const repository = new SqliteAppRepository(
      path.join(directory, "circo.db"),
    );
    const seeded = await repository.load();
    expect(seeded.goals.length).toBeGreaterThan(0);

    const changed = createSeedState();
    changed.goals[0].title = "Changed goal";
    const saved = await repository.save(changed);
    const reloaded = await repository.load();
    expect(reloaded.goals[0].title).toBe("Changed goal");
    expect(reloaded.revision).toBe(saved.revision);
  });

  it("rejects an incompatible restore payload", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "circo-test-"));
    directories.push(directory);
    const repository = new SqliteAppRepository(
      path.join(directory, "circo.db"),
    );
    await expect(
      repository.restore({ schemaVersion: 2 } as never),
    ).rejects.toThrow();
  });

  it("adds a default profile when restoring a legacy snapshot", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "circo-test-"));
    directories.push(directory);
    const repository = new SqliteAppRepository(
      path.join(directory, "circo.db"),
    );
    const legacy = createSeedState() as Partial<AppState>;
    delete legacy.profile;

    const restored = await repository.restore(legacy as AppState);
    expect(restored.profile).toEqual({ name: "Me", avatarDataUrl: "" });
  });

  it("adds library metadata when restoring a legacy snapshot", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "circo-test-"));
    directories.push(directory);
    const repository = new SqliteAppRepository(
      path.join(directory, "circo.db"),
    );
    const legacy = createSeedState() as Partial<AppState>;
    legacy.libraryLists = legacy.libraryLists?.slice(0, 2);
    delete legacy.pointLists;
    delete legacy.points;
    delete (legacy.sources?.[0] as Partial<AppState["sources"][number]>)
      .listIds;

    const restored = await repository.restore(legacy as AppState);
    expect(restored.libraryLists.map((item) => item.system)).toEqual([
      "default",
      "recent",
      "marked",
    ]);
    expect(restored.sources[0].listIds).toEqual(["library_default"]);
    expect(restored.points).toEqual([]);
    expect(restored.pointLists.map((item) => item.system)).toEqual([
      "default",
      "recent",
    ]);
  });

  it("moves legacy task history into archived activities and removes its table", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "circo-test-"));
    directories.push(directory);
    const databasePath = path.join(directory, "circo.db");
    const repository = new SqliteAppRepository(databasePath);
    const seed = createSeedState();
    const legacyTask = {
      ...seed.activities[0],
      id: "legacy-history-task",
      status: "done" as const,
      completedAt: "2026-08-20T10:00:00.000Z",
    };
    const legacy = {
      ...seed,
      activities: undefined,
      tasks: [legacyTask],
      taskHistory: [legacyTask],
    } as unknown as AppState;

    const restored = await repository.restore(legacy);
    const migrated = restored.activities.find((task) => task.id === legacyTask.id);
    const database = new Database(databasePath, { readonly: true });
    const oldTable = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'task_history'")
      .get();
    database.close();

    expect(migrated?.status).toBe("done");
    expect(migrated?.archivedAt).toBe(legacyTask.completedAt);
    expect(oldTable).toBeUndefined();
  });
});
