import { describe, expect, it, vi } from 'vitest';
import { buildMemoryLeaderboardSnapshot } from '@/backend/services/leaderboard-service';
import { DEFAULT_PREFERENCES } from '@/backend/services/preferences';

describe('leaderboard service', () => {
  it('ranks the current user against seeded warriors by XP', () => {
    vi.stubEnv('DATABASE_URL', '');

    const snapshot = buildMemoryLeaderboardSnapshot({
      id: 'live-user',
      name: 'Live Tester',
      email: 'live@verdant.io',
      avatar: '🌱',
      location: 'Mumbai, India',
      monthlyBudgetKg: 400,
      totalCarbonKg: 12,
      streak: 6,
      level: 2,
      xp: 15000,
      badges: [],
      joinedAt: new Date(),
      preferences: DEFAULT_PREFERENCES,
    });

    expect(snapshot.totalWarriors).toBeGreaterThan(10);
    expect(snapshot.entries[0].name).toBe('Live Tester');
    expect(snapshot.entries.some((entry) => entry.userId === 'live-user')).toBe(true);
  });

  it('hides users who opt out of the leaderboard', () => {
    vi.stubEnv('DATABASE_URL', '');

    const snapshot = buildMemoryLeaderboardSnapshot({
      id: 'private-user',
      name: 'Private User',
      email: 'private@verdant.io',
      avatar: '🔒',
      location: 'Delhi, India',
      monthlyBudgetKg: 400,
      totalCarbonKg: 5,
      streak: 2,
      level: 1,
      xp: 20000,
      badges: [],
      joinedAt: new Date(),
      preferences: { ...DEFAULT_PREFERENCES, showOnLeaderboard: false },
    });

    expect(snapshot.entries.some((entry) => entry.userId === 'private-user')).toBe(false);
  });
});
