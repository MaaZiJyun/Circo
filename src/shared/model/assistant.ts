import type {
  Artifact,
  Idea,
  ProjectLog,
  ProjectRecord,
  SourceRecord,
} from "./entities";

export type AssistantLocale = "zh-CN" | "en";

export interface AssistantAdapter {
  guide(source: SourceRecord, locale: AssistantLocale): Promise<string>;
  summarize(source: SourceRecord, locale: AssistantLocale): Promise<string>;
  explore(
    input: string,
    method: Idea["method"],
    locale: AssistantLocale,
  ): Promise<string>;
  draft(
    project: ProjectRecord | undefined,
    logs: ProjectLog[],
    artifact: Artifact,
    locale: AssistantLocale,
  ): Promise<string>;
}
