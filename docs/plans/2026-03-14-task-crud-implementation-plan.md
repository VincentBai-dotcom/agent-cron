# Task CRUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full CRUD for task definitions to the control plane with validated request payloads, DB-backed queries, and route-level tests.

**Architecture:** The control plane owns HTTP validation and CRUD semantics; the DB package remains schema/client only. Task CRUD is implemented as a small route group with a local query layer and zod validation. IDs are generated in the control plane with `crypto.randomUUID()`.

**Tech Stack:** Bun, TypeScript, Hono, Zod, Drizzle ORM, postgres.js

---

### Task 1: Add control-plane dependencies and test tooling

**Files:**
- Modify: `apps/control-plane/package.json`

**Step 1: Add runtime dependencies**

Add:

- `@agent-cron/db`
- `zod`

Add a Hono validation helper only if it materially simplifies route code.

**Step 2: Add test support**

Add:

- a `test` script using Bun’s test runner

Add any minimal test dependency only if Bun’s built-in tooling is insufficient.

**Step 3: Verify package manifest**

Run:

```bash
sed -n '1,220p' apps/control-plane/package.json
```

Expected: the control plane has the DB and validation dependencies plus a test script.

**Step 4: Commit**

```bash
git add apps/control-plane/package.json
git commit -m "chore: add control-plane task crud dependencies"
```

### Task 2: Create DB bootstrap helper for the control plane

**Files:**
- Create: `apps/control-plane/src/lib/db.ts`

**Step 1: Create a thin DB helper**

Implement a small wrapper around `createDb()` from `@agent-cron/db`.

Keep it minimal and reusable by the route/query layer.

**Step 2: Verify typecheck**

Run:

```bash
bun run --cwd apps/control-plane typecheck
```

Expected: the new helper compiles cleanly.

**Step 3: Commit**

```bash
git add apps/control-plane/src/lib/db.ts
git commit -m "chore: add control-plane db helper"
```

### Task 3: Write the first failing task route test

**Files:**
- Create: `apps/control-plane/src/tasks/routes.test.ts`

**Step 1: Write a failing create-task test**

Add a test that exercises `POST /tasks` with a valid payload and expects a created task response.

The test should show the intended API shape clearly.

**Step 2: Run the single test to verify failure**

Run:

```bash
bun test apps/control-plane/src/tasks/routes.test.ts
```

Expected: FAIL because the task routes do not exist yet.

**Step 3: Commit**

```bash
git add apps/control-plane/src/tasks/routes.test.ts
git commit -m "test: add failing task create route test"
```

### Task 4: Add task payload schemas

**Files:**
- Create: `apps/control-plane/src/tasks/schema.ts`

**Step 1: Define create and update payload schemas**

Add `zod` schemas for:

- create payload
- patch payload
- task response shape if useful

Constrain `actionMode` to the currently supported values.

**Step 2: Export input types**

Export inferred types for use in the query and route layers.

**Step 3: Verify typecheck**

Run:

```bash
bun run --cwd apps/control-plane typecheck
```

Expected: schema file compiles cleanly.

**Step 4: Commit**

```bash
git add apps/control-plane/src/tasks/schema.ts
git commit -m "feat: add task payload schemas"
```

### Task 5: Add task query functions

**Files:**
- Create: `apps/control-plane/src/tasks/queries.ts`

**Step 1: Implement query functions**

Add functions for:

- `createTask`
- `listTasks`
- `getTaskById`
- `updateTaskById`
- `deleteTaskById`

Use `createDb()` through the local DB helper.

**Step 2: Generate IDs in the control plane**

Use `crypto.randomUUID()` when inserting tasks.

**Step 3: Keep update semantics partial**

Only update provided fields and always set `updatedAt`.

**Step 4: Verify typecheck**

Run:

```bash
bun run --cwd apps/control-plane typecheck
```

Expected: query layer compiles cleanly.

**Step 5: Commit**

```bash
git add apps/control-plane/src/tasks/queries.ts
git commit -m "feat: add task query layer"
```

### Task 6: Add task routes

**Files:**
- Create: `apps/control-plane/src/tasks/routes.ts`
- Modify: `apps/control-plane/src/index.ts`

**Step 1: Implement the route group**

Add:

- `POST /tasks`
- `GET /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

**Step 2: Use route-local validation**

Validate create and patch bodies with `zod`.

Return:

- `400` for invalid payloads
- `404` for missing tasks
- `204` for successful delete

**Step 3: Register the route group from `src/index.ts`**

Keep the app composition small and obvious.

**Step 4: Run the original create test**

Run:

```bash
bun test apps/control-plane/src/tasks/routes.test.ts
```

Expected: the original create-route test now passes.

**Step 5: Commit**

```bash
git add apps/control-plane/src/tasks/routes.ts apps/control-plane/src/index.ts
git commit -m "feat: add task crud routes"
```

### Task 7: Expand the route test suite

**Files:**
- Modify: `apps/control-plane/src/tasks/routes.test.ts`

**Step 1: Add list test**

Write a test for `GET /tasks`.

**Step 2: Add get-by-id test**

Write:

- one success case
- one `404` case

**Step 3: Add patch test**

Verify:

- prompt updates
- schedule updates
- enabled toggles
- `updatedAt` changes

**Step 4: Add delete test**

Verify:

- delete returns `204`
- later fetch returns `404`

**Step 5: Add validation failure tests**

Reject malformed create and patch payloads.

**Step 6: Run the full route test file**

Run:

```bash
bun test apps/control-plane/src/tasks/routes.test.ts
```

Expected: all task CRUD tests pass.

**Step 7: Commit**

```bash
git add apps/control-plane/src/tasks/routes.test.ts
git commit -m "test: cover task crud routes"
```

### Task 8: Add any minimal test harness support

**Files:**
- Create or modify only if needed after the tests are written

**Step 1: Add the smallest possible support code**

Only if the tests require it, add:

- a small app factory
- a test DB helper
- a route composition helper

Do not introduce a large abstraction layer unless the tests force it.

**Step 2: Re-run the task test file**

Run:

```bash
bun test apps/control-plane/src/tasks/routes.test.ts
```

Expected: the suite remains green.

**Step 3: Commit**

```bash
git add apps/control-plane/src
git commit -m "chore: add minimal task route test harness"
```

### Task 9: Run workspace verification

**Files:**
- No new files required unless fixes are needed

**Step 1: Run control-plane tests**

Run:

```bash
bun test apps/control-plane/src/tasks/routes.test.ts
```

Expected: all task CRUD tests pass.

**Step 2: Run workspace typecheck**

Run:

```bash
bun run typecheck
```

Expected: workspace typecheck passes.

**Step 3: Run workspace build**

Run:

```bash
bun run build
```

Expected: workspace build passes.

**Step 4: Commit**

```bash
git add apps/control-plane bun.lock
git commit -m "chore: verify task crud slice"
```

### Task 10: Update design/status docs if needed

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/design/agent-cron-design.md`

**Step 1: Update repo status only if the new feature materially changes the documented current state**

Keep the updates short and factual.

**Step 2: Verify doc diff cleanliness**

Run:

```bash
git diff --check
```

Expected: no patch formatting issues.

**Step 3: Commit**

```bash
git add AGENTS.md docs/design/agent-cron-design.md
git commit -m "docs: update status after task crud"
```

## Verification Notes

This slice should not be considered complete without:

- passing route tests
- passing workspace typecheck
- passing workspace build

## External References

- Hono docs: https://hono.dev/
- Zod docs: https://zod.dev/
- Drizzle docs: https://orm.drizzle.team/

Plan complete and saved to `docs/plans/2026-03-14-task-crud-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
