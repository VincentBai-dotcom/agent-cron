import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }

  return databaseUrl
}

export function createPostgresClient(databaseUrl = getDatabaseUrl()) {
  return postgres(databaseUrl, {
    max: 1
  })
}

export function createDb(databaseUrl = getDatabaseUrl()) {
  const client = createPostgresClient(databaseUrl)

  return drizzle(client, {
    schema
  })
}
