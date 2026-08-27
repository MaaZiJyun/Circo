import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { AppRepository, AppState } from "@/shared/model/app-state";
import type { ActivityRecord } from "@/shared/model/entities";
import { isAppState } from "@/shared/model/app-state";
import { getStorageConfig } from "./storage-config";
import { createSeedState } from "./seed";
import { seedPointLists } from "./seed-project-lists";
import { emptyReadingReview } from "@/modules/find/model/reading-record";
import { normalizeBackgroundAudio } from "@/shared/model/background-audio";
import { normalizeTaskImportance } from "@/shared/model/task-importance";
import { normalizeTaskFactors } from "@/shared/model/task-factors";
import { normalizeTasks, withoutLegacyRoutineTasks } from "@/shared/model/task-normalization";
import { priorityFromImportance } from "@/shared/model/task-normalization";
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
const systemTaskLists = [
  {
    id: "task_list_default",
    name: "All Tasks",
    note: "All activities",
    color: "#18181b",
    system: "default" as const,
  },
  {
    id: "task_list_formal",
    name: "Formal",
    note: "Tasks that belong to a project",
    color: "#2563eb",
    system: "formal" as const,
  },
  {
    id: "task_list_casual",
    name: "Casual",
    note: "Tasks that do not belong to any project",
    color: "#f59e0b",
    system: "casual" as const,
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

type LegacySnapshot = AppState & {
  tasks?: ActivityRecord[];
  taskHistory?: Array<ActivityRecord & { status: "done" }>;
};

function withoutLegacyActivityFields(state: AppState): AppState {
  const normalized = { ...state } as LegacySnapshot;
  delete normalized.tasks;
  delete normalized.taskHistory;
  return normalized;
}

function dropLegacyTaskHistory(database: Database.Database) {
  database.exec("DROP TABLE IF EXISTS task_history");
}

function openDatabase(databasePath: string) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  const hasLegacyTasksTable = Boolean(
    database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'tasks'")
      .get(),
  );
  const hasActivitiesTable = Boolean(
    database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'activities'")
      .get(),
  );
  if (hasLegacyTasksTable && !hasActivitiesTable) {
    database.exec("ALTER TABLE tasks RENAME TO activities");
  }
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_snapshots (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      schema_version INTEGER NOT NULL,
      revision INTEGER NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      score REAL,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      parent_id TEXT,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      start_date TEXT,
      due_date TEXT,
      estimated_minutes REAL NOT NULL DEFAULT 0,
      actual_minutes REAL NOT NULL DEFAULT 0,
      actual_started_at TEXT,
      completed_at TEXT,
      archived_at TEXT,
      activity_type TEXT NOT NULL DEFAULT 'task',
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      cycle_id TEXT,
      goal_id TEXT,
      project_id TEXT,
      task_id TEXT,
      title TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT NOT NULL,
      minutes REAL NOT NULL DEFAULT 0,
      effective INTEGER NOT NULL DEFAULT 0,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id);
    CREATE INDEX IF NOT EXISTS idx_activities_status_due_date ON activities(status, due_date);
    CREATE INDEX IF NOT EXISTS idx_sessions_task_id ON sessions(task_id);
  `);
  for (const statement of [
    "ALTER TABLE activities ADD COLUMN archived_at TEXT",
    "ALTER TABLE activities ADD COLUMN activity_type TEXT NOT NULL DEFAULT 'task'",
  ]) {
    try {
      database.exec(statement);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("duplicate column name")) {
        throw error;
      }
    }
  }
  return database;
}

function syncRelationalTables(database: Database.Database, state: AppState) {
  database.exec("DELETE FROM projects; DELETE FROM activities; DELETE FROM sessions;");
  const projectInsert = database.prepare(`
    INSERT INTO projects
      (id, name, status, start_date, end_date, score, deleted_at, created_at, updated_at, payload)
    VALUES
      (@id, @name, @status, @startDate, @endDate, @score, @deletedAt, @createdAt, @updatedAt, @payload)
  `);
  for (const project of state.projects) {
    projectInsert.run({ id: project.id, name: project.name, status: project.status, startDate: project.startDate, endDate: project.endDate, score: project.score, deletedAt: project.deletedAt ?? null, createdAt: project.createdAt, updatedAt: project.updatedAt, payload: JSON.stringify(project) });
  }
  const taskInsert = database.prepare(`
    INSERT INTO activities
      (id, project_id, parent_id, title, status, start_date, due_date, estimated_minutes, actual_minutes, actual_started_at, completed_at, archived_at, activity_type, deleted_at, created_at, updated_at, payload)
    VALUES
      (@id, @projectId, @parentId, @title, @status, @startDate, @dueDate, @estimatedMinutes, @actualMinutes, @actualStartedAt, @completedAt, @archivedAt, @activityType, @deletedAt, @createdAt, @updatedAt, @payload)
  `);
  for (const task of state.activities) {
    taskInsert.run({ id: task.id, projectId: task.projectId ?? null, parentId: task.parentId ?? null, title: task.title, status: task.status, startDate: task.startDate, dueDate: task.dueDate, estimatedMinutes: task.estimatedMinutes, actualMinutes: task.actualMinutes, actualStartedAt: task.actualStartedAt ?? null, completedAt: task.completedAt ?? null, archivedAt: task.archivedAt ?? null, activityType: task.activityType ?? "task", deletedAt: task.deletedAt ?? null, createdAt: task.createdAt, updatedAt: task.updatedAt, payload: JSON.stringify(task) });
  }
  const sessionInsert = database.prepare(`
    INSERT INTO sessions
      (id, cycle_id, goal_id, project_id, task_id, title, started_at, ended_at, minutes, effective, payload)
    VALUES
      (@id, @cycleId, @goalId, @projectId, @taskId, @title, @startedAt, @endedAt, @minutes, @effective, @payload)
  `);
  for (const session of state.sessions) {
    sessionInsert.run({ id: session.id, cycleId: session.cycleId, goalId: session.goalId ?? null, projectId: session.projectId ?? null, taskId: session.taskId ?? null, title: session.title, startedAt: session.startedAt, endedAt: session.endedAt, minutes: session.minutes, effective: session.effective ? 1 : 0, payload: JSON.stringify(session) });
  }
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
  const legacyActivities = (state as LegacySnapshot).tasks ?? [];
  const sourceState = {
    ...state,
    activities: state.activities ?? legacyActivities,
  } as AppState;
  const legacyHistory = (state as LegacySnapshot).taskHistory ?? [];
  const stamp = state.updatedAt || new Date().toISOString();
  const systemPointLists = seedPointLists(stamp);
  const existingLists = state.libraryLists ?? [];
  const systemListIds = new Set(systemLists.map((item) => item.id));
  const existingProjectLists = state.projectLists ?? [];
  const existingTaskLists = state.taskLists ?? [];
  const existingIdeaLists = state.ideaLists ?? [];
  const existingPointLists = state.pointLists ?? [];
  const systemProjectListIds = new Set(
    systemProjectLists.map((item) => item.id),
  );
  const systemTaskListIds = new Set(systemTaskLists.map((item) => item.id));
  const systemIdeaListIds = new Set(systemIdeaLists.map((item) => item.id));
  const systemPointListIds = new Set(systemPointLists.map((item) => item.id));
  const normalizedTasks = normalizeTasks(sourceState);
  const legacyDailyTasks = (state.dailyTasks ?? []).map((item) => ({
    ...item,
    description: item.description ?? "",
    dueAt: item.dueAt ?? item.date + "T23:59",
    estimatedMinutes: item.estimatedMinutes ?? 30,
    actualMinutes: item.actualMinutes ?? 0,
    expectedOutput: item.expectedOutput ?? "",
    ...normalizeTaskImportance(item, item.importance ?? 50),
    ...normalizeTaskFactors(item),
  }));
  for (const item of legacyDailyTasks) {
    if (item.sourceTaskId || normalizedTasks.some((task) => task.id === item.id)) continue;
    normalizedTasks.push({
      id: item.id,
      title: item.title,
      description: item.description,
      startDate: item.dueAt,
      dueDate: item.dueAt,
      priority: priorityFromImportance(item.importance),
      status: item.completed ? "done" : "todo",
      estimatedMinutes: item.estimatedMinutes,
      actualMinutes: item.actualMinutes,
      milestone: false,
      expectedOutput: item.expectedOutput,
      importance: item.importance,
      impact: item.impact,
      goal: item.goal,
      risk: item.risk,
      value: item.value,
      delayLoss: item.delayLoss,
      dependencyIds: [],
      complexity: item.complexity,
      uncertainty: item.uncertainty,
      recurrence: null,
      activityType: "task",
      projectId: item.projectId,
      completedAt: item.completedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    } as ActivityRecord);
  }
  for (const history of legacyHistory) {
    const completedAt = history.completedAt ?? history.updatedAt ?? stamp;
    const existingIndex = normalizedTasks.findIndex((task) => task.id === history.id);
    if (existingIndex >= 0) {
      normalizedTasks[existingIndex] = {
        ...normalizedTasks[existingIndex],
        status: "done",
        completedAt,
        archivedAt: normalizedTasks[existingIndex].archivedAt ?? completedAt,
      };
      continue;
    }
    normalizedTasks.push({
      ...history,
      status: "done",
      activityType: history.activityType ?? "task",
      completedAt,
      archivedAt: history.archivedAt ?? completedAt,
    });
  }
  return {
    ...withoutLegacyActivityFields(withoutLegacyRoutineTasks(state)),
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
    taskLists: [
      ...systemTaskLists.map(
        (item) =>
          existingTaskLists.find((existing) => existing.id === item.id) ?? {
            ...item,
            createdAt: stamp,
            updatedAt: stamp,
          },
      ),
      ...existingTaskLists.filter((item) => !systemTaskListIds.has(item.id)),
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
    activities: normalizedTasks,
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
  const persisted = { ...saved, dailyTasks: undefined };
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
      payload: JSON.stringify(persisted),
      updatedAt: saved.updatedAt,
    });
  dropLegacyTaskHistory(database);
  syncRelationalTables(database, saved);
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
      if (state) {
        const row = database
          .prepare("SELECT payload FROM app_snapshots WHERE id = 1")
          .get() as { payload: string } | undefined;
        const rawPayload = row ? (JSON.parse(row.payload) as {
          taskHistory?: unknown;
          tasks?: unknown;
        }) : null;
        const hasLegacyFields = Boolean(
          rawPayload?.taskHistory || rawPayload?.tasks,
        );
        if (hasLegacyFields) {
          return database.transaction(() => writeSnapshot(database, state))();
        }
        database.transaction(() => {
          dropLegacyTaskHistory(database);
          syncRelationalTables(database, state);
        })();
        return state;
      }
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
