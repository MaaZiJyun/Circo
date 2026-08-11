# Circo

A minimal foundation for a future self-knowledge management system. The app uses
Next.js as both the frontend and backend, with a local SQLite database.

## Stack

- Next.js (App Router)
- React and TypeScript
- Tailwind CSS
- SQLite (single local file, no server or account required)

## Getting started

Start the complete development environment with one command:

```bash
npm run dev:all
```

This installs npm dependencies when needed, creates the SQLite database file if
needed, and launches the Next.js development server. Open
[http://localhost:3000](http://localhost:3000).

To start each service separately instead, follow the steps below.

Install dependencies:

```bash
npm install
```

Initialize SQLite:

```bash
npm run db:init
```

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

The local database is stored in `data/circo.db`. It has no username or password,
does not run a background server, and is excluded from Git. WAL mode is enabled
for better concurrency. No tables or seed data are created.

Useful commands:

```bash
npm run db:init
npm run db:shell
```
