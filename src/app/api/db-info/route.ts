import fs from "node:fs";
import Database from "better-sqlite3";
import { SqliteAppRepository } from "@/shared/infrastructure/sqlite-repository";
import { getStorageConfig } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const repository = new SqliteAppRepository();

const COLLECTION_KEYS = [
  "cycles",
  "goals",
  "sessions",
  "sources",
  "points",
  "annotations",
  "ideas",
  "projects",
  "tasks",
  "taskHistory",
  "logs",
  "attachments",
  "artifacts",
  "messages",
] as const;

export async function GET() {
  try {
    const state = await repository.load();
    const databasePath = getStorageConfig().databasePath;

    const sizeBytes = fs.existsSync(databasePath)
      ? fs.statSync(databasePath).size
      : 0;

    const walPath = `${databasePath}-wal`;
    const walSizeBytes = fs.existsSync(walPath)
      ? fs.statSync(walPath).size
      : 0;

    let journalMode = "unknown";
  let tables: string[] = [];
  let rowCount = 0;
  const tableRowCounts: Record<string, number> = {};

    try {
      const database = new Database(databasePath, { readonly: true });
      journalMode = String(database.pragma("journal_mode", { simple: true }));
      tables = (
        database
          .prepare(
            "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
          )
          .all() as { name: string }[]
      ).map((row) => row.name);
      for (const table of tables) {
        const escaped = table.replaceAll('"', '""');
        const count = database
          .prepare('SELECT COUNT(*) AS count FROM "' + escaped + '"')
          .get() as { count: number };
        tableRowCounts[table] = count.count;
        rowCount += count.count;
      }
      database.close();
    } catch {
      // Metadata is best-effort; never fail the whole response because of it.
    }

    const collections: Record<string, number> = {};
    for (const key of COLLECTION_KEYS) {
      const value = state[key] as unknown;
      collections[key] = Array.isArray(value) ? value.length : 0;
    }

    return Response.json({
      path: databasePath,
      sizeBytes,
      walSizeBytes,
      journalMode,
      tables,
      rowCount,
      schemaVersion: state.schemaVersion,
      revision: state.revision,
      updatedAt: state.updatedAt,
      collections,
      tableRowCounts,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
