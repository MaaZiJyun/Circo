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
  profile: UserProfile;
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
  "schemaVersion" | "revision" | "updatedAt" | "profile"
>;

export interface UserProfile {
  name: string;
  avatarDataUrl: string;
}

export type AppEntity = AppState[CollectionName][number];

export interface AppRepository {
  load(): Promise<AppState>;
  save(state: AppState): Promise<AppState>;
  restore(state: AppState): Promise<AppState>;
}

function isProfile(value: unknown) {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<UserProfile>;
  const avatar = profile.avatarDataUrl;
  return (
    typeof profile.name === "string" &&
    profile.name.trim().length > 0 &&
    profile.name.length <= 60 &&
    typeof avatar === "string" &&
    avatar.length <= 3_000_000 &&
    (avatar === "" || /^data:image\/(jpeg|png|webp);base64,/.test(avatar))
  );
}

export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<AppState>;
  return (
    item.schemaVersion === 1 &&
    typeof item.revision === "number" &&
    isProfile(item.profile) &&
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
