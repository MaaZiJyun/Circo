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
});
