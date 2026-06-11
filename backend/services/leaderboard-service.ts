import { desc, sql } from 'drizzle-orm';
import { LeaderboardEntry, UserProfile } from '@/types';
import { getDb } from '@/backend/db/client';
import { ensureDatabase } from '@/backend/db/bootstrap';
import { users } from '@/backend/db/schema';
import { parsePreferences } from './preferences';

export interface LeaderboardSnapshot {
  entries: LeaderboardEntry[];
  totalWarriors: number;
}

const SEED_WARRIORS: Array<{
  sessionId: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  totalCarbonKg: number;
  monthlyBudgetKg: number;
}> = [
  { sessionId: 'seed:aria', name: 'Aria Nakamura', avatar: '👩‍🔬', xp: 14200, level: 12, streak: 42, totalCarbonKg: 48, monthlyBudgetKg: 520 },
  { sessionId: 'seed:luca', name: 'Luca Fernandez', avatar: '🧑‍🌾', xp: 12800, level: 11, streak: 31, totalCarbonKg: 72, monthlyBudgetKg: 500 },
  { sessionId: 'seed:priya', name: 'Priya Mehta', avatar: '👩‍💻', xp: 11400, level: 10, streak: 28, totalCarbonKg: 65, monthlyBudgetKg: 480 },
  { sessionId: 'seed:elias', name: 'Elias Müller', avatar: '🧑‍🎓', xp: 9900, level: 9, streak: 22, totalCarbonKg: 88, monthlyBudgetKg: 460 },
  { sessionId: 'seed:zara', name: 'Zara Osei', avatar: '👩‍🎨', xp: 8700, level: 8, streak: 17, totalCarbonKg: 95, monthlyBudgetKg: 420 },
  { sessionId: 'seed:kai', name: 'Kai Larsson', avatar: '🧑‍🚀', xp: 7900, level: 8, streak: 14, totalCarbonKg: 110, monthlyBudgetKg: 410 },
  { sessionId: 'seed:yuna', name: 'Yuna Park', avatar: '👩‍🏫', xp: 6800, level: 7, streak: 11, totalCarbonKg: 120, monthlyBudgetKg: 390 },
  { sessionId: 'seed:mateo', name: 'Mateo Silva', avatar: '🧑‍🔧', xp: 5400, level: 6, streak: 9, totalCarbonKg: 140, monthlyBudgetKg: 360 },
  { sessionId: 'seed:ingrid', name: 'Ingrid Johansson', avatar: '👩‍🌾', xp: 4200, level: 5, streak: 7, totalCarbonKg: 155, monthlyBudgetKg: 340 },
  { sessionId: 'seed:omar', name: 'Omar Hassan', avatar: '🧑‍🍳', xp: 3100, level: 4, streak: 5, totalCarbonKg: 170, monthlyBudgetKg: 320 },
];

const memoryWarriors = new Map<string, UserProfile>();

function round(value: number, digits = 1): number {
  return Number(value.toFixed(digits));
}

function toLeaderboardEntry(user: Pick<UserProfile, 'id' | 'name' | 'avatar' | 'xp' | 'level' | 'streak' | 'monthlyBudgetKg' | 'totalCarbonKg'>, rank: number): LeaderboardEntry {
  return {
    rank,
    userId: user.id,
    name: user.name,
    avatar: user.avatar ?? '🌱',
    reductionKg: Math.max(0, round(user.monthlyBudgetKg - user.totalCarbonKg)),
    xp: user.xp,
    level: user.level,
    streak: user.streak,
  };
}

function sortAndRank(players: UserProfile[], currentUserId: string): LeaderboardSnapshot {
  const visible = players.filter((player) => parsePreferences(player.preferences).showOnLeaderboard);
  const sorted = [...visible].sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
  const totalWarriors = sorted.length;
  const top = sorted.slice(0, 10).map((player, index) => toLeaderboardEntry(player, index + 1));
  const currentInTop = top.some((entry) => entry.userId === currentUserId);

  if (!currentInTop) {
    const current = sorted.find((player) => player.id === currentUserId);
    if (current) {
      const rank = sorted.findIndex((player) => player.id === currentUserId) + 1;
      top.push(toLeaderboardEntry(current, rank));
    }
  }

  return { entries: top, totalWarriors };
}

export function registerMemoryWarrior(user: UserProfile): void {
  memoryWarriors.set(user.id, user);
}

export async function ensureSeedWarriors(): Promise<void> {
  await ensureDatabase();
  const db = getDb();
  if (!db) return;

  for (const warrior of SEED_WARRIORS) {
    await db.insert(users).values({
      sessionId: warrior.sessionId,
      name: warrior.name,
      avatar: warrior.avatar,
      xp: warrior.xp,
      level: warrior.level,
      streak: warrior.streak,
      totalCarbonKg: String(warrior.totalCarbonKg),
      monthlyBudgetKg: String(warrior.monthlyBudgetKg),
      preferences: sql`'{"showOnLeaderboard":true,"dailyReminder":true,"weeklyReport":false,"milestoneAlerts":true,"useMetric":true,"defaultCategory":"transport","profileVisibility":"public"}'::jsonb`,
    }).onConflictDoNothing({ target: users.sessionId });
  }
}

export function buildMemoryLeaderboardSnapshot(currentUser: UserProfile): LeaderboardSnapshot {
  registerMemoryWarrior(currentUser);
  const seedProfiles: UserProfile[] = SEED_WARRIORS.map((warrior, index) => ({
    id: `seed-profile-${index}`,
    name: warrior.name,
    email: `${warrior.sessionId}@verdant.io`,
    avatar: warrior.avatar,
    location: 'Global',
    monthlyBudgetKg: warrior.monthlyBudgetKg,
    totalCarbonKg: warrior.totalCarbonKg,
    streak: warrior.streak,
    level: warrior.level,
    xp: warrior.xp,
    badges: [],
    joinedAt: new Date(),
    preferences: {
      showOnLeaderboard: true,
      dailyReminder: true,
      weeklyReport: false,
      milestoneAlerts: true,
      useMetric: true,
      defaultCategory: 'transport',
      profileVisibility: 'public',
    },
  }));
  return sortAndRank([...seedProfiles, ...memoryWarriors.values(), currentUser], currentUser.id);
}

export async function buildGlobalLeaderboard(currentUser: UserProfile): Promise<LeaderboardSnapshot> {
  await ensureSeedWarriors();
  const db = getDb();

  if (!db) {
    return buildMemoryLeaderboardSnapshot(currentUser);
  }

  const rows = await db.select().from(users).orderBy(desc(users.xp)).limit(100);
  const players: UserProfile[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar || '🌱',
    location: row.location,
    monthlyBudgetKg: Number(row.monthlyBudgetKg),
    totalCarbonKg: Number(row.totalCarbonKg),
    streak: row.streak,
    level: row.level,
    xp: row.xp,
    badges: [],
    joinedAt: row.joinedAt,
    preferences: parsePreferences(row.preferences),
  }));

  const hasCurrent = players.some((player) => player.id === currentUser.id);
  if (!hasCurrent) players.push(currentUser);

  return sortAndRank(players, currentUser.id);
}

export async function countVisibleWarriors(): Promise<number> {
  const db = getDb();
  if (!db) return memoryWarriors.size + SEED_WARRIORS.length;
  const rows = await db.select({ preferences: users.preferences }).from(users);
  return rows.filter((row) => parsePreferences(row.preferences).showOnLeaderboard).length;
}
