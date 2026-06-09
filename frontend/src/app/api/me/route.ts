import { NextRequest, NextResponse } from 'next/server';
import { getSnapshot, updateUser } from '@/backend/services/carbon-service';
import { updateUserSchema } from '@/backend/api/validation';
import { attachSessionCookie, getClientKey, getSession } from '@/backend/api/session';
import { errorResponse, parseJson } from '@/backend/api/http';
import { assertRateLimit } from '@/backend/services/rate-limit-service';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = getSession(req);
  try {
    await assertRateLimit(getClientKey(req, session.sessionId), 'me:read', 120, 60_000);
    const snapshot = await getSnapshot(session.sessionId);
    return attachSessionCookie(NextResponse.json(snapshot), session.sessionId, session.shouldSetCookie);
  } catch (error) {
    return errorResponse(req, error);
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const session = getSession(req);
  try {
    await assertRateLimit(getClientKey(req, session.sessionId), 'me:write', 30, 60_000);
    const input = await parseJson(req, updateUserSchema);
    const snapshot = await updateUser(session.sessionId, input);
    return attachSessionCookie(NextResponse.json(snapshot), session.sessionId, session.shouldSetCookie);
  } catch (error) {
    return errorResponse(req, error);
  }
}
