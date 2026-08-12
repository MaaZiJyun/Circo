import { describe, expect, it } from "vitest";
import { pdfAssetUrl } from "./pdf-assets";

describe("PDF asset paths", () => {
  it("encodes asset URLs", () => {
    expect(pdfAssetUrl("3806cc10-6b9c-4047-9d3b-a3646bd10a40", "1-1.png")).toBe(
      "/api/markdown-assets/3806cc10-6b9c-4047-9d3b-a3646bd10a40/1-1.png",
    );
  });
});
