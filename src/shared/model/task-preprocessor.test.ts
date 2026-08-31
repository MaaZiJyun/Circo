import { describe, expect, it } from "vitest";
import {
  defaultTaskPreprocessingRules,
  preprocessTask,
} from "./task-preprocessor";

describe("task preprocessor", () => {
  it("uses different profiles for writing and meals", () => {
    const report = preprocessTask("写报告", defaultTaskPreprocessingRules);
    const breakfast = preprocessTask("吃早饭", defaultTaskPreprocessingRules);

    expect(report.ruleId).toBe("writing");
    expect(report.estimatedMinutes).toBeGreaterThan(breakfast.estimatedMinutes);
    expect(report.expectedOutput).not.toBe(breakfast.expectedOutput);
    expect(report.complexity).toBeGreaterThan(breakfast.complexity);
    expect(report.description).toContain("写报告");
  });

  it("uses user-defined rules before the generic fallback", () => {
    const rules = [
      {
        ...defaultTaskPreprocessingRules.at(-1)!,
        id: "reading",
        name: "阅读",
        keywords: ["读书"],
        estimatedMinutes: 35,
        description: "完成 {{name}}。",
      },
      defaultTaskPreprocessingRules.at(-1)!,
    ];

    const result = preprocessTask("读书", rules);
    expect(result.ruleId).toBe("reading");
    expect(result.estimatedMinutes).toBe(35);
    expect(result.description).toBe("完成 读书。");
  });
});
