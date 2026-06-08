/**
 * @file carbon-store.ts
 * @description Zustand state management store for the Verdant Carbon Intelligence Platform.
 * Manages user profile information, tracked activities, AI insights, carbon summaries,
 * and current challenges. Persists data inside local storage for hackathon usage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Activity, UserProfile, AIInsight, Challenge, CarbonSummary, LeaderboardEntry } from '@/types';
import { calculateCarbon, getXPForActivity } from '@/lib/carbon-calculator';

interface CarbonStore {
  user: UserProfile | null;
  activities: Activity[];
  insights: AIInsight[];
  challenges: Challenge[];
  summary: CarbonSummary | null;
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  
  // Actions
  setUser: (user: UserProfile) => void;
  addActivity: (activity: Activity) => void;
  removeActivity: (id: string) => void;
  setInsights: (insights: AIInsight[]) => void;
  setChallenges: (challenges: Challenge[]) => void;
  setSummary: (summary: CarbonSummary) => void;
  setLoading: (loading: boolean) => void;
  updateLeaderboard: () => void;
  
  // Computed
  getTodayActivities: () => Activity[];
  getWeekActivities: () => Activity[];
}

const defaultUser: UserProfile = {
  id: 'user',
  name: 'Eco Warrior',
  email: 'eco.warrior@verdant.io',
  avatar: '🌱',
  location: 'San Francisco, USA',
  monthlyBudgetKg: 400.0,
  totalCarbonKg: 0,
  streak: 1,
  level: 1,
  xp: 120,
  badges: [
    { id: 'b1', name: 'Eco Starter', description: 'Created a Verdant profile', icon: 'Leaf', rarity: 'common', earnedAt: new Date() }
  ],
  joinedAt: new Date(),
};

const defaultChallenges: Challenge[] = [
  {
    id: 'c1',
    title: 'Zero Emission Commute',
    description: 'Log 50km on electric transit or train',
    category: 'transport',
    targetReductionKg: 15,
    currentProgressKg: 0,
    duration: 'weekly',
    xpReward: 200,
    participants: 1450,
    status: 'active',
    endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'c2',
    title: 'Green Diet Shift',
    description: 'Save 30kg carbon emissions on plant-based food entries',
    category: 'food',
    targetReductionKg: 30,
    currentProgressKg: 0,
    duration: 'weekly',
    xpReward: 150,
    participants: 920,
    status: 'active',
    endsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'c3',
    title: 'Grid Saver',
    description: 'Keep home electricity footprints under 50kg carbon this week',
    category: 'energy',
    targetReductionKg: 40,
    currentProgressKg: 0,
    duration: 'monthly',
    xpReward: 300,
    participants: 2120,
    status: 'active',
    endsAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },
];

const defaultLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', name: 'Alena Vance', avatar: '👩‍🔬', reductionKg: 125.4, xp: 1450, level: 3 },
  { rank: 2, userId: 'u2', name: 'Julian Drake', avatar: '👨‍💻', reductionKg: 98.2, xp: 1200, level: 2 },
  { rank: 3, userId: 'u3', name: 'Sophia Chen', avatar: '👩‍🎨', reductionKg: 85.0, xp: 950, level: 2 },
  { rank: 4, userId: 'user', name: 'Eco Warrior', avatar: '🌱', reductionKg: 0, xp: 120, level: 1 }
];

export const useCarbonStore = create<CarbonStore>()(
  persist(
    (set, get) => ({
      user: defaultUser,
      activities: [],
      insights: [],
      challenges: defaultChallenges,
      summary: {
        today: 0,
        week: 0,
        month: 0,
        year: 0,
        categoryBreakdown: {
          transport: 0,
          food: 0,
          energy: 0,
          lifestyle: 0,
        },
        trend: 'stable',
        percentageVsAverage: 0,
      },
      leaderboard: defaultLeaderboard,
      isLoading: false,
      
      setUser: (user) => set({ user }),
      
      addActivity: (activity) => {
        const calculatedEmissions = calculateCarbon(activity.subCategory, activity.value);
        const finalActivity: Activity = {
          ...activity,
          carbonKg: calculatedEmissions,
        };

        const updatedActivities = [finalActivity, ...get().activities];
        set({ activities: updatedActivities });

        // Update User Profile metrics
        const currentUser = get().user;
        if (currentUser) {
          const xpGained = getXPForActivity(calculatedEmissions, false);
          const newXp = currentUser.xp + xpGained;
          const newLevel = Math.floor(newXp / 1000) + 1;
          
          // Add new badges if criteria met
          const updatedBadges = [...currentUser.badges];
          if (updatedActivities.length === 1 && !updatedBadges.find(b => b.id === 'b_first')) {
            updatedBadges.push({
              id: 'b_first',
              name: 'First Step',
              description: 'Logged first activity in Verdant',
              icon: 'Leaf',
              rarity: 'common',
              earnedAt: new Date(),
            });
          }
          if (updatedActivities.length >= 10 && !updatedBadges.find(b => b.id === 'b_ten')) {
            updatedBadges.push({
              id: 'b_ten',
              name: 'Carbon Tracker Pro',
              description: 'Logged 10 activities',
              icon: 'Award',
              rarity: 'rare',
              earnedAt: new Date(),
            });
          }

          set({
            user: {
              ...currentUser,
              totalCarbonKg: Number((currentUser.totalCarbonKg + calculatedEmissions).toFixed(2)),
              xp: newXp,
              level: newLevel,
              badges: updatedBadges,
            }
          });
        }

        // Update Challenges
        const currentChallenges = get().challenges;
        const updatedChallenges = currentChallenges.map(challenge => {
          if (challenge.status !== 'active') return challenge;
          if (challenge.category === activity.category) {
            // Suppose logging less carbon updates the progress.
            // For hackathon purposes, let's advance the challenge by 10% of the value logged as an offset
            const progressIncrease = Number((activity.value * 0.1).toFixed(2));
            const newProgress = Math.min(challenge.targetReductionKg, challenge.currentProgressKg + progressIncrease);
            const isCompleted = newProgress >= challenge.targetReductionKg;
            
            if (isCompleted) {
              const u = get().user;
              if (u) {
                setTimeout(() => {
                  set({
                    user: {
                      ...u,
                      xp: u.xp + challenge.xpReward,
                      level: Math.floor((u.xp + challenge.xpReward) / 1000) + 1,
                    }
                  });
                }, 0);
              }
            }

            return {
              ...challenge,
              currentProgressKg: newProgress,
              status: isCompleted ? 'completed' as const : 'active' as const,
            };
          }
          return challenge;
        });
        set({ challenges: updatedChallenges });

        // Update Summary
        get().updateLeaderboard();
        
        // Recalculate summary totals
        const todayLimit = new Date();
        todayLimit.setHours(0, 0, 0, 0);

        const weekLimit = new Date();
        weekLimit.setDate(weekLimit.getDate() - 7);

        const monthLimit = new Date();
        monthLimit.setMonth(monthLimit.getMonth() - 1);

        const yearLimit = new Date();
        yearLimit.setFullYear(yearLimit.getFullYear() - 1);

        let todaySum = 0;
        let weekSum = 0;
        let monthSum = 0;
        let yearSum = 0;
        const categoryBreakdown = {
          transport: 0,
          food: 0,
          energy: 0,
          lifestyle: 0,
        };

        updatedActivities.forEach(act => {
          const actDate = new Date(act.timestamp);
          const cKg = act.carbonKg;
          
          if (actDate >= todayLimit) todaySum += cKg;
          if (actDate >= weekLimit) weekSum += cKg;
          if (actDate >= monthLimit) monthSum += cKg;
          if (actDate >= yearLimit) yearSum += cKg;

          if (act.category in categoryBreakdown) {
            categoryBreakdown[act.category] = Number((categoryBreakdown[act.category] + cKg).toFixed(2));
          }
        });

        // Determine trend relative to world average (13.0 kg/day = 91 kg/week)
        const weeklyAverage = 13.0 * 7;
        const trend = weekSum < weeklyAverage - 10 ? 'improving' : weekSum > weeklyAverage + 10 ? 'worsening' : 'stable';
        const percentageVsAverage = Math.round(((weekSum - weeklyAverage) / weeklyAverage) * 100);

        set({
          summary: {
            today: Number(todaySum.toFixed(2)),
            week: Number(weekSum.toFixed(2)),
            month: Number(monthSum.toFixed(2)),
            year: Number(yearSum.toFixed(2)),
            categoryBreakdown,
            trend,
            percentageVsAverage,
          }
        });
      },
      
      removeActivity: (id) => {
        const activity = get().activities.find(a => a.id === id);
        if (!activity) return;

        const updatedActivities = get().activities.filter(a => a.id !== id);
        set({ activities: updatedActivities });

        // Update User Profile
        const currentUser = get().user;
        if (currentUser) {
          const xpLost = getXPForActivity(activity.carbonKg, false);
          const newXp = Math.max(0, currentUser.xp - xpLost);
          const newLevel = Math.floor(newXp / 1000) + 1;
          
          set({
            user: {
              ...currentUser,
              totalCarbonKg: Math.max(0, Number((currentUser.totalCarbonKg - activity.carbonKg).toFixed(2))),
              xp: newXp,
              level: newLevel,
            }
          });
        }

        // Recalculate summary totals
        const todayLimit = new Date();
        todayLimit.setHours(0, 0, 0, 0);

        const weekLimit = new Date();
        weekLimit.setDate(weekLimit.getDate() - 7);

        const monthLimit = new Date();
        monthLimit.setMonth(monthLimit.getMonth() - 1);

        const yearLimit = new Date();
        yearLimit.setFullYear(yearLimit.getFullYear() - 1);

        let todaySum = 0;
        let weekSum = 0;
        let monthSum = 0;
        let yearSum = 0;
        const categoryBreakdown = {
          transport: 0,
          food: 0,
          energy: 0,
          lifestyle: 0,
        };

        updatedActivities.forEach(act => {
          const actDate = new Date(act.timestamp);
          const cKg = act.carbonKg;
          
          if (actDate >= todayLimit) todaySum += cKg;
          if (actDate >= weekLimit) weekSum += cKg;
          if (actDate >= monthLimit) monthSum += cKg;
          if (actDate >= yearLimit) yearSum += cKg;

          if (act.category in categoryBreakdown) {
            categoryBreakdown[act.category] = Number((categoryBreakdown[act.category] + cKg).toFixed(2));
          }
        });

        const weeklyAverage = 13.0 * 7;
        const trend = weekSum < weeklyAverage - 10 ? 'improving' : weekSum > weeklyAverage + 10 ? 'worsening' : 'stable';
        const percentageVsAverage = Math.round(((weekSum - weeklyAverage) / weeklyAverage) * 100);

        set({
          summary: {
            today: Number(todaySum.toFixed(2)),
            week: Number(weekSum.toFixed(2)),
            month: Number(monthSum.toFixed(2)),
            year: Number(yearSum.toFixed(2)),
            categoryBreakdown,
            trend,
            percentageVsAverage,
          }
        });

        get().updateLeaderboard();
      },

      setInsights: (insights) => set({ insights }),
      setChallenges: (challenges) => set({ challenges }),
      setSummary: (summary) => set({ summary }),
      setLoading: (isLoading) => set({ isLoading }),
      
      updateLeaderboard: () => {
        const u = get().user;
        const currentLeaderboard = get().leaderboard;
        if (u) {
          // reduction is monthly budget minus total carbon
          const userReduction = Math.max(0, Number((u.monthlyBudgetKg - u.totalCarbonKg).toFixed(1)));
          const updated = currentLeaderboard.map(entry => {
            if (entry.userId === 'user') {
              return {
                ...entry,
                name: u.name,
                avatar: u.avatar,
                reductionKg: userReduction,
                xp: u.xp,
                level: u.level,
              };
            }
            return entry;
          }).sort((a, b) => b.xp - a.xp).map((entry, idx) => ({
            ...entry,
            rank: idx + 1,
          }));
          set({ leaderboard: updated });
        }
      },

      getTodayActivities: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return get().activities.filter(a => new Date(a.timestamp) >= today);
      },
      
      getWeekActivities: () => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return get().activities.filter(a => new Date(a.timestamp) >= weekAgo);
      },
    }),
    { name: 'verdant-store' }
  )
);
