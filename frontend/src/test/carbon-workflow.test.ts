import { describe, expect, it, vi } from 'vitest';
import {
  createActivity,
  createChallengeFromInsight,
  deleteActivity,
  deleteAllUserData,
  getSnapshot,
  updateUser,
} from '@/backend/services/carbon-service';
import { AIInsight } from '@/types';

function sessionId(): string {
  return `test-session-${Date.now()}-${Math.random()}`;
}

describe('server-side carbon workflow', () => {
  it('creates activities with server-side emission factors and recalculates summary', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const session = sessionId();

    const snapshot = await createActivity(session, {
      category: 'transport',
      subCategory: 'car_petrol',
      value: 10,
      notes: 'baseline commute',
    });

    expect(snapshot.activities).toHaveLength(1);
    expect(snapshot.activities[0].carbonKg).toBe(1.92);
    expect(snapshot.activities[0].unit).toBe('km');
    expect(snapshot.summary.week).toBe(1.92);
    expect(snapshot.user.badges.some((badge) => badge.id === 'b_first')).toBe(true);
    expect(snapshot.user.xp).toBeGreaterThan(120);
  });

  it('rejects mismatched categories instead of trusting client-selected factors', async () => {
    vi.stubEnv('DATABASE_URL', '');
    await expect(createActivity(sessionId(), {
      category: 'food',
      subCategory: 'car_petrol',
      value: 10,
    })).rejects.toMatchObject({ status: 400 });
  });

  it('deletes activities and keeps totals non-negative', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const session = sessionId();
    const created = await createActivity(session, {
      category: 'food',
      subCategory: 'beef',
      value: 0.5,
    });

    const afterDelete = await deleteActivity(session, created.activities[0].id);
    expect(afterDelete.activities).toHaveLength(0);
    expect(afterDelete.user.totalCarbonKg).toBe(0);
    expect(afterDelete.summary.week).toBe(0);
  });

  it('updates anonymous profile fields without requiring a login wall', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const updated = await updateUser(sessionId(), {
      name: 'Urban Tester',
      location: 'Mumbai, India',
      monthlyBudgetKg: 250,
    });

    expect(updated.user.name).toBe('Urban Tester');
    expect(updated.user.location).toBe('Mumbai, India');
    expect(updated.user.monthlyBudgetKg).toBe(250);
  });

  it('turns AI insights into deduplicated challenges', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const session = sessionId();
    const insight: AIInsight = {
      id: 'ai-transport-test',
      type: 'tip',
      title: 'Replace one commute',
      description: 'Use rail or bus once this week.',
      potentialSavingKg: 8,
      difficulty: 'easy',
      category: 'transport',
      actionItems: ['Pick one commute', 'Log the replacement'],
      generatedAt: new Date(),
    };

    const first = await createChallengeFromInsight(session, insight);
    const second = await createChallengeFromInsight(session, insight);
    const matching = second.challenges.filter((challenge) => challenge.title === insight.title);

    expect(first.challenges.some((challenge) => challenge.title === insight.title)).toBe(true);
    expect(matching).toHaveLength(1);
    expect(matching[0].xpReward).toBe(200);
  });

  it('wipes activities, badges, and challenge progress while preserving profile fields', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const session = sessionId();
    await createActivity(session, {
      category: 'transport',
      subCategory: 'car_petrol',
      value: 12,
    });
    await updateUser(session, { name: 'Reset Tester', location: 'Delhi, India' });

    const wiped = await deleteAllUserData(session);
    expect(wiped.activities).toHaveLength(0);
    expect(wiped.user.name).toBe('Reset Tester');
    expect(wiped.user.location).toBe('Delhi, India');
    expect(wiped.user.totalCarbonKg).toBe(0);
    expect(wiped.challenges.length).toBeGreaterThanOrEqual(3);
    expect(wiped.challenges.every((challenge) => challenge.currentProgressKg === 0)).toBe(true);
  });

  it('returns a complete empty-state snapshot for new visitors', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const snapshot = await getSnapshot(sessionId());

    expect(snapshot.activities).toEqual([]);
    expect(snapshot.summary.categoryBreakdown).toEqual({ transport: 0, food: 0, energy: 0, lifestyle: 0 });
    expect(snapshot.challenges.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.leaderboard.some((entry) => entry.userId === snapshot.user.id)).toBe(true);
  });
});
