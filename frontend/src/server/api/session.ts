import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'verdant_session';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function getSecret(): string {
  return process.env.SESSION_SECRET || 'verdant-local-development-secret';
}

function sign(sessionId: string): string {
  return createHmac('sha256', getSecret()).update(sessionId).digest('hex');
}

function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const [sessionId, signature] = token.split('.');
  if (!sessionId || !signature) return null;

  const expected = sign(sessionId);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return null;

  return timingSafeEqual(providedBuffer, expectedBuffer) ? sessionId : null;
}

export function getSession(req: NextRequest): { sessionId: string; shouldSetCookie: boolean } {
  const existing = verifyToken(req.cookies.get(COOKIE_NAME)?.value);
  if (existing) return { sessionId: existing, shouldSetCookie: false };

  return {
    sessionId: randomBytes(24).toString('hex'),
    shouldSetCookie: true,
  };
}

export function attachSessionCookie(res: NextResponse, sessionId: string, shouldSetCookie: boolean): NextResponse {
  if (!shouldSetCookie) return res;

  res.cookies.set({
    name: COOKIE_NAME,
    value: `${sessionId}.${sign(sessionId)}`,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  });

  return res;
}

export function getClientKey(req: NextRequest, sessionId: string): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return `${sessionId}:${ip}`;
}
