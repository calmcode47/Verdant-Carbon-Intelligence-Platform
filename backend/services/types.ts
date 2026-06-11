import { Activity, AIInsight, CarbonSummary, Challenge, LeaderboardEntry, UserProfile } from '@/types';

export interface AppSnapshot {
  user: UserProfile;
  activities: Activity[];
  summary: CarbonSummary;
  challenges: Challenge[];
  leaderboard: LeaderboardEntry[];
  leaderboardTotalWarriors: number;
}

export interface InsightsPayload {
  insights: AIInsight[];
  summary: string;
  chatResponse?: string;
  source: 'gemini' | 'fallback';
}
