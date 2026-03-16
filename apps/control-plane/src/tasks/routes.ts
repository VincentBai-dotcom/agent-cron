import { Hono } from 'hono'

import { createTaskSchema, updateTaskSchema } from './schema'
import { createTask, deleteTaskById, getTaskById, listTasks, updateTaskById } from './queries'

const taskRoutes = new Hono()

taskRoutes.get('/', async (c) => {
  const taskList = await listTasks()

  return c.json(taskList)
})

taskRoutes.get('/:id', async (c) => {
  const task = await getTaskById(c.req.param('id'))

  if (!task) {
    return c.json(
      {
        error: 'Task not found'
      },
      404
    )
  }

  return c.json(task)
})

taskRoutes.patch('/:id', async (c) => {
  const body = await c.req.json()
  const result = updateTaskSchema.safeParse(body)

  if (!result.success) {
    return c.json(
      {
        error: 'Invalid task payload'
      },
      400
    )
  }

  const task = await updateTaskById(c.req.param('id'), result.data)

  if (!task) {
    return c.json(
      {
        error: 'Task not found'
      },
      404
    )
  }

  return c.json(task)
})

taskRoutes.delete('/:id', async (c) => {
  const task = await deleteTaskById(c.req.param('id'))

  if (!task) {
    return c.json(
      {
        error: 'Task not found'
      },
      404
    )
  }

  return c.body(null, 204)
})

taskRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const result = createTaskSchema.safeParse(body)

  if (!result.success) {
    return c.json(
      {
        error: 'Invalid task payload'
      },
      400
    )
  }

  const task = await createTask(result.data)

  return c.json(task, 201)
})

export { taskRoutes }
