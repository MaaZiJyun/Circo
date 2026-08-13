export interface TaskCoordinates {
  urgency: number;
  importance: number;
  quadrant: "do" | "schedule" | "delegate" | "eliminate";
}

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

export function taskCoordinates(
  dueAt: string,
  estimatedMinutes: number,
  importance: number,
  currentTime = Date.now(),
): TaskCoordinates {
  const dueTime = Date.parse(dueAt);
  const remainingMinutes = Number.isFinite(dueTime)
    ? (dueTime - currentTime) / 60_000
    : 30 * 24 * 60;
  const estimate = Math.max(1, estimatedMinutes);
  const slackRatio = (remainingMinutes - estimate) / estimate;
  const urgency = clamp(100 - slackRatio * 25);
  const normalizedImportance = clamp(importance);
  const urgent = urgency >= 50;
  const important = normalizedImportance >= 50;
  return {
    urgency,
    importance: normalizedImportance,
    quadrant: important
      ? urgent
        ? "do"
        : "schedule"
      : urgent
        ? "delegate"
        : "eliminate",
  };
}
