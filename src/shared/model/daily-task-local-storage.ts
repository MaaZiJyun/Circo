const STORAGE_KEY = "circo.daily-task-ids.v1";
const CLEARED_KEY = "circo.daily-task-cleared.v1";

type DailyTaskIndex = Record<string, string[]>;

export function readDailyTaskIds(date: string) {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as DailyTaskIndex;
    return Array.isArray(parsed[date]) ? parsed[date] : [];
  } catch {
    return [];
  }
}

export function writeDailyTaskIds(date: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as DailyTaskIndex;
    parsed[date] = [...new Set(ids)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Local cache is best-effort; database data remains authoritative.
  }
}

export function readClearedDailyDates() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const parsed = JSON.parse(localStorage.getItem(CLEARED_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function isDailyTaskDateCleared(date: string) {
  return readClearedDailyDates().includes(date);
}

export function clearDailyTaskDate(date: string) {
  if (typeof window === "undefined") return;
  const dates = new Set(readClearedDailyDates());
  dates.add(date);
  localStorage.setItem(CLEARED_KEY, JSON.stringify([...dates]));
  writeDailyTaskIds(date, []);
  window.dispatchEvent(new Event("circo-daily-cache-changed"));
}

/**
 * At the end of a day, keep unfinished activities and activities whose due
 * date is still in the future. This only changes the browser cache; it does
 * not archive or modify the database activity.
 */
export function clearCompletedDueDailyTaskDate(
  date: string,
  idsToKeep: string[],
) {
  if (typeof window === "undefined") return;
  const dates = new Set(readClearedDailyDates());
  dates.add(date);
  localStorage.setItem(CLEARED_KEY, JSON.stringify([...dates]));
  writeDailyTaskIds(date, idsToKeep);
  window.dispatchEvent(new Event("circo-daily-cache-changed"));
}
