import { NextRequest, NextResponse } from 'next/server';
import { deleteActivity } from '@/backend/services/carbon-service';
import { attachSessionCookie, getClientKey, getSession } from '@/backend/api/session';
import { errorResponse } from '@/backend/api/http';
import { assertRateLimit } from '@/backend/services/rate-limit-service';

export const runtime = 'nodejs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = getSession(req);
  try {
    await assertRateLimit(getClientKey(req, session.sessionId), 'activity:delete', 60, 60_000);
    const { id } = await params;
    const snapshot = await deleteActivity(session.sessionId, id);
    return attachSessionCookie(NextResponse.json(snapshot), session.sessionId, session.shouldSetCookie);
  } catch (error) {
    return errorResponse(req, error);
  }
}
