# Drizzle Bootstrap Design

## Purpose

This document defines the first database-layer design for `agent-cron`.

The goal is to introduce Drizzle in a way that matches the existing scaffold:

- Bun-first services
- a shared monorepo package layout
- Postgres as the first persistent store
- a worker and control plane that both need access to the same relational model

This is a planning document for the database bootstrap. The long-term system architecture remains in [`docs/design/agent-cron-design.md`](/home/vincent-bai/Documents/github/agent-cron/docs/design/agent-cron-design.md).

## Chosen Approach

The database layer should live in `packages/db`.

That package should own:

- Drizzle schema definitions
- Drizzle config
- the Postgres client bootstrap
- migration generation and execution scripts
- shared database exports consumed by the apps

Applications should import from `@agent-cron/db` rather than maintaining separate DB configuration.

## Why `packages/db` Should Own the DB Layer

### Shared relational model

The control plane and worker will both depend on:

- task records
- job runs
- connector state
- approvals

Putting the schema in one package keeps those contracts aligned.

### Avoid duplicated config

Drizzle config, schema exports, and connection logic should not be duplicated across:

- `apps/control-plane`
- `apps/worker`
- future local or server-side support processes

### Cleaner package boundaries

`packages/db` should remain a thin persistence package.

It should provide:

- schema
- client creation
- migrations

It should not absorb:

- scheduling logic
- worker orchestration logic
- business rules for tasks
- connector policy

## Chosen Driver

The DB package should use:

- `drizzle-orm`
- `drizzle-kit`
- `postgres`

The chosen driver is `postgres` (`postgres.js`), not `pg`.

This is the better fit for the current repo because:

- Bun is the primary runtime for the server services and worker
- `postgres.js` treats Bun as a first-class target
- Drizzle supports it directly through `drizzle-orm/postgres-js`

## Proposed File Layout

The package should evolve toward:

```text
packages/db/
  drizzle.config.ts
  package.json
  tsconfig.json
  drizzle/
  src/
    client.ts
    index.ts
    schema/
      approvals.ts
      connectors.ts
      jobRuns.ts
      tasks.ts
      index.ts
```

## Schema Scope for the First Pass

The first schema should stay intentionally small.

### `tasks`

Purpose:

- define long-lived task configuration

Suggested fields:

- `id`
- `name`
- `description`
- `enabled`
- `scheduleExpr`
- `taskPrompt`
- `actionMode`
- `outputSchema`
- `createdAt`
- `updatedAt`

### `job_runs`

Purpose:

- track each execution attempt

Suggested fields:

- `id`
- `taskId`
- `status`
- `scheduledAt`
- `startedAt`
- `finishedAt`
- `inputSnapshot`
- `outputSnapshot`
- `errorSummary`
- `createdAt`

### `connectors`

Purpose:

- track registered local connector instances

Suggested fields:

- `id`
- `machineName`
- `status`
- `capabilities`
- `version`
- `lastHeartbeatAt`
- `createdAt`

### `approvals`

Purpose:

- capture review decisions for draft-first actions

Suggested fields:

- `id`
- `jobRunId`
- `status`
- `reviewer`
- `decisionAt`
- `notes`
- `createdAt`

## Type and Schema Conventions

The initial schema should prefer:

- string IDs first for simplicity
- JSON columns for early flexible payloads such as `inputSnapshot`, `outputSnapshot`, and `capabilities`
- explicit timestamp columns on all core tables
- clear enum-like text columns for `status` and `actionMode` before introducing stricter DB enums

This is intentionally conservative for the first pass.

The first goal is a stable relational base, not a perfect final schema.

## Migration Strategy

The package should use generated SQL migrations in `packages/db/drizzle/`.

Expected flow:

1. update schema files
2. run Drizzle generate
3. inspect generated SQL
4. apply migrations to local Postgres

This keeps schema evolution explicit and reviewable.

## Environment Model

The first DB bootstrap should assume a single `DATABASE_URL`.

The repo should provide:

- a package-local `.env.example` under `packages/db`
- a shared env-loading convention for Bun services

For local development, a default like this is fine:

`postgres://postgres:postgres@localhost:5432/agent_cron`

## Script Model

`packages/db` should expose package-local scripts for:

- `db:generate`
- `db:migrate`
- `db:studio`
- `typecheck`

The repo root can later forward into those scripts, but the package should remain the source of truth for DB tooling.

## Integration Boundaries

The DB package should export:

- table definitions
- schema aggregates
- typed client helpers

Applications should own their own queries and repository-like helpers.

That means:

- `apps/control-plane` decides how task CRUD works
- `apps/worker` decides how job polling works
- `packages/db` does not become a dumping ground for app behavior

## First Bootstrap Goals

The first Drizzle milestone should prove:

- schema files compile cleanly
- the config points at the right schema directory
- migrations can be generated
- a local migration can run successfully
- the control plane and worker can import the DB package without circular structure problems

## Risks to Watch

### Overdesigning the schema too early

The system design is still evolving. The first schema should support the first workflow, not attempt to predict all future task types.

### Letting `packages/db` become an application service

This package should stay narrow. If business behavior starts accumulating there, split it back out.

### Mixing dev-only and production connection assumptions

The first bootstrap can be local-first, but the package should not hardcode environment-specific behavior into the exported client factory.

## Source Notes

These choices are based on the current primary docs:

- Drizzle docs: https://orm.drizzle.team/
- Drizzle with `postgres.js`: https://orm.drizzle.team/docs/get-started-postgresql
- `postgres.js`: https://github.com/porsager/postgres
