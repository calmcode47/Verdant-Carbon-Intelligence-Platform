import { NextRequest, NextResponse } from 'next/server';
import { insightsRequestSchema } from '@/server/api/validation';
import { attachSessionCookie, getClientKey, getSession } from '@/server/api/session';
import { errorResponse, parseJson } from '@/server/api/http';
import { generateInsights } from '@/server/services/insights-service';
import { assertRateLimit } from '@/server/services/rate-limit-service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = getSession(req);
  try {
    await assertRateLimit(getClientKey(req, session.sessionId), 'insights:create', 12, 60_000);
    const input = await parseJson(req, insightsRequestSchema);
    const payload = await generateInsights(input);
    return attachSessionCookie(NextResponse.json(payload), session.sessionId, session.shouldSetCookie);
  } catch (err) {
    return errorResponse(req, err);
  }
}
