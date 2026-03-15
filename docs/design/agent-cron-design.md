# agent-cron Design

## Purpose

`agent-cron` is a server-orchestrated AI agent automation system for scheduled and manually triggered tasks.

Each task should:

- run on a schedule or explicit trigger
- create a fresh agent session per run
- gather information from deterministic sources, local resources, or the internet
- produce structured outputs
- optionally perform downstream actions such as creating drafts or publishing content

This is a living design document. It should be updated as architectural decisions change.

## Current Status

As of 2026-03-14, the repository has an initial scaffold that reflects this design:

- a Bun workspace root
- `apps/control-plane` scaffolded with Hono
- `apps/local-connector` scaffolded with Hono
- `apps/desktop` scaffolded with Electron and React
- `apps/worker` scaffolded as a Bun TypeScript process
- placeholder shared packages for DB, policy, adapters, and task definitions

This scaffold is structural only. It does not yet implement real scheduling, persistence, task execution, or connector protocols.

## Initial Use Case

The first concrete workflow is:

- collect recent GitHub code changes and activity
- summarize the work into a concise human-readable update
- generate a Xiaohongshu-friendly draft
- create a draft through a local `xiaohongshu-mcp` integration

The first version should be `draft first`, not auto-publish.

## Non-Goals

`agent-cron` should not treat the agent as the entire system.

Out of scope for the agent itself:

- cron scheduling semantics
- retries and backoff policy
- raw secret storage and access control
- direct unrestricted shell, desktop, or filesystem access
- unvalidated writes to persistent storage
- unbounded multi-step workflows without external guardrails

The system should use agents for reasoning and synthesis, not for infrastructure control.

## Core Design Principles

### 1. Server-hosted control plane

The primary orchestration system should run on a server, not only on a local desktop machine.

The server should own:

- task definitions
- schedules
- queueing
- run history
- approvals
- logs and artifacts
- operator UI

### 2. Required local desktop connector

The first version should require a local desktop connector.

The connector is a first-class architectural component, not an optional plugin. It exists because some tasks depend on local-only capabilities such as:

- local repositories
- local files
- desktop login state
- desktop-hosted MCP services such as `xiaohongshu-mcp`

### 3. Fresh agent session per run

Every `job_run` should start a new agent session with:

- the task objective
- the time window being processed
- task-scoped tool permissions
- the required output schema
- relevant prior run context when needed

Runs should not share mutable agent state by default.

### 4. Deterministic tools before agent reasoning

When reliable APIs or deterministic collectors exist, the system should use them before invoking open-ended agent behavior.

Examples:

- collect GitHub activity through API-backed or deterministic adapters
- normalize data into a stable internal format
- then let the agent summarize and rewrite it for a target platform

### 5. Structured output contracts

Downstream actions should not depend on free-form agent text.

Tasks should define a required structured output contract, for example:

```json
{
  "summary": "This week I shipped ...",
  "xiaohongshu_draft": {
    "title": "这周做了什么",
    "body": "这周主要完成了..."
  },
  "links": ["https://github.com/..."],
  "confidence": 0.87,
  "requires_approval": true
}
```

The system should validate this output before any action is taken.

### 6. Draft-first action safety

The system should support explicit action modes:

- `observe`
- `draft`
- `publish`

The initial GitHub-to-Xiaohongshu task should operate in `draft` mode only.

## High-Level Architecture

The system is split into four planes.

### 1. Control plane

Responsible for:

- task CRUD
- schedule management
- manual triggers
- connector registration and health
- approval workflow
- operator dashboard
- credential reference management

This is the persistent operational backend.

### 2. Execution plane

Responsible for:

- claiming queued jobs
- starting fresh agent sessions
- enforcing timeout and retry policies
- tracking run state
- invoking deterministic tools and connector tools
- persisting outputs and artifacts

This is where task runs actually execute.

### 3. Connector and tool plane

Responsible for:

- GitHub activity collection
- web research tools when required
- local repository inspection
- local file access within approved boundaries
- content formatting helpers
- Xiaohongshu draft creation through the local connector

This plane should mostly expose deterministic, narrow interfaces.

### 4. Data plane

Responsible for:

- task state
- run history
- artifacts
- transcript summaries
- approval records
- connector heartbeats

## Core Components

### Scheduler

The scheduler decides when a task should run.

Examples:

- every day at 9am
- every Friday evening
- manual trigger from the dashboard
- future webhook-triggered runs

The scheduler should not contain agent logic.

### Task registry

The system needs a stable definition for each task, including:

- task id
- name
- description
- enabled state
- schedule expression
- task prompt or objective
- allowed tools
- connector requirements
- output schema
- action mode
- approval policy
- timeout and retry policy

### Job queue

When a task is triggered, the scheduler should create a `job_run` and enqueue it.

Queueing is required because:

- agent runs can be slow
- tasks may run concurrently
- retries should be decoupled from scheduling
- worker capacity should be independently scalable

### Execution worker

Each worker should:

- claim a queued `job_run`
- load the task definition
- invoke a configured executor backend to start a fresh agent session
- call deterministic collectors first
- run the agent synthesis step
- validate outputs
- trigger downstream actions
- store logs, outputs, and artifacts
- mark terminal state

### Executor backend

The worker should not be tightly coupled to one agent runtime implementation.

Instead, it should call an executor abstraction with a stable contract:

- task objective
- time window and normalized input data
- allowed tools and connector capabilities
- workspace or path context when needed
- required output schema
- timeout and execution limits

The executor should return:

- structured output
- executor status
- transcript or transcript summary
- artifact references when available

This keeps the worker, task registry, and policy layer stable even if the execution backend changes later.

### Prototype executor: `codex exec`

For the prototype, the first executor backend should shell out to `codex exec` on the server machine.

This is a speed-optimized implementation choice, not the long-term architectural target.

The prototype backend should assume:

- `codex` is installed on the server
- the server machine is already authenticated through the Codex CLI
- the worker can capture and normalize CLI output into the system's run record
- concurrency is conservative until real operational behavior is understood

This prototype path avoids building a custom API-based agent runtime before the rest of the orchestration system exists.

### Production-target executor

The long-term executor target should be API or SDK based.

The preferred migration path is:

- keep the worker-to-executor contract stable
- replace the `codex exec` backend with an OpenAI API or Agents SDK backend when stronger observability, structured integration, and service-style authentication become necessary

### Local desktop connector

The local connector should run as a long-lived desktop service.

It should expose an allowlisted capability surface such as:

- read approved local repositories
- inspect local git diffs or local repo metadata
- read approved local files
- call local desktop-hosted tools such as `xiaohongshu-mcp`
- upload artifacts or execution metadata back to the server

The connector should not expose unrestricted shell or filesystem access.

### Deterministic adapters

The system should define explicit adapters for:

- GitHub activity collection
- GitHub activity normalization
- content validation
- duplicate detection
- Xiaohongshu draft creation
- notifications and approval prompts

## End-to-End Job Flow

For the initial `github-activity-to-xiaohongshu-draft` task:

1. The scheduler creates a `job_run` for a defined time window.
2. A worker claims the queued run.
3. The worker starts a fresh agent session with task-scoped tools and the required output schema.
4. Deterministic GitHub collection runs first:
   - commits
   - pull requests
   - code reviews
   - issues
   - merged work
5. If needed, the worker calls the local connector for additional local repo context.
6. The agent receives normalized activity data and generates:
   - a canonical summary
   - a Xiaohongshu title
   - a Xiaohongshu body
   - optional links and tags
   - confidence and review signals
7. The policy layer validates schema and safety constraints.
8. Because the task is draft-first, the system routes the draft action through the local connector, which calls the local `xiaohongshu-mcp` boundary.
9. The control plane stores the run result, artifacts, transcript summary, and action metadata.
10. The dashboard exposes the generated draft for review.

For the prototype executor, step 3 is implemented by the worker invoking `codex exec` through the executor abstraction and then normalizing the CLI result back into the `job_run` record.

## Local Desktop Connector Model

The connector exists to bridge server orchestration with local-only capabilities.

### Responsibilities

- maintain a trusted connection to the control plane
- advertise supported capabilities
- heartbeat health and version information
- execute approved local actions on behalf of the server
- protect local secrets and login state

### Connector trust model

The control plane should execute local actions only against:

- registered connectors
- approved connectors
- healthy connectors with recent heartbeats
- connectors whose capability set satisfies the task definition

### Why the connector is required

The initial use case depends on desktop-local behavior:

- optional local repo inspection
- local login state for Xiaohongshu automation
- local `xiaohongshu-mcp` execution

That makes a pure server-only design too restrictive for the first version.

## Data Model

The minimum persistent model should include the following entities.

### `tasks`

Defines the long-lived automation contract.

Suggested fields:

- `id`
- `name`
- `description`
- `enabled`
- `schedule_expr`
- `task_prompt`
- `tool_policy`
- `connector_requirements`
- `output_schema`
- `action_mode`
- `approval_policy`
- `timeout_seconds`
- `max_retries`

### `job_runs`

One record per scheduled or manual execution.

Suggested fields:

- `id`
- `task_id`
- `time_window_start`
- `time_window_end`
- `scheduled_at`
- `started_at`
- `finished_at`
- `status`
- `retry_count`
- `input_snapshot`
- `output_snapshot`
- `error_summary`
- `connector_id`

### `connectors`

Tracks trusted local connector instances.

Suggested fields:

- `id`
- `machine_name`
- `capabilities`
- `status`
- `last_heartbeat_at`
- `version`
- `approved_at`

### `artifacts`

Stores generated files and execution byproducts.

Suggested fields:

- `id`
- `job_run_id`
- `kind`
- `storage_ref`
- `metadata`

### `approvals`

Tracks draft and publish review state.

Suggested fields:

- `id`
- `job_run_id`
- `status`
- `reviewer`
- `decision_at`
- `notes`

### `secret_refs`

Stores references to secret material without embedding raw secrets in task definitions.

For the initial Xiaohongshu flow, the local connector should own local session state needed by `xiaohongshu-mcp`.

## Repository and Module Layout

The repository should separate orchestration, execution, and local integration concerns.

- `apps/control-plane`
  - API and dashboard backend
- `apps/worker`
  - queue consumer and run executor
- `apps/local-connector`
  - desktop daemon for local capabilities
- `packages/task-registry`
  - task schemas, task definitions, output contracts
- `packages/agent-runtime`
  - agent session orchestration and transcript capture
- `packages/adapters-github`
  - GitHub collectors and normalization
- `packages/adapters-xiaohongshu`
  - connector-facing Xiaohongshu draft adapter contract
- `packages/policy-engine`
  - schema validation, duplicate prevention, action gating
- `packages/db`
  - schema, migrations, and typed data access
- `packages/shared`
  - shared config, logging, types, and identifiers

## Reliability and Safety Rules

### Decouple scheduling from execution

The scheduler should only create `job_run` records and queue work. It should not directly execute agent logic.

### Enforce idempotency

The system should prevent duplicate actions by using a deterministic action key built from:

- task id
- target platform
- time window
- content hash

### Classify failures

The system should handle failures differently depending on type:

- transient network or provider failures: retry
- auth or session failures: mark connector or integration unhealthy
- validation failures: fail without retry
- policy failures: require human review

### Enforce timeouts and heartbeats

Each run should have:

- a hard timeout
- progress heartbeat updates
- a terminal state

For the prototype `codex exec` backend, the worker should also enforce:

- explicit process timeouts
- exit-code handling
- normalization of stdout or generated artifacts into structured outputs
- clear failure states for missing CLI authentication or unavailable CLI installation

### Capture observability data

The system should persist:

- structured logs
- deterministic tool call metadata
- transcript summaries
- final validated outputs
- action responses

## Security Model

### Server restrictions

The server should never get unrestricted desktop access.

### Connector restrictions

The local connector should expose only approved capabilities and approved local paths.

### Task-scoped permissions

Each task should declare its required tools and connector capabilities ahead of time.

Workers should not dynamically expand permissions during a run.

### Secret locality

Secrets and login state should stay as close as possible to where they are needed.

For the initial Xiaohongshu workflow, local session state should remain on the desktop connector side.

For the prototype executor, OpenAI-side authentication is represented by the server's Codex CLI login state rather than an application-managed API credential.

## MVP Scope

The MVP should prove the full architecture on one end-to-end workflow.

### Included in MVP

- server-hosted control plane
- scheduler
- queue-backed worker execution
- executor abstraction with `codex exec` as the first backend
- required local desktop connector
- GitHub activity collection and normalization
- agent-generated summary and Xiaohongshu draft output
- draft creation through local `xiaohongshu-mcp`
- task/run storage and basic observability
- dashboard support for viewing runs and draft state

### Deferred after MVP

- multi-platform auto-publish
- rich long-term memory across tasks
- broad internet research tasks
- advanced browser automation beyond the connector boundary
- large-scale worker fleets
- replacing the prototype `codex exec` executor with an API or SDK-backed executor

## Open Questions

These questions should stay open until implementation sharpens them:

- what transport should connect the control plane to the local connector
- how connector authentication and approval should be bootstrapped
- whether task definitions should live only in the database or also in code
- how much local repo inspection is needed beyond GitHub API data
- whether screenshots or images are required for Xiaohongshu drafts in the first production workflow
