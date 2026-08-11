import type {
  Annotation,
  AIJob,
  Artifact,
  Attachment,
  Cycle,
  EventReason,
  Goal,
  Idea,
  ProjectLog,
  ProjectRecord,
  Relation,
  SourceRecord,
  TaskRecord,
  WorkSession,
} from "./entities";

export interface AppState {
  schemaVersion: 1;
  revision: number;
  updatedAt: string;
  cycles: Cycle[];
  goals: Goal[];
  sessions: WorkSession[];
  events: EventReason[];
  sources: SourceRecord[];
  annotations: Annotation[];
  ideas: Idea[];
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  logs: ProjectLog[];
  attachments: Attachment[];
  artifacts: Artifact[];
  relations: Relation[];
  aiJobs: AIJob[];
}

export type CollectionName = Exclude<
  keyof AppState,
  "schemaVersion" | "revision" | "updatedAt"
>;

export type AppEntity = AppState[CollectionName][number];

export interface AppRepository {
  load(): Promise<AppState>;
  save(state: AppState): Promise<AppState>;
  restore(state: AppState): Promise<AppState>;
}

export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<AppState>;
  return (
    item.schemaVersion === 1 &&
    typeof item.revision === "number" &&
    Array.isArray(item.cycles) &&
    Array.isArray(item.goals) &&
    Array.isArray(item.sources) &&
    Array.isArray(item.ideas) &&
    Array.isArray(item.projects) &&
    Array.isArray(item.artifacts) &&
    Array.isArray(item.aiJobs)
  );
}

export function activeItems<T extends { deletedAt?: string }>(items: T[]): T[] {
  return items.filter((item) => !item.deletedAt);
}
