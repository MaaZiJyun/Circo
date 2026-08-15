import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { AppRepository, AppState } from "@/shared/model/app-state";
import { isAppState } from "@/shared/model/app-state";
import { getStorageConfig } from "./storage-config";
import { createSeedState } from "./seed";
import { seedPointLists } from "./seed-project-lists";
import { emptyReadingReview } from "@/modules/find/model/reading-record";
import { normalizeBackgroundAudio } from "@/shared/model/background-audio";
import { normalizeTaskImportance } from "@/shared/model/task-importance";
import { normalizeTaskFactors } from "@/shared/model/task-factors";
import { normalizeTasks, withoutLegacyRoutineTasks } from "@/shared/model/task-normalization";
const systemLists = [
  {
    id: "library_default",
    name: "Default List",
    note: "All imported literature",
    tags: [],
    color: "#18181b",
    system: "default" as const,
  },
  {
    id: "library_recent",
    name: "Recently Added",
    note: "Literature ordered by import time",
    tags: [],
    color: "#2563eb",
    system: "recent" as const,
  },
  {
    id: "library_marked",
    name: "Marked",
    note: "All marked literature",
    tags: [],
    color: "#ef4444",
    system: "marked" as const,
  },
];
const systemProjectLists = [
  {
    id: "project_list_default",
    name: "All Projects",
    note: "All projects",
    color: "#18181b",
    system: "default" as const,
  },
  {
    id: "project_list_recent",
    name: "Recently Added",
    note: "Projects added in the last seven days",
    color: "#2563eb",
    system: "recent" as const,
  },
];
const systemIdeaLists = [
  {
    id: "idea_list_default",
    name: "All Ideas",
    note: "All ideas",
    color: "#18181b",
    system: "default" as const,
  },
  {
    id: "idea_list_recent",
    name: "Recently Added",
    note: "Ideas added in the last seven days",
    color: "#2563eb",
    system: "recent" as const,
  },
];
function openDatabase(databasePath: string) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_snapshots (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      schema_version INTEGER NOT NULL,
      revision INTEGER NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return database;
}
function readSnapshot(database: Database.Database): AppState | null {
  const row = database
    .prepare("SELECT payload FROM app_snapshots WHERE id = 1")
    .get() as { payload: string } | undefined;
  if (!row) return null;
  const parsed: unknown = JSON.parse(row.payload);
  if (!isAppState(parsed))
    throw new Error("Stored data uses an unsupported schema.");
  return normalizeState(parsed);
}
function normalizeState(state: AppState): AppState {
  const stamp = state.updatedAt || new Date().toISOString();
  const systemPointLists = seedPointLists(stamp);
  const existingLists = state.libraryLists ?? [];
  const systemListIds = new Set(systemLists.map((item) => item.id));
  const existingProjectLists = state.projectLists ?? [];
  const existingIdeaLists = state.ideaLists ?? [];
  const existingPointLists = state.pointLists ?? [];
  const systemProjectListIds = new Set(
    systemProjectLists.map((item) => item.id),
  );
  const systemIdeaListIds = new Set(systemIdeaLists.map((item) => item.id));
  const systemPointListIds = new Set(systemPointLists.map((item) => item.id));
  return {
    ...withoutLegacyRoutineTasks(state),
    profile: {
      name: state.profile?.name?.trim() || "Me",
      avatarDataUrl: state.profile?.avatarDataUrl ?? "",
      ...(state.profile?.birthDate
        ? { birthDate: state.profile.birthDate }
        : {}),
      ...normalizeBackgroundAudio(state.profile),
      ...(state.profile?.countdownTaskSlots ? {
        countdownTaskSlots: state.profile.countdownTaskSlots.slice(0, 3),
      } : {}),
      matrixFormulas: state.profile?.matrixFormulas,
    },
    aiJobs: state.aiJobs ?? [],
    messages: state.messages ?? [],
    relations: state.relations ?? [],
    libraryLists: [
      ...systemLists.map(
        (item) =>
          existingLists.find((existing) => existing.id === item.id) ?? {
            ...item,
            createdAt: stamp,
            updatedAt: stamp,
          },
      ),
      ...existingLists.filter((item) => !systemListIds.has(item.id)),
    ],
    projectLists: [
      ...systemProjectLists.map(
        (item) =>
          existingProjectLists.find((existing) => existing.id === item.id) ?? {
            ...item,
            createdAt: stamp,
            updatedAt: stamp,
          },
      ),
      ...existingProjectLists.filter(
        (item) => !systemProjectListIds.has(item.id),
      ),
    ],
    ideaLists: [
      ...systemIdeaLists.map(
        (item) =>
          existingIdeaLists.find((existing) => existing.id === item.id) ?? {
            ...item,
            createdAt: stamp,
            updatedAt: stamp,
          },
      ),
      ...existingIdeaLists.filter((item) => !systemIdeaListIds.has(item.id)),
    ],
    pointLists: [
      ...systemPointLists.map(
        (item) =>
          existingPointLists.find((existing) => existing.id === item.id) ?? {
            ...item,
            createdAt: stamp,
            updatedAt: stamp,
          },
      ),
      ...existingPointLists.filter((item) => !systemPointListIds.has(item.id)),
    ],
    points: (state.points ?? []).map((item) => ({
      ...item,
      listIds: item.listIds ?? [],
    })),
    sources: state.sources.map((item) => ({
      ...item,
      fileToken: item.fileToken ?? "", filePath: item.filePath ?? "",
      markdownToken: item.markdownToken ?? "",
      markdownPath: item.markdownPath ?? "",
      tags: item.tags ?? [],
      listIds: item.listIds ?? ["library_default"],
      favorite: item.favorite ?? false,
      rating: item.rating ?? 0,
      publicationDate: item.publicationDate ?? item.year ?? "",
      citation: item.citation ?? "",
      category: item.category ?? "unknown",
      studyDurationMinutes: item.studyDurationMinutes ?? 0,
      readingReview: item.readingReview ?? emptyReadingReview(),
    })),
    ideas: state.ideas.map((item) => ({
      ...item,
      listIds: item.listIds ?? [],
      tags: item.tags ?? [],
      chatMessages: item.chatMessages ?? [],
    })),
    projects: state.projects.map((item) => ({
      ...item,
      score: item.score ?? 50,
      listIds: item.listIds ?? [],
      tags: item.tags ?? [],
    })),
    dailyTasks: (state.dailyTasks ?? []).map((item) => ({
      ...item,
      description: item.description ?? "",
      dueAt: item.dueAt ?? `${item.date}T23:59`,
      estimatedMinutes: item.estimatedMinutes ?? 30,
      actualMinutes: item.actualMinutes ?? 0,
      expectedOutput: item.expectedOutput ?? "",
      ...normalizeTaskImportance(item, item.importance ?? 50),
      ...normalizeTaskFactors(item),
    })),
    dailyCacheClearedDates: state.dailyCacheClearedDates ?? [],
    tasks: normalizeTasks(state),
    logs: Array.from(
      new Map(state.logs.map((item) => [item.id, item])).values(),
    ).map((item) => ({
      ...item,
      period: item.period ?? "day",
      filePath: item.filePath ?? `project/${item.projectId}/logs/${item.id}.md`,
      tags: item.tags ?? [],
    })),
    attachments: state.attachments.map((item) => ({
      ...item,
      fileToken: item.fileToken ?? "",
      filePath: item.filePath ?? "",
    })),
    artifacts: state.artifacts.map((item) => ({
      ...item,
      tags: item.tags ?? [],
    })),
  };
}

function writeSnapshot(database: Database.Database, state: AppState): AppState {
  const current = readSnapshot(database);
  const saved: AppState = {
    ...normalizeState(state),
    revision: (current?.revision ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  };
  database
    .prepare(
      `
      INSERT INTO app_snapshots (id, schema_version, revision, payload, updated_at)
      VALUES (1, @schemaVersion, @revision, @payload, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        schema_version = excluded.schema_version,
        revision = excluded.revision,
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `,
    )
    .run({
      schemaVersion: saved.schemaVersion,
      revision: saved.revision,
      payload: JSON.stringify(saved),
      updatedAt: saved.updatedAt,
    });
  return saved;
}

export class SqliteAppRepository implements AppRepository {
  constructor(private readonly databasePath?: string) {}

  private open() {
    return openDatabase(this.databasePath ?? getStorageConfig().databasePath);
  }

  async load(): Promise<AppState> {
    const database = this.open();
    try {
      const state = readSnapshot(database);
      if (state) return state;
      return database.transaction(() =>
        writeSnapshot(database, createSeedState()),
      )();
    } finally {
      database.close();
    }
  }

  async save(state: AppState): Promise<AppState> {
    if (!isAppState(state)) throw new Error("Invalid application state.");
    const database = this.open();
    try {
      return database.transaction(() => writeSnapshot(database, state))();
    } finally {
      database.close();
    }
  }

  async restore(state: AppState): Promise<AppState> {
    if (!isAppState(state))
      throw new Error("Backup is not compatible with this version.");
    return this.save(state);
  }
}
