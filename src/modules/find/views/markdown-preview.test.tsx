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

  it("renders Circo colored highlight and underline extensions", () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview content="{{highlight:#FFE066|marked}} and {{underline:#4F46E5|underlined}}" />,
    );
    expect(html).toContain("background-color:#FFE066");
    expect(html).toContain("text-decoration-color:#4F46E5");
    expect(html).toContain("marked");
    expect(html).toContain("underlined");
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

  it("renders MinerU HTML tables instead of exposing their markup", () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview
        content={
          '<table><tr><td rowspan="2">Name</td><td>Speed</td></tr><tr><td>7.8</td></tr></table>'
        }
      />,
    );

    expect(html).toContain("<table");
    expect(html).toContain('<th rowSpan="2"');
    expect(html).toContain("<td");
    expect(html).not.toContain("&lt;table&gt;");
  });

  it("renders MinerU images with Markdown hard-break spaces", () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview content="![](/api/markdown-assets/example/1.jpg)  " />,
    );

    expect(html).toContain(
      '<img src="/api/markdown-assets/example/1.jpg" alt=""',
    );
    expect(html).not.toContain("![](");
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
