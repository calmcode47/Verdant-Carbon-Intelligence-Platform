import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let db: NeonHttpDatabase<typeof schema> | null | undefined;

export function getDb(): NeonHttpDatabase<typeof schema> | null {
  if (db !== undefined) return db;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    db = null;
    return db;
  }

  const sql = neon(databaseUrl);
  db = drizzle(sql, { schema });
  return db;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
