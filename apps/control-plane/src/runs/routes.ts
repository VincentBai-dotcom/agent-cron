import { Hono } from 'hono'

import { createJobRunForTask, getTaskById } from './queries'

const runRoutes = new Hono()

runRoutes.post('/tasks/:id/runs', async (c) => {
  const taskId = c.req.param('id')
  const task = await getTaskById(taskId)

  if (!task) {
    return c.json(
      {
        error: 'Task not found'
      },
      404
    )
  }

  const jobRun = await createJobRunForTask(taskId)

  return c.json(jobRun, 201)
})

export { runRoutes }
