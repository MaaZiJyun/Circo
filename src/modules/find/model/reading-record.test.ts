import { describe, expect, it } from "vitest";
import type { SourceRecord } from "@/shared/model/entities";
import {
  completeReading,
  emptyReadingReview,
  startReading,
} from "./reading-record";

const source = {
  readingStatus: "unread",
  readingReview: emptyReadingReview(),
} as SourceRecord;

describe("literature reading record", () => {
  it("records only the first open time", () => {
    const started = startReading(source, "2026-08-12T01:00:00.000Z");
    const reopened = startReading(started, "2026-08-12T02:00:00.000Z");
    expect(reopened.readingStartedAt).toBe("2026-08-12T01:00:00.000Z");
  });

  it("calculates study duration when marking literature as read", () => {
    const started = startReading(source, "2026-08-12T01:00:00.000Z");
    const completed = completeReading(
      started,
      { ...emptyReadingReview(), problem: "A problem" },
      "2026-08-12T02:30:00.000Z",
    );
    expect(completed.readingStatus).toBe("read");
    expect(completed.studyDurationMinutes).toBe(90);
    expect(completed.readingCompletedAt).toBe("2026-08-12T02:30:00.000Z");
  });
});
