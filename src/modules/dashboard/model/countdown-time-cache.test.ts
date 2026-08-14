import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cachedElapsed,
  readCountdownTimeCache,
} from "./countdown-time-cache";

describe("countdown time cache", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("persists a real-time anchor when migrating a legacy seconds cache", () => {
    let stored = JSON.stringify({ task_1: 422 });
    const localStorage = {
      getItem: vi.fn(() => stored),
      setItem: vi.fn((_key: string, value: string) => {
        stored = value;
      }),
    };
    vi.stubGlobal("window", { localStorage });

    const first = readCountdownTimeCache(1_000_000);
    const restored = readCountdownTimeCache(1_005_000);

    expect(first.task_1).toEqual({
      startedAt: 1_000_000,
      accumulatedSeconds: 422,
    });
    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
    expect(restored.task_1.startedAt).toBe(1_000_000);
    expect(cachedElapsed(restored.task_1, 1_005_000)).toBe(427);
  });
});
