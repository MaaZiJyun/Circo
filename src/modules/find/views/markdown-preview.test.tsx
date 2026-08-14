import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownPreview } from "./markdown-preview";

describe("MarkdownPreview", () => {
  it("renders italic and bold inline Markdown", () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview content="Use *emphasis* and **strong text**." />,
    );

    expect(html).toContain("<em>emphasis</em>");
    expect(html).toContain("<strong>strong text</strong>");
  });

  it("renders pipe tables as a single semantic table", () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview
        content={"| Name | Score |\n| --- | ---: |\n| Circo | **95** |"}
      />,
    );

    expect(html).toContain("<table");
    expect(html).toContain("<th");
    expect(html).toContain("<td");
    expect(html).not.toContain("---:");
    expect(html).toContain("<strong>95</strong>");
  });

  it("renders fenced code without interpreting its Markdown", () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview
        content={"```ts\nconst value = **not bold**;\n  return value;\n```"}
      />,
    );

    expect(html).toContain("<pre");
    expect(html).toContain("<code>");
    expect(html).toContain("const value = **not bold**;");
    expect(html).not.toContain("<strong>not bold</strong>");
    expect(html).toContain("ts");
  });
});
