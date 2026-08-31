import { describe, expect, it } from "vitest";
import { applyMarkdownCommand } from "./markdown-editor-command";

describe("Markdown editor commands", () => {
  it("wraps selected text with inline formatting", () => {
    expect(
      applyMarkdownCommand("hello", { start: 0, end: 5 }, "bold").content,
    ).toBe("**hello**");
    expect(
      applyMarkdownCommand(
        "hello",
        { start: 0, end: 5 },
        "highlight",
        "#ABCDEF",
      ).content,
    ).toBe("{{highlight:#ABCDEF|hello}}");
  });

  it("creates block Markdown components", () => {
    expect(
      applyMarkdownCommand("item", { start: 0, end: 4 }, "list").content,
    ).toBe("- item");
    expect(
      applyMarkdownCommand("", { start: 0, end: 0 }, "table").content,
    ).toContain("| --- | --- |");
  });
});
