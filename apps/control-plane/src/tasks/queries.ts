import { desc, eq } from 'drizzle-orm'
import { tasks } from '@agent-cron/db'

import { getDb } from '../lib/db'
import type { CreateTaskInput, UpdateTaskInput } from './schema'

export async function createTask(input: CreateTaskInput) {
  const [task] = await getDb()
    .insert(tasks)
    .values({
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description ?? null,
      enabled: input.enabled,
      scheduleExpr: input.scheduleExpr,
      taskPrompt: input.taskPrompt,
      actionMode: input.actionMode,
      outputSchema: input.outputSchema,
      updatedAt: new Date()
    })
    .returning()

  return task
}

export async function listTasks() {
  return getDb().select().from(tasks).orderBy(desc(tasks.createdAt), desc(tasks.id))
}

export async function getTaskById(taskId: string) {
  const [task] = await getDb().select().from(tasks).where(eq(tasks.id, taskId)).limit(1)

  return task ?? null
}

export async function updateTaskById(taskId: string, input: UpdateTaskInput) {
  const [task] = await getDb()
    .update(tasks)
    .set({
      ...input,
      updatedAt: new Date()
    })
    .where(eq(tasks.id, taskId))
    .returning()

  return task ?? null
}

export async function deleteTaskById(taskId: string) {
  const [task] = await getDb().delete(tasks).where(eq(tasks.id, taskId)).returning()

  return task ?? null
}
