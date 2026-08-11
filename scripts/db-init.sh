#!/usr/bin/env bash

set -Eeuo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
database_dir="$project_dir/data"
database_file="$database_dir/circo.db"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "Error: SQLite is required but was not found." >&2
  exit 1
fi

mkdir -p "$database_dir"
sqlite3 "$database_file" "PRAGMA journal_mode = WAL;" >/dev/null
sqlite3 "$database_file" "CREATE TABLE IF NOT EXISTS app_snapshots (id INTEGER PRIMARY KEY CHECK (id = 1), schema_version INTEGER NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL); PRAGMA user_version = 1;" >/dev/null

echo "SQLite database is ready at $database_file"
