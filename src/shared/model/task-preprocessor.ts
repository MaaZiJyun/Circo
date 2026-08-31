import type { TaskImportanceDimensions } from "./task-importance-types";

export interface TaskPreprocessingRule extends TaskImportanceDimensions {
  id: string;
  activityListId?: string;
  name: string;
  keywords: string[];
  description: string;
  estimatedMinutes: number;
  expectedOutput: string;
  delayLoss: number;
  complexity: number;
  uncertainty: number;
}

export type TaskPreprocessingValues = Pick<
  TaskPreprocessingRule,
  | "description"
  | "estimatedMinutes"
  | "expectedOutput"
  | "impact"
  | "goal"
  | "risk"
  | "value"
  | "delayLoss"
  | "complexity"
  | "uncertainty"
>;

const rule = (
  value: Omit<TaskPreprocessingRule, "id"> & { id?: string },
): TaskPreprocessingRule => ({
  id: value.id ?? value.name.toLowerCase().replace(/\s+/g, "-"),
  ...value,
});

export const defaultTaskPreprocessingRules: TaskPreprocessingRule[] = [
  rule({
    id: "writing",
    name: "写作 / 报告",
    keywords: ["报告", "写作", "文章", "文档", "汇报", "report", "write", "document"],
    description: "围绕“{{name}}”明确结构、完成内容，并标记需要补充的部分。",
    estimatedMinutes: 120,
    expectedOutput: "一份可审阅的初稿，包含清晰结构、核心内容和待补充项。",
    impact: 4,
    goal: 4,
    risk: 3,
    value: 4,
    delayLoss: 3,
    complexity: 3,
    uncertainty: 3,
  }),
  rule({
    id: "meal",
    name: "吃饭 / 用餐",
    keywords: ["早餐", "早饭", "午餐", "午饭", "晚餐", "晚饭", "吃饭", "用餐", "breakfast", "lunch", "dinner", "meal"],
    description: "完成“{{name}}”，留出必要的用餐和短暂休息时间。",
    estimatedMinutes: 20,
    expectedOutput: "完成用餐，恢复精力。",
    impact: 1,
    goal: 1,
    risk: 1,
    value: 2,
    delayLoss: 1,
    complexity: 1,
    uncertainty: 1,
  }),
  rule({
    id: "meeting",
    name: "会议 / 沟通",
    keywords: ["会议", "沟通", "讨论", "面试", "meeting", "call", "interview"],
    description: "围绕“{{name}}”准备议题，完成沟通并记录决定。",
    estimatedMinutes: 45,
    expectedOutput: "明确的结论、负责人和后续行动。",
    impact: 4,
    goal: 4,
    risk: 3,
    value: 4,
    delayLoss: 4,
    complexity: 2,
    uncertainty: 3,
  }),
  rule({
    id: "coding",
    name: "编码 / 开发",
    keywords: ["编码", "开发", "修复", "代码", "编程", "bug", "code", "develop", "implement"],
    description: "完成“{{name}}”的实现，进行基本验证并记录未解决问题。",
    estimatedMinutes: 90,
    expectedOutput: "可运行的实现或修复，以及对应的基本验证结果。",
    impact: 4,
    goal: 4,
    risk: 4,
    value: 4,
    delayLoss: 3,
    complexity: 4,
    uncertainty: 3,
  }),
  rule({
    id: "research",
    name: "研究 / 调研",
    keywords: ["研究", "调研", "分析", "查资料", "research", "analyze", "analysis"],
    description: "针对“{{name}}”收集关键资料，比较结论并记录仍待确认的问题。",
    estimatedMinutes: 90,
    expectedOutput: "资料来源、主要结论、判断依据和开放问题。",
    impact: 4,
    goal: 4,
    risk: 3,
    value: 4,
    delayLoss: 2,
    complexity: 3,
    uncertainty: 4,
  }),
  rule({
    id: "exercise",
    name: "运动 / 锻炼",
    keywords: ["运动", "锻炼", "跑步", "健身", "exercise", "workout", "run", "gym"],
    description: "完成“{{name}}”，记录实际完成情况和身体感受。",
    estimatedMinutes: 45,
    expectedOutput: "完成训练，并记录时长、内容和感受。",
    impact: 2,
    goal: 2,
    risk: 1,
    value: 3,
    delayLoss: 1,
    complexity: 2,
    uncertainty: 2,
  }),
  rule({
    id: "admin",
    name: "行政 / 日常事务",
    keywords: ["缴费", "预约", "整理", "提交", "购买", "账单", "pay", "schedule", "organize"],
    description: "完成“{{name}}”，确认事务已提交、整理或安排妥当。",
    estimatedMinutes: 30,
    expectedOutput: "事务完成，并保留必要的确认信息。",
    impact: 2,
    goal: 2,
    risk: 2,
    value: 2,
    delayLoss: 3,
    complexity: 1,
    uncertainty: 2,
  }),
  rule({
    id: "generic",
    name: "其他任务",
    keywords: [],
    description: "明确“{{name}}”的完成标准，并拆出下一步行动。",
    estimatedMinutes: 60,
    expectedOutput: "一个明确、可检查的完成结果。",
    impact: 3,
    goal: 3,
    risk: 3,
    value: 3,
    delayLoss: 3,
    complexity: 3,
    uncertainty: 3,
  }),
];

function score(value: number) {
  return Math.max(1, Math.min(5, Math.round(Number(value) || 3)));
}

function normalizeRules(rules?: TaskPreprocessingRule[]) {
  return rules?.length ? rules : defaultTaskPreprocessingRules;
}

function renderTemplate(value: string, title: string) {
  return value.replaceAll("{{name}}", title.trim());
}

export function preprocessTask(
  title: string,
  rules?: TaskPreprocessingRule[],
): TaskPreprocessingValues & { ruleId: string; ruleName: string } {
  const normalizedTitle = title.trim().toLocaleLowerCase();
  const candidates = normalizeRules(rules);
  const matched = candidates.find(
    (candidate) =>
      candidate.id !== "generic" &&
      candidate.keywords.some((keyword) => {
        const normalizedKeyword = keyword.trim().toLocaleLowerCase();
        return normalizedKeyword.length > 0 && normalizedTitle.includes(normalizedKeyword);
      }),
  );
  const selected = matched ?? candidates.find((candidate) => candidate.id === "generic") ?? candidates[candidates.length - 1];
  return {
    ruleId: selected.id,
    ruleName: selected.name,
    description: renderTemplate(selected.description, title),
    estimatedMinutes: Math.max(5, Math.round(selected.estimatedMinutes / 5) * 5),
    expectedOutput: selected.expectedOutput,
    impact: score(selected.impact),
    goal: score(selected.goal),
    risk: score(selected.risk),
    value: score(selected.value),
    delayLoss: score(selected.delayLoss),
    complexity: score(selected.complexity),
    uncertainty: score(selected.uncertainty),
  };
}
