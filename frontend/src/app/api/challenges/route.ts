import { NextRequest, NextResponse } from 'next/server';
import { getSnapshot } from '@/backend/services/carbon-service';
import { attachSessionCookie, getClientKey, getSession } from '@/backend/api/session';
import { errorResponse } from '@/backend/api/http';
import { assertRateLimit } from '@/backend/services/rate-limit-service';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = getSession(req);
  try {
    await assertRateLimit(getClientKey(req, session.sessionId), 'challenges:read', 120, 60_000);
    const snapshot = await getSnapshot(session.sessionId);
    return attachSessionCookie(NextResponse.json({ challenges: snapshot.challenges }), session.sessionId, session.shouldSetCookie);
  } catch (error) {
    return errorResponse(req, error);
  }
}
