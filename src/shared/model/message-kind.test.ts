import { describe, expect, it } from "vitest";
import type { FutureMessage } from "./message";
import {
  isDailySummary,
  shouldCelebrateDailySummary,
} from "./message-kind";

const message = (change: Partial<FutureMessage> = {}): FutureMessage => ({
  id: "message_daily_summary_2026-08-13",
  subject: "Summary",
  body: "",
  recipient: "futureSelf",
  deliveryMode: "scheduled",
  deliverAt: "2026-08-13T23:59:00",
  references: [],
  attachments: [],
  createdAt: "2026-08-13T23:59:00",
  updatedAt: "2026-08-13T23:59:00",
  ...change,
});

describe("daily summary celebration", () => {
  it("recognizes current and legacy daily summary messages", () => {
    expect(isDailySummary(message())).toBe(true);
    expect(
      isDailySummary(message({ id: "system", messageType: "dailySummary" })),
    ).toBe(true);
  });

  it("celebrates only an unread summary that has never celebrated", () => {
    expect(shouldCelebrateDailySummary(message())).toBe(true);
    expect(
      shouldCelebrateDailySummary(message({ readAt: "2026-08-14" })),
    ).toBe(false);
    expect(
      shouldCelebrateDailySummary(message({ celebratedAt: "2026-08-14" })),
    ).toBe(false);
  });
});
