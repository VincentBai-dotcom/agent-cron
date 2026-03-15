import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { jobRuns } from './jobRuns'

export const approvals = pgTable('approvals', {
  id: text('id').primaryKey(),
  jobRunId: text('job_run_id')
    .notNull()
    .references(() => jobRuns.id),
  status: text('status').notNull(),
  reviewer: text('reviewer'),
  decisionAt: timestamp('decision_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})
