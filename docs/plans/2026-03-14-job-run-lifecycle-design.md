# Job Run Lifecycle Design

## Purpose

This document defines the first execution-lifecycle slice for `agent-cron`.

The goal is to prove the core boundary between:

- task definitions in the control plane
- concrete `job_run` records as execution units
- a worker that consumes those `job_run` records

This slice intentionally excludes scheduling, retries, and real agent execution. It exists to establish the run lifecycle and persistence model first.

## Chosen Approach

Implement a manual-triggered `job_run` flow first.

That means:

- the control plane adds `POST /tasks/:id/runs`
- the route creates a `pending` `job_run`
- the worker polls for pending runs
- the worker claims one run
- the worker marks the run `completed` with a stub output

This keeps one run producer in scope while still exercising the full control-plane-to-worker lifecycle.

## Why This Approach

### `job_run` should be the execution unit

Workers should not execute directly from the `tasks` table.

`tasks` are long-lived definitions.

`job_runs` are concrete execution records.

That separation is required for:

- audit history
- retries later
- per-run logs and outputs
- manual reruns
- scheduler-created runs in a later slice

### Manual trigger is enough to validate the lifecycle

There are eventually two producers of `job_run` rows:

- manual trigger
- scheduler

The downstream worker path should be identical regardless of producer.

So the fastest useful slice is to implement only manual trigger now and let the scheduler become a second producer later.

### Stub completion is better than claim-only

If the worker only claims runs and stops, the lifecycle remains half-proven.

Marking the run `completed` with a stub output gives an end-to-end persisted state transition now:

- `pending`
- `running`
- `completed`

That is a better foundation for later executor integration.

## Run State Model

For this slice, `job_run.status` should use:

- `pending`
- `running`
- `completed`
- `failed`

Only `pending`, `running`, and `completed` need to be exercised in the implementation.

## Control Plane Responsibilities

The control plane should add a run route group.

Minimum route:

- `POST /tasks/:id/runs`

Behavior:

- verify the task exists
- create a `job_run`
- set:
  - `id`
  - `taskId`
  - `status = pending`
  - `scheduledAt = now`
  - `startedAt = null`
  - `finishedAt = null`
  - `inputSnapshot = null`
  - `outputSnapshot = null`
  - `errorSummary = null`
- return `201` with the created run

Optional read routes are useful in the same slice:

- `GET /runs`
- `GET /runs/:id`

Those routes make it easier to inspect worker behavior from the control plane and desktop UI later.

## Worker Responsibilities

The worker should operate on `job_runs`, not tasks.

For this slice it should:

- poll for one `pending` run
- claim it by marking it `running`
- set `startedAt`
- complete it with a stub output
- set `finishedAt`

Suggested stub output:

```json
{
  "executor": "stub",
  "message": "job run execution not implemented yet"
}
```

## Atomic Claim Rule

The worker must avoid double-claiming the same `pending` row.

For this first slice, the claim logic should be implemented as a single DB update path that only succeeds when the row is still `pending`.

A simple and acceptable first approach is:

- fetch one `pending` run candidate
- update by `id` with `where status = 'pending'`
- treat a zero-row update as claim failure and retry later

This is sufficient for a single-worker prototype and still respects the intended concurrency boundary.

## Proposed File Layout

```text
apps/control-plane/src/
  index.ts
  runs/
    queries.ts
    routes.ts

apps/worker/src/
  index.ts
  jobRuns.ts
```

## Error Handling

Control plane:

- `404` when triggering a missing task
- `500` for unexpected DB failures

Worker:

- return no work when no `pending` run exists
- do not invent retry logic yet
- if stub completion fails after claim, the row may remain `running` for now

That last limitation is acceptable in this slice because recovery behavior is explicitly out of scope.

## Testing Strategy

Control-plane route tests should cover:

- `POST /tasks/:id/runs` creates a `pending` run
- triggering a missing task returns `404`

Worker tests should cover:

- no-op when no pending run exists
- claiming a run sets `running` and `startedAt`
- processing completes the run and sets `finishedAt`

Tests should use the real DB package and local Postgres-backed path already established for this repo.

## Out of Scope

Do not add any of the following in this slice:

- cron scheduler
- retries
- approval workflow
- local connector interaction
- real executor integration
- task-specific input collection
- queue middleware like Redis

The only goal here is to establish the persisted run lifecycle cleanly.
