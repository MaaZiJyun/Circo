export interface CountdownTimeEntry {
  startedAt: number;
  accumulatedSeconds: number;
}

export type CountdownTimeCache = Record<string, CountdownTimeEntry>;

const cacheKey = "circo-countdown-task-time";

export function normalizeCountdownTimeCache(
  value: unknown,
  currentTime: number,
) {
  if (!value || typeof value !== "object")
    return { cache: {}, migrated: false } as const;
  let migrated = false;
  const entries = Object.entries(value).flatMap(([id, entry]) => {
    if (typeof entry === "number" && entry >= 0) {
      migrated = true;
      return [[id, { startedAt: currentTime, accumulatedSeconds: entry }]];
    }
    if (
      entry &&
      typeof entry === "object" &&
      "startedAt" in entry &&
      "accumulatedSeconds" in entry &&
      typeof entry.startedAt === "number" &&
      typeof entry.accumulatedSeconds === "number"
    )
      return [[id, entry as CountdownTimeEntry]];
    migrated = true;
    return [];
  });
  return {
    cache: Object.fromEntries(entries) as CountdownTimeCache,
    migrated,
  };
}

export function readCountdownTimeCache(
  currentTime: number,
): CountdownTimeCache {
  if (typeof window === "undefined") return {};
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(cacheKey) ?? "{}",
    );
    const result = normalizeCountdownTimeCache(value, currentTime);
    if (result.migrated) writeCountdownTimeCache(result.cache);
    return result.cache;
  } catch {
    return {};
  }
}

export function writeCountdownTimeCache(value: CountdownTimeCache) {
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch {
    // The in-memory cache remains authoritative for the current session.
  }
}

export function cachedElapsed(
  entry: CountdownTimeEntry | undefined,
  currentTime: number,
) {
  if (!entry) return 0;
  return (
    entry.accumulatedSeconds +
    Math.max(0, currentTime - entry.startedAt) / 1000
  );
}
