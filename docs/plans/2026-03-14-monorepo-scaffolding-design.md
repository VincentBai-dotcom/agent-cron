# Monorepo Scaffolding Design

## Purpose

This document defines the initial repository scaffold for `agent-cron`.

The scaffold should optimize for:

- fast local prototyping
- a Bun-first development workflow
- a server-hosted control plane
- a desktop app that can supervise the local connector
- a clean migration path from prototype-only choices to production-ready implementations

This is a planning document for repository structure and tool choices. It is not the long-term architecture source of truth. The architecture reference remains [`docs/design/agent-cron-design.md`](/home/vincent-bai/Documents/github/agent-cron/docs/design/agent-cron-design.md).

## Selected Stack

The scaffold should use:

- `Bun` for package management, workspaces, script running, and Bun-native services
- `Hono` for the control plane API and the local connector HTTP service
- `Electron` with the `react-ts` template for the desktop app
- `Postgres` as the first persistent store
- `Drizzle` for schema and database access
- `zod` for schema validation
- `pino` for structured logging

## Why This Stack

### Bun-first development

The project should use Bun for the monorepo because:

- local development speed matters more than ecosystem conservatism at this stage
- Bun can manage workspaces and scripts across the repo
- Bun is a good fit for the control plane, worker, and local connector during development
- Bun can compile the local connector into a standalone executable for desktop distribution

### Hono for service packages

`Hono` is the right fit for `apps/control-plane` and `apps/local-connector` because:

- it has an official Bun starter via `bun create hono@latest`
- it stays portable if some services later run on Node.js
- it keeps the service layer small and direct

### Electron for the customer-facing desktop app

The desktop UI should use Electron because:

- it can render a real dashboard and job registration interface
- its main process can supervise background processes reliably
- it can spawn the local connector in development
- it can spawn a bundled connector executable in packaged builds

The chosen template should be `react-ts` because the desktop UI is expected to grow beyond a trivial renderer.

## Monorepo Shape

The initial scaffold should create this layout:

```text
agent-cron/
  apps/
    control-plane/
    desktop/
    local-connector/
    worker/
  packages/
    adapters-github/
    adapters-xiaohongshu/
    db/
    policy-engine/
    shared/
    task-registry/
  docs/
    design/
    plans/
  package.json
  bunfig.toml
  tsconfig.base.json
```

## App Responsibilities

### `apps/control-plane`

Server-hosted API for:

- tasks
- job registration and run state
- approvals
- connector registration and health
- dashboard data endpoints

This should be scaffolded with `bun create hono@latest` and the `bun` template.

### `apps/local-connector`

Local HTTP service for:

- approved local-machine capabilities
- Xiaohongshu draft integration
- health reporting back to the desktop app and control plane

This should also be scaffolded with `bun create hono@latest` and the `bun` template.

### `apps/worker`

Background job executor for:

- polling queued `job_runs`
- calling deterministic collectors
- invoking the executor abstraction
- normalizing the `codex exec` result
- writing terminal state back to storage

This should be created as a plain Bun TypeScript package, not via a service scaffold.

### `apps/desktop`

Customer-facing desktop app for:

- dashboard UI
- task registration UI
- desktop-side connector supervision
- surfacing local connector health
- surfacing draft and approval flows

This should be scaffolded with the official Electron quick-start generator using the `react-ts` template.

## Shared Package Responsibilities

### `packages/shared`

Shared runtime-neutral code such as:

- environment parsing
- app config types
- logger factory
- IDs and common utility types

### `packages/task-registry`

Task definitions, schemas, and output contracts.

### `packages/db`

Database connection setup, Drizzle schema, and migration entrypoints.

### `packages/policy-engine`

Validation, duplicate prevention, and action gating.

### `packages/adapters-github`

GitHub activity normalization and collector interfaces.

### `packages/adapters-xiaohongshu`

The connector-facing contract for Xiaohongshu draft creation.

## Generator Strategy

The scaffold should intentionally mix generators with hand-created packages.

### Use generators where they save time

Use:

- `bun create hono@latest apps/control-plane`
- `bun create hono@latest apps/local-connector`
- `npm create @quick-start/electron@latest apps/desktop -- --template react-ts`

These are worth using because they produce the right starting shape faster than hand-writing the base files.

### Avoid generators where cleanup cost is higher than setup cost

Do not generate:

- `apps/worker`
- `packages/shared`
- `packages/task-registry`
- `packages/db`
- `packages/policy-engine`
- `packages/adapters-github`
- `packages/adapters-xiaohongshu`

These should be created manually with minimal `package.json`, `tsconfig.json`, and `src/index.ts` files.

## Bun and Electron Boundary

Electron should not be treated as a Bun runtime.

The intended boundary is:

- Bun manages dependencies and workspaces for the repo
- Bun runs the Hono services and worker during development
- Electron runs the desktop shell on Node.js

This is acceptable because dependency management and application runtime do not need to be the same thing.

## Local Connector Execution Model

The connector has two different execution paths.

### Development path

During development, the Electron main process should spawn the connector from source through Bun.

That keeps iteration fast and avoids a compile step for every local change.

### Packaged app path

For packaged desktop builds, the connector should be built with `bun build --compile` into a standalone executable and bundled with the desktop app.

The Electron main process should then spawn that bundled executable directly.

This is preferred over bundling a generic Bun binary because:

- the connector code and runtime version stay pinned together
- customer machines do not need Bun installed
- the process contract is simpler to support

## Packaging Assumptions

The scaffold should assume platform-specific desktop packaging later, but not fully implement it yet.

What the scaffold should prepare for:

- a deterministic output path for compiled connector binaries
- Electron main-process utilities that resolve the connector binary path differently in dev and packaged modes
- build scripts that compile the connector before desktop packaging

## Queue and Persistence Scope for the First Scaffold

The scaffold should not introduce Redis or BullMQ yet.

The first scaffold should assume:

- Postgres for persistent state
- a simple DB-backed job polling model in `apps/worker`

This keeps the first implementation small and aligned with the prototype goal.

## Initial Environment Expectations

The first scaffold should assume developers have:

- Bun installed
- Node.js available for Electron tooling
- Postgres available locally
- `codex` installed and authenticated on the server or development machine used for the worker prototype

## Risks to Watch

### Electron scaffold integration with Bun workspaces

The Electron generator will not be Bun-native. Expect light cleanup after scaffolding so it fits the workspace layout and shared package conventions.

### Bun compile packaging details

`bun build --compile` is a strong fit for the connector, but the project should avoid overcommitting to advanced packaging decisions before the first connector binary is actually built and tested.

### Keeping the desktop shell thin

The desktop app should supervise the connector and render UI. It should not absorb the connector's service logic just because both are local.

## Recommended Scaffold Sequence

1. Create the Bun workspace root.
2. Scaffold `apps/control-plane`.
3. Scaffold `apps/local-connector`.
4. Scaffold `apps/desktop`.
5. Create `apps/worker`.
6. Create the shared packages.
7. Add workspace scripts and shared TypeScript config.
8. Add the first dev-only connector supervision path in Electron.
9. Add the first compiled-connector build script.

## Source Notes

These choices are based on current primary documentation:

- Hono Bun starter: https://hono.dev/docs/getting-started/bun
- Electron quick-start generator: https://electron-vite.org/guide/
- Bun standalone executables: https://bun.sh/docs/bundler/executables
