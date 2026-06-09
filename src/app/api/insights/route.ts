import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// In-memory rate limit (resets on cold start — acceptable for hackathon)
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_WINDOW = 12;
const ipMap = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(key);
  if (!entry || now > entry.resetAt) {
    ipMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_PER_WINDOW) return true;
  entry.count++;
  return false;
}

function sanitizePrompt(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw
    .trim()
    .slice(0, 2000)
    .replace(/<[^>]*>/g, '')      // strip HTML tags
    .replace(/javascript:/gi, '') // strip JS protocol
    .replace(/on\w+\s*=/gi, '');  // strip event handlers
  return cleaned.length > 10 ? cleaned : null;
}

const MOCK_INSIGHTS = [
  'Switching to public transport for weekday commutes can reduce your transport emissions by up to 40%.',
  'Reducing beef consumption from daily to twice per week can save approximately 14 kg CO₂ per week.',
  'Replacing incandescent bulbs with LED throughout your home cuts lighting energy by 75%.',
  'Taking one less short-haul flight per year saves more CO₂ than switching to vegetarianism for a month.',
  'Air-drying clothes instead of tumble-drying saves roughly 1.5 kg CO₂ per load.',
];

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate limiting
  const clientKey = getClientKey(req);
  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before requesting new insights.' },
      { status: 429 }
    );
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const prompt = sanitizePrompt(body.prompt);
  if (!prompt) {
    return NextResponse.json({ error: 'A valid prompt is required.' }, { status: 400 });
  }

  // No API key — return mock insights gracefully
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      insights: MOCK_INSIGHTS.slice(0, 3),
      source: 'mock',
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { maxOutputTokens: 600 },
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return NextResponse.json({ insights: [text], source: 'gemini' });
  } catch (err) {
    console.error('[Gemini API]', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({
      insights: MOCK_INSIGHTS.slice(0, 2),
      source: 'mock',
      warning: 'AI service temporarily unavailable.',
    });
  }
}
