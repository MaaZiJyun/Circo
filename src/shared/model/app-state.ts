import type {
  Annotation,
  AIJob,
  Artifact,
  Attachment,
  Cycle,
  DailyTask,
  EventReason,
  Goal,
  Idea,
  IdeaList,
  LibraryList,
  ProjectLog,
  ProjectList,
  PointList,
  ProjectRecord,
  ReferencePoint,
  Relation,
  SourceRecord,
  TaskRecord,
  WorkSession,
} from "./entities";
import type { FutureMessage } from "./message";

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
  libraryLists: LibraryList[];
  projectLists: ProjectList[];
  ideaLists: IdeaList[];
  pointLists: PointList[];
  points: ReferencePoint[];
  annotations: Annotation[];
  ideas: Idea[];
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  dailyTasks: DailyTask[];
  dailyCacheClearedDates?: string[];
  logs: ProjectLog[];
  attachments: Attachment[];
  artifacts: Artifact[];
  relations: Relation[];
  aiJobs: AIJob[];
  messages: FutureMessage[];
}

export type CollectionName = Exclude<
  keyof AppState,
  | "schemaVersion"
  | "revision"
  | "updatedAt"
  | "profile"
  | "dailyCacheClearedDates"
>;

export interface UserProfile {
  name: string;
  avatarDataUrl: string;
  birthDate?: string;
  backgroundAudioToken?: string;
  backgroundAudioName?: string;
  backgroundMusicEnabled?: boolean;
  backgroundAudioTracks?: BackgroundAudioTrack[];
  countdownTaskSlots?: Array<string | null>;
  matrixFormulas?: MatrixFormulaSettings;
}

export interface MatrixFormulaSettings {
  urgency?: string;
  importance?: string;
  /** Legacy layout formulas kept for loading older snapshots; no longer editable. */
  x?: string;
  y?: string;
  size?: string;
  dispersion?: number;
}

export interface BackgroundAudioTrack {
  token: string;
  name: string;
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
    (avatar === "" ||
      /^data:image\/(jpeg|png|webp|svg\+xml);base64,/.test(avatar)) &&
    (profile.backgroundAudioToken === undefined ||
      (typeof profile.backgroundAudioToken === "string" &&
        (profile.backgroundAudioToken === "" ||
          /^[a-f0-9-]+\.(aac|flac|m4a|mp3|ogg|wav|webm)$/i.test(
            profile.backgroundAudioToken,
          )))) &&
    (profile.backgroundAudioName === undefined ||
      (typeof profile.backgroundAudioName === "string" &&
        profile.backgroundAudioName.length <= 200)) &&
    (profile.backgroundMusicEnabled === undefined ||
      typeof profile.backgroundMusicEnabled === "boolean") &&
    (profile.backgroundAudioTracks === undefined ||
      (Array.isArray(profile.backgroundAudioTracks) &&
        profile.backgroundAudioTracks.length <= 100 &&
        profile.backgroundAudioTracks.every(
          (track) =>
            track &&
            typeof track === "object" &&
            typeof track.token === "string" &&
            /^[a-f0-9-]+\.(aac|flac|m4a|mp3|ogg|wav|webm)$/i.test(
              track.token,
            ) &&
            typeof track.name === "string" &&
            track.name.length <= 200,
        ))) &&
    (profile.countdownTaskSlots === undefined ||
      (Array.isArray(profile.countdownTaskSlots) &&
        profile.countdownTaskSlots.length <= 3 &&
        profile.countdownTaskSlots.every(
          (taskId) => taskId === null || typeof taskId === "string",
        ))) &&
    (profile.matrixFormulas === undefined ||
      (profile.matrixFormulas !== null &&
        typeof profile.matrixFormulas === "object" &&
        [profile.matrixFormulas.x, profile.matrixFormulas.y, profile.matrixFormulas.size]
          .every((formula) => formula === undefined || (typeof formula === "string" && formula.length <= 300)) &&
        (profile.matrixFormulas.urgency === undefined ||
          (typeof profile.matrixFormulas.urgency === "string" &&
            profile.matrixFormulas.urgency.length <= 300)) &&
        (profile.matrixFormulas.importance === undefined ||
          (typeof profile.matrixFormulas.importance === "string" &&
            profile.matrixFormulas.importance.length <= 300)) &&
        (profile.matrixFormulas.dispersion === undefined ||
          (typeof profile.matrixFormulas.dispersion === "number" &&
            profile.matrixFormulas.dispersion >= 0.1 &&
            profile.matrixFormulas.dispersion <= 10)))) &&
    (profile.birthDate === undefined ||
      /^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate))
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
    (item.libraryLists === undefined || Array.isArray(item.libraryLists)) &&
    (item.projectLists === undefined || Array.isArray(item.projectLists)) &&
    (item.ideaLists === undefined || Array.isArray(item.ideaLists)) &&
    (item.pointLists === undefined || Array.isArray(item.pointLists)) &&
    (item.points === undefined || Array.isArray(item.points)) &&
    Array.isArray(item.ideas) &&
    Array.isArray(item.projects) &&
    (item.dailyTasks === undefined || Array.isArray(item.dailyTasks)) &&
    Array.isArray(item.artifacts) &&
    Array.isArray(item.aiJobs) &&
    (item.messages === undefined || Array.isArray(item.messages))
  );
}

export function activeItems<T extends { deletedAt?: string }>(items: T[]): T[] {
  return items.filter((item) => !item.deletedAt);
}
