import { NextRequest, NextResponse } from 'next/server';
import { getSnapshot, updateUser } from '@/server/services/carbon-service';
import { updateUserSchema } from '@/server/api/validation';
import { attachSessionCookie, getClientKey, getSession } from '@/server/api/session';
import { errorResponse, parseJson } from '@/server/api/http';
import { assertRateLimit } from '@/server/services/rate-limit-service';

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
