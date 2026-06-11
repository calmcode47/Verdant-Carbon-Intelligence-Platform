/**
 * @file index.ts
 * @description Comprehensive TypeScript type definitions for the Verdant Carbon Intelligence Platform.
 * Defines the core data models including Activities, User Profiles, Carbon Summaries, AI Insights,
 * Challenges, Badges, Leaderboard Entries, and Emission Factors.
 */

export type ActivityCategory = 'transport' | 'food' | 'energy' | 'lifestyle';

export interface Activity {
  id: string;
  userId: string;
  category: ActivityCategory;
  subCategory: string;
  value: number;
  unit: string;
  carbonKg: number;
  timestamp: Date;
  notes?: string;
  aiSuggestion?: string;
}

export interface UserPreferences {
  dailyReminder: boolean;
  weeklyReport: boolean;
  milestoneAlerts: boolean;
  useMetric: boolean;
  defaultCategory: ActivityCategory;
  profileVisibility: 'public' | 'friends' | 'private';
  showOnLeaderboard: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  location: string;
  monthlyBudgetKg: number;
  totalCarbonKg: number;
  streak: number;
  level: number;
  xp: number;
  badges: Badge[];
  joinedAt: Date;
  preferences: UserPreferences;
}

export interface CarbonSummary {
  today: number;
  week: number;
  month: number;
  year: number;
  categoryBreakdown: Record<ActivityCategory, number>;
  trend: 'improving' | 'worsening' | 'stable';
  percentageVsAverage: number;
}

export interface AIInsight {
  id: string;
  type: 'tip' | 'warning' | 'achievement' | 'prediction';
  title: string;
  description: string;
  potentialSavingKg: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: ActivityCategory;
  actionItems: string[];
  generatedAt: Date;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  targetReductionKg: number;
  currentProgressKg: number;
  duration: 'daily' | 'weekly' | 'monthly';
  xpReward: number;
  participants: number;
  status: 'active' | 'completed' | 'failed';
  endsAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  reductionKg: number;
  xp: number;
  level: number;
  streak?: number;
}

export interface EmissionFactor {
  category: ActivityCategory;
  subCategory: string;
  label: string;
  kgCO2PerUnit: number;
  unit: string;
  icon: string;
}
