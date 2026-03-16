import { afterEach, describe, expect, test } from 'bun:test'
import { inArray } from 'drizzle-orm'

import { createDb, jobRuns, tasks } from '@agent-cron/db'

import { processNextPendingJobRun } from './jobRuns'

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
      name: `Worker test task ${crypto.randomUUID()}`,
      description: 'Used for worker tests',
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

async function insertPendingJobRun(taskId: string) {
  const [jobRun] = await db
    .insert(jobRuns)
    .values({
      id: crypto.randomUUID(),
      taskId,
      status: 'pending',
      scheduledAt: new Date()
    })
    .returning()

  createdJobRunIds.push(jobRun.id)

  return jobRun
}

describe('job run worker lifecycle', () => {
  test('returns idle when there is no pending job run', async () => {
    const result = await processNextPendingJobRun()

    expect(result).toEqual({
      status: 'idle'
    })
  })

  test('claims and completes a pending job run', async () => {
    const task = await insertTask()
    const jobRun = await insertPendingJobRun(task.id)

    const result = await processNextPendingJobRun()

    expect(result).toEqual({
      status: 'completed',
      jobRunId: jobRun.id
    })

    const [updatedJobRun] = await db.select().from(jobRuns).where(inArray(jobRuns.id, [jobRun.id]))

    expect(updatedJobRun.status).toBe('completed')
    expect(updatedJobRun.startedAt).toBeDate()
    expect(updatedJobRun.finishedAt).toBeDate()
    expect(updatedJobRun.outputSnapshot).toEqual({
      executor: 'stub',
      message: 'job run execution not implemented yet'
    })
  })
})
