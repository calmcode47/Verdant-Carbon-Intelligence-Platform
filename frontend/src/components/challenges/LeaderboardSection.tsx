'use client';

import { LeaderboardDisplayEntry } from '@/lib/challenge-mappers';

interface LeaderboardSectionProps {
  top: LeaderboardDisplayEntry[];
  userEntry: LeaderboardDisplayEntry | null;
  totalWarriors: number;
  renderRow: (entry: LeaderboardDisplayEntry, index: number, isUser: boolean) => React.ReactNode;
}

export function LeaderboardSection({
  top,
  userEntry,
  totalWarriors,
  renderRow,
}: LeaderboardSectionProps) {
  const userInTopTen = Boolean(userEntry && userEntry.rank <= 10);
  const visibleTop = userInTopTen ? top : top.filter((entry) => !entry.isUser);

  return (
    <section className="relative z-10 px-4 sm:px-8 lg:px-16 pb-16" aria-labelledby="leaderboard-heading">
      <div className="max-w-7xl mx-auto">
        <h2 id="leaderboard-heading" className="font-display text-4xl text-white tracking-widest mb-2">
          GLOBAL LEADERBOARD
        </h2>
        <p className="font-heading text-sm text-white/45 mb-6">
          Live rankings from all warriors who opted in. Your position updates as you earn XP.
        </p>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
        >
          <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5">
            <div className="w-8 font-mono text-[9px] text-white/30 tracking-widest">RANK</div>
            <div className="w-9 shrink-0" />
            <div className="flex-1 font-mono text-[9px] text-white/30 tracking-widest">WARRIOR</div>
            <div className="font-mono text-[9px] text-white/30 tracking-widest hidden sm:block shrink-0 w-28 text-right">CO₂ SAVED</div>
            <div className="font-mono text-[9px] text-white/30 tracking-widest shrink-0 w-16 text-right">XP</div>
            <div className="font-mono text-[9px] text-white/30 tracking-widest hidden md:block shrink-0 w-16 text-right">STREAK</div>
          </div>

          <div className="p-3 space-y-2">
            {visibleTop.map((entry, index) => renderRow(entry, index, Boolean(entry.isUser)))}

            {!userInTopTen && userEntry && (
              <>
                <div className="flex items-center gap-2 py-1 px-2">
                  <div className="flex-1 border-t border-dashed border-white/10" />
                  <span className="font-mono text-[9px] text-white/20">
                    YOUR RANK: #{userEntry.rank} OF {totalWarriors.toLocaleString()}
                  </span>
                  <div className="flex-1 border-t border-dashed border-white/10" />
                </div>
                {renderRow(userEntry, visibleTop.length, true)}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
