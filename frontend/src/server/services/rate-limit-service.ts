import { and, eq } from 'drizzle-orm';
import { ensureDatabase } from '@/server/db/bootstrap';
import { getDb } from '@/server/db/client';
import { rateLimits } from '@/server/db/schema';

const memory = new Map<string, { count: number; resetAt: number }>();

export async function assertRateLimit(key: string, bucket: string, limit: number, windowMs: number): Promise<void> {
  const now = Date.now();
  const resetAt = new Date(now + windowMs);
  const memoryKey = `${key}:${bucket}`;

  await ensureDatabase();
  const db = getDb();
  if (!db) {
    const entry = memory.get(memoryKey);
    if (!entry || now > entry.resetAt) {
      memory.set(memoryKey, { count: 1, resetAt: now + windowMs });
      return;
    }
    if (entry.count >= limit) {
      throw Object.assign(new Error('Too many requests. Please wait before trying again.'), { status: 429 });
    }
    entry.count += 1;
    return;
  }

  const [entry] = await db
    .select()
    .from(rateLimits)
    .where(and(eq(rateLimits.key, key), eq(rateLimits.bucket, bucket)))
    .limit(1);

  if (!entry || entry.resetAt.getTime() < now) {
    await db
      .insert(rateLimits)
      .values({ key, bucket, count: 1, resetAt })
      .onConflictDoUpdate({
        target: [rateLimits.key, rateLimits.bucket],
        set: { count: 1, resetAt },
      });
    return;
  }

  if (entry.count >= limit) {
    throw Object.assign(new Error('Too many requests. Please wait before trying again.'), { status: 429 });
  }

  await db
    .update(rateLimits)
    .set({ count: entry.count + 1 })
    .where(and(eq(rateLimits.key, key), eq(rateLimits.bucket, bucket)));
}
