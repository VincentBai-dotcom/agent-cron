# Task CRUD Design

## Purpose

This document defines the first real control-plane feature for `agent-cron`: full CRUD for task definitions.

The goal is to give the control plane a stable task-management surface so users can:

- create task definitions
- view all task definitions
- inspect one task definition
- update task definitions frequently, especially prompts and schedules
- delete task definitions when they are no longer needed

This is the first API slice built on top of the scaffold and Drizzle bootstrap. The long-term architecture reference remains [`docs/design/agent-cron-design.md`](/home/vincent-bai/Documents/github/agent-cron/docs/design/agent-cron-design.md).

## Chosen Approach

The control plane should implement a validated REST-style route group for `tasks`.

Routes:

- `POST /tasks`
- `GET /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

Validation should be explicit and route-owned. The DB package remains schema/client only.

## Why This Approach

### Full CRUD is required immediately

Task definitions are expected to change often.

That includes:

- prompt changes
- enable/disable toggles
- schedule edits
- output schema updates
- eventual action policy changes

Because editing is core behavior, partial CRUD is not sufficient for the first slice.

### Validation should live in the control plane

`@agent-cron/db` should not own HTTP payload semantics.

The DB package already owns:

- schema
- migrations
- DB bootstrap

The control plane should own:

- payload validation
- route semantics
- HTTP error handling
- ID generation

### Keep the API shape close to the DB, but not equal to it

The first CRUD API can track the current task table closely, but it should still define explicit request and response DTOs so the HTTP contract can evolve independently later.

## Proposed File Layout

The control plane should evolve toward:

```text
apps/control-plane/src/
  index.ts
  lib/
    db.ts
  tasks/
    queries.ts
    routes.ts
    schema.ts
```

## Task Payload Shape

The task API should expose:

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

## Route Semantics

### `POST /tasks`

Creates a new task.

Rules:

- generate `id` in the control plane
- require all user-managed fields except timestamps
- return the created record

### `GET /tasks`

Returns all tasks.

Rules:

- return JSON
- use stable ordering
- prefer newest first for now

### `GET /tasks/:id`

Returns a single task.

Rules:

- return `404` if the task does not exist

### `PATCH /tasks/:id`

Partially updates a task.

Rules:

- allow partial payloads
- update `updatedAt` on every successful mutation
- return `404` if missing

### `DELETE /tasks/:id`

Hard deletes a task.

Rules:

- no soft delete yet
- return `404` if missing
- return `204` on success

Hard delete is the right first choice because:

- there is no task-run retention policy implemented yet
- there is no restore workflow yet
- soft delete would add complexity before there is evidence it is needed

## Validation Rules

### Create validation

Require:

- `name`: non-empty string
- `scheduleExpr`: non-empty string
- `taskPrompt`: non-empty string
- `actionMode`: constrained string
- `outputSchema`: JSON object
- `enabled`: boolean

Allow:

- `description`: optional or nullable string

### Update validation

Allow partial updates for:

- `name`
- `description`
- `enabled`
- `scheduleExpr`
- `taskPrompt`
- `actionMode`
- `outputSchema`

Do not allow clients to patch:

- `id`
- `createdAt`
- `updatedAt`

## ID Strategy

The control plane should generate task IDs with `crypto.randomUUID()`.

This keeps task creation under application control and avoids adding DB-side UUID defaults before that complexity is needed.

## Query Layer Boundary

`apps/control-plane/src/tasks/queries.ts` should own the task CRUD queries.

This layer should:

- call `createDb()`
- translate route intent into SQL operations
- return typed task records

It should not:

- know about HTTP request objects
- validate JSON payloads
- own UI-specific formatting

## Error Handling

The first slice should use simple route-level error handling:

- `400` for invalid request payloads
- `404` for missing task IDs
- `500` for unexpected DB failures

No custom error taxonomy is required yet.

## Testing Strategy

The route slice should be tested end-to-end at the Hono app layer as much as is practical.

Coverage should include:

- create succeeds
- list returns created tasks
- get-by-id returns `404` for missing tasks
- patch updates prompt, schedule, and enabled
- delete removes the task
- invalid payloads are rejected

If a real local Postgres-backed test path is available, use it.

If not, keep the query layer small enough that a later DB-backed test harness can replace minimal temporary seams without re-architecting the routes.

## First Slice Goals

The first CRUD milestone should prove:

- the control plane can talk to `@agent-cron/db`
- route-local validation works
- the task table is actually usable from the API layer
- task definitions can be created, edited, and deleted cleanly

## Risks to Watch

### Overgrowing the task DTO immediately

Do not add approval policy, timeout, retries, tool policy, or connector policy to the CRUD slice unless the current UI/API truly needs them.

### Leaking DB details into the API

Keep the DB package reusable by avoiding route semantics in `packages/db`.

### Premature cron validation

Do not try to solve cron-expression correctness in this slice. Store the expression and validate structure later.
