import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createActivitySchema, insightsRequestSchema, updateUserSchema } from '@/backend/api/validation';
import { errorResponse, parseJson } from '@/backend/api/http';
import { getSession } from '@/backend/api/session';
import { assertRateLimit } from '@/backend/services/rate-limit-service';

function jsonRequest(body: unknown, init?: RequestInit): NextRequest {
  return new NextRequest('https://verdant.test/api/test', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
}

describe('backend request validation and API safety', () => {
  it('rejects unsupported and unsafe activity payloads before service execution', () => {
    expect(() => createActivitySchema.parse({ category: 'transport', subCategory: '', value: 1 })).toThrow();
    expect(() => createActivitySchema.parse({ category: 'transport', subCategory: 'car_petrol', value: -1 })).toThrow();
    expect(() => createActivitySchema.parse({ category: 'transport', subCategory: 'car_petrol', value: 100_001 })).toThrow();
    expect(() => createActivitySchema.parse({ category: 'transport', subCategory: 'car_petrol', value: 1, notes: 'x'.repeat(501) })).toThrow();
  });

  it('bounds profile and insight input size for public demo safety', () => {
    expect(() => updateUserSchema.parse({ email: 'not-an-email' })).toThrow();
    expect(() => updateUserSchema.parse({ monthlyBudgetKg: 20_001 })).toThrow();
    expect(() => insightsRequestSchema.parse({ activities: Array.from({ length: 81 }, () => ({})) })).toThrow();
    expect(() => insightsRequestSchema.parse({ userQuestion: 'x'.repeat(1_001) })).toThrow();
  });

  it('enforces JSON body limits and returns safe validation errors', async () => {
    const req = jsonRequest({ message: 'x' }, { headers: { 'content-length': '64001' } });
    await expect(parseJson(req, z.object({ message: z.string() }))).rejects.toMatchObject({ status: 413 });

    const badReq = jsonRequest({ value: 1 });
    const response = errorResponse(badReq, new z.ZodError([]));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request payload.' });
  });

  it('uses signed anonymous sessions and rejects tampered cookies', () => {
    vi.stubEnv('SESSION_SECRET', 'test-secret-for-session-signatures');
    const fresh = getSession(new NextRequest('https://verdant.test/api/me'));
    expect(fresh.shouldSetCookie).toBe(true);
    expect(fresh.sessionId).toMatch(/^[a-f0-9]{48}$/);

    const tampered = getSession(new NextRequest('https://verdant.test/api/me', {
      headers: { cookie: 'verdant_session=abc.invalidsignature' },
    }));
    expect(tampered.shouldSetCookie).toBe(true);
    expect(tampered.sessionId).not.toBe('abc');
  });

  it('rate-limits repeated public requests in memory fallback mode', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const key = `test-${Date.now()}-${Math.random()}`;
    await assertRateLimit(key, 'unit', 2, 60_000);
    await assertRateLimit(key, 'unit', 2, 60_000);
    await expect(assertRateLimit(key, 'unit', 2, 60_000)).rejects.toMatchObject({ status: 429 });
  });
});
