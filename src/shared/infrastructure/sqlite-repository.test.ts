import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
});
