import { Activity, AIInsight, Challenge, UserProfile } from '@/types';
import type { AppSnapshot } from '@/backend/services/types';

export type CreateActivityPayload = {
  category: Activity['category'];
  subCategory: string;
  value: number;
  notes?: string;
  timestamp?: Date;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const data = await response.json().catch(() => null) as T | { error?: string } | null;
  if (!response.ok) {
    const message =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : 'Request failed.';
    throw new Error(message);
  }

  return data as T;
}

export const verdantApi = {
  getSnapshot: () => requestJson<AppSnapshot>('/api/me'),
  updateUser: (patch: Partial<Pick<UserProfile, 'name' | 'email' | 'avatar' | 'location' | 'monthlyBudgetKg'>>) =>
    requestJson<AppSnapshot>('/api/me', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  createActivity: (payload: CreateActivityPayload) =>
    requestJson<AppSnapshot>('/api/activities', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteActivity: (id: string) =>
    requestJson<AppSnapshot>(`/api/activities/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  createChallengeFromInsight: (insight: AIInsight) =>
    requestJson<AppSnapshot>('/api/challenges/from-insight', {
      method: 'POST',
      body: JSON.stringify(insight),
    }),
};

export function normalizeSnapshot(snapshot: AppSnapshot): AppSnapshot {
  return {
    ...snapshot,
    user: {
      ...snapshot.user,
      joinedAt: new Date(snapshot.user.joinedAt),
      badges: snapshot.user.badges.map((badge) => ({
        ...badge,
        earnedAt: badge.earnedAt ? new Date(badge.earnedAt) : undefined,
      })),
    },
    activities: snapshot.activities.map((activity) => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    })),
    challenges: snapshot.challenges.map((challenge: Challenge) => ({
      ...challenge,
      endsAt: new Date(challenge.endsAt),
    })),
  };
}
