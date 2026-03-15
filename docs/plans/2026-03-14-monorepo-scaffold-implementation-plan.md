# Monorepo Scaffold Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the initial `agent-cron` monorepo scaffold using Bun workspaces, Hono service apps, an Electron desktop app, a Bun-authored worker, and a Bun-compiled local connector distribution path.

**Architecture:** The repo will be scaffolded around four apps and several shared packages. `apps/control-plane` and `apps/local-connector` use Hono. `apps/desktop` uses Electron with the `react-ts` template. `apps/worker` is a plain Bun TypeScript package. The local connector runs through Bun in development and as a Bun-compiled standalone executable in packaged desktop builds.

**Tech Stack:** Bun, Hono, Electron, React, TypeScript, Postgres, Drizzle, zod, pino

---

### Task 1: Create the workspace root

**Files:**
- Create: `package.json`
- Create: `bunfig.toml`
- Create: `tsconfig.base.json`
- Create: `apps/.gitkeep`
- Create: `packages/.gitkeep`

**Step 1: Create the root workspace manifest**

Create `package.json` with:

- `private: true`
- workspace entries for `apps/*` and `packages/*`
- root scripts for `dev`, `build`, `lint`, and `typecheck`

**Step 2: Create Bun workspace config**

Create `bunfig.toml` with workspace-friendly defaults if needed by the repo.

**Step 3: Create a shared TypeScript base config**

Create `tsconfig.base.json` for strict TypeScript defaults shared by apps and packages.

**Step 4: Create the top-level directories**

Run:

```bash
mkdir -p apps packages
touch apps/.gitkeep packages/.gitkeep
```

Expected: `apps/` and `packages/` exist in the repo root.

**Step 5: Verify the workspace root**

Run:

```bash
bun install
```

Expected: a root `bun.lock` is generated without workspace errors.

**Step 6: Commit**

```bash
git add package.json bunfig.toml tsconfig.base.json apps/.gitkeep packages/.gitkeep bun.lock
git commit -m "chore: initialize bun workspace root"
```

### Task 2: Scaffold the control plane app

**Files:**
- Create: `apps/control-plane/**`
- Modify: `apps/control-plane/package.json`
- Modify: `apps/control-plane/tsconfig.json`

**Step 1: Scaffold the app with Hono**

Run:

```bash
bun create hono@latest apps/control-plane
```

Select the `bun` template when prompted.

Expected: a Hono Bun app is created in `apps/control-plane`.

**Step 2: Normalize the package metadata**

Update `apps/control-plane/package.json` to:

- use the repo naming convention
- point scripts at Bun-based dev and build commands
- remove unnecessary scaffold defaults that conflict with the workspace

**Step 3: Align TypeScript settings**

Update `apps/control-plane/tsconfig.json` to extend `../../tsconfig.base.json`.

**Step 4: Verify the scaffold**

Run:

```bash
bun --cwd apps/control-plane run dev
```

Expected: the control plane starts locally on its configured development port.

**Step 5: Commit**

```bash
git add apps/control-plane
git commit -m "chore: scaffold control plane app"
```

### Task 3: Scaffold the local connector app

**Files:**
- Create: `apps/local-connector/**`
- Modify: `apps/local-connector/package.json`
- Modify: `apps/local-connector/tsconfig.json`

**Step 1: Scaffold the app with Hono**

Run:

```bash
bun create hono@latest apps/local-connector
```

Select the `bun` template when prompted.

Expected: a Hono Bun app is created in `apps/local-connector`.

**Step 2: Normalize the package metadata**

Update `apps/local-connector/package.json` to:

- use the repo naming convention
- define `dev`, `build`, and `compile` scripts
- prepare for both dev execution and standalone compilation

**Step 3: Align TypeScript settings**

Update `apps/local-connector/tsconfig.json` to extend `../../tsconfig.base.json`.

**Step 4: Verify the scaffold**

Run:

```bash
bun --cwd apps/local-connector run dev
```

Expected: the local connector starts locally on its configured development port.

**Step 5: Commit**

```bash
git add apps/local-connector
git commit -m "chore: scaffold local connector app"
```

### Task 4: Scaffold the desktop app

**Files:**
- Create: `apps/desktop/**`
- Modify: `apps/desktop/package.json`
- Modify: `apps/desktop/electron.vite.config.*`
- Modify: `apps/desktop/src/main/**`
- Modify: `apps/desktop/src/renderer/**`

**Step 1: Scaffold the app with the Electron quick-start generator**

Run:

```bash
npm create @quick-start/electron@latest apps/desktop -- --template react-ts
```

Expected: an Electron app using the `react-ts` template is created in `apps/desktop`.

**Step 2: Normalize dependency management**

At the repo root, run:

```bash
bun install
```

Expected: the root `bun.lock` captures desktop dependencies along with the rest of the workspace.

**Step 3: Normalize the desktop package metadata**

Update `apps/desktop/package.json` so its scripts and package naming align with the monorepo.

**Step 4: Add a placeholder connector supervision hook**

Add a small main-process utility that will later spawn the connector in dev and packaged modes.

**Step 5: Verify the desktop scaffold**

Run:

```bash
bun --cwd apps/desktop run dev
```

Expected: the Electron desktop app starts with the React renderer.

**Step 6: Commit**

```bash
git add apps/desktop bun.lock
git commit -m "chore: scaffold desktop app"
```

### Task 5: Create the worker app

**Files:**
- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/src/index.ts`

**Step 1: Create a plain Bun package**

Create `apps/worker/package.json` with Bun-oriented scripts for:

- `dev`
- `build`
- `typecheck`

**Step 2: Add TypeScript config**

Create `apps/worker/tsconfig.json` extending `../../tsconfig.base.json`.

**Step 3: Add the worker entrypoint**

Create `apps/worker/src/index.ts` with a minimal boot log and process startup stub.

**Step 4: Verify the worker package**

Run:

```bash
bun --cwd apps/worker run dev
```

Expected: the worker starts and logs its bootstrap message.

**Step 5: Commit**

```bash
git add apps/worker
git commit -m "chore: create worker app scaffold"
```

### Task 6: Create shared packages

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/task-registry/package.json`
- Create: `packages/task-registry/tsconfig.json`
- Create: `packages/task-registry/src/index.ts`
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/src/index.ts`
- Create: `packages/policy-engine/package.json`
- Create: `packages/policy-engine/tsconfig.json`
- Create: `packages/policy-engine/src/index.ts`
- Create: `packages/adapters-github/package.json`
- Create: `packages/adapters-github/tsconfig.json`
- Create: `packages/adapters-github/src/index.ts`
- Create: `packages/adapters-xiaohongshu/package.json`
- Create: `packages/adapters-xiaohongshu/tsconfig.json`
- Create: `packages/adapters-xiaohongshu/src/index.ts`

**Step 1: Create the package directories**

Run:

```bash
mkdir -p \
  packages/shared/src \
  packages/task-registry/src \
  packages/db/src \
  packages/policy-engine/src \
  packages/adapters-github/src \
  packages/adapters-xiaohongshu/src
```

Expected: each shared package directory exists with a `src/` subdirectory.

**Step 2: Create minimal package manifests**

Create one `package.json` per package with:

- package name
- version
- private setting as appropriate
- `type: "module"`
- minimal scripts for `typecheck` and `build`

**Step 3: Create package TypeScript configs**

Create one `tsconfig.json` per package extending `../../tsconfig.base.json`.

**Step 4: Create package entrypoints**

Create one `src/index.ts` per package exporting a minimal placeholder symbol.

**Step 5: Verify all packages install and resolve**

Run:

```bash
bun install
```

Expected: workspace install completes with all packages recognized.

**Step 6: Commit**

```bash
git add packages bun.lock
git commit -m "chore: create shared package scaffolds"
```

### Task 7: Add root workspace scripts

**Files:**
- Modify: `package.json`

**Step 1: Add root dev scripts**

Add scripts for:

- `dev:control-plane`
- `dev:local-connector`
- `dev:worker`
- `dev:desktop`

**Step 2: Add root quality scripts**

Add scripts for:

- `typecheck`
- `build`

Use workspace-aware execution rather than ad hoc shell chains.

**Step 3: Verify root scripts**

Run:

```bash
bun run dev:control-plane
```

Expected: the root script forwards correctly into the service app.

**Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add workspace scripts"
```

### Task 8: Add connector compile scripts

**Files:**
- Modify: `apps/local-connector/package.json`
- Create: `apps/local-connector/build/`

**Step 1: Add compile scripts for the connector**

Add scripts for:

- local build
- standalone compile
- target-specific compile outputs when needed

The initial script should use Bun's standalone executable support.

**Step 2: Define the first compile command**

Use a command shaped like:

```bash
bun build ./src/index.ts --compile --outfile ./build/local-connector
```

Later, add `--target` variants for customer builds.

**Step 3: Verify local standalone compilation**

Run:

```bash
bun --cwd apps/local-connector build ./src/index.ts --compile --outfile ./build/local-connector
```

Expected: a standalone connector executable is produced in `apps/local-connector/build/`.

**Step 4: Commit**

```bash
git add apps/local-connector
git commit -m "chore: add connector compile scripts"
```

### Task 9: Add desktop-side connector process abstraction

**Files:**
- Modify: `apps/desktop/src/main/**`

**Step 1: Create a connector launcher module**

Add a main-process module responsible for:

- resolving dev vs packaged connector execution path
- spawning the connector process
- tracking stdout, stderr, exit, and health

**Step 2: Implement development-mode behavior**

In development, the launcher should spawn the connector through Bun from `apps/local-connector`.

**Step 3: Implement packaged-mode behavior**

In packaged mode, the launcher should spawn the bundled compiled connector executable.

**Step 4: Add a temporary startup smoke path**

Hook the launcher into app startup behind a guarded feature flag or explicit startup call.

**Step 5: Verify development-mode spawning**

Run:

```bash
bun --cwd apps/desktop run dev
```

Expected: the Electron main process starts and attempts to launch the local connector in development mode.

**Step 6: Commit**

```bash
git add apps/desktop
git commit -m "feat: add desktop connector launcher scaffold"
```

### Task 10: Add first shared dependencies

**Files:**
- Modify: `package.json`
- Modify: `packages/db/package.json`
- Modify: `packages/policy-engine/package.json`
- Modify: `packages/shared/package.json`

**Step 1: Add core shared dependencies**

Add the first workspace dependencies:

- `zod`
- `pino`
- `drizzle-orm`

Add package-local dependencies only where required.

**Step 2: Add type packages only where needed**

Keep the dependency graph minimal.

**Step 3: Verify install**

Run:

```bash
bun install
```

Expected: all dependencies resolve and the lockfile updates cleanly.

**Step 4: Commit**

```bash
git add package.json packages bun.lock
git commit -m "chore: add core shared dependencies"
```

### Task 11: Add workspace-wide smoke verification

**Files:**
- Modify: `package.json`

**Step 1: Add a workspace typecheck script**

Create a root script that runs typechecks across all apps and packages that already expose a `typecheck` command.

**Step 2: Add a workspace build script**

Create a root script that runs builds across scaffolded packages where a build command exists.

**Step 3: Run the smoke verification**

Run:

```bash
bun run typecheck
```

Expected: all scaffolded packages typecheck cleanly.

Run:

```bash
bun run build
```

Expected: all scaffolded packages with build commands complete without fatal errors.

**Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add workspace smoke verification"
```

### Task 12: Update project documentation after scaffold

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/design/agent-cron-design.md`

**Step 1: Update repo status**

Update `AGENTS.md` to reflect that the repo is now scaffolded rather than design-only.

**Step 2: Update architecture doc if the implemented scaffold deviates**

Only change long-lived architecture statements, not temporary scaffolding noise.

**Step 3: Verify doc diffs are clean**

Run:

```bash
git diff --check
```

Expected: no whitespace or patch formatting issues.

**Step 4: Commit**

```bash
git add AGENTS.md docs/design/agent-cron-design.md
git commit -m "docs: update repo status after scaffold"
```

## Verification Notes

This scaffold plan intentionally favors smoke verification over deep tests because the initial work is structural.

The first meaningful test suite should be introduced after:

- the worker bootstrap exists
- the connector launcher exists
- the control plane exposes initial routes

## External References

- Hono Bun starter: https://hono.dev/docs/getting-started/bun
- Electron quick-start generator: https://electron-vite.org/guide/
- Bun standalone executables: https://bun.sh/docs/bundler/executables

Plan complete and saved to `docs/plans/2026-03-14-monorepo-scaffold-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
