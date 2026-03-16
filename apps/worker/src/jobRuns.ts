import { and, asc, eq } from 'drizzle-orm'

import { createDb, jobRuns } from '@agent-cron/db'

const db = createDb()

export async function processNextPendingJobRun() {
  const [candidate] = await db
    .select()
    .from(jobRuns)
    .where(eq(jobRuns.status, 'pending'))
    .orderBy(asc(jobRuns.scheduledAt), asc(jobRuns.id))
    .limit(1)

  if (!candidate) {
    return {
      status: 'idle' as const
    }
  }

  const startedAt = new Date()
  const [claimedJobRun] = await db
    .update(jobRuns)
    .set({
      status: 'running',
      startedAt
    })
    .where(and(eq(jobRuns.id, candidate.id), eq(jobRuns.status, 'pending')))
    .returning()

  if (!claimedJobRun) {
    return {
      status: 'idle' as const
    }
  }

  const finishedAt = new Date()
  await db
    .update(jobRuns)
    .set({
      status: 'completed',
      finishedAt,
      outputSnapshot: {
        executor: 'stub',
        message: 'job run execution not implemented yet'
      }
    })
    .where(eq(jobRuns.id, claimedJobRun.id))

  return {
    status: 'completed' as const,
    jobRunId: claimedJobRun.id
  }
}
