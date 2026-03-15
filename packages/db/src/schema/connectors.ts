import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const connectors = pgTable('connectors', {
  id: text('id').primaryKey(),
  machineName: text('machine_name').notNull(),
  status: text('status').notNull(),
  capabilities: jsonb('capabilities').notNull(),
  version: text('version').notNull(),
  lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})
