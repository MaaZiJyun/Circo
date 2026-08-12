import type { LiteratureReview, SourceRecord } from "@/shared/model/entities";

export const emptyReadingReview = (): LiteratureReview => ({
  type: "",
  problem: "",
  approach: "",
  result: "",
  limitation: "",
  inspiration: "",
  structure: "",
});

export function startReading(source: SourceRecord, timestamp: string) {
  if (source.readingStatus === "read" || source.readingStartedAt) return source;
  return { ...source, readingStartedAt: timestamp };
}

export function completeReading(
  source: SourceRecord,
  review: LiteratureReview,
  timestamp: string,
): Partial<SourceRecord> {
  const start = Date.parse(source.readingStartedAt ?? timestamp);
  const end = Date.parse(timestamp);
  return {
    readingStatus: "read",
    readingStartedAt: source.readingStartedAt ?? timestamp,
    readingCompletedAt: timestamp,
    studyDurationMinutes: Math.max(0, Math.round((end - start) / 6000) / 10),
    readingReview: review,
  };
}
