import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { AppRepository, AppState } from "@/shared/model/app-state";
import { isAppState } from "@/shared/model/app-state";
import { getStorageConfig } from "./storage-config";
import { createSeedState } from "./seed";

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
  const existingLists = state.libraryLists ?? [];
  const systemListIds = new Set(systemLists.map((item) => item.id));
  return {
    ...state,
    profile: {
      name: state.profile?.name?.trim() || "Me",
      avatarDataUrl: state.profile?.avatarDataUrl ?? "",
    },
    aiJobs: state.aiJobs ?? [],
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
    sources: state.sources.map((item) => ({
      ...item,
      fileToken: item.fileToken ?? "",
      filePath: item.filePath ?? "",
      markdownToken: item.markdownToken ?? "",
      markdownPath: item.markdownPath ?? "",
      tags: item.tags ?? [],
      listIds: item.listIds ?? ["library_default"],
      favorite: item.favorite ?? false,
      rating: item.rating ?? 0,
      publicationDate: item.publicationDate ?? item.year ?? "",
    })),
    ideas: state.ideas.map((item) => ({ ...item, tags: item.tags ?? [] })),
    projects: state.projects.map((item) => ({
      ...item,
      tags: item.tags ?? [],
    })),
    logs: state.logs.map((item) => ({ ...item, tags: item.tags ?? [] })),
    attachments: state.attachments.map((item) => ({
      ...item,
      fileToken: item.fileToken ?? "",
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
