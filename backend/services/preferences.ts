import { ActivityCategory, UserPreferences } from '@/types';

export const DEFAULT_PREFERENCES: UserPreferences = {
  dailyReminder: true,
  weeklyReport: false,
  milestoneAlerts: true,
  useMetric: true,
  defaultCategory: 'transport',
  profileVisibility: 'public',
  showOnLeaderboard: true,
};

export function parsePreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PREFERENCES };

  const value = raw as Record<string, unknown>;
  return {
    dailyReminder: typeof value.dailyReminder === 'boolean' ? value.dailyReminder : DEFAULT_PREFERENCES.dailyReminder,
    weeklyReport: typeof value.weeklyReport === 'boolean' ? value.weeklyReport : DEFAULT_PREFERENCES.weeklyReport,
    milestoneAlerts: typeof value.milestoneAlerts === 'boolean' ? value.milestoneAlerts : DEFAULT_PREFERENCES.milestoneAlerts,
    useMetric: typeof value.useMetric === 'boolean' ? value.useMetric : DEFAULT_PREFERENCES.useMetric,
    defaultCategory: isActivityCategory(value.defaultCategory)
      ? value.defaultCategory
      : DEFAULT_PREFERENCES.defaultCategory,
    profileVisibility: isVisibility(value.profileVisibility)
      ? value.profileVisibility
      : DEFAULT_PREFERENCES.profileVisibility,
    showOnLeaderboard: typeof value.showOnLeaderboard === 'boolean'
      ? value.showOnLeaderboard
      : DEFAULT_PREFERENCES.showOnLeaderboard,
  };
}

export function mergePreferences(
  current: UserPreferences,
  patch: Partial<UserPreferences>,
): UserPreferences {
  return parsePreferences({ ...current, ...patch });
}

function isActivityCategory(value: unknown): value is ActivityCategory {
  return value === 'transport' || value === 'food' || value === 'energy' || value === 'lifestyle';
}

function isVisibility(value: unknown): value is UserPreferences['profileVisibility'] {
  return value === 'public' || value === 'friends' || value === 'private';
}
