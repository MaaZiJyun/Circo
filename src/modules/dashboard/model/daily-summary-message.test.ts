import { describe, expect, it } from "vitest";
import type { DailyTask } from "@/shared/model/entities";
import type { DailyReviewAnswers } from "@/shared/model/message";
import {
  buildDailySummaryMessage,
  dailySummaryId,
  shouldCelebrateFinishToday,
} from "./daily-summary-message";

const task: DailyTask = {
  id: "daily_1",
  date: "2026-08-14",
  title: "Ship Finish Today",
  description: "",
  completed: true,
  dueAt: "2026-08-14T22:00",
  estimatedMinutes: 60,
  actualMinutes: 60,
  expectedOutput: "",
  impact: 4,
  goal: 4,
  risk: 4,
  value: 4,
  importance: 16,
  delayLoss: 3,
  dependencyIds: [],
  complexity: 3,
  uncertainty: 3,
  createdAt: "2026-08-14T00:00:00.000Z",
  updatedAt: "2026-08-14T00:00:00.000Z",
};

const review: DailyReviewAnswers = {
  accomplished: "Completed the workflow.",
  learned: "A shared builder prevents drift.",
  wentWrong: "The first layout was too wide.",
  unfinished: "Nothing remains.",
  changeNextTime: "Test the shared path first.",
  tomorrowPriority: "Plan tomorrow.",
};

describe("daily summary message", () => {
  it("uses the scheduled summary id for an early Finish Today message", () => {
    const { message, result } = buildDailySummaryMessage({
      dailyTasks: [task],
      date: "2026-08-14",
      stamp: "2026-08-14T18:00:00.000Z",
      deliverAt: "2026-08-14T18:00:00.000Z",
      review,
      t: (key) => key,
      formatNumber: String,
    });

    expect(message.id).toBe(dailySummaryId("2026-08-14"));
    expect(message.deliverAt).toBe("2026-08-14T18:00:00.000Z");
    expect(message.readAt).toBeUndefined();
    expect(message.dailyReview).toEqual(review);
    expect(message.body).toContain(review.tomorrowPriority);
    expect(message.body).toContain("score: 100 / 100");
    expect(result.score).toBe(100);
  });

  it("celebrates only scores greater than 60", () => {
    expect(shouldCelebrateFinishToday(60)).toBe(false);
    expect(shouldCelebrateFinishToday(61)).toBe(true);
  });
});
