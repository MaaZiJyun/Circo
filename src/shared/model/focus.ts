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
