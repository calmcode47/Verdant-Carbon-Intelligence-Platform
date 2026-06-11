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

const BENCHMARK_WARRIORS: LeaderboardDisplayEntry[] = [
  { rank: 1, name: 'Aria Nakamura', avatar: '👩‍🔬', level: 12, carbonSaved: 487.2, xp: 14200, streak: 42, isBenchmark: true },
  { rank: 2, name: 'Luca Fernandez', avatar: '🧑‍🌾', level: 11, carbonSaved: 421.8, xp: 12800, streak: 31, isBenchmark: true },
  { rank: 3, name: 'Priya Mehta', avatar: '👩‍💻', level: 10, carbonSaved: 398.5, xp: 11400, streak: 28, isBenchmark: true },
  { rank: 4, name: 'Elias Müller', avatar: '🧑‍🎓', level: 9, carbonSaved: 356.1, xp: 9900, streak: 22, isBenchmark: true },
  { rank: 5, name: 'Zara Osei', avatar: '👩‍🎨', level: 8, carbonSaved: 312.7, xp: 8700, streak: 17, isBenchmark: true },
  { rank: 6, name: 'Kai Larsson', avatar: '🧑‍🚀', level: 8, carbonSaved: 289.4, xp: 7900, streak: 14, isBenchmark: true },
  { rank: 7, name: 'Yuna Park', avatar: '👩‍🏫', level: 7, carbonSaved: 245.9, xp: 6800, streak: 11, isBenchmark: true },
  { rank: 8, name: 'Mateo Silva', avatar: '🧑‍🔧', level: 6, carbonSaved: 198.3, xp: 5400, streak: 9, isBenchmark: true },
  { rank: 9, name: 'Ingrid Johansson', avatar: '👩‍🌾', level: 5, carbonSaved: 167.6, xp: 4200, streak: 7, isBenchmark: true },
  { rank: 10, name: 'Omar Hassan', avatar: '🧑‍🍳', level: 4, carbonSaved: 134.1, xp: 3100, streak: 5, isBenchmark: true },
];

export function buildLeaderboardDisplay(
  entries: LeaderboardEntry[],
  userStreak: number,
): { top: LeaderboardDisplayEntry[]; userEntry: LeaderboardDisplayEntry | null } {
  const benchmarkIds = new Set(['u1', 'u2', 'u3']);
  const liveUser = entries.find((entry) => !benchmarkIds.has(entry.userId)) ?? null;
  const userEntry = liveUser
    ? {
        rank: liveUser.rank,
        name: liveUser.name,
        avatar: liveUser.avatar ?? '🌱',
        level: liveUser.level,
        carbonSaved: liveUser.reductionKg,
        xp: liveUser.xp,
        streak: userStreak,
        isUser: true,
      }
    : null;

  return { top: BENCHMARK_WARRIORS.slice(0, 10), userEntry };
}

export function buildWeeklyProgress(currentKg: number, targetKg: number): { day: string; kg: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const step = targetKg > 0 ? currentKg / Math.max(days.length - 1, 1) : 0;
  return days.map((day, index) => ({
    day,
    kg: Number(Math.min(currentKg, step * index).toFixed(1)),
  }));
}
