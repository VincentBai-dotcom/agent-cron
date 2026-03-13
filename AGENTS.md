# agent-cron

## Goal

`agent-cron` is a server-orchestrated AI agent cron system.

The repository should evolve toward a hybrid architecture where:

- the control plane is server-hosted
- each task run gets a fresh agent session
- deterministic adapters gather and validate data
- a required local desktop connector exposes approved local capabilities

The first concrete workflow is:

- collect GitHub code change and activity data
- summarize it into a short update
- generate a Xiaohongshu draft
- create that draft through a local `xiaohongshu-mcp` integration

## Non-Goals

The repo should not treat the agent as an unbounded operator with unrestricted access.

Out of scope:

- putting scheduling or retry policy inside prompts
- using browser-style scraping when deterministic APIs are available
- allowing unrestricted desktop or filesystem access
- coupling the whole system to a purely local-only runtime model
- depending on free-form text for downstream action contracts

## Current Status

The repo is in the design/bootstrap stage.

Current state as of 2026-03-13:

- architecture is defined at a high level
- no implementation has been started yet
- the design reference lives in `docs/design/agent-cron-design.md`

## Working Principles

Prefer these rules when extending the repo:

- server control plane first
- required local desktop connector for local-only capabilities
- fresh agent session per `job_run`
- deterministic collectors before agent reasoning
- structured JSON outputs for downstream actions
- draft-first safety for social posting integrations
- task-scoped tool permissions only

## Intended Repository Shape

The repo should eventually separate into:

- `apps/control-plane`
- `apps/worker`
- `apps/local-connector`
- `packages/task-registry`
- `packages/agent-runtime`
- `packages/adapters-github`
- `packages/adapters-xiaohongshu`
- `packages/policy-engine`
- `packages/db`
- `packages/shared`

## Design Source of Truth

When architecture decisions change, update `docs/design/agent-cron-design.md` first.

Keep the design doc focused on:

- stable boundaries
- component responsibilities
- data flow
- safety rules
- connector model
- MVP scope

Avoid burying short-lived implementation detail in the design doc unless it changes system behavior or a long-lived contract.
