import { Hono } from 'hono'
import { tasks } from '@agent-cron/db'

import { runRoutes } from './runs/routes'
import { taskRoutes } from './tasks/routes'

const app = new Hono()

app.get('/', (c) => {
  return c.json({
    service: 'control-plane',
    status: 'ok',
    dbSmokeCheck: Boolean(tasks)
  })
})

app.route('/tasks', taskRoutes)
app.route('/', runRoutes)

export default app
