import { randomUUID } from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import { Activity, ActivityCategory, Badge, Challenge, LeaderboardEntry, UserProfile } from '@/types';
import { calculateCarbon, EMISSION_FACTORS, getXPForActivity } from '@/lib/carbon-calculator';
import { getDb } from '@/server/db/client';
import { ensureDatabase } from '@/server/db/bootstrap';
import { activities, badges, challenges, DbActivity, DbBadge, DbChallenge, DbUser, users } from '@/server/db/schema';
import { CreateActivityInput, InsightInput, UpdateUserInput } from '@/server/api/validation';
import { AppSnapshot } from './types';

const DEFAULT_BADGE: Badge = {
  id: 'b1',
  name: 'Eco Starter',
  description: 'Created a Verdant profile',
  icon: 'Leaf',
  rarity: 'common',
  earnedAt: new Date(),
};

const DEFAULT_CHALLENGES: Omit<Challenge, 'id' | 'currentProgressKg' | 'status' | 'endsAt'>[] = [
  {
    title: 'Zero Emission Commute',
    description: 'Log 50km on electric transit or train',
    category: 'transport',
    targetReductionKg: 15,
    duration: 'weekly',
    xpReward: 200,
    participants: 1450,
  },
  {
    title: 'Green Diet Shift',
    description: 'Save 30kg carbon emissions on plant-based food entries',
    category: 'food',
    targetReductionKg: 30,
    duration: 'weekly',
    xpReward: 150,
    participants: 920,
  },
  {
    title: 'Grid Saver',
    description: 'Keep home electricity footprints under 50kg carbon this week',
    category: 'energy',
    targetReductionKg: 40,
    duration: 'monthly',
    xpReward: 300,
    participants: 2120,
  },
];

interface MemoryState {
  user: UserProfile;
  activities: Activity[];
  challenges: Challenge[];
}

const memory = new Map<string, MemoryState>();

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function createDefaultUser(id: string): UserProfile {
  return {
    id,
    name: 'Eco Warrior',
    email: 'eco.warrior@verdant.io',
    avatar: '🌱',
    location: 'San Francisco, USA',
    monthlyBudgetKg: 400,
    totalCarbonKg: 0,
    streak: 1,
    level: 1,
    xp: 120,
    badges: [DEFAULT_BADGE],
    joinedAt: new Date(),
  };
}

function createDefaultChallenges(userId: string): Challenge[] {
  return DEFAULT_CHALLENGES.map((challenge, index) => ({
    ...challenge,
    id: `${userId}:c${index + 1}`,
    currentProgressKg: 0,
    status: 'active',
    endsAt: new Date(Date.now() + (index === 2 ? 20 : 5 - index) * 24 * 60 * 60 * 1000),
  }));
}

function getMemoryState(sessionId: string): MemoryState {
  const existing = memory.get(sessionId);
  if (existing) return existing;

  const user = createDefaultUser(`mem-${sessionId.slice(0, 12)}`);
  const state = {
    user,
    activities: [],
    challenges: createDefaultChallenges(user.id),
  };
  memory.set(sessionId, state);
  return state;
}

export function calculateSummary(activityList: Activity[]): AppSnapshot['summary'] {
  const now = new Date();
  const todayLimit = new Date(now);
  todayLimit.setHours(0, 0, 0, 0);

  const weekLimit = new Date(now);
  weekLimit.setDate(weekLimit.getDate() - 7);

  const monthLimit = new Date(now);
  monthLimit.setMonth(monthLimit.getMonth() - 1);

  const yearLimit = new Date(now);
  yearLimit.setFullYear(yearLimit.getFullYear() - 1);

  const categoryBreakdown: Record<ActivityCategory, number> = {
    transport: 0,
    food: 0,
    energy: 0,
    lifestyle: 0,
  };

  let today = 0;
  let week = 0;
  let month = 0;
  let year = 0;

  for (const activity of activityList) {
    const timestamp = new Date(activity.timestamp);
    const carbonKg = Number(activity.carbonKg) || 0;
    if (timestamp >= todayLimit) today += carbonKg;
    if (timestamp >= weekLimit) week += carbonKg;
    if (timestamp >= monthLimit) month += carbonKg;
    if (timestamp >= yearLimit) year += carbonKg;
    categoryBreakdown[activity.category] = round(categoryBreakdown[activity.category] + carbonKg);
  }

  const weeklyAverage = 13 * 7;
  const trend = week < weeklyAverage - 10 ? 'improving' : week > weeklyAverage + 10 ? 'worsening' : 'stable';

  return {
    today: round(today),
    week: round(week),
    month: round(month),
    year: round(year),
    categoryBreakdown,
    trend,
    percentageVsAverage: Math.round(((week - weeklyAverage) / weeklyAverage) * 100),
  };
}

function buildLeaderboard(user: UserProfile): LeaderboardEntry[] {
  const userReduction = Math.max(0, round(user.monthlyBudgetKg - user.totalCarbonKg, 1));
  return [
    { rank: 1, userId: 'u1', name: 'Alena Vance', avatar: '👩‍🔬', reductionKg: 125.4, xp: 1450, level: 3 },
    { rank: 2, userId: 'u2', name: 'Julian Drake', avatar: '👨‍💻', reductionKg: 98.2, xp: 1200, level: 2 },
    { rank: 3, userId: 'u3', name: 'Sophia Chen', avatar: '👩‍🎨', reductionKg: 85, xp: 950, level: 2 },
    { rank: 4, userId: user.id, name: user.name, avatar: user.avatar, reductionKg: userReduction, xp: user.xp, level: user.level },
  ]
    .sort((a, b) => b.xp - a.xp)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function snapshotFromState(state: MemoryState): AppSnapshot {
  return {
    user: state.user,
    activities: [...state.activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    summary: calculateSummary(state.activities),
    challenges: state.challenges,
    leaderboard: buildLeaderboard(state.user),
  };
}

function mapDbUser(user: DbUser, userBadges: DbBadge[]): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || '🌱',
    location: user.location,
    monthlyBudgetKg: Number(user.monthlyBudgetKg),
    totalCarbonKg: Number(user.totalCarbonKg),
    streak: user.streak,
    level: user.level,
    xp: user.xp,
    badges: userBadges.map((badge) => ({
      id: badge.badgeId,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      rarity: badge.rarity as Badge['rarity'],
      earnedAt: badge.earnedAt,
    })),
    joinedAt: user.joinedAt,
  };
}

function mapDbActivity(activity: DbActivity): Activity {
  return {
    id: activity.id,
    userId: activity.userId,
    category: activity.category as ActivityCategory,
    subCategory: activity.subCategory,
    value: Number(activity.value),
    unit: activity.unit,
    carbonKg: Number(activity.carbonKg),
    timestamp: activity.timestamp,
    notes: activity.notes || undefined,
    aiSuggestion: activity.aiSuggestion || undefined,
  };
}

function mapDbChallenge(challenge: DbChallenge): Challenge {
  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    category: challenge.category as ActivityCategory,
    targetReductionKg: Number(challenge.targetReductionKg),
    currentProgressKg: Number(challenge.currentProgressKg),
    duration: challenge.duration as Challenge['duration'],
    xpReward: challenge.xpReward,
    participants: challenge.participants,
    status: challenge.status as Challenge['status'],
    endsAt: challenge.endsAt,
  };
}

async function seedUserRows(userId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  await db.insert(badges).values({
    userId,
    badgeId: DEFAULT_BADGE.id,
    name: DEFAULT_BADGE.name,
    description: DEFAULT_BADGE.description,
    icon: DEFAULT_BADGE.icon,
    rarity: DEFAULT_BADGE.rarity,
  }).onConflictDoNothing();

  const rows = DEFAULT_CHALLENGES.map((challenge, index) => ({
    id: `${userId}:c${index + 1}`,
    userId,
    title: challenge.title,
    description: challenge.description,
    category: challenge.category,
    targetReductionKg: String(challenge.targetReductionKg),
    currentProgressKg: '0',
    duration: challenge.duration,
    xpReward: challenge.xpReward,
    participants: challenge.participants,
    status: 'active',
    endsAt: new Date(Date.now() + (index === 2 ? 20 : 5 - index) * 24 * 60 * 60 * 1000),
  }));

  await db.insert(challenges).values(rows).onConflictDoNothing();
}

async function getOrCreateDbUser(sessionId: string): Promise<DbUser> {
  await ensureDatabase();
  const db = getDb();
  if (!db) throw new Error('Database is not configured.');

  const [existing] = await db.select().from(users).where(eq(users.sessionId, sessionId)).limit(1);
  if (existing) return existing;

  const [created] = await db.insert(users).values({ sessionId, avatar: '🌱' }).returning();
  await seedUserRows(created.id);
  return created;
}

async function dbSnapshot(sessionId: string): Promise<AppSnapshot> {
  const db = getDb();
  if (!db) return snapshotFromState(getMemoryState(sessionId));

  const user = await getOrCreateDbUser(sessionId);
  await seedUserRows(user.id);
  const [userBadges, userActivities, userChallenges] = await Promise.all([
    db.select().from(badges).where(eq(badges.userId, user.id)),
    db.select().from(activities).where(eq(activities.userId, user.id)).orderBy(desc(activities.timestamp)),
    db.select().from(challenges).where(eq(challenges.userId, user.id)),
  ]);

  const mappedActivities = userActivities.map(mapDbActivity);
  const mappedUser = mapDbUser(user, userBadges);

  return {
    user: mappedUser,
    activities: mappedActivities,
    summary: calculateSummary(mappedActivities),
    challenges: userChallenges.map(mapDbChallenge),
    leaderboard: buildLeaderboard(mappedUser),
  };
}

export async function getSnapshot(sessionId: string): Promise<AppSnapshot> {
  await ensureDatabase();
  return dbSnapshot(sessionId);
}

function validateFactor(category: ActivityCategory, subCategory: string) {
  const factor = EMISSION_FACTORS.find((item) => item.subCategory === subCategory);
  if (!factor || factor.category !== category) {
    throw Object.assign(new Error('Unsupported activity category or emission factor.'), { status: 400 });
  }
  return factor;
}

function applyActivityRewards(state: MemoryState, activity: Activity): void {
  const xpGained = getXPForActivity(activity.carbonKg, false);
  const updatedActivities = [activity, ...state.activities];
  const badgesList = [...state.user.badges];

  if (updatedActivities.length === 1 && !badgesList.some((badge) => badge.id === 'b_first')) {
    badgesList.push({
      id: 'b_first',
      name: 'First Step',
      description: 'Logged first activity in Verdant',
      icon: 'Leaf',
      rarity: 'common',
      earnedAt: new Date(),
    });
  }
  if (updatedActivities.length >= 10 && !badgesList.some((badge) => badge.id === 'b_ten')) {
    badgesList.push({
      id: 'b_ten',
      name: 'Carbon Tracker Pro',
      description: 'Logged 10 activities',
      icon: 'Award',
      rarity: 'rare',
      earnedAt: new Date(),
    });
  }

  state.activities = updatedActivities;
  state.user = {
    ...state.user,
    totalCarbonKg: round(state.user.totalCarbonKg + activity.carbonKg),
    xp: state.user.xp + xpGained,
    level: Math.floor((state.user.xp + xpGained) / 1000) + 1,
    badges: badgesList,
  };

  state.challenges = state.challenges.map((challenge) => {
    if (challenge.status !== 'active' || challenge.category !== activity.category) return challenge;

    const currentProgressKg = Math.min(challenge.targetReductionKg, round(challenge.currentProgressKg + activity.value * 0.1));
    const completed = currentProgressKg >= challenge.targetReductionKg;
    if (completed) {
      const xp = state.user.xp + challenge.xpReward;
      state.user = { ...state.user, xp, level: Math.floor(xp / 1000) + 1 };
    }

    return {
      ...challenge,
      currentProgressKg,
      status: completed ? 'completed' : 'active',
    };
  });
}

export async function createActivity(sessionId: string, input: CreateActivityInput): Promise<AppSnapshot> {
  const factor = validateFactor(input.category, input.subCategory);
  const carbonKg = calculateCarbon(input.subCategory, input.value);
  const timestamp = input.timestamp || new Date();

  await ensureDatabase();
  const db = getDb();
  if (!db) {
    const state = getMemoryState(sessionId);
    const activity: Activity = {
      id: randomUUID(),
      userId: state.user.id,
      category: input.category,
      subCategory: input.subCategory,
      value: input.value,
      unit: factor.unit,
      carbonKg,
      timestamp,
      notes: input.notes,
    };
    applyActivityRewards(state, activity);
    return snapshotFromState(state);
  }

  const user = await getOrCreateDbUser(sessionId);
  const [created] = await db.insert(activities).values({
    userId: user.id,
    category: input.category,
    subCategory: input.subCategory,
    value: String(input.value),
    unit: factor.unit,
    carbonKg: String(carbonKg),
    notes: input.notes,
    timestamp,
  }).returning();

  const allActivities = await db.select().from(activities).where(eq(activities.userId, user.id));
  const xpGained = getXPForActivity(Number(created.carbonKg), false);
  const nextXp = user.xp + xpGained;
  await db.update(users).set({
    totalCarbonKg: String(round(Number(user.totalCarbonKg) + carbonKg)),
    xp: nextXp,
    level: Math.floor(nextXp / 1000) + 1,
    updatedAt: new Date(),
  }).where(eq(users.id, user.id));

  if (allActivities.length === 1) {
    await db.insert(badges).values({
      userId: user.id,
      badgeId: 'b_first',
      name: 'First Step',
      description: 'Logged first activity in Verdant',
      icon: 'Leaf',
      rarity: 'common',
    }).onConflictDoNothing();
  }
  if (allActivities.length >= 10) {
    await db.insert(badges).values({
      userId: user.id,
      badgeId: 'b_ten',
      name: 'Carbon Tracker Pro',
      description: 'Logged 10 activities',
      icon: 'Award',
      rarity: 'rare',
    }).onConflictDoNothing();
  }

  const activeChallenges = await db.select().from(challenges).where(and(eq(challenges.userId, user.id), eq(challenges.category, input.category)));
  for (const challenge of activeChallenges) {
    if (challenge.status !== 'active') continue;
    const currentProgressKg = Math.min(Number(challenge.targetReductionKg), round(Number(challenge.currentProgressKg) + input.value * 0.1));
    const completed = currentProgressKg >= Number(challenge.targetReductionKg);
    await db.update(challenges).set({
      currentProgressKg: String(currentProgressKg),
      status: completed ? 'completed' : 'active',
    }).where(eq(challenges.id, challenge.id));
  }

  return dbSnapshot(sessionId);
}

export async function deleteActivity(sessionId: string, activityId: string): Promise<AppSnapshot> {
  await ensureDatabase();
  const db = getDb();
  if (!db) {
    const state = getMemoryState(sessionId);
    const activity = state.activities.find((item) => item.id === activityId);
    if (activity) {
      state.activities = state.activities.filter((item) => item.id !== activityId);
      const xp = Math.max(0, state.user.xp - getXPForActivity(activity.carbonKg, false));
      state.user = {
        ...state.user,
        totalCarbonKg: Math.max(0, round(state.user.totalCarbonKg - activity.carbonKg)),
        xp,
        level: Math.floor(xp / 1000) + 1,
      };
    }
    return snapshotFromState(state);
  }

  const user = await getOrCreateDbUser(sessionId);
  const [activity] = await db.select().from(activities).where(and(eq(activities.id, activityId), eq(activities.userId, user.id))).limit(1);
  if (activity) {
    await db.delete(activities).where(eq(activities.id, activityId));
    const xp = Math.max(0, user.xp - getXPForActivity(Number(activity.carbonKg), false));
    await db.update(users).set({
      totalCarbonKg: String(Math.max(0, round(Number(user.totalCarbonKg) - Number(activity.carbonKg)))),
      xp,
      level: Math.floor(xp / 1000) + 1,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));
  }

  return dbSnapshot(sessionId);
}

export async function updateUser(sessionId: string, input: UpdateUserInput): Promise<AppSnapshot> {
  await ensureDatabase();
  const db = getDb();
  if (!db) {
    const state = getMemoryState(sessionId);
    state.user = { ...state.user, ...input };
    return snapshotFromState(state);
  }

  const user = await getOrCreateDbUser(sessionId);
  await db.update(users).set({
    ...(input.name ? { name: input.name } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.avatar ? { avatar: input.avatar } : {}),
    ...(input.location ? { location: input.location } : {}),
    ...(input.monthlyBudgetKg ? { monthlyBudgetKg: String(input.monthlyBudgetKg) } : {}),
    updatedAt: new Date(),
  }).where(eq(users.id, user.id));

  return dbSnapshot(sessionId);
}

export async function createChallengeFromInsight(sessionId: string, insight: InsightInput): Promise<AppSnapshot> {
  await ensureDatabase();
  const db = getDb();
  const title = insight.title.trim();

  if (!db) {
    const state = getMemoryState(sessionId);
    if (!state.challenges.some((challenge) => challenge.title === title)) {
      state.challenges = [
        ...state.challenges,
        {
          id: `c_ai_${Date.now()}`,
          title,
          description: insight.description,
          category: insight.category,
          targetReductionKg: insight.potentialSavingKg,
          currentProgressKg: 0,
          duration: 'weekly',
          xpReward: Math.round(insight.potentialSavingKg * 10) + 120,
          participants: 120 + Math.floor(insight.potentialSavingKg * 7),
          status: 'active',
          endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ];
    }
    return snapshotFromState(state);
  }

  const user = await getOrCreateDbUser(sessionId);
  const existing = await db.select().from(challenges).where(and(eq(challenges.userId, user.id), eq(challenges.title, title))).limit(1);
  if (existing.length === 0) {
    await db.insert(challenges).values({
      id: `${user.id}:ai:${randomUUID()}`,
      userId: user.id,
      title,
      description: insight.description,
      category: insight.category,
      targetReductionKg: String(insight.potentialSavingKg),
      currentProgressKg: '0',
      duration: 'weekly',
      xpReward: Math.round(insight.potentialSavingKg * 10) + 120,
      participants: 120 + Math.floor(insight.potentialSavingKg * 7),
      status: 'active',
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  return dbSnapshot(sessionId);
}
