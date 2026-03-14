import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json({
    service: 'local-connector',
    status: 'ok'
  })
})

export default app
