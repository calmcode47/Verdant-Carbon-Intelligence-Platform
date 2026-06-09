import { NextRequest, NextResponse } from 'next/server';
import { createChallengeFromInsight } from '@/server/services/carbon-service';
import { createChallengeFromInsightSchema } from '@/server/api/validation';
import { attachSessionCookie, getClientKey, getSession } from '@/server/api/session';
import { errorResponse, parseJson } from '@/server/api/http';
import { assertRateLimit } from '@/server/services/rate-limit-service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = getSession(req);
  try {
    await assertRateLimit(getClientKey(req, session.sessionId), 'challenge:create', 30, 60_000);
    const insight = await parseJson(req, createChallengeFromInsightSchema);
    const snapshot = await createChallengeFromInsight(session.sessionId, insight);
    return attachSessionCookie(NextResponse.json(snapshot, { status: 201 }), session.sessionId, session.shouldSetCookie);
  } catch (error) {
    return errorResponse(req, error);
  }
}
