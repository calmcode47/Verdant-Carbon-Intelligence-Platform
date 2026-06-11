import { ActivityCategory, Challenge, LeaderboardEntry } from '@/types';

export interface ArenaChallengeView {
  id: string;
  title: string;
  category: string;
  duration: 'daily' | 'weekly' | 'monthly';
  description: string;
  targetKg: number;
  currentKg: number;
  xpReward: number;
  participants: number;
  endsAt: Date;
  status: 'active' | 'completed' | 'failed';
  joined: boolean;
  tips: string[];
}

export interface LeaderboardDisplayEntry {
  rank: number;
  name: string;
  avatar: string;
  level: number;
  carbonSaved: number;
  xp: number;
  streak: number;
  isUser?: boolean;
  isBenchmark?: boolean;
}

const CATEGORY_TIPS: Record<ActivityCategory, string[]> = {
  food: [
    'Replace beef with lentils or beans for a large carbon reduction.',
    'Meal-prep plant-based dishes to stay consistent all week.',
    'Track each meat-free meal in Verdant to see live savings.',
  ],
  transport: [
    'Plan cycling or transit routes the night before.',
    'Combine cycling with rail on longer commutes.',
    'Log every low-carbon trip to advance challenge progress.',
  ],
  energy: [
    'Unplug idle chargers and appliances on standby.',
    'Switch to LED bulbs and run full loads on appliances.',
    'Lower your thermostat slightly and layer clothing indoors.',
  ],
  lifestyle: [
    'Set daily screen-time limits to cut streaming emissions.',
    'Buy durable goods instead of fast-fashion impulse purchases.',
    'Repair and reuse before replacing electronics.',
  ],
};

export function mapChallengeToArena(challenge: Challenge): ArenaChallengeView {
  return {
    id: challenge.id,
    title: challenge.title,
    category: challenge.category,
    duration: challenge.duration,
    description: challenge.description,
    targetKg: challenge.targetReductionKg,
    currentKg: challenge.currentProgressKg,
    xpReward: challenge.xpReward,
    participants: challenge.participants,
    endsAt: new Date(challenge.endsAt),
    status: challenge.status,
    joined: challenge.status === 'active' || challenge.status === 'completed',
    tips: CATEGORY_TIPS[challenge.category],
  };
}

export function buildLeaderboardDisplay(
  entries: LeaderboardEntry[],
  currentUserId: string,
  totalWarriors: number,
): { top: LeaderboardDisplayEntry[]; userEntry: LeaderboardDisplayEntry | null; totalWarriors: number } {
  const mapped = entries.map((entry) => ({
    rank: entry.rank,
    name: entry.name,
    avatar: entry.avatar ?? '🌱',
    level: entry.level,
    carbonSaved: entry.reductionKg,
    xp: entry.xp,
    streak: entry.streak ?? 0,
    isUser: entry.userId === currentUserId,
  }));

  const userEntry = mapped.find((entry) => entry.isUser) ?? null;
  const top = mapped.filter((entry) => entry.rank <= 10);

  return { top, userEntry, totalWarriors };
}

export function buildWeeklyProgress(currentKg: number, targetKg: number): { day: string; kg: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const step = targetKg > 0 ? currentKg / Math.max(days.length - 1, 1) : 0;
  return days.map((day, index) => ({
    day,
    kg: Number(Math.min(currentKg, step * index).toFixed(1)),
  }));
}
