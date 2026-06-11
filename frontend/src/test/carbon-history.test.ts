import { describe, expect, it } from 'vitest';
import {
  activitiesToCsv,
  build30DayHistory,
  buildDisplayBadges,
  buildJourneyMilestones,
} from '@/lib/carbon-history';
import { Activity } from '@/types';

function activity(partial: Partial<Activity> & Pick<Activity, 'carbonKg' | 'timestamp'>): Activity {
  return {
    id: partial.id ?? 'a1',
    userId: partial.userId ?? 'user',
    category: partial.category ?? 'transport',
    subCategory: partial.subCategory ?? 'car_petrol',
    value: partial.value ?? 10,
    unit: partial.unit ?? 'km',
    carbonKg: partial.carbonKg,
    timestamp: partial.timestamp,
    notes: partial.notes,
  };
}

describe('carbon history utilities', () => {
  it('aggregates activities into a 30-day chart series', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const history = build30DayHistory([
      activity({ carbonKg: 2.5, timestamp: today }),
      activity({ carbonKg: 1.5, timestamp: yesterday }),
    ]);

    expect(history).toHaveLength(30);
    expect(history.at(-1)?.kg).toBe(2.5);
    expect(history.at(-2)?.kg).toBe(1.5);
  });

  it('exports real activity rows to CSV', () => {
    const csv = activitiesToCsv([
      activity({
        carbonKg: 3.2,
        timestamp: new Date('2026-01-10T10:00:00.000Z'),
        category: 'food',
        subCategory: 'beef',
        value: 0.4,
        unit: 'kg',
        notes: 'lunch',
      }),
    ]);

    expect(csv).toContain('Date,Category,SubCategory,Value,Unit,CarbonKg,Notes');
    expect(csv).toContain('food,beef,0.4,kg,3.2,"lunch"');
  });

  it('builds milestones from real profile and challenge progress', () => {
    const milestones = buildJourneyMilestones(
      {
        id: 'user',
        name: 'Tester',
        email: 'test@verdant.io',
        location: 'Mumbai',
        monthlyBudgetKg: 300,
        totalCarbonKg: 12,
        streak: 8,
        level: 2,
        xp: 1200,
        badges: [{
          id: 'b_first',
          name: 'First Step',
          description: 'Logged first activity',
          icon: 'Leaf',
          rarity: 'common',
          earnedAt: new Date('2026-01-02'),
        }],
        joinedAt: new Date('2026-01-01'),
        preferences: {
          dailyReminder: true,
          weeklyReport: false,
          milestoneAlerts: true,
          useMetric: true,
          defaultCategory: 'transport',
          profileVisibility: 'public',
          showOnLeaderboard: true,
        },
      },
      [activity({ carbonKg: 1.2, timestamp: new Date('2026-01-02') })],
      [{
        id: 'c1',
        title: 'Grid Saver',
        description: 'Reduce energy',
        category: 'energy',
        targetReductionKg: 10,
        currentProgressKg: 10,
        duration: 'weekly',
        xpReward: 200,
        participants: 100,
        status: 'completed',
        endsAt: new Date('2026-02-01'),
      }],
    );

    expect(milestones.some((item) => item.title === 'Joined Verdant')).toBe(true);
    expect(milestones.some((item) => item.title === 'First Log')).toBe(true);
    expect(milestones.some((item) => item.title === 'Challenge Complete')).toBe(true);
  });

  it('marks earned badges from the user profile', () => {
    const badges = buildDisplayBadges([
      {
        id: 'b_first',
        name: 'First Step',
        description: 'Logged first activity',
        icon: 'Leaf',
        rarity: 'common',
        earnedAt: new Date(),
      },
    ]);

    expect(badges.find((badge) => badge.id === 'b_first')?.earned).toBe(true);
    expect(badges.some((badge) => badge.id === 'energy_wizard' && !badge.earned)).toBe(true);
  });
});
