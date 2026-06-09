import { createHash } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { Activity, ActivityCategory, AIInsight, CarbonSummary, UserProfile } from '@/types';
import { calculateSummary } from './carbon-service';
import { InsightsPayload } from './types';

const CATEGORIES: ActivityCategory[] = ['transport', 'food', 'energy', 'lifestyle'];

function coerceActivities(raw: unknown): Activity[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 80).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const activity = item as Partial<Activity>;
    if (!activity.category || !CATEGORIES.includes(activity.category)) return [];
    return [{
      id: String(activity.id || 'client-activity'),
      userId: String(activity.userId || 'user'),
      category: activity.category,
      subCategory: String(activity.subCategory || ''),
      value: Number(activity.value) || 0,
      unit: String(activity.unit || ''),
      carbonKg: Number(activity.carbonKg) || 0,
      timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
      notes: activity.notes,
    }];
  });
}

function coerceUser(raw: unknown): Pick<UserProfile, 'monthlyBudgetKg' | 'location' | 'level' | 'streak'> {
  if (!raw || typeof raw !== 'object') {
    return { monthlyBudgetKg: 400, location: 'San Francisco, USA', level: 1, streak: 1 };
  }
  const user = raw as Partial<UserProfile>;
  return {
    monthlyBudgetKg: Number(user.monthlyBudgetKg) || 400,
    location: String(user.location || 'San Francisco, USA'),
    level: Number(user.level) || 1,
    streak: Number(user.streak) || 1,
  };
}

function getDominantCategory(summary: CarbonSummary): ActivityCategory {
  return CATEGORIES.reduce((current, category) => (
    summary.categoryBreakdown[category] > summary.categoryBreakdown[current] ? category : current
  ), 'transport');
}

function fallbackInsights(activities: Activity[], summary: CarbonSummary): AIInsight[] {
  const dominant = getDominantCategory(summary);
  const generatedAt = new Date();
  const categoryText: Record<ActivityCategory, string> = {
    transport: 'commute',
    food: 'meal',
    energy: 'home energy',
    lifestyle: 'purchase and digital habit',
  };

  return [
    {
      id: 'fallback-tip',
      type: 'tip',
      title: `Optimize your ${categoryText[dominant]} routine`,
      description: `Your ${dominant} footprint is currently the strongest signal. Start with one repeatable weekday action instead of a broad lifestyle overhaul.`,
      potentialSavingKg: dominant === 'transport' ? 8 : dominant === 'food' ? 6 : dominant === 'energy' ? 5 : 3,
      difficulty: 'easy',
      category: dominant,
      actionItems: [
        'Choose one high-impact habit for the next 7 days.',
        'Log the same activity daily to measure the change.',
        'Review weekly totals before adding a second habit.',
      ],
      generatedAt,
    },
    {
      id: 'fallback-warning',
      type: summary.trend === 'worsening' ? 'warning' : 'prediction',
      title: summary.trend === 'worsening' ? 'Weekly emissions are above benchmark' : 'Current trend is manageable',
      description: `This week is ${Math.abs(summary.percentageVsAverage)}% ${summary.percentageVsAverage > 0 ? 'above' : 'below'} the global average benchmark used by Verdant.`,
      potentialSavingKg: Math.max(2, Math.round(summary.week * 0.12)),
      difficulty: 'medium',
      category: dominant,
      actionItems: [
        'Avoid the highest-carbon logged option once this week.',
        'Replace it with the lowest-carbon option in the same category.',
        'Check whether daily totals stay under 13 kg CO2e.',
      ],
      generatedAt,
    },
    {
      id: 'fallback-achievement',
      type: activities.length > 0 ? 'achievement' : 'tip',
      title: activities.length > 0 ? 'Tracking loop established' : 'Start with one baseline log',
      description: activities.length > 0
        ? `You have ${activities.length} logged activities, enough to start forming a personal carbon pattern.`
        : 'Log one commute, one meal, and one home energy activity to unlock better personalization.',
      potentialSavingKg: 2,
      difficulty: 'easy',
      category: dominant,
      actionItems: [
        'Keep logs short and consistent.',
        'Use notes only for context that changes behavior.',
        'Refresh insights after adding three new activities.',
      ],
      generatedAt,
    },
  ];
}

function parseGeminiJson(text: string): { insights?: AIInsight[]; summary?: string; chatResponse?: string } | null {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned) as { insights?: AIInsight[]; summary?: string; chatResponse?: string };
    if (!Array.isArray(parsed.insights)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildInsightCacheKey(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export async function generateInsights(input: {
  activities?: unknown;
  user?: unknown;
  summary?: unknown;
  prompt?: string;
  userQuestion?: string;
}): Promise<InsightsPayload> {
  const activities = coerceActivities(input.activities);
  const user = coerceUser(input.user);
  const summary = input.summary && typeof input.summary === 'object'
    ? input.summary as CarbonSummary
    : calculateSummary(activities);
  const fallback = fallbackInsights(activities, summary);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      insights: fallback,
      summary: `Analyzed ${activities.length} activities with deterministic Verdant rules. Add GEMINI_API_KEY for live AI reasoning.`,
      chatResponse: input.userQuestion ? fallback[0].description : undefined,
      source: 'fallback',
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = [
    'You are Verdant, a carbon intelligence assistant for an urban professional.',
    'Return strict JSON only with keys: insights, summary, chatResponse.',
    'insights must be an array of 3 to 4 objects matching: id, type, title, description, potentialSavingKg, difficulty, category, actionItems.',
    'Use only categories transport, food, energy, lifestyle and types tip, warning, achievement, prediction.',
    'Base recommendations on practical actions: commute choice, meal swaps, home electricity, purchases, streaming, waste.',
    `User context: ${JSON.stringify(user)}`,
    `Carbon summary: ${JSON.stringify(summary)}`,
    `Recent activities: ${JSON.stringify(activities.slice(0, 20))}`,
    input.prompt ? `Legacy prompt: ${input.prompt}` : '',
    input.userQuestion ? `User question: ${input.userQuestion}` : '',
  ].filter(Boolean).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 900,
        temperature: 0.35,
        responseMimeType: 'application/json',
      },
    });
    const parsed = parseGeminiJson(response.text || '');
    if (!parsed?.insights) throw new Error('Gemini returned invalid JSON.');

    return {
      insights: parsed.insights.slice(0, 4).map((insight, index) => ({
        ...fallback[index % fallback.length],
        ...insight,
        id: String(insight.id || `gemini-${index}`),
        generatedAt: new Date(),
      })),
      summary: parsed.summary || `Analyzed ${activities.length} activities with Gemini.`,
      chatResponse: parsed.chatResponse,
      source: 'gemini',
    };
  } catch (error) {
    console.warn('[Gemini]', error instanceof Error ? error.message : 'Unknown AI error');
    return {
      insights: fallback,
      summary: `Analyzed ${activities.length} activities with deterministic Verdant fallback rules.`,
      chatResponse: input.userQuestion ? fallback[0].description : undefined,
      source: 'fallback',
    };
  }
}
