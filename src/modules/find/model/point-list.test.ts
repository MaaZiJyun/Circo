import { describe, expect, it } from "vitest";
import { defaultPointColor, pointTraceColor } from "./point-list";

describe("pointTraceColor", () => {
  it("uses the first Point List color", () => {
    expect(
      pointTraceColor({ listIds: ["list_blue", "list_red"] }, [
        { id: "list_red", color: "#ef4444" },
        { id: "list_blue", color: "#2563eb" },
      ]),
    ).toBe("#2563eb");
  });

  it("uses the fallback color without a Point List", () => {
    expect(pointTraceColor({ listIds: [] }, [])).toBe(defaultPointColor);
  });
});
