# Drizzle Bootstrap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a first working Drizzle + `postgres.js` database layer in `packages/db` with schema files, config, migrations, and package-local scripts that the control plane and worker can build on.

**Architecture:** The DB layer lives in `packages/db` and remains a narrow shared package. It owns schema, config, client setup, and migrations. Applications import the DB package rather than duplicating configuration. The first schema covers `tasks`, `job_runs`, `connectors`, and `approvals` only.

**Tech Stack:** Bun, TypeScript, Postgres, Drizzle ORM, Drizzle Kit, postgres.js, zod

---

### Task 1: Add DB package dependencies and scripts

**Files:**
- Modify: `packages/db/package.json`

**Step 1: Add runtime dependencies**

Add:

- `drizzle-orm`
- `postgres`

**Step 2: Add dev dependencies**

Add:

- `drizzle-kit`
- `typescript`

Keep the package minimal. Do not add extra DB wrappers yet.

**Step 3: Add package scripts**

Add scripts for:

- `typecheck`
- `db:generate`
- `db:migrate`
- `db:studio`

The script names should be package-local and explicit.

**Step 4: Verify package manifest shape**

Run:

```bash
sed -n '1,220p' packages/db/package.json
```

Expected: the package has Drizzle, `postgres`, and the DB scripts defined.

**Step 5: Commit**

```bash
git add packages/db/package.json
git commit -m "chore: add drizzle dependencies to db package"
```

### Task 2: Add Drizzle config

**Files:**
- Create: `packages/db/drizzle.config.ts`

**Step 1: Create the Drizzle config file**

Define:

- dialect: PostgreSQL
- schema glob under `./src/schema/*`
- migrations output directory `./drizzle`
- `DATABASE_URL` from environment

**Step 2: Keep the config package-local**

Do not place this config at the repo root.

**Step 3: Verify the file exists**

Run:

```bash
sed -n '1,220p' packages/db/drizzle.config.ts
```

Expected: the file points at the package-local schema and migration paths.

**Step 4: Commit**

```bash
git add packages/db/drizzle.config.ts
git commit -m "chore: add drizzle config"
```

### Task 3: Create the Postgres and Drizzle client bootstrap

**Files:**
- Create: `packages/db/src/client.ts`
- Modify: `packages/db/src/index.ts`

**Step 1: Create `src/client.ts`**

Implement:

- a `postgres()` client factory
- a Drizzle wrapper using `drizzle-orm/postgres-js`
- a narrow export that other apps can import

Keep the file free of app-specific query logic.

**Step 2: Re-export the client from `src/index.ts`**

Make `packages/db` export the client setup through its public entrypoint.

**Step 3: Verify typecheck for the package**

Run:

```bash
bun run --cwd packages/db typecheck
```

Expected: the DB package typechecks cleanly.

**Step 4: Commit**

```bash
git add packages/db/src/client.ts packages/db/src/index.ts
git commit -m "feat: add postgres and drizzle client bootstrap"
```

### Task 4: Create the tasks schema

**Files:**
- Create: `packages/db/src/schema/tasks.ts`
- Create: `packages/db/src/schema/index.ts`

**Step 1: Define the `tasks` table**

Include fields for:

- id
- name
- description
- enabled
- schedule expression
- task prompt
- action mode
- output schema
- created/updated timestamps

Prefer text and JSON fields over premature enum complexity.

**Step 2: Export the schema**

Add `tasks` to the schema barrel in `packages/db/src/schema/index.ts`.

**Step 3: Verify typecheck**

Run:

```bash
bun run --cwd packages/db typecheck
```

Expected: the tasks schema compiles cleanly.

**Step 4: Commit**

```bash
git add packages/db/src/schema/tasks.ts packages/db/src/schema/index.ts
git commit -m "feat: add tasks schema"
```

### Task 5: Create the job runs schema

**Files:**
- Create: `packages/db/src/schema/jobRuns.ts`
- Modify: `packages/db/src/schema/index.ts`

**Step 1: Define the `job_runs` table**

Include fields for:

- id
- task id
- status
- scheduled/started/finished timestamps
- input snapshot
- output snapshot
- error summary
- created timestamp

Use a foreign key to `tasks`.

**Step 2: Export the schema**

Add `jobRuns` to the schema barrel.

**Step 3: Verify typecheck**

Run:

```bash
bun run --cwd packages/db typecheck
```

Expected: the job-runs schema compiles cleanly.

**Step 4: Commit**

```bash
git add packages/db/src/schema/jobRuns.ts packages/db/src/schema/index.ts
git commit -m "feat: add job runs schema"
```

### Task 6: Create the connectors schema

**Files:**
- Create: `packages/db/src/schema/connectors.ts`
- Modify: `packages/db/src/schema/index.ts`

**Step 1: Define the `connectors` table**

Include fields for:

- id
- machine name
- status
- capabilities
- version
- last heartbeat timestamp
- created timestamp

**Step 2: Export the schema**

Add `connectors` to the schema barrel.

**Step 3: Verify typecheck**

Run:

```bash
bun run --cwd packages/db typecheck
```

Expected: the connectors schema compiles cleanly.

**Step 4: Commit**

```bash
git add packages/db/src/schema/connectors.ts packages/db/src/schema/index.ts
git commit -m "feat: add connectors schema"
```

### Task 7: Create the approvals schema

**Files:**
- Create: `packages/db/src/schema/approvals.ts`
- Modify: `packages/db/src/schema/index.ts`

**Step 1: Define the `approvals` table**

Include fields for:

- id
- job run id
- status
- reviewer
- decision timestamp
- notes
- created timestamp

Use a foreign key to `job_runs`.

**Step 2: Export the schema**

Add `approvals` to the schema barrel.

**Step 3: Verify typecheck**

Run:

```bash
bun run --cwd packages/db typecheck
```

Expected: the approvals schema compiles cleanly.

**Step 4: Commit**

```bash
git add packages/db/src/schema/approvals.ts packages/db/src/schema/index.ts
git commit -m "feat: add approvals schema"
```

### Task 8: Re-export the schema surface

**Files:**
- Modify: `packages/db/src/index.ts`

**Step 1: Export the schema barrel**

Make `packages/db` export:

- schema tables
- schema namespace if useful
- DB client helpers

Do not add repositories or application queries yet.

**Step 2: Verify typecheck**

Run:

```bash
bun run --cwd packages/db typecheck
```

Expected: the package public API compiles cleanly.

**Step 3: Commit**

```bash
git add packages/db/src/index.ts
git commit -m "chore: export db schema surface"
```

### Task 9: Add environment conventions

**Files:**
- Create: `packages/db/.env.example`
- Modify: `AGENTS.md`

**Step 1: Add `packages/db/.env.example`**

Include at minimum:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/agent_cron
```

Add placeholders only for env vars actually needed by the current scaffold.

**Step 2: Document the DB env convention**

Update `AGENTS.md` so future sessions know the DB package owns the `DATABASE_URL` convention.

**Step 3: Verify doc diff cleanliness**

Run:

```bash
git diff --check
```

Expected: no whitespace or patch issues.

**Step 4: Commit**

```bash
git add packages/db/.env.example AGENTS.md
git commit -m "docs: add database environment convention"
```

### Task 10: Generate the first migration

**Files:**
- Create: `packages/db/drizzle/**`

**Step 1: Run Drizzle generate**

Run:

```bash
bun run --cwd packages/db db:generate
```

Expected: the initial SQL migration files are generated under `packages/db/drizzle`.

**Step 2: Inspect generated output**

Check that the migration includes the four intended tables and foreign keys.

**Step 3: Verify the generated files are tracked**

Run:

```bash
find packages/db/drizzle -maxdepth 3 -type f | sort
```

Expected: generated migration files exist.

**Step 4: Commit**

```bash
git add packages/db/drizzle
git commit -m "chore: generate initial drizzle migration"
```

### Task 11: Apply the first migration locally

**Files:**
- No new files expected unless Drizzle writes migration metadata

**Step 1: Ensure local Postgres is available**

Use a local database matching `packages/db/.env.example`.

**Step 2: Run Drizzle migrate**

Run:

```bash
bun run --cwd packages/db db:migrate
```

Expected: the migration applies successfully to local Postgres.

**Step 3: Verify the local migration result**

Use either Drizzle Studio or a direct SQL check to confirm the tables exist.

Example verification:

```bash
psql postgres://postgres:postgres@localhost:5432/agent_cron -c '\dt'
```

Expected: the four schema tables appear.

**Step 4: Commit**

```bash
git add packages/db
git commit -m "chore: apply initial database migration"
```

### Task 12: Smoke-check package integration from an app

**Files:**
- Modify: `apps/control-plane/src/index.ts`

**Step 1: Add a temporary DB import smoke check**

Import a symbol from `@agent-cron/db` in the control plane entrypoint to prove workspace resolution is correct.

Do not wire actual runtime DB calls yet unless needed.

**Step 2: Verify typecheck**

Run:

```bash
bun run typecheck
```

Expected: the full workspace still typechecks.

**Step 3: Verify build**

Run:

```bash
bun run build
```

Expected: the scaffold still builds with the DB package integrated.

**Step 4: Commit**

```bash
git add apps/control-plane/src/index.ts packages/db
git commit -m "chore: smoke-check db package integration"
```

## Verification Notes

This plan has two kinds of verification:

- package-level compile checks after each schema step
- local Postgres verification once the first migration exists

The migration-application step should not be claimed complete without a real local database check.

## External References

- Drizzle docs: https://orm.drizzle.team/
- Drizzle with `postgres.js`: https://orm.drizzle.team/docs/get-started-postgresql
- `postgres.js`: https://github.com/porsager/postgres

Plan complete and saved to `docs/plans/2026-03-14-drizzle-bootstrap-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
