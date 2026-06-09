import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import { attachSessionCookie, getSession } from './session';

const MAX_BODY_BYTES = 64_000;

export async function parseJson<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  const contentLength = Number(req.headers.get('content-length') || '0');
  if (contentLength > MAX_BODY_BYTES) {
    throw Object.assign(new Error('Request body is too large.'), { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw Object.assign(new Error('Invalid JSON request body.'), { status: 400 });
  }

  return schema.parse(body);
}

export function jsonWithSession(req: NextRequest, data: unknown, init?: ResponseInit): NextResponse {
  const session = getSession(req);
  const response = NextResponse.json(data, init);
  return attachSessionCookie(response, session.sessionId, session.shouldSetCookie);
}

export function errorResponse(req: NextRequest, error: unknown): NextResponse {
  const status =
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
      ? error.status
      : error instanceof ZodError
        ? 400
        : 500;

  if (status >= 500) {
    console.error('[API]', error instanceof Error ? error.message : error);
  }

  const message =
    error instanceof ZodError
      ? 'Invalid request payload.'
      : error instanceof Error && status < 500
        ? error.message
        : 'Unexpected server error.';

  return jsonWithSession(req, { error: message }, { status });
}
