import { describe, expect, it } from "vitest";
import { isRecentlyAdded } from "./use-library-management";

describe("recently added literature", () => {
  const now = Date.parse("2026-08-12T12:00:00.000Z");

  it("includes literature added within the previous seven days", () => {
    expect(isRecentlyAdded("2026-08-05T12:00:00.000Z", now)).toBe(true);
    expect(isRecentlyAdded("2026-08-10T08:00:00.000Z", now)).toBe(true);
  });

  it("excludes older and invalid timestamps", () => {
    expect(isRecentlyAdded("2026-08-05T11:59:59.999Z", now)).toBe(false);
    expect(isRecentlyAdded("not-a-date", now)).toBe(false);
  });
});
