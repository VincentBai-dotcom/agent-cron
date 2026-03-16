import { eq } from 'drizzle-orm'
import { jobRuns, tasks } from '@agent-cron/db'

import { getDb } from '../lib/db'

export async function getTaskById(taskId: string) {
  const [task] = await getDb().select().from(tasks).where(eq(tasks.id, taskId)).limit(1)

  return task ?? null
}

export async function createJobRunForTask(taskId: string) {
  const [jobRun] = await getDb()
    .insert(jobRuns)
    .values({
      id: crypto.randomUUID(),
      taskId,
      status: 'pending',
      scheduledAt: new Date()
    })
    .returning()

  return jobRun
}
