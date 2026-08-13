import { describe, expect, it } from "vitest";
import { projectLogTitle } from "./project-log";

describe("project log title", () => {
  it("uses the first Markdown heading", () => {
    expect(
      projectLogTitle({
        content: "Some preface\n## Experiment result\nDetails",
        createdAt: "2026-08-13T00:00:00.000Z",
      }),
    ).toBe("Experiment result");
  });

  it("falls back to the first text line or date", () => {
    expect(
      projectLogTitle({
        content: "A short update",
        createdAt: "2026-08-13T00:00:00.000Z",
      }),
    ).toBe("A short update");
    expect(
      projectLogTitle({ content: "", createdAt: "2026-08-13T00:00:00.000Z" }),
    ).toBe("2026-08-13");
  });
});
