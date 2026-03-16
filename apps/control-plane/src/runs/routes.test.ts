import { afterEach, describe, expect, test } from 'bun:test'
import { inArray } from 'drizzle-orm'

import { createDb, jobRuns, tasks } from '@agent-cron/db'

import app from '../index'

const db = createDb()
const createdTaskIds: string[] = []
const createdJobRunIds: string[] = []

afterEach(async () => {
  if (createdJobRunIds.length > 0) {
    await db
      .delete(jobRuns)
      .where(inArray(jobRuns.id, createdJobRunIds.splice(0, createdJobRunIds.length)))
  }

  if (createdTaskIds.length > 0) {
    await db.delete(tasks).where(inArray(tasks.id, createdTaskIds.splice(0, createdTaskIds.length)))
  }
})

async function insertTask() {
  const [task] = await db
    .insert(tasks)
    .values({
      id: crypto.randomUUID(),
      name: `Run trigger task ${crypto.randomUUID()}`,
      description: 'Used for job run route tests',
      enabled: true,
      scheduleExpr: '0 9 * * 1',
      taskPrompt: 'Summarize my recent GitHub work.',
      actionMode: 'draft',
      outputSchema: {
        summary: 'string'
      },
      updatedAt: new Date()
    })
    .returning()

  createdTaskIds.push(task.id)

  return task
}

describe('run routes', () => {
  test('POST /tasks/:id/runs creates a pending job run', async () => {
    const task = await insertTask()

    const response = await app.request(`/tasks/${task.id}/runs`, {
      method: 'POST'
    })

    expect(response.status).toBe(201)

    const body = await response.json()
    createdJobRunIds.push(body.id)

    expect(body).toMatchObject({
      taskId: task.id,
      status: 'pending'
    })
    expect(body.id).toBeString()
    expect(body.scheduledAt).toBeString()
    expect(body.startedAt).toBeNull()
    expect(body.finishedAt).toBeNull()
  })

  test('POST /tasks/:id/runs returns 404 when the task does not exist', async () => {
    const response = await app.request(`/tasks/${crypto.randomUUID()}/runs`, {
      method: 'POST'
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      error: 'Task not found'
    })
  })
})
