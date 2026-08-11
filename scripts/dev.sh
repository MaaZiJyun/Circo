#!/usr/bin/env bash

set -Eeuo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "Error: SQLite is required but was not found." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: Node.js and npm are required but were not found." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Installing frontend dependencies..."
  npm install
fi

./scripts/db-init.sh

echo "Starting Next.js at http://localhost:3000"
exec npm run dev
