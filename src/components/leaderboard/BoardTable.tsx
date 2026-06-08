/**
 * @file BoardTable.tsx
 * @description Community Leaderboard Table component.
 * Displays rank-ordered sustainability metrics comparing user scores, XP,
 * and monthly carbon offsets with other community members.
 */

'use client';

import { useCarbonStore } from '@/store/carbon-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Trophy, Award, Crown, Leaf } from 'lucide-react';

export function BoardTable() {
  const leaderboard = useCarbonStore((state) => state.leaderboard);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400" />;
    if (rank === 2) return <Award className="w-4 h-4 text-slate-300 fill-slate-300" />;
    if (rank === 3) return <Award className="w-4 h-4 text-amber-600 fill-amber-600" />;
    return <span className="text-xs font-mono text-slate-500 w-4 text-center">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/5 border-yellow-500/20';
    if (rank === 2) return 'bg-slate-300/5 border-slate-300/10';
    if (rank === 3) return 'bg-amber-600/5 border-amber-600/10';
    return 'bg-transparent border-transparent';
  };

  return (
    <Card id="leaderboard">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div>
            <CardTitle className="text-sm font-semibold text-white">Community Leaderboard</CardTitle>
            <CardDescription>Compare scores and carbon reduction stats</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header Row */}
          <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800/40">
            <div className="col-span-2">Rank</div>
            <div className="col-span-5">User</div>
            <div className="col-span-2 text-right">XP</div>
            <div className="col-span-3 text-right">Reduction</div>
          </div>

          {/* List of Entries */}
          <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
            {leaderboard.map((entry) => {
              const isCurrentUser = entry.userId === 'user';
              const rank = entry.rank || 1;
              return (
                <div
                  key={entry.userId}
                  className={`grid grid-cols-12 items-center p-3 rounded-xl border text-xs transition-all duration-200 ${
                    isCurrentUser
                      ? 'bg-emerald-500/5 border-emerald-500/30 text-white font-medium shadow-lg shadow-emerald-950/10'
                      : `border-slate-900 bg-slate-950/20 text-slate-300 hover:border-slate-800/80 ${getRankBg(rank)}`
                  }`}
                >
                  {/* Rank Column */}
                  <div className="col-span-2 flex items-center">{getRankBadge(rank)}</div>

                  {/* Name + Avatar */}
                  <div className="col-span-5 flex items-center space-x-2.5">
                    <span className="text-base select-none">{entry.avatar || '👤'}</span>
                    <div>
                      <span className={isCurrentUser ? 'font-bold text-emerald-400' : 'text-slate-200'}>
                        {entry.name}
                      </span>
                      <span className="text-[9px] text-slate-500 ml-1.5">Lvl {entry.level}</span>
                    </div>
                  </div>

                  {/* Eco XP */}
                  <div className="col-span-2 text-right font-mono font-semibold text-emerald-400">
                    {entry.xp}
                  </div>

                  {/* Carbon Total */}
                  <div className="col-span-3 text-right font-mono text-slate-400 flex items-center justify-end space-x-1">
                    <Leaf className="w-2.5 h-2.5 text-slate-650" />
                    <span>{entry.reductionKg} kg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
