import type { AppState } from "./app-state";
import type { FocusRecord } from "./entities";
import { createId, now } from "./factories";

export function addFocus(
  state: AppState,
  input: Pick<FocusRecord, "startedAt" | "endedAt" | "duration" | "focusOn"> &
    Partial<Pick<FocusRecord, "title" | "output" | "note">>,
): AppState {
  const stamp = now();
  const focus: FocusRecord = {
    id: createId("focus"),
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    duration: Math.max(0, input.duration),
    focusOn: input.focusOn,
    title: input.title ?? "",
    output: input.output ?? "",
    note: input.note ?? "",
    createdAt: stamp,
    updatedAt: stamp,
  };
  const focusRecords = [...(state.focus ?? []), focus];
  const related = focusRecords.filter((item) => item.focusOn === focus.focusOn);
  const actualMinutes = related.reduce((sum, item) => sum + item.duration, 0);
  const actualStartedAt = related
    .map((item) => item.startedAt)
    .sort((a, b) => a.localeCompare(b))[0];
  return {
    ...state,
    focus: focusRecords,
    activities: state.activities.map((activity) =>
      activity.id === focus.focusOn
        ? { ...activity, actualMinutes, actualStartedAt, updatedAt: stamp }
        : activity,
    ),
  };
}

export function replaceActivityFocus(
  state: AppState,
  activityId: string,
  records: FocusRecord[],
  stamp = now(),
): AppState {
  const activity = state.activities.find((item) => item.id === activityId);
  if (!activity || activity.archivedAt) return state;

  const replacements = new Map(
    records.map((record) => [
      record.id,
      {
        ...record,
        focusOn: activityId,
        duration: Math.max(0, Number(record.duration) || 0),
        title: record.title || activity.title,
        output: record.output || activity.expectedOutput,
        ...(record.minutes === undefined
          ? {}
          : { minutes: Math.max(0, Number(record.duration) || 0) }),
        updatedAt: stamp,
      },
    ]),
  );
  const replacedIds = new Set<string>();
  const focus = state.focus.flatMap((record) => {
    if (record.focusOn !== activityId || record.deletedAt) return [record];
    const replacement = replacements.get(record.id);
    if (!replacement) return [];
    replacedIds.add(record.id);
    return [replacement];
  });
  for (const [id, record] of replacements) {
    if (!replacedIds.has(id)) focus.push({ ...record, createdAt: record.createdAt || stamp });
  }

  const related = focus.filter(
    (record) => record.focusOn === activityId && !record.deletedAt,
  );
  const actualMinutes = related.reduce(
    (total, record) => total + record.duration,
    0,
  );
  const actualStartedAt = related
    .map((record) => record.startedAt)
    .sort((a, b) => a.localeCompare(b))[0];

  return {
    ...state,
    focus,
    activities: state.activities.map((item) =>
      item.id === activityId
        ? { ...item, actualMinutes, actualStartedAt, updatedAt: stamp }
        : item,
    ),
  };
}
