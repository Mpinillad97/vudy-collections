# Vudy Collections

Monorepo foundation for the Vudy Collections assessment project.

## Stack

- **apps/web** — React + TypeScript + Vite + Tailwind CSS
- **apps/api** — NestJS + TypeScript
- **prisma/** — Prisma ORM (schema at the repository root)
- **PostgreSQL** — via Docker Compose
- npm workspaces (no Nx/Turborepo/pnpm/Yarn)

This milestone is the initial technical foundation only. No domain models,
business logic, or Vudy API integration have been implemented yet.

## Prerequisites

- Node.js 20+
- Docker Desktop (for local PostgreSQL)

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` with local values, at minimum:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vudy_collections?schema=public
```

Start PostgreSQL:

```bash
docker compose up -d
```

Generate the Prisma client:

```bash
npm run prisma:generate
```

> The schema currently has no models (this milestone intentionally ships an
> empty foundation), so generation uses Prisma's `--allow-no-models` flag.
> Once domain models are added in a later milestone, this flag is no longer
> needed.

Apply migrations (once the database is running):

```bash
npm run prisma:migrate
```

## Running the apps

```bash
npm run dev:api   # NestJS API on http://localhost:3000 (configurable via PORT)
npm run dev:web   # Vite dev server on http://localhost:5173
```

Health check:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

## Building

```bash
npm run build:api
npm run build:web
```

## Root scripts

| Script | Description |
| --- | --- |
| `npm run dev:web` | Run the Vite dev server |
| `npm run dev:api` | Run the NestJS API in watch mode |
| `npm run build:web` | Build the frontend for production |
| `npm run build:api` | Build the backend for production |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Run Prisma migrations against the local database |

## Environment variables

See [.env.example](.env.example). `VUDY_*` variables are placeholders for a
future milestone that integrates the Vudy API — they are not used yet.
