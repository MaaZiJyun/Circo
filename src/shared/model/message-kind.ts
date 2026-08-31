import type { FutureMessage } from "./message";

export function isDailySummary(message: FutureMessage) {
  return (
    message.messageType === "dailySummary" ||
    message.id.startsWith("message_daily_summary_")
  );
}

export function shouldCelebrateDailySummary(message: FutureMessage) {
  return isDailySummary(message) && !message.readAt && !message.celebratedAt;
}
