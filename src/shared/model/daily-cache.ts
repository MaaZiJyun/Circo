import type { AppState } from "./app-state";

export function isDailyCacheCleared(state: AppState, date: string) {
  return Boolean(
    state.dailyCacheClearedDates?.includes(date) ||
    state.messages?.some(
      (message) => message.id === `message_daily_summary_${date}`,
    ),
  );
}

export function clearDailyCacheDate(state: AppState, date: string): AppState {
  const dates = new Set(state.dailyCacheClearedDates ?? []);
  dates.add(date);
  return {
    ...state,
    dailyCacheClearedDates: [...dates],
    profile: {
      ...state.profile,
      countdownTaskSlots: [null, null, null],
    },
  };
}
