export interface TaskCoordinates {
  urgency: number;
  importance: number;
  priority: number;
  effort: number;
  quadrant: "do" | "schedule" | "delegate" | "eliminate";
}

export interface QuadrantAxis {
  maximum: number;
  threshold: number;
  position: (value: number) => number;
}

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));
const plotInset = 5;
const minimumBubbleDiameter = 48;
const maximumBubbleDiameter = 128;

export function quadrantAxis(values: number[]): QuadrantAxis {
  void values;
  const maximum = 100;
  const position = (value: number) =>
    plotInset +
    (Math.min(maximum, Math.max(0, value)) / maximum) * (100 - plotInset * 2);
  return { maximum, threshold: position(50), position };
}

export function taskBubbleDiameter(
  estimatedMinutes: number,
  maximumMinutes: number,
) {
  const ratio = Math.min(
    1,
    Math.max(0, estimatedMinutes) / Math.max(1, maximumMinutes),
  );
  return Math.round(
    minimumBubbleDiameter +
      ratio * (maximumBubbleDiameter - minimumBubbleDiameter),
  );
}

export function taskCoordinates(
  importance: number,
  urgency: number,
  effort: number,
): TaskCoordinates {
  const normalizedUrgency = clamp(((urgency - 2) / 13) * 100);
  const normalizedImportance = clamp(((importance - 4) / 16) * 100);
  const urgent = urgency >= 8.5;
  const important = importance >= 12;
  return {
    urgency: normalizedUrgency,
    importance: normalizedImportance,
    priority:
      Math.round((importance * urgency * 100) / Math.max(1, effort)) / 100,
    effort: Math.max(1, effort),
    quadrant: important
      ? urgent
        ? "do"
        : "schedule"
      : urgent
        ? "delegate"
        : "eliminate",
  };
}
