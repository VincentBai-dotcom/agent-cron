# Job Run Lifecycle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add manual `job_run` creation in the control plane and a worker loop that claims and stub-completes pending runs.

**Architecture:** The control plane remains responsible for task and run creation, while the worker owns persisted run state transitions. `job_runs` are the execution unit; the worker never executes directly from the `tasks` table.

**Tech Stack:** Bun, TypeScript, Hono, Drizzle ORM, postgres.js

---

### Task 1: Add worker and control-plane dependencies for run lifecycle work

**Files:**
- Modify: `apps/worker/package.json`
- Modify: `apps/control-plane/package.json`

**Step 1: Add DB access where needed**

Ensure both the worker and control plane can import `@agent-cron/db`.

Add any direct Drizzle dependency only where query helpers or tests need it.

**Step 2: Add worker test support**

Add a `test` script for `apps/worker`.

**Step 3: Verify manifests**

Run:

```bash
sed -n '1,220p' apps/worker/package.json
sed -n '1,220p' apps/control-plane/package.json
```

Expected: both packages expose the dependencies needed for DB-backed run lifecycle code.

### Task 2: Write the first failing control-plane run trigger test

**Files:**
- Create: `apps/control-plane/src/runs/routes.test.ts`

**Step 1: Write a failing manual-trigger test**

Create a task row, then exercise `POST /tasks/:id/runs`.

Expect:

- `201`
- `taskId` matches
- `status = pending`
- `scheduledAt` is present

**Step 2: Run the single test and verify failure**

Run:

```bash
bun run --cwd apps/control-plane test src/runs/routes.test.ts
```

Expected: FAIL because the route does not exist yet.

### Task 3: Implement control-plane run queries and routes

**Files:**
- Create: `apps/control-plane/src/runs/queries.ts`
- Create: `apps/control-plane/src/runs/routes.ts`
- Modify: `apps/control-plane/src/index.ts`

**Step 1: Add a task existence check helper or query**

Use the existing tasks table rather than duplicating task state.

**Step 2: Add `createJobRunForTask()`**

Insert a pending run with:

- generated `id`
- `taskId`
- `status = pending`
- `scheduledAt = now`

Leave the optional snapshots and timing fields unset.

**Step 3: Implement `POST /tasks/:id/runs`**

Return:

- `201` with the created run
- `404` when the task does not exist

**Step 4: Register the new route**

Mount the route group from the control-plane app.

**Step 5: Run the focused test**

Run:

```bash
bun run --cwd apps/control-plane test src/runs/routes.test.ts
```

Expected: the create-run test passes.

### Task 4: Expand control-plane run tests

**Files:**
- Modify: `apps/control-plane/src/runs/routes.test.ts`

**Step 1: Add missing-task test**

Verify `POST /tasks/:id/runs` returns `404`.

**Step 2: Optionally add read-route tests only if you implement read routes**

Do not add them if the slice stays write-only.

**Step 3: Run the focused route test suite**

Run:

```bash
bun run --cwd apps/control-plane test src/runs/routes.test.ts
```

Expected: all run-route tests pass.

### Task 5: Write the first failing worker lifecycle test

**Files:**
- Create: `apps/worker/src/jobRuns.test.ts`

**Step 1: Write a no-work test**

Expect the worker helper to return a no-op result when no pending runs exist.

**Step 2: Write a processing test**

Create:

- a task row
- a pending run row

Expect the worker helper to:

- claim the run
- set `startedAt`
- set `finishedAt`
- mark `status = completed`
- write the stub `outputSnapshot`

**Step 3: Run the worker test file and verify failure**

Run:

```bash
bun run --cwd apps/worker test src/jobRuns.test.ts
```

Expected: FAIL because the lifecycle helper does not exist yet.

### Task 6: Implement worker run lifecycle helpers

**Files:**
- Create: `apps/worker/src/jobRuns.ts`
- Modify: `apps/worker/src/index.ts`

**Step 1: Add `processNextPendingJobRun()`**

The helper should:

- find one pending run
- attempt to claim it with a `where id = ? and status = 'pending'` update
- if claim succeeds, mark it `running` with `startedAt`
- then mark it `completed` with `finishedAt` and stub output

**Step 2: Return structured results**

For example:

- `{ status: 'idle' }`
- `{ status: 'completed', jobRunId }`

**Step 3: Keep `src/index.ts` minimal**

It can log scaffold startup and invoke the helper once, or just export it for now if that is cleaner.

**Step 4: Run the worker tests**

Run:

```bash
bun run --cwd apps/worker test src/jobRuns.test.ts
```

Expected: PASS.

### Task 7: Run verification for the full slice

**Files:**
- No file changes expected

**Step 1: Run focused control-plane tests**

```bash
bun run --cwd apps/control-plane test src/runs/routes.test.ts
```

**Step 2: Run focused worker tests**

```bash
bun run --cwd apps/worker test src/jobRuns.test.ts
```

**Step 3: Run package checks**

```bash
bun run --cwd apps/control-plane typecheck
bun run --cwd apps/worker typecheck
```

**Step 4: Run repo checks**

```bash
bun run typecheck
bun run build
git diff --check
```

Expected: all commands exit successfully.

### Task 8: Update docs if implementation meaningfully diverges

**Files:**
- Modify only if needed:
  - `docs/plans/2026-03-14-job-run-lifecycle-design.md`

**Step 1: Compare implementation with approved design**

If the implementation stays aligned, do not churn docs.

**Step 2: If a long-lived contract changed, update the design note**

Keep it concise and factual.
