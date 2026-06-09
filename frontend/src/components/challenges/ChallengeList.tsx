/**
 * @file ChallengeList.tsx
 * @description Gamification Hub component.
 * Displays a tabbed menu of active carbon challenges (showing progress and XP rewards)
 * and achievement badges (rendering unlocked badges in color and locking incomplete ones).
 */

'use client';

import { useState, memo } from 'react';
import { useCarbonStore } from '@/store/carbon-store';
import { Challenge, Badge } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Target, Award, CheckCircle2, Sparkles, Leaf, Bike, Apple, FlameKindling, Users, Calendar } from 'lucide-react';

const ICON_MAP = {
  Leaf: Leaf,
  Bike: Bike,
  Apple: Apple,
  FlameKindling: FlameKindling,
  Award: Award,
};

// All available badges in the application
const ALL_BADGES = [
  { id: 'b1', name: 'Eco Starter', description: 'Created a Verdant profile', icon: 'Leaf', rarity: 'common' },
  { id: 'b_first', name: 'First Step', description: 'Logged first activity in Verdant', icon: 'Award', rarity: 'common' },
  { id: 'b_ten', name: 'Carbon Tracker Pro', description: 'Logged 10 carbon logs', icon: 'FlameKindling', rarity: 'rare' },
  { id: 'b_champion', name: 'Climate Champion', description: 'Achieve Level 5 and 1000 XP', icon: 'Bike', rarity: 'legendary' },
] as const;

const getBadgeIcon = (iconName: string) => {
  const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP] || Award;
  return <IconComponent className="w-5 h-5" />;
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    case 'rare':
      return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
    case 'epic':
      return 'text-purple-400 border-purple-500/20 bg-purple-500/5';
    case 'legendary':
      return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5';
    default:
      return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
  }
};

const ChallengeCard = memo(function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const isCompleted = challenge.status === 'completed';
  const progressPercentage = Math.min(
    100,
    Math.round((challenge.currentProgressKg / challenge.targetReductionKg) * 100)
  );

  return (
    <div
      className={`p-3 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'border-slate-850 bg-slate-950/10'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5">
            <Target className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-400' : 'text-slate-400'}`} />
            <h4 className={`text-xs font-semibold ${isCompleted ? 'text-emerald-300' : 'text-slate-200'}`}>
              {challenge.title}
            </h4>
          </div>
          <p className="text-[10px] text-slate-400 max-w-[280px] leading-relaxed">
            {challenge.description}
          </p>
        </div>

        <div className="text-right flex flex-col items-end space-y-1">
          <div className="flex items-center space-x-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
            <Sparkles className="w-2.5 h-2.5" />
            <span>+{challenge.xpReward} XP</span>
          </div>
          <span className="text-[8px] text-slate-500 flex items-center">
            <Users className="w-2.5 h-2.5 mr-0.5" />
            {challenge.participants} in
          </span>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-[9px] font-semibold text-slate-500">
          <span>Offset Progress</span>
          <span>
            {challenge.currentProgressKg} / {challenge.targetReductionKg} kg ({progressPercentage}%)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Progress value={progressPercentage} className="flex-1" />
          {isCompleted && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 fill-emerald-950" />
          )}
        </div>
        
        <div className="text-[8px] text-slate-650 flex items-center pt-0.5">
          <Calendar className="w-2.5 h-2.5 mr-0.5" />
          Ends: {new Date(challenge.endsAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
});
ChallengeCard.displayName = 'ChallengeCard';

const BadgeCard = memo(function BadgeCard({
  badgeDef,
  isUnlocked,
  earnedAt,
}: {
  badgeDef: Omit<Badge, 'earnedAt'>;
  isUnlocked: boolean;
  earnedAt?: Date | string;
}) {
  return (
    <div
      className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
        isUnlocked
          ? 'bg-gradient-to-b from-emerald-500/5 to-teal-500/5 border-emerald-500/30 shadow-md shadow-emerald-500/5'
          : 'border-slate-900 bg-slate-950/20 opacity-55'
      }`}
    >
      <div
        className={`p-2 rounded-xl mb-2 border transition-all ${
          isUnlocked
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            : 'bg-slate-900 border-slate-800 text-slate-500'
        }`}
      >
        {getBadgeIcon(badgeDef.icon)}
      </div>
      <h4 className={`text-xs font-semibold ${isUnlocked ? 'text-emerald-300' : 'text-slate-400'}`}>
        {badgeDef.name}
      </h4>
      <p className="text-[9px] text-slate-500 mt-1 max-w-[120px] leading-tight">
        {badgeDef.description}
      </p>
      
      <span className={`text-[8px] font-mono mt-2 px-1.5 py-0.5 rounded-full border ${getRarityColor(badgeDef.rarity)}`}>
        {badgeDef.rarity}
      </span>
      
      {isUnlocked && earnedAt ? (
        <span className="text-[8px] text-slate-400 mt-2 font-mono">
          Unlocked: {new Date(earnedAt).toLocaleDateString()}
        </span>
      ) : (
        <span className="text-[8px] text-slate-650 mt-2 font-mono">
          Locked
        </span>
      )}
    </div>
  );
});
BadgeCard.displayName = 'BadgeCard';

export function ChallengeList() {
  const challenges = useCarbonStore((state) => state.challenges);
  const user = useCarbonStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'challenges' | 'badges'>('challenges');

  const earnedBadges = user?.badges || [];

  return (
    <Card className="h-full" id="challenges">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-white">Gamification Hub</CardTitle>
            <CardDescription>Streaks, challenges, and achievements</CardDescription>
          </div>

          {/* Tab buttons */}
          <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800/80 text-[10px]">
            <button
              onClick={() => setActiveTab('challenges')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === 'challenges'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-950/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Challenges
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === 'badges'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-950/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Badges
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'challenges' ? (
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          /* Badges Tab */
          <div className="grid grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
            {ALL_BADGES.map((badgeDef) => {
              const earnedBadge = earnedBadges.find((b) => b.id === badgeDef.id);
              const isUnlocked = !!earnedBadge;
              const earnedAt = earnedBadge?.earnedAt;

              return (
                <BadgeCard
                  key={badgeDef.id}
                  badgeDef={badgeDef}
                  isUnlocked={isUnlocked}
                  earnedAt={earnedAt}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
