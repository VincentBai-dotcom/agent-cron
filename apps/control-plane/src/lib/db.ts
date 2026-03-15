import { createDb } from '@agent-cron/db'

let db: ReturnType<typeof createDb> | null = null

export function getDb() {
  if (db) {
    return db
  }

  db = createDb()

  return db
}
