import { describe, expect, it } from "vitest";
import { pdfTextToMarkdown } from "./pdf-to-markdown";

describe("PDF text to Markdown", () => {
  it("creates headings, paragraphs, lists, and page anchors", () => {
    const markdown = pdfTextToMarkdown([
      {
        num: 1,
        text: "A STUDY OF CIRCO\n\nAbstract\nA long para-\ngraph continues here.\n\n• First item\n• Second item\n1",
      },
    ]);
    expect(markdown).toContain("<!-- Page 1 -->");
    expect(markdown).toContain("## A STUDY OF CIRCO");
    expect(markdown).toContain("## Abstract");
    expect(markdown).toContain("A long paragraph continues here.");
    expect(markdown).toContain("- First item\n\n- Second item");
  });

  it("removes repeated headers and footers", () => {
    const markdown = pdfTextToMarkdown([
      { num: 1, text: "Journal of Circo\nFirst page body.\nPage 1 of 2" },
      { num: 2, text: "Journal of Circo\nSecond page body.\nPage 2 of 2" },
    ]);
    expect(markdown).not.toContain("Journal of Circo");
    expect(markdown).not.toContain("Page 1 of 2");
    expect(markdown).toContain("First page body.");
    expect(markdown).toContain("Second page body.");
  });

  it("turns tabular rows into a Markdown table", () => {
    const markdown = pdfTextToMarkdown([
      { num: 1, text: "Results\n\nMethod\tScore\nCirco\t95" },
    ]);
    expect(markdown).toContain("| Method | Score |");
    expect(markdown).toContain("| --- | --- |");
    expect(markdown).toContain("| Circo | 95 |");
  });
});
