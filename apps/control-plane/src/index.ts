import { Hono } from 'hono'
import { tasks } from '@agent-cron/db'

const app = new Hono()

app.get('/', (c) => {
  return c.json({
    service: 'control-plane',
    status: 'ok',
    dbSmokeCheck: Boolean(tasks)
  })
})

export default app
