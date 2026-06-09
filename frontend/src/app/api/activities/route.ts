import { NextRequest, NextResponse } from 'next/server';
import { createActivity } from '@/server/services/carbon-service';
import { createActivitySchema } from '@/server/api/validation';
import { attachSessionCookie, getClientKey, getSession } from '@/server/api/session';
import { errorResponse, parseJson } from '@/server/api/http';
import { assertRateLimit } from '@/server/services/rate-limit-service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = getSession(req);
  try {
    await assertRateLimit(getClientKey(req, session.sessionId), 'activity:create', 60, 60_000);
    const input = await parseJson(req, createActivitySchema);
    const snapshot = await createActivity(session.sessionId, input);
    return attachSessionCookie(NextResponse.json(snapshot, { status: 201 }), session.sessionId, session.shouldSetCookie);
  } catch (error) {
    return errorResponse(req, error);
  }
}
