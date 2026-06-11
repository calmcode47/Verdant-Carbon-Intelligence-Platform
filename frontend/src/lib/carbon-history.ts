import { Activity, Badge, Challenge, UserProfile } from '@/types';

export interface DailyCarbonPoint {
  label: string;
  kg: number;
  date: string;
}

export interface JourneyMilestone {
  date: string;
  icon: string;
  title: string;
  desc: string;
  side: 'left' | 'right';
}

function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function build30DayHistory(activities: Activity[]): DailyCarbonPoint[] {
  const now = new Date();
  const buckets = new Map<string, number>();

  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    buckets.set(dateKey(day), 0);
  }

  for (const activity of activities) {
    const key = dateKey(new Date(activity.timestamp));
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + activity.carbonKg);
    }
  }

  return Array.from(buckets.entries()).map(([isoDate, kg]) => {
    const day = new Date(isoDate);
    return {
      date: isoDate,
      label: day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      kg: Number(kg.toFixed(2)),
    };
  });
}

export function buildJourneyMilestones(
  user: UserProfile | null,
  activities: Activity[],
  challenges: Challenge[],
): JourneyMilestone[] {
  const milestones: JourneyMilestone[] = [];

  if (user?.joinedAt) {
    milestones.push({
      date: new Date(user.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      icon: '🌱',
      title: 'Joined Verdant',
      desc: `Started your carbon intelligence journey as ${user.name}.`,
      side: 'right',
    });
  }

  if (activities.length > 0) {
    const first = [...activities].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )[0];
    milestones.push({
      date: new Date(first.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      icon: '📝',
      title: 'First Log',
      desc: `Logged ${first.value} ${first.unit} of ${first.subCategory.replace(/_/g, ' ')} (${first.carbonKg} kg CO₂e).`,
      side: 'left',
    });
  }

  for (const badge of user?.badges ?? []) {
    if (!badge.earnedAt) continue;
    milestones.push({
      date: new Date(badge.earnedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      icon: badge.icon.length <= 2 ? badge.icon : '🏅',
      title: badge.name,
      desc: badge.description,
      side: milestones.length % 2 === 0 ? 'right' : 'left',
    });
  }

  for (const challenge of challenges.filter((item) => item.status === 'completed')) {
    milestones.push({
      date: new Date(challenge.endsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      icon: '✅',
      title: 'Challenge Complete',
      desc: `Finished "${challenge.title}" and earned ${challenge.xpReward} XP.`,
      side: milestones.length % 2 === 0 ? 'right' : 'left',
    });
  }

  const history = build30DayHistory(activities);
  const bestDay = history.reduce<{ point: DailyCarbonPoint | null; kg: number }>(
    (best, point) => (point.kg > 0 && point.kg < best.kg ? { point, kg: point.kg } : best),
    { point: null, kg: Number.POSITIVE_INFINITY },
  );
  if (bestDay.point) {
    milestones.push({
      date: bestDay.point.label,
      icon: '🌿',
      title: 'Best Day',
      desc: `Your lowest-emission day in the last 30 days: ${bestDay.point.kg} kg CO₂e.`,
      side: 'right',
    });
  }

  if ((user?.streak ?? 0) >= 7) {
    milestones.push({
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      icon: '🔥',
      title: '7-Day Streak',
      desc: `Maintained ${user?.streak} consecutive days of carbon logging.`,
      side: 'left',
    });
  }

  if (milestones.length === 0) {
    milestones.push({
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      icon: '🌍',
      title: 'Ready to Begin',
      desc: 'Log your first activity on the Track page to start building your carbon journey.',
      side: 'right',
    });
  }

  return milestones.slice(0, 8);
}

const BADGE_ICON_MAP: Record<string, string> = {
  Leaf: '🌱',
  Award: '🏅',
  Flame: '🔥',
  Star: '⭐',
};

export function badgeDisplayIcon(icon: string): string {
  return BADGE_ICON_MAP[icon] ?? (icon.length <= 2 ? icon : '🏅');
}

export interface DisplayBadge {
  id: string;
  name: string;
  icon: string;
  rarity: Badge['rarity'];
  earned: boolean;
  description?: string;
}

const BADGE_CATALOG: DisplayBadge[] = [
  { id: 'b_first', name: 'First Step', icon: '🌱', rarity: 'common', earned: false, description: 'Log your first activity' },
  { id: 'b_ten', name: 'Carbon Tracker Pro', icon: '🏅', rarity: 'rare', earned: false, description: 'Log 10 activities' },
  { id: 'b1', name: 'Eco Starter', icon: '🌱', rarity: 'common', earned: false, description: 'Created a Verdant profile' },
  { id: 'week_streak', name: 'Week Warrior', icon: '🔥', rarity: 'common', earned: false, description: '7-day logging streak' },
  { id: 'carbon_saver', name: 'Carbon Saver', icon: '🌿', rarity: 'rare', earned: false, description: 'Stay under your weekly budget' },
  { id: 'energy_wizard', name: 'Energy Wizard', icon: '⚡', rarity: 'epic', earned: false, description: 'Reduce energy emissions' },
];

export function buildDisplayBadges(earnedBadges: Badge[]): DisplayBadge[] {
  const earnedIds = new Set(earnedBadges.map((badge) => badge.id));
  const catalog = BADGE_CATALOG.map((badge) => ({
    ...badge,
    earned: earnedIds.has(badge.id),
  }));

  for (const badge of earnedBadges) {
    if (!catalog.some((item) => item.id === badge.id)) {
      catalog.push({
        id: badge.id,
        name: badge.name,
        icon: badgeDisplayIcon(badge.icon),
        rarity: badge.rarity,
        earned: true,
        description: badge.description,
      });
    }
  }

  return catalog;
}

export function activitiesToCsv(activities: Activity[]): string {
  const header = 'Date,Category,SubCategory,Value,Unit,CarbonKg,Notes';
  const rows = [...activities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map((activity) => {
      const date = new Date(activity.timestamp).toISOString();
      const notes = (activity.notes ?? '').replace(/"/g, '""');
      return `${date},${activity.category},${activity.subCategory},${activity.value},${activity.unit},${activity.carbonKg},"${notes}"`;
    });
  return `${header}\n${rows.join('\n')}`;
}
