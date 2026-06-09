import { describe, expect, it } from 'vitest';
import { Activity } from '@/types';
import { calculateSummary } from '@/server/services/carbon-service';

describe('calculateSummary', () => {
  it('aggregates activity emissions across time windows and categories', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const activities: Activity[] = [
      {
        id: 'a1',
        userId: 'u1',
        category: 'transport',
        subCategory: 'car_petrol',
        value: 10,
        unit: 'km',
        carbonKg: 1.92,
        timestamp: now,
      },
      {
        id: 'a2',
        userId: 'u1',
        category: 'food',
        subCategory: 'beef',
        value: 0.2,
        unit: 'kg',
        carbonKg: 5.4,
        timestamp: yesterday,
      },
    ];

    const summary = calculateSummary(activities);

    expect(summary.week).toBe(7.32);
    expect(summary.month).toBe(7.32);
    expect(summary.categoryBreakdown.transport).toBe(1.92);
    expect(summary.categoryBreakdown.food).toBe(5.4);
    expect(summary.trend).toBe('improving');
  });
});
