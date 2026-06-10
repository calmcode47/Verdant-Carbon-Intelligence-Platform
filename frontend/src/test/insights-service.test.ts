import { describe, expect, it, vi } from 'vitest';
import { generateInsights } from '@/backend/services/insights-service';

describe('generateInsights', () => {
  it('returns structured deterministic fallback insights without an API key', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');

    const result = await generateInsights({
      activities: [
        {
          id: 'a1',
          userId: 'u1',
          category: 'transport',
          subCategory: 'car_petrol',
          value: 20,
          unit: 'km',
          carbonKg: 3.84,
          timestamp: new Date().toISOString(),
        },
      ],
      userQuestion: 'How can I reduce my commute emissions?',
    });

    expect(result.source).toBe('fallback');
    expect(result.insights.length).toBeGreaterThanOrEqual(3);
    expect(result.insights[0]).toMatchObject({
      type: 'tip',
      category: 'transport',
      difficulty: 'easy',
    });
    expect(result.chatResponse).toBeTruthy();
    expect(result.chatResponse).toContain('transport');
    expect(result.chatResponse).toContain('Replace one solo car commute');
  });

  it('returns a plan-style fallback answer for 7-day reduction questions', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');

    const result = await generateInsights({
      activities: [],
      userQuestion: 'Give me a 7-day reduction plan',
    });

    expect(result.source).toBe('fallback');
    expect(result.chatResponse).toContain('7-day carbon reduction plan');
    expect(result.chatResponse).toContain('Day 7:');
  });
});
