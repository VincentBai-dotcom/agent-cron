import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json({
    service: 'control-plane',
    status: 'ok'
  })
})

export default app
