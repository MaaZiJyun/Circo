import { describe, expect, it } from "vitest";
import { markdownCardToken, parseMarkdownCard } from "./markdown-card";

describe("Markdown Card syntax", () => {
  it("round-trips supported entity references", () => {
    const reference = { kind: "task", id: "task_123" } as const;
    expect(parseMarkdownCard(markdownCardToken(reference))).toEqual(reference);
  });

  it("does not interpret ordinary Markdown or unsafe identifiers", () => {
    expect(parseMarkdownCard("[link](https://example.com)")).toBeNull();
    expect(parseMarkdownCard("[[card:task:../../secret]]")).toBeNull();
  });

  it("supports Note references keyed by their source id", () => {
    expect(parseMarkdownCard("[[card:note:source_123]]")).toEqual({
      kind: "note",
      id: "source_123",
    });
  });
});
