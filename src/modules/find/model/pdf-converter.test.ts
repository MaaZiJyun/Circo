import { describe, expect, it } from "vitest";
import { pdfAssetUrl, pdfTextToMarkdown } from "./pdf-converter";

describe("PDF text to Markdown", () => {
  it("builds an encoded URL for an extracted image", () => {
    expect(
      pdfAssetUrl("3806cc10-6b9c-4047-9d3b-a3646bd10a40", "1-1.png"),
    ).toBe(
      "/api/markdown-assets/3806cc10-6b9c-4047-9d3b-a3646bd10a40/1-1.png",
    );
  });
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

  it("includes detected tables and extracted images on their source page", () => {
    const markdown = pdfTextToMarkdown(
      [{ num: 2, text: "Results" }],
      {
        images: new Map([[2, ["/api/files/aabbccdd-2-1.png"]]]),
        tables: [
          {
            num: 2,
            tables: [[ ["Method", "Score"], ["Circo", "95"] ]],
          },
        ],
      },
    );
    expect(markdown).toContain("| Method | Score |");
    expect(markdown).toContain(
      "![Page 2 image 1](/api/files/aabbccdd-2-1.png)",
    );
  });
});
