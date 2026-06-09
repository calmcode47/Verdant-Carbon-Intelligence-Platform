import { NextRequest, NextResponse } from 'next/server';
import { insightsRequestSchema } from '@/backend/api/validation';
import { attachSessionCookie, getClientKey, getSession } from '@/backend/api/session';
import { errorResponse, parseJson } from '@/backend/api/http';
import { generateInsights } from '@/backend/services/insights-service';
import { assertRateLimit } from '@/backend/services/rate-limit-service';

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
