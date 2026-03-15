import { boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  enabled: boolean('enabled').notNull().default(true),
  scheduleExpr: text('schedule_expr').notNull(),
  taskPrompt: text('task_prompt').notNull(),
  actionMode: text('action_mode').notNull(),
  outputSchema: jsonb('output_schema').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})
