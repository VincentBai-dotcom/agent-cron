import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { tasks } from './tasks'

export const jobRuns = pgTable('job_runs', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id),
  status: text('status').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  inputSnapshot: jsonb('input_snapshot'),
  outputSnapshot: jsonb('output_snapshot'),
  errorSummary: text('error_summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})
