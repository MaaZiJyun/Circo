import type {
  AssistantAdapter,
  AssistantLocale,
} from "@/shared/model/assistant";
import type {
  Artifact,
  Idea,
  ProjectLog,
  ProjectRecord,
  SourceRecord,
} from "@/shared/model/entities";

const excerpt = (content: string) =>
  content
    .replace(/[#>*_`]/g, "")
    .trim()
    .slice(0, 280);

export class LocalAssistant implements AssistantAdapter {
  async guide(source: SourceRecord, locale: AssistantLocale) {
    const text = excerpt(source.content);
    return locale === "zh-CN"
      ? `本地辅助草稿 · 来源：${source.fileName || source.title}\n\n核心内容：${text}\n\n解释：这份材料可以从“研究对象—采用方法—证据—限制”四个层次阅读。以上内容由本地规则生成，需用户核实。`
      : `Local assistant draft · Source: ${source.fileName || source.title}\n\nCore content: ${text}\n\nExplanation: Read this source through four layers: subject, method, evidence, and limitations. This rule-based output requires verification.`;
  }

  async summarize(source: SourceRecord, locale: AssistantLocale) {
    const text = excerpt(source.content);
    return locale === "zh-CN"
      ? `研究问题：待根据原文确认。\n方法：从转换文本中提取关键论述。\n数据/证据：${text}\n主要结论：待用户核实。\n局限性：本地演示未执行语义模型推理。\n可借鉴点：将关键论述转为灵感并关联原文位置。`
      : `Research question: Confirm from the source.\nMethod: Extract the central statement from converted text.\nData/evidence: ${text}\nMain conclusion: User verification required.\nLimitations: The local demo does not run semantic model inference.\nReusable insight: Convert key statements into ideas linked to their location.`;
  }

  async explore(
    input: string,
    method: Idea["method"],
    locale: AssistantLocale,
  ) {
    const zh: Record<Idea["method"], string> = {
      capture: `继续澄清“${input}”解决的具体问题、目标对象和成功标准。`,
      combine: `将“${input}”拆成两个学科概念：一个提供机制，一个提供应用场景，寻找可验证的交叉点。`,
      transfer: `把“${input}”中的方法迁移到约束不同的问题，并比较哪些假设仍然成立。`,
      alternative: `保持“${input}”的问题不变，分别尝试规则方法、数据方法与混合方法。`,
      premise: `追问“${input}”成立所需的数据、资源、环境和因果假设，并设计最小验证。`,
      followUp: `沿“${input}”的反向、去中心化和长期演进方向各形成一个后续问题。`,
      macro: `把“${input}”放入系统架构、跨模态协作和长期演进的大尺度中考虑。`,
      micro: `聚焦“${input}”中的单一部件、能耗、延迟或误差，定义可测量改进。`,
    };
    const en: Record<Idea["method"], string> = {
      capture: `Clarify the problem, target user, and success criteria behind “${input}”.`,
      combine: `Split “${input}” into two disciplines: one supplies a mechanism and the other a use case, then find a testable intersection.`,
      transfer: `Transfer the method in “${input}” to a differently constrained problem and compare which assumptions survive.`,
      alternative: `Keep the problem in “${input}” fixed and compare rule-based, data-driven, and hybrid methods.`,
      premise: `List the data, resource, environment, and causal assumptions required by “${input}”, then design a minimal test.`,
      followUp: `Explore the reverse, decentralized, and long-term evolution paths of “${input}”.`,
      macro: `Place “${input}” in a system architecture, cross-modal, and long-term context.`,
      micro: `Focus on one component, energy cost, latency, or error in “${input}” and define a measurable improvement.`,
    };
    return locale === "zh-CN" ? zh[method] : en[method];
  }

  async draft(
    project: ProjectRecord | undefined,
    logs: ProjectLog[],
    artifact: Artifact,
    locale: AssistantLocale,
  ) {
    const evidence = logs.map((log) => `- ${log.content}`).join("\n");
    if (locale === "zh-CN")
      return `# ${artifact.title}\n\n## 背景与问题\n${project?.purpose || "待补充项目背景。"}\n\n## 方法与过程\n${evidence || "待从项目日志补充。"}\n\n## 结果\n${project?.expected || "待补充预期成果。"}\n\n## 局限与下一步\n> 待核实：当前草稿仅使用已选择项目及日志材料。`;
    return `# ${artifact.title}\n\n## Context and problem\n${project?.purpose || "Add project context."}\n\n## Method and process\n${evidence || "Add evidence from project logs."}\n\n## Outcome\n${project?.expected || "Add the expected outcome."}\n\n## Limitations and next step\n> Verification needed: this draft only uses the selected project and log material.`;
  }
}
