import { afterEach, describe, expect, test } from 'bun:test'
import { inArray } from 'drizzle-orm'

import { createDb, tasks } from '@agent-cron/db'

import app from '../index'

const db = createDb()
const createdTaskIds: string[] = []

afterEach(async () => {
  if (createdTaskIds.length === 0) {
    return
  }

  await db.delete(tasks).where(inArray(tasks.id, createdTaskIds.splice(0, createdTaskIds.length)))
})

async function createTask(overrides: Partial<{
  name: string
  description: string
  enabled: boolean
  scheduleExpr: string
  taskPrompt: string
  actionMode: 'observe' | 'draft' | 'publish'
  outputSchema: Record<string, unknown>
}> = {}) {
  const response = await app.request('/tasks', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      name: `GitHub weekly summary ${crypto.randomUUID()}`,
      description: 'Summarize recent GitHub activity into a draft',
      enabled: true,
      scheduleExpr: '0 9 * * 1',
      taskPrompt: 'Summarize my work from GitHub into a short Xiaohongshu draft.',
      actionMode: 'draft',
      outputSchema: {
        summary: 'string',
        xiaohongshuDraft: {
          title: 'string',
          body: 'string'
        }
      },
      ...overrides
    })
  })

  return response
}

describe('task routes', () => {
  test('POST /tasks creates a task', async () => {
    const response = await createTask({
      name: 'GitHub weekly summary'
    })

    expect(response.status).toBe(201)

    const body = await response.json()
    createdTaskIds.push(body.id)

    expect(body).toMatchObject({
      name: 'GitHub weekly summary',
      enabled: true,
      scheduleExpr: '0 9 * * 1',
      actionMode: 'draft'
    })
    expect(body.id).toBeString()
    expect(body.createdAt).toBeString()
    expect(body.updatedAt).toBeString()
  })

  test('GET /tasks lists tasks in newest-first order', async () => {
    const firstResponse = await createTask({
      name: 'First task'
    })
    const firstTask = await firstResponse.json()
    createdTaskIds.push(firstTask.id)

    const secondResponse = await createTask({
      name: 'Second task'
    })
    const secondTask = await secondResponse.json()
    createdTaskIds.push(secondTask.id)

    const response = await app.request('/tasks')

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toBeArray()
    expect(body.slice(0, 2).map((task: { id: string }) => task.id)).toEqual([
      secondTask.id,
      firstTask.id
    ])
  })

  test('GET /tasks/:id returns a task', async () => {
    const createResponse = await createTask({
      name: 'Lookup task'
    })
    const createdTask = await createResponse.json()
    createdTaskIds.push(createdTask.id)

    const response = await app.request(`/tasks/${createdTask.id}`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toMatchObject({
      id: createdTask.id,
      name: 'Lookup task',
      actionMode: 'draft'
    })
  })

  test('GET /tasks/:id returns 404 when the task does not exist', async () => {
    const response = await app.request(`/tasks/${crypto.randomUUID()}`)

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      error: 'Task not found'
    })
  })

  test('PATCH /tasks/:id updates a task and bumps updatedAt', async () => {
    const createResponse = await createTask({
      name: 'Patch target',
      enabled: false
    })
    const createdTask = await createResponse.json()
    createdTaskIds.push(createdTask.id)

    const response = await app.request(`/tasks/${createdTask.id}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        enabled: true,
        taskPrompt: 'Use the latest GitHub activity and write a shorter draft.'
      })
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toMatchObject({
      id: createdTask.id,
      name: 'Patch target',
      enabled: true,
      taskPrompt: 'Use the latest GitHub activity and write a shorter draft.'
    })
    expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(
      new Date(createdTask.updatedAt).getTime()
    )
  })

  test('PATCH /tasks/:id returns 404 when the task does not exist', async () => {
    const response = await app.request(`/tasks/${crypto.randomUUID()}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        enabled: false
      })
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      error: 'Task not found'
    })
  })

  test('POST /tasks returns 400 for an invalid payload', async () => {
    const response = await app.request('/tasks', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        name: '',
        enabled: true,
        scheduleExpr: '',
        taskPrompt: '',
        actionMode: 'draft',
        outputSchema: {}
      })
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Invalid task payload'
    })
  })

  test('PATCH /tasks/:id returns 400 for an empty payload', async () => {
    const createResponse = await createTask({
      name: 'Patch validation target'
    })
    const createdTask = await createResponse.json()
    createdTaskIds.push(createdTask.id)

    const response = await app.request(`/tasks/${createdTask.id}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({})
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Invalid task payload'
    })
  })

  test('DELETE /tasks/:id removes a task', async () => {
    const createResponse = await createTask({
      name: 'Delete target'
    })
    const createdTask = await createResponse.json()

    const deleteResponse = await app.request(`/tasks/${createdTask.id}`, {
      method: 'DELETE'
    })

    expect(deleteResponse.status).toBe(204)

    const getResponse = await app.request(`/tasks/${createdTask.id}`)

    expect(getResponse.status).toBe(404)
    expect(await getResponse.json()).toEqual({
      error: 'Task not found'
    })
  })

  test('DELETE /tasks/:id returns 404 when the task does not exist', async () => {
    const response = await app.request(`/tasks/${crypto.randomUUID()}`, {
      method: 'DELETE'
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      error: 'Task not found'
    })
  })
})
