/**
 * @file page.tsx
 * @description Eco Warrior Arena — full-featured Challenges page for Verdant.
 * Includes: Three.js leaf/firefly particle background, arena hero header with XP/streak,
 * challenge cards grid with countdown timers & progress bars, detail modal with mini chart,
 * global leaderboard with animated entrance, hexagonal achievement badges, and custom challenge creation.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSharedSecondTick } from '@/hooks/useSharedSecondTick';
import { enableRichMotion } from '@/lib/performance';
import { useCarbonStore } from '@/store/carbon-store';
import { buildDisplayBadges } from '@/lib/carbon-history';
import {
  ArenaChallengeView,
  buildLeaderboardDisplay,
  buildWeeklyProgress,
  LeaderboardDisplayEntry,
  mapChallengeToArena,
} from '@/lib/challenge-mappers';
import { ChallengesBackground } from '@/components/backgrounds';
import { LeaderboardSection } from '@/components/challenges/LeaderboardSection';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { X, Plus, Share2, Trash2, Lock } from 'lucide-react';



// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  food:      '#FF6B35',
  transport: '#00C853',
  energy:    '#FFD600',
  lifestyle: '#7C4DFF',
};

const CATEGORY_ICONS: Record<string, string> = {
  food:      '🥗',
  transport: '🚗',
  energy:    '⚡',
  lifestyle: '📱',
};

type ArenaChallenge = ArenaChallengeView;

interface BadgeView {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned: boolean;
}

const RARITY_STYLES: Record<string, { color: string; glow: string; label: string }> = {
  common:    { color: '#9CA3AF', glow: 'rgba(156,163,175,0.3)',  label: 'COMMON'    },
  rare:      { color: '#3B82F6', glow: 'rgba(59,130,246,0.4)',   label: 'RARE'      },
  epic:      { color: '#A855F7', glow: 'rgba(168,85,247,0.5)',   label: 'EPIC'      },
  legendary: { color: '#FFD600', glow: 'rgba(255,214,0,0.6)',    label: 'LEGENDARY' },
};

// ─── HELPER: COUNTDOWN TIMER ────────────────────────────────────────────────
function useCountdown(endsAt: Date) {
  const calc = useCallback(() => {
    const diff = Math.max(0, endsAt.getTime() - Date.now());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  }, [endsAt]);

  const tick = useSharedSecondTick();
  return useMemo(() => calc(), [calc, tick]);
}

// ─── HELPER: TYPEWRITER ─────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 60) {
  const [displayed, setDisplayed] = useState(() => (enableRichMotion() ? '' : text));
  useEffect(() => {
    if (!enableRichMotion()) {
      setDisplayed(text);
      return;
    }
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

// ─── HEXAGON SVG SHAPE ───────────────────────────────────────────────────────
function Hexagon({
  size = 80,
  color,
  glow,
  children,
  className = '',
}: {
  size?: number;
  color: string;
  glow: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const r = size / 2;
  // flat-top hexagon points
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${r + r * Math.cos(a)},${r + r * Math.sin(a)}`;
  }).join(' ');

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
      >
        <polygon
          points={pts}
          fill="rgba(0,0,0,0.5)"
          stroke={color}
          strokeWidth="1.5"
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ─── LEVEL BADGE ─────────────────────────────────────────────────────────────
function LevelBadge({ level }: { level: number }) {
  const r = 44;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${r + r * Math.cos(a)},${r + r * Math.sin(a)}`;
  }).join(' ');

  return (
    <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
      <svg
        width={88}
        height={88}
        viewBox="0 0 88 88"
        style={{ filter: 'drop-shadow(0 0 16px rgba(0,200,83,0.6))' }}
        className="absolute inset-0"
      >
        <polygon points={pts} fill="rgba(0,200,83,0.12)" stroke="#00C853" strokeWidth="2" />
        <polygon
          points={pts}
          fill="none"
          stroke="rgba(255,214,0,0.4)"
          strokeWidth="0.5"
          strokeDasharray="4 2"
        />
      </svg>
      <div className="relative z-10 text-center">
        <div className="font-display text-3xl text-[#00C853] leading-none">{level}</div>
        <div className="font-mono text-[9px] text-[#FFD600] tracking-widest">LEVEL</div>
      </div>
    </div>
  );
}

// ─── XP BAR ───────────────────────────────────────────────────────────────────
function XPBar({ xp }: { xp: number }) {
  const xpInLevel = xp % 1000;
  const pct = Math.min(100, (xpInLevel / 1000) * 100);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setAnimated(pct), 400);
    return () => clearTimeout(id);
  }, [pct]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-[11px] text-white/50">XP TO NEXT LEVEL</span>
        <span className="font-mono text-[11px] text-[#FFD600]">{xpInLevel} / 1000</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${animated}%`,
            background: 'linear-gradient(90deg, #00C853, #FFD600)',
            boxShadow: '0 0 10px rgba(0,200,83,0.5)',
          }}
        />
      </div>
      <div className="mt-1 font-mono text-[10px] text-white/40">Total XP: {xp.toLocaleString()}</div>
    </div>
  );
}

// ─── COUNTDOWN DISPLAY ────────────────────────────────────────────────────────
function CountdownDisplay({ endsAt }: { endsAt: Date }) {
  const { d, h, m, s } = useCountdown(endsAt);
  const parts = d > 0
    ? `${d}d ${h}h left`
    : `${h}h ${m}m ${s}s left`;

  return (
    <span className="font-mono text-[11px] text-[#FFD600]" style={{ fontVariantNumeric: 'tabular-nums' }}>
      ⏰ {parts}
    </span>
  );
}

// ─── CHALLENGE CARD ───────────────────────────────────────────────────────────
function ChallengeCard({
  challenge,
  onClick,
  index,
}: {
  challenge: ArenaChallenge;
  onClick: () => void;
  index: number;
}) {
  const catColor = CATEGORY_COLORS[challenge.category] || '#00C853';
  const pct = Math.min(100, Math.round((challenge.currentKg / challenge.targetKg) * 100));
  const [animPct, setAnimPct] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const delay = index * 80;
    const t1 = setTimeout(() => setVisible(true), delay);
    const t2 = setTimeout(() => setAnimPct(pct), delay + 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [index, pct]);

  const isCompleted = challenge.status === 'completed';
  const isFailed    = challenge.status === 'failed';

  return (
    <div
      onClick={onClick}
      className="arena-card group cursor-pointer relative overflow-hidden rounded-2xl transition-all duration-300"
      style={{
        height: 280,
        background: 'linear-gradient(145deg, #0D2412, #0A1A0D)',
        border: `1px solid rgba(255,255,255,0.06)`,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-40px) scale(0.96)',
        opacity: visible ? 1 : 0,
        transition: `transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${index * 80}ms, opacity 0.4s ease ${index * 80}ms`,
      }}
    >
      {/* Category colour band */}
      <div style={{ height: 4, background: catColor, boxShadow: `0 0 12px ${catColor}80` }} />

      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 40px ${catColor}15` }}
      />

      {/* Status watermarks */}
      {isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'rgba(0,200,83,0.08)' }} />
          <div className="text-center">
            <div className="text-5xl">✅</div>
            <div className="font-display text-2xl text-[#00C853] tracking-widest mt-1">COMPLETED</div>
          </div>
        </div>
      )}
      {isFailed && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'rgba(255,23,68,0.08)' }} />
          <div className="text-center">
            <div className="text-5xl">❌</div>
            <div className="font-display text-2xl text-[#FF1744] tracking-widest mt-1">FAILED</div>
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col h-[calc(100%-4px)]">
        {/* Category + Duration badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: `${catColor}20`, color: catColor, border: `1px solid ${catColor}40` }}>
            {CATEGORY_ICONS[challenge.category]} {challenge.category.toUpperCase()} · {challenge.duration.toUpperCase()}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-[28px] text-white leading-tight tracking-wide mb-1 group-hover:text-opacity-90">
          {challenge.title}
        </h3>

        {/* Description */}
        <p className="font-heading text-[13px] leading-snug flex-1"
          style={{ color: 'rgba(255,255,255,0.65)' }}>
          {challenge.description}
        </p>

        {/* Progress */}
        <div className="mt-2 mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-[11px] text-white/50">
              {challenge.currentKg.toFixed(1)} of {challenge.targetKg.toFixed(1)} kg
            </span>
            <span className="font-mono text-[11px]" style={{ color: catColor }}>
              {pct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out group-hover:shadow-lg"
              style={{
                width: `${animPct}%`,
                background: `linear-gradient(90deg, ${catColor}, ${catColor}cc)`,
                boxShadow: `0 0 8px ${catColor}80`,
              }}
            />
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(255,214,0,0.15)', color: '#FFD600', border: '1px solid rgba(255,214,0,0.3)' }}>
              ⚡ +{challenge.xpReward} XP
            </span>
            <span className="font-mono text-[10px] text-white/40">
              👥 {challenge.participants.toLocaleString()} joined
            </span>
          </div>
          <CountdownDisplay endsAt={challenge.endsAt} />
        </div>
      </div>
    </div>
  );
}

// ─── CHALLENGE DETAIL MODAL ───────────────────────────────────────────────────
function ChallengeModal({
  challenge,
  onClose,
}: {
  challenge: ArenaChallenge | null;
  onClose: () => void;
}) {
  const [joined, setJoined] = useState(challenge?.joined ?? false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const catColor = challenge ? CATEGORY_COLORS[challenge.category] || '#00C853' : '#00C853';

  useEffect(() => {
    if (challenge) setJoined(challenge.joined);
  }, [challenge]);

  if (!challenge) return null;

  const pct = Math.min(100, Math.round((challenge.currentKg / challenge.targetKg) * 100));
  const progressChartData = buildWeeklyProgress(challenge.currentKg, challenge.targetKg);

  const handleShare = () => {
    const text = `🌍 I'm taking on the "${challenge.title}" challenge on Verdant! Join me in fighting climate change. #EcoWarrior #Verdant`;
    if (navigator.share) {
      navigator.share({ title: challenge.title, text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Challenge link copied to clipboard!');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6"
        style={{
          background: 'linear-gradient(145deg, #0D2412, #0A1A0D)',
          border: `1px solid ${catColor}40`,
          boxShadow: `0 0 60px ${catColor}20`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X size={16} className="text-white/60" />
        </button>

        {/* Header */}
        <div className="mb-1">
          <span className="font-mono text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: `${catColor}20`, color: catColor, border: `1px solid ${catColor}40` }}>
            {CATEGORY_ICONS[challenge.category]} {challenge.category.toUpperCase()} · {challenge.duration.toUpperCase()}
          </span>
        </div>
        <h2 className="font-display text-4xl text-white tracking-wide mt-2 mb-1">{challenge.title}</h2>
        <p className="font-heading text-sm text-white/60 mb-5">{challenge.description}</p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'PARTICIPANTS', value: challenge.participants.toLocaleString() },
            { label: 'COMPLETION RATE', value: '68%' },
            { label: 'XP REWARD', value: `⚡ ${challenge.xpReward}` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="font-mono text-[10px] text-white/40 tracking-widest mb-1">{label}</div>
              <div className="font-mono text-lg" style={{ color: catColor }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="font-mono text-[11px] text-white/50">YOUR PROGRESS</span>
            <span className="font-mono text-[11px]" style={{ color: catColor }}>{pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${catColor}, ${catColor}cc)`, boxShadow: `0 0 8px ${catColor}80` }}
            />
          </div>
          <div className="font-mono text-[10px] text-white/40 mt-1">{challenge.currentKg.toFixed(1)} / {challenge.targetKg.toFixed(1)} kg saved</div>
        </div>

        {/* Mini chart */}
        <div className="mb-5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="font-mono text-[10px] text-white/40 tracking-widest mb-2">PROGRESS THIS WEEK</div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={progressChartData}>
              <Line type="monotone" dataKey="kg" stroke={catColor} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Tooltip
                contentStyle={{ background: '#0D2412', border: `1px solid ${catColor}40`, borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                itemStyle={{ color: catColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tips */}
        <div className="mb-5">
          <div className="font-mono text-[10px] text-white/40 tracking-widest mb-3">AI TIPS TO COMPLETE THIS CHALLENGE</div>
          <ul className="space-y-2">
            {challenge.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 font-heading text-[13px] text-white/70">
                <span style={{ color: catColor, flexShrink: 0 }}>▸</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {!joined ? (
            <button
              onClick={() => setJoined(true)}
              className="flex-1 py-3 rounded-xl font-display text-xl tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${catColor}, ${catColor}cc)`, color: '#000', boxShadow: `0 0 20px ${catColor}40` }}
            >
              JOIN CHALLENGE
            </button>
          ) : showAbandonConfirm ? (
            <div className="flex-1 flex gap-2">
              <span className="flex-1 py-3 rounded-xl font-heading text-sm text-center text-white/70 flex items-center justify-center"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Abandon this challenge?
              </span>
              <button
                onClick={() => { setJoined(false); setShowAbandonConfirm(false); }}
                className="px-4 py-3 rounded-xl font-display text-lg tracking-wider"
                style={{ background: 'rgba(255,23,68,0.2)', color: '#FF1744', border: '1px solid rgba(255,23,68,0.4)' }}
              >
                YES
              </button>
              <button
                onClick={() => setShowAbandonConfirm(false)}
                className="px-4 py-3 rounded-xl font-heading text-sm text-white/50"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                NO
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAbandonConfirm(true)}
              className="flex-1 py-3 rounded-xl font-display text-xl tracking-widest transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(255,23,68,0.15)', color: '#FF1744', border: '1px solid rgba(255,23,68,0.3)' }}
            >
              <span className="flex items-center justify-center gap-2"><Trash2 size={16} />ABANDON</span>
            </button>
          )}
          <button
            onClick={handleShare}
            className="px-5 py-3 rounded-xl font-display text-xl tracking-widest transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BADGE MODAL ──────────────────────────────────────────────────────────────
function BadgeModal({
  badge,
  onClose,
}: {
  badge: BadgeView | null;
  onClose: () => void;
}) {
  if (!badge) return null;
  const r = RARITY_STYLES[badge.rarity];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-sm w-full rounded-3xl p-8 text-center"
        style={{ background: 'linear-gradient(145deg, #0D2412, #0A1A0D)', border: `1px solid ${r.color}40`, boxShadow: `0 0 60px ${r.glow}` }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10">
          <X size={16} className="text-white/60" />
        </button>

        <div className="flex justify-center mb-4">
          <Hexagon size={100} color={r.color} glow={r.glow}>
            <span className="text-4xl">{badge.icon}</span>
          </Hexagon>
        </div>

        <div className="font-mono text-[10px] tracking-widest mb-1" style={{ color: r.color }}>{r.label}</div>
        <h3 className="font-display text-3xl text-white tracking-wide mb-2">{badge.name}</h3>
        <p className="font-heading text-sm text-white/60 mb-4">{badge.description}</p>

        {badge.earned ? (
          <div className="font-mono text-xs text-[#00C853]">✅ EARNED — Keep it up, Warrior!</div>
        ) : (
          <div className="p-3 rounded-xl font-heading text-sm text-white/50"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            🔒 Complete the requirement to unlock this badge.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LEADERBOARD ROW ─────────────────────────────────────────────────────────
function LeaderboardRow({
  entry,
  index,
  isUser,
}: {
  entry: LeaderboardDisplayEntry;
  index: number;
  isUser: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 50);
    return () => clearTimeout(t);
  }, [index]);

  const rankStyle =
    entry.rank === 1 ? { color: '#FFD700', bg: 'rgba(255,215,0,0.08)',  border: 'rgba(255,215,0,0.25)' } :
    entry.rank === 2 ? { color: '#C0C0C0', bg: 'rgba(192,192,192,0.06)', border: 'rgba(192,192,192,0.2)' } :
    entry.rank === 3 ? { color: '#CD7F32', bg: 'rgba(205,127,50,0.07)',  border: 'rgba(205,127,50,0.2)' } :
    isUser            ? { color: '#00C853', bg: 'rgba(0,200,83,0.07)',   border: 'rgba(0,200,83,0.35)' } :
                        { color: '#ffffff80', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)' };

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all"
      style={{
        background: rankStyle.bg,
        border: `1px solid ${rankStyle.border}`,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        opacity: visible ? 1 : 0,
        transition: `transform 0.4s ease ${index * 50}ms, opacity 0.4s ease ${index * 50}ms`,
      }}
    >
      {/* Rank */}
      <div className="w-8 text-center font-mono text-sm font-bold shrink-0" style={{ color: rankStyle.color }}>
        {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : `#${entry.rank}`}
      </div>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
        style={{ background: 'rgba(255,255,255,0.08)', border: `2px solid ${rankStyle.border}` }}
      >
        {entry.avatar}
      </div>

      {/* Name + level */}
      <div className="flex-1 min-w-0">
        <div className="font-heading text-sm text-white truncate">{entry.name}</div>
        <div className="font-mono text-[10px] text-white/40">Level {entry.level}</div>
      </div>

      {/* Carbon */}
      <div className="text-right hidden sm:block shrink-0">
        <div className="font-mono text-sm text-[#00C853]">{entry.carbonSaved.toFixed(1)} kg</div>
        <div className="font-mono text-[9px] text-white/30">CO₂ SAVED</div>
      </div>

      {/* XP */}
      <div className="text-right shrink-0">
        <div className="font-mono text-sm text-[#FFD600]">{entry.xp.toLocaleString()}</div>
        <div className="font-mono text-[9px] text-white/30">XP</div>
      </div>

      {/* Streak */}
      <div className="text-right shrink-0 hidden md:block">
        <div className="font-mono text-sm text-white/70">🔥 {entry.streak}d</div>
        <div className="font-mono text-[9px] text-white/30">STREAK</div>
      </div>
    </div>
  );
}

// ─── CUSTOM CHALLENGE FORM ────────────────────────────────────────────────────
function CustomChallengeForm() {
  const createChallengeFromInsight = useCarbonStore((state) => state.createChallengeFromInsight);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', category: 'food', targetKg: '', duration: 'weekly', description: '',
  });
  const inputCls = "w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/90 font-heading placeholder-white/30 focus:outline-none focus:border-[#00C853]/50 transition-colors";

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">🌍</div>
        <div className="font-display text-3xl text-[#00C853] tracking-wide mb-2">CHALLENGE SUBMITTED!</div>
        <p className="font-heading text-sm text-white/50">Your challenge is now active in your arena dashboard.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitError('');
        setIsSubmitting(true);
        try {
          await createChallengeFromInsight({
            id: `custom-${Date.now()}`,
            type: 'tip',
            title: form.title.trim(),
            description: form.description.trim() || `Complete this ${form.duration} ${form.category} challenge.`,
            potentialSavingKg: Number(form.targetKg) || 5,
            difficulty: 'medium',
            category: form.category as 'food' | 'transport' | 'energy' | 'lifestyle',
            actionItems: ['Track progress daily in Verdant'],
            generatedAt: new Date(),
          });
          setSubmitted(true);
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : 'Failed to create challenge.');
        } finally {
          setIsSubmitting(false);
        }
      }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <div className="sm:col-span-2">
        <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">CHALLENGE TITLE</label>
        <input
          className={inputCls}
          placeholder="e.g. No-Plastic Month"
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          required
          id="custom-challenge-title"
        />
      </div>

      <div>
        <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">CATEGORY</label>
        <select
          className={inputCls}
          value={form.category}
          onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
          id="custom-challenge-category"
        >
          <option value="food">🥗 Food</option>
          <option value="transport">🚗 Transport</option>
          <option value="energy">⚡ Energy</option>
          <option value="lifestyle">📱 Lifestyle</option>
        </select>
      </div>

      <div>
        <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">DURATION</label>
        <select
          className={inputCls}
          value={form.duration}
          onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
          id="custom-challenge-duration"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div>
        <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">TARGET REDUCTION (kg CO₂)</label>
        <input
          type="number"
          min="0.1"
          step="0.1"
          className={inputCls}
          placeholder="e.g. 10"
          value={form.targetKg}
          onChange={e => setForm(p => ({ ...p, targetKg: e.target.value }))}
          required
          id="custom-challenge-target"
        />
      </div>

      <div>
        <label className="font-mono text-[10px] text-white/40 tracking-widest block mb-1.5">DESCRIPTION</label>
        <input
          className={inputCls}
          placeholder="What's the challenge about?"
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          id="custom-challenge-description"
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl font-display text-xl tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #00C853, #00E676)', color: '#000', boxShadow: '0 0 20px rgba(0,200,83,0.3)' }}
        >
          <span className="flex items-center justify-center gap-2">
            <Plus size={18} />
            {isSubmitting ? 'CREATING…' : 'SUBMIT CHALLENGE'}
          </span>
        </button>
        {submitError && <p className="sm:col-span-2 text-sm text-red-400" role="alert">{submitError}</p>}
      </div>
    </form>
  );
}

// ─── SECTION TITLE ────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 relative">
      <h2 className="font-display text-4xl text-white tracking-widest">{children}</h2>
      <div className="absolute bottom-0 left-0 w-12 h-0.5 mt-1" style={{ background: '#FFD600', boxShadow: '0 0 8px rgba(255,214,0,0.6)' }} />
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ChallengesPage() {
  const user = useCarbonStore((state) => state.user);
  const challenges = useCarbonStore((state) => state.challenges);
  const leaderboard = useCarbonStore((state) => state.leaderboard);
  const leaderboardTotalWarriors = useCarbonStore((state) => state.leaderboardTotalWarriors);
  const level   = user?.level  ?? 1;
  const xp      = user?.xp     ?? 120;
  const streak  = user?.streak ?? 14;

  const arenaChallenges = useMemo(
    () => challenges.map(mapChallengeToArena),
    [challenges],
  );
  const { top: leaderboardTop, userEntry } = useMemo(
    () => buildLeaderboardDisplay(leaderboard, user?.id ?? '', leaderboardTotalWarriors),
    [leaderboard, user?.id, leaderboardTotalWarriors],
  );
  const badgeList = useMemo(
    () => buildDisplayBadges(user?.badges ?? []).map((badge) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description ?? badge.name,
      icon: badge.icon,
      rarity: badge.rarity,
      earned: badge.earned,
    })),
    [user?.badges],
  );

  const heroText     = useTypewriter('ECO WARRIOR\nARENA', 55);
  const [selectedChallenge, setSelectedChallenge] = useState<ArenaChallenge | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeView | null>(null);

  return (
    <>
      <ChallengesBackground />
      <div
        className="min-h-screen relative overflow-x-hidden"
        style={{ position: 'relative', zIndex: 1 }}
      >
      {/* ── HERO: ARENA HEADER ──────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 pb-12 px-4 sm:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">

          {/* Arena title */}
          <div className="mb-8">
            <div className="inline-block">
              <h1
                className="font-display text-white whitespace-pre-line leading-none"
                style={{ fontSize: 'clamp(4rem, 10vw, 9rem)', letterSpacing: '0.04em' }}
                aria-label="ECO WARRIOR ARENA"
              >
                {heroText}
                <span className="animate-pulse" style={{ color: '#00C853' }}>_</span>
              </h1>
              {/* Gold underline accent */}
              <div
                className="mt-2 rounded-full"
                style={{ height: 3, background: 'linear-gradient(90deg, #FFD600, transparent)', boxShadow: '0 0 12px rgba(255,214,0,0.5)' }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-start gap-8 lg:gap-12">

            {/* Rank */}
            <div>
              <div className="font-mono text-[11px] text-white/40 tracking-widest mb-1">YOUR RANK</div>
              <div className="font-mono text-2xl md:text-3xl" style={{ color: '#FFD600', textShadow: '0 0 20px rgba(255,214,0,0.4)' }}>
                #{userEntry?.rank ?? '—'}
                <span className="font-mono text-sm text-white/40 ml-2">
                  OF {leaderboardTotalWarriors.toLocaleString()} WARRIORS
                </span>
              </div>
            </div>

            {/* Level badge + XP bar */}
            <div className="flex items-center gap-5">
              <LevelBadge level={level} />
              <div className="w-56">
                <XPBar xp={xp} />
              </div>
            </div>

            {/* Streak */}
            <div>
              <div className="font-mono text-[11px] text-white/40 tracking-widest mb-1">CURRENT STREAK</div>
              <div
                className={`font-display text-3xl md:text-4xl${enableRichMotion() ? ' arena-flame-flicker' : ''}`}
                style={enableRichMotion() ? undefined : { color: '#FF6B00', textShadow: '0 0 20px rgba(255,107,0,0.5)' }}
              >
                🔥 {streak} DAY STREAK
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTIVE CHALLENGES ───────────────────────────────────────────── */}
      <section className="relative z-10 px-4 sm:px-8 lg:px-16 pb-16">
        <div className="max-w-7xl mx-auto">
          <SectionTitle>YOUR CHALLENGES</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {arenaChallenges.map((c, i) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                index={i}
                onClick={() => setSelectedChallenge(c)}
              />
            ))}
          </div>
        </div>
      </section>

      <LeaderboardSection
        top={leaderboardTop}
        userEntry={userEntry}
        totalWarriors={leaderboardTotalWarriors}
        renderRow={(entry, index, isUser) => (
          <LeaderboardRow key={isUser ? 'user' : entry.rank} entry={entry} index={index} isUser={isUser} />
        )}
      />

      {/* ── ACHIEVEMENT BADGES ──────────────────────────────────────────── */}
      <section className="relative z-10 px-4 sm:px-8 lg:px-16 pb-16">
        <div className="max-w-7xl mx-auto">
          <SectionTitle>YOUR ACHIEVEMENTS</SectionTitle>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-5">
            {badgeList.map((badge) => {
              const r = RARITY_STYLES[badge.rarity];
              const isLegendary = badge.rarity === 'legendary';

              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className="flex flex-col items-center gap-2 group focus:outline-none"
                  title={badge.name}
                  id={`badge-${badge.id}`}
                >
                  <div
                    className="relative transition-transform duration-300 group-hover:scale-110"
                    style={{
                      filter: badge.earned ? `drop-shadow(0 0 8px ${r.glow})` : 'none',
                    }}
                  >
                    <Hexagon
                      size={72}
                      color={badge.earned ? r.color : '#333'}
                      glow={badge.earned ? r.glow : 'transparent'}
                    >
                      {badge.earned ? (
                        <span
                          className={`text-2xl transition-transform duration-300 group-hover:rotate-12 inline-block ${isLegendary ? 'badge-legendary-sparkle' : ''}`}
                        >
                          {badge.icon}
                        </span>
                      ) : (
                        <Lock size={18} className="text-white/20" />
                      )}
                    </Hexagon>

                    {/* Legendary sparkle ring */}
                    {isLegendary && badge.earned && (
                      <div className="absolute inset-0 pointer-events-none badge-sparkle-ring" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-heading text-[11px] text-white/70 leading-tight">{badge.name}</div>
                    <div className="font-mono text-[9px] tracking-wider mt-0.5" style={{ color: badge.earned ? r.color : '#333' }}>
                      {r.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CREATE CUSTOM CHALLENGE (Level 5+) ─────────────────────────── */}
      {level >= 5 ? (
        <section className="relative z-10 px-4 sm:px-8 lg:px-16 pb-20">
          <div className="max-w-3xl mx-auto">
            <div
              className="rounded-2xl p-6"
              style={{ background: 'rgba(0,200,83,0.04)', border: '1px solid rgba(0,200,83,0.15)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Plus size={18} style={{ color: '#00C853' }} />
                <SectionTitle>CREATE CUSTOM CHALLENGE</SectionTitle>
              </div>
              <CustomChallengeForm />
            </div>
          </div>
        </section>
      ) : (
        <section className="relative z-10 px-4 sm:px-8 lg:px-16 pb-20">
          <div className="max-w-3xl mx-auto">
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Lock size={28} className="mx-auto mb-3 text-white/20" />
              <div className="font-display text-2xl text-white/30 tracking-widest mb-1">CREATE CUSTOM CHALLENGE</div>
              <p className="font-heading text-sm text-white/30">Unlock at <span className="text-[#00C853]">Level 5</span> — keep earning XP to gain this power!</p>
            </div>
          </div>
        </section>
      )}

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      {selectedChallenge && (
        <ChallengeModal challenge={selectedChallenge} onClose={() => setSelectedChallenge(null)} />
      )}
      {selectedBadge && (
        <BadgeModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
      )}

      {/* ── GLOBAL STYLES (badge animations, arena card hover) ──────────── */}
      <style jsx global>{`
        .arena-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,200,83,0.08);
        }

        /* Legendary badge sparkle ring */
        @keyframes sparkle-spin {
          0%   { transform: rotate(0deg); opacity: 0.7; }
          100% { transform: rotate(360deg); opacity: 0.4; }
        }
        .badge-sparkle-ring {
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent, #FFD600, transparent, #FFD60080, transparent);
          animation: sparkle-spin 3s linear infinite;
        }
        /* Legendary badge icon pulse */
        @keyframes legendary-pulse {
          0%, 100% { filter: drop-shadow(0 0 4px #FFD600); }
          50%       { filter: drop-shadow(0 0 12px #FFD600) drop-shadow(0 0 24px #FFD60080); }
        }
        .badge-legendary-sparkle {
          animation: legendary-pulse 2s ease-in-out infinite;
        }

        /* Streak flame flicker */
        @keyframes flame-flicker {
          0%, 100% { opacity: 1; transform: scale(1); }
          33%       { opacity: 0.8; transform: scale(1.05) rotate(-1deg); }
          66%       { opacity: 0.9; transform: scale(0.97) rotate(1deg); }
        }
      `}</style>
      </div>
    </>
  );
}
