/**
 * @file page.tsx
 * @description Personal Carbon Sanctuary — the Verdant Profile page.
 * Two-column layout: left panel has avatar card + quick stats + badges;
 * right panel has carbon journey timeline, editable goals, settings sections,
 * and a 30-day history Recharts bar chart.
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { useCarbonStore } from '@/store/carbon-store';
import {
  activitiesToCsv,
  build30DayHistory,
  buildDisplayBadges,
  buildJourneyMilestones,
  type DisplayBadge,
} from '@/lib/carbon-history';
import { ProfileBackground } from '@/components/backgrounds';
import {
  Pencil,
  Check,
  X,
  Download,
  Trash2,
  ExternalLink,
  MapPin,
  Calendar,
  Camera,
  Shield,
  Bell,
  Settings2,
  BarChart2,
  Target,
} from 'lucide-react';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const C = {
  bg:      '#120E08',
  amber:   '#FF8F00',
  amberLt: '#FFB300',
  green:   '#2E7D32',
  greenLt: '#4CAF50',
  cream:   '#FFF8F0',
  panel:   'rgba(255,248,240,0.04)',
  border:  'rgba(255,248,240,0.08)',
  muted:   'rgba(255,248,240,0.40)',
};

const RARITY_COLOR: Record<string, string> = {
  common:    '#9CA3AF',
  rare:      '#3B82F6',
  epic:      '#A855F7',
  legendary: '#FFD600',
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function barColor(kg: number, goal: number) {
  if (kg <= goal * 0.7) return '#2E7D32';   // great (green)
  if (kg <= 13)         return '#FF8F00';   // ok (amber)
  return '#D32F2F';                          // high (red)
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span style={{ color: C.amber }}>{icon}</span>
      <h2 className="font-heading text-xl font-bold" style={{ color: C.cream }}>{children}</h2>
      <div className="flex-1 h-px ml-2" style={{ background: C.border }} />
    </div>
  );
}

// ─── QUICK STAT CARD ─────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, color = C.greenLt,
}: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: C.panel, border: `1px solid ${C.border}` }}
    >
      <div className="font-mono text-[10px] tracking-widest mb-1" style={{ color: C.muted }}>{label}</div>
      <div className="font-mono text-2xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="font-mono text-[10px] mt-0.5" style={{ color: C.muted }}>{sub}</div>}
    </div>
  );
}

// ─── HEXAGON BADGE ────────────────────────────────────────────────────────────
function HexBadge({ badge }: { badge: DisplayBadge }) {
  const color = badge.earned ? RARITY_COLOR[badge.rarity] : '#333';
  const size  = 56;
  const r     = size / 2;
  const pts   = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${r + r * Math.cos(a)},${r + r * Math.sin(a)}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
      <div
        className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
        style={{
          width: size, height: size,
          filter: badge.earned ? `drop-shadow(0 0 6px ${color}60)` : 'none',
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
          <polygon points={pts} fill="rgba(0,0,0,0.4)" stroke={color} strokeWidth="1.5" />
        </svg>
        <span className="relative z-10 text-xl" style={{ opacity: badge.earned ? 1 : 0.25 }}>
          {badge.icon}
        </span>
      </div>
      <span className="font-heading text-[10px] text-center leading-tight" style={{ color: badge.earned ? C.cream : '#444' }}>
        {badge.name}
      </span>
    </div>
  );
}

// ─── INLINE EDITABLE FIELD ────────────────────────────────────────────────────
function EditableNumber({
  label, value, unit, onChange,
}: {
  label: string; value: number; unit: string; onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(value));
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const n = parseFloat(draft);
    if (!isNaN(n) && n > 0) onChange(n);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="font-mono text-[10px] tracking-widest mb-1" style={{ color: C.muted }}>{label}</div>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="number"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
              className="w-32 rounded-lg px-2 py-1 font-mono text-lg outline-none"
              style={{ background: 'rgba(255,248,240,0.08)', border: `1px solid ${C.amber}60`, color: C.cream }}
            />
            <span className="font-mono text-sm" style={{ color: C.muted }}>{unit}</span>
            <button onClick={commit}><Check size={14} style={{ color: C.greenLt }} /></button>
            <button onClick={() => setEditing(false)}><X size={14} style={{ color: '#888' }} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold" style={{ color: C.amberLt }}>{value}</span>
            <span className="font-mono text-sm" style={{ color: C.muted }}>{unit}</span>
          </div>
        )}
      </div>
      {!editing && (
        <button
          onClick={() => { setDraft(String(value)); setEditing(true); }}
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
          title="Edit"
          aria-label={`Edit ${label}`}
        >
          <Pencil size={13} style={{ color: C.amber }} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// ─── TOGGLE ───────────────────────────────────────────────────────────────────
function Toggle({
  value,
  onChange,
  id,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  id: string;
  label: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className="relative w-10 h-5 rounded-full transition-colors duration-200"
      style={{ background: value ? C.greenLt : 'rgba(255,255,255,0.12)' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
        style={{
          background: 'white',
          transform: value ? 'translateX(21px)' : 'translateX(2px)',
        }}
      />
    </button>
  );
}

// ─── SETTINGS ROW ─────────────────────────────────────────────────────────────
function SettingRow({
  label, sub, children,
}: {
  label: string; sub?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div>
        <div className="font-heading text-sm" style={{ color: C.cream }}>{label}</div>
        {sub && <div className="font-body text-[11px] mt-0.5" style={{ color: C.muted }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const user = useCarbonStore((state) => state.user);
  const activities = useCarbonStore((state) => state.activities);
  const challenges = useCarbonStore((state) => state.challenges);
  const updateUserProfile = useCarbonStore((state) => state.updateUserProfile);
  const deleteAllData = useCarbonStore((state) => state.deleteAllData);

  const name          = user?.name          ?? 'Eco Warrior';
  const avatar        = user?.avatar        ?? '🌱';
  const location      = user?.location      ?? 'New Delhi, India';
  const level         = user?.level         ?? 1;
  const xp            = user?.xp            ?? 120;
  const streak        = user?.streak        ?? 14;
  const totalCarbonKg = user?.totalCarbonKg ?? 0;
  const badges = user?.badges ?? [];

  // Level title
  const levelTitles: Record<number, string> = {
    1: 'ECO STARTER', 2: 'GREEN SCOUT', 3: 'CARBON CUTTER',
    4: 'EARTH FRIEND', 5: 'ECO ADVOCATE', 6: 'CLIMATE GUARDIAN',
    7: 'ECO CHAMPION',  8: 'CARBON HERO', 9: 'EARTH PROTECTOR', 10: 'VERDANT MASTER',
  };
  const levelTitle = levelTitles[level] ?? 'ECO ADVOCATE';

  // XP
  const xpInLevel = xp % 1000;
  const xpPct     = Math.min(100, (xpInLevel / 1000) * 100);
  const [animXp, setAnimXp] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimXp(xpPct), 400); return () => clearTimeout(t); }, [xpPct]);

  // Goals state
  const [monthlyGoal, setMonthlyGoal] = useState(user?.monthlyBudgetKg ?? 390);
  const [yearGoalKg,  setYearGoalKg]  = useState(3500);
  const [goalBarAnim, setGoalBarAnim] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGoalBarAnim(true), 600); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (user?.monthlyBudgetKg) setMonthlyGoal(user.monthlyBudgetKg);
  }, [user?.monthlyBudgetKg]);

  const avgMonthly  = 13 * 30;   // ~390 kg
  const goalPct     = Math.min(100, (monthlyGoal / avgMonthly) * 100);
  const savingsPct  = Math.max(0, Math.round(((avgMonthly - monthlyGoal) / avgMonthly) * 100));

  const settings = user?.preferences ?? {
    dailyReminder: true,
    weeklyReport: false,
    milestoneAlerts: true,
    useMetric: true,
    defaultCategory: 'transport' as const,
    profileVisibility: 'public' as const,
    showOnLeaderboard: true,
  };

  const updatePreference = async <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    await updateUserProfile({ preferences: { [key]: value } });
  };

  // Data management
  const [deleteInput,    setDeleteInput]    = useState('');
  const [showDeleteConf, setShowDeleteConf] = useState(false);
  const [exportDone,     setExportDone]     = useState(false);
  const [deleteError,    setDeleteError]    = useState('');
  const [isDeleting,     setIsDeleting]     = useState(false);

  const historyData = useMemo(() => build30DayHistory(activities), [activities]);
  const milestones = useMemo(
    () => buildJourneyMilestones(user, activities, challenges),
    [user, activities, challenges],
  );
  const displayBadges = useMemo(() => buildDisplayBadges(user?.badges ?? []), [user?.badges]);

  const handleExport = () => {
    const csv = activitiesToCsv(activities);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verdant-carbon-activities.csv';
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  };

  const handleDeleteAll = async () => {
    setDeleteError('');
    setIsDeleting(true);
    try {
      await deleteAllData();
      setDeleteInput('');
      setShowDeleteConf(false);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete data.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Avatar upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarEmoji, setAvatarEmoji] = useState(avatar);

  const last30Total = historyData.reduce((sum, day) => sum + day.kg, 0);
  const last30Avg = historyData.length > 0 ? last30Total / historyData.length : 0;
  const globalAvg = 13;
  const savedVsAvg = (globalAvg * 30 - last30Total).toFixed(1);
  const challengesDone = challenges.filter((challenge) => challenge.status === 'completed').length;
  const joinedLabel = user?.joinedAt
    ? `Member since ${new Date(user.joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
    : 'Member since joining Verdant';

  return (
    <>
      <ProfileBackground />
      <div
        className="min-h-screen relative"
        style={{ position: 'relative', zIndex: 1 }}
      >
      {/* Warm ambient gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 90% 10%, rgba(255,143,0,0.05) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />
      {/* CSS noise texture */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`,
          zIndex: 0,
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="font-heading text-4xl font-bold" style={{ color: C.cream }}>
            Your Carbon Sanctuary
          </h1>
          <p className="font-body text-sm mt-1" style={{ color: C.muted }}>
            Reflect on your journey. Set your intentions. Keep growing.
          </p>
        </motion.div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-6 items-start">

          {/* ── LEFT COLUMN ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="space-y-5"
          >
            {/* PROFILE CARD */}
            <div
              className="rounded-3xl p-6 flex flex-col items-center text-center"
              style={{ background: C.panel, border: `1px solid ${C.border}` }}
            >
              {/* Avatar */}
              <div className="relative mb-4">
                <button
                  type="button"
                  className="w-[120px] h-[120px] rounded-full flex items-center justify-center text-6xl select-none cursor-pointer group"
                  style={{
                    background: 'rgba(46,125,50,0.12)',
                    border: `3px solid ${C.greenLt}`,
                    boxShadow: `0 0 0 6px rgba(76,175,80,0.12), 0 0 30px rgba(76,175,80,0.25)`,
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change profile avatar"
                >
                  <span className="transition-transform group-hover:scale-110">{avatarEmoji}</span>
                  <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.45)' }}>
                    <Camera size={24} style={{ color: C.cream }} aria-hidden="true" />
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="avatar-upload"
                  onChange={() => setAvatarEmoji('🧑‍🌿')}
                />
              </div>

              {/* Name */}
              <h2 className="font-heading text-[28px] font-bold leading-tight" style={{ color: C.cream }}>{name}</h2>

              {/* Level */}
              <div className="mt-1 font-mono text-[11px] tracking-widest px-3 py-1 rounded-full"
                style={{ background: `${C.amber}15`, color: C.amber, border: `1px solid ${C.amber}40` }}>
                LEVEL {level} — {levelTitle}
              </div>

              {/* XP Bar */}
              <div className="w-full mt-4">
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-[10px]" style={{ color: C.muted }}>XP PROGRESS</span>
                  <span className="font-mono text-[10px]" style={{ color: C.amberLt }}>{xpInLevel}/1000</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${animXp}%`,
                      background: `linear-gradient(90deg, ${C.green}, ${C.amber})`,
                      boxShadow: `0 0 8px ${C.amber}60`,
                    }}
                  />
                </div>
              </div>

              {/* Meta */}
              <div className="w-full mt-5 space-y-2 text-left">
                <div className="flex items-center gap-2 font-body text-sm" style={{ color: C.muted }}>
                  <MapPin size={13} style={{ color: C.amber }} />
                  📍 {location}
                </div>
                <div className="flex items-center gap-2 font-body text-sm" style={{ color: C.muted }}>
                  <Calendar size={13} style={{ color: C.amber }} />
                  {joinedLabel}
                </div>
              </div>

              {/* Edit Profile button */}
              <button
                className="mt-5 w-full py-2 rounded-xl font-heading text-sm transition-all hover:bg-white/5"
                style={{ border: `1px solid ${C.border}`, color: C.muted }}
                id="edit-profile-btn"
              >
                <Pencil size={13} className="inline mr-1.5" />
                Edit Profile
              </button>
            </div>

            {/* QUICK STATS */}
            <div className="space-y-3">
              <SectionLabel icon={<BarChart2 size={16} />}>Quick Stats</SectionLabel>
              <StatCard
                label="TOTAL CO₂ TRACKED"
                value={totalCarbonKg >= 1000 ? `${(totalCarbonKg / 1000).toFixed(2)}t` : `${last30Total.toFixed(0)} kg`}
                sub="last 30 days"
                color={C.greenLt}
              />
              <StatCard
                label="SAVED VS GLOBAL AVERAGE"
                value={`${parseFloat(savedVsAvg) >= 0 ? '+' : ''}${savedVsAvg} kg`}
                sub={`vs ${(globalAvg * 30).toFixed(0)} kg global avg`}
                color={parseFloat(savedVsAvg) >= 0 ? C.greenLt : '#F44336'}
              />
              <StatCard
                label="CHALLENGES COMPLETED"
                value={`${challengesDone} / ${challenges.length}`}
                sub="challenges completed"
                color={C.amberLt}
              />
              <StatCard
                label="LONGEST STREAK"
                value={`🔥 ${streak} days`}
                sub="current streak"
                color={C.amber}
              />
            </div>

            {/* EARNED BADGES (horizontal scroll) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <SectionLabel icon={<span>🏅</span>}>Your Badges</SectionLabel>
                <Link
                  href="/challenges"
                  className="font-mono text-[10px] tracking-widest flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ color: C.amber }}
                >
                  VIEW ALL <ExternalLink size={10} />
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                {displayBadges.map((badge) => <HexBadge key={badge.id} badge={badge} />)}
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="space-y-8"
          >

            {/* CARBON JOURNEY TIMELINE */}
            <div>
              <SectionLabel icon={<span>🗺</span>}>Carbon Journey</SectionLabel>
              <div className="relative pl-8">
                {/* Vertical line */}
                <div
                  className="absolute left-3 top-0 bottom-0 w-0.5 rounded-full"
                  style={{ background: `linear-gradient(180deg, ${C.greenLt}, ${C.amber}30)` }}
                />
                {/* Travelling dot */}
                <div
                  className="absolute left-[10px] w-2 h-2 rounded-full"
                  style={{
                    background: C.greenLt,
                    boxShadow: `0 0 8px ${C.greenLt}`,
                    animation: 'travel-dot 4s ease-in-out infinite',
                  }}
                />

                <div className="space-y-5">
                  {milestones.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: m.side === 'left' ? -30 : 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.45, delay: 0.2 + i * 0.07 }}
                      className="relative"
                    >
                      {/* Dot on line */}
                      <div
                        className="absolute -left-[22px] top-3 w-3 h-3 rounded-full"
                        style={{
                          background: C.bg,
                          border: `2px solid ${C.greenLt}`,
                          boxShadow: `0 0 6px ${C.greenLt}60`,
                        }}
                      />
                      <div
                        className="rounded-2xl p-4"
                        style={{ background: C.panel, border: `1px solid ${C.border}` }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-0.5">{m.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-heading text-sm font-bold" style={{ color: C.cream }}>{m.title}</h4>
                              <span className="font-mono text-[10px]" style={{ color: C.muted }}>{m.date}</span>
                            </div>
                            <p className="font-body text-[12px] mt-1" style={{ color: C.muted }}>{m.desc}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* GOALS */}
            <div>
              <SectionLabel icon={<Target size={16} />}>Your Carbon Goals</SectionLabel>
              <div
                className="rounded-2xl p-5 space-y-5"
                style={{ background: C.panel, border: `1px solid ${C.border}` }}
              >
                <EditableNumber
                  label="MONTHLY CARBON BUDGET"
                  value={monthlyGoal}
                  unit="kg CO₂e / month"
                  onChange={v => {
                    setMonthlyGoal(v);
                    updateUserProfile({ monthlyBudgetKg: v }).catch((error) => {
                      console.error('Profile update failed:', error instanceof Error ? error.message : error);
                    });
                    setGoalBarAnim(false);
                    setTimeout(() => setGoalBarAnim(true), 50);
                  }}
                />

                {/* Goal bar */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[10px]" style={{ color: C.muted }}>VS GLOBAL AVERAGE (390 kg)</span>
                    <span className="font-mono text-[10px]" style={{ color: monthlyGoal < avgMonthly ? C.greenLt : C.amber }}>
                      {savingsPct > 0 ? `${savingsPct}% below avg` : `${Math.abs(savingsPct)}% above avg`}
                    </span>
                  </div>
                  <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div
                      className="absolute h-full rounded-full transition-all duration-700"
                      style={{
                        width: goalBarAnim ? `${Math.min(100, goalPct)}%` : '0%',
                        background: monthlyGoal < avgMonthly
                          ? `linear-gradient(90deg, ${C.green}, ${C.greenLt})`
                          : `linear-gradient(90deg, ${C.amber}, ${C.amberLt})`,
                      }}
                    />
                    {/* Global avg marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5"
                      style={{ left: '100%', background: 'rgba(255,255,255,0.3)' }}
                    />
                  </div>
                  <p className="font-body text-[12px] mt-2" style={{ color: C.greenLt }}>
                    🌍 Your goal puts you in the{' '}
                    <strong style={{ color: C.greenLt }}>
                      top {monthlyGoal < 300 ? '10%' : monthlyGoal < 350 ? '20%' : '25%'}
                    </strong>{' '}
                    globally — great work!
                  </p>
                </div>

                <div className="pt-1">
                  <EditableNumber
                    label="YEAR-END TARGET"
                    value={yearGoalKg}
                    unit="kg CO₂e for 2025"
                    onChange={setYearGoalKg}
                  />
                  <p className="font-body text-[11px] mt-2" style={{ color: C.muted }}>
                    That&apos;s ~{(yearGoalKg / 365).toFixed(1)} kg/day — equivalent to {yearGoalKg < 3000 ? 'well below' : 'slightly above'} the global average.
                  </p>
                </div>
              </div>
            </div>

            {/* SETTINGS */}
            <div>
              <SectionLabel icon={<Settings2 size={16} />}>Settings</SectionLabel>
              <div className="space-y-4">

                {/* Notifications */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: C.panel, border: `1px solid ${C.border}` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Bell size={13} style={{ color: C.amber }} />
                    <span className="font-heading text-sm font-bold" style={{ color: C.cream }}>Notifications</span>
                  </div>
                  <SettingRow label="Daily activity reminder" sub="Nudge to log today's activities">
                    <Toggle id="toggle-daily" label="Daily reminder notifications" value={settings.dailyReminder} onChange={(v) => { void updatePreference('dailyReminder', v); }} />
                  </SettingRow>
                  <SettingRow label="Weekly carbon report" sub="Email digest every Monday">
                    <Toggle id="toggle-weekly" label="Weekly carbon report emails" value={settings.weeklyReport} onChange={(v) => { void updatePreference('weeklyReport', v); }} />
                  </SettingRow>
                  <SettingRow label="Challenge milestone alerts" sub="Get notified on challenge progress">
                    <Toggle id="toggle-milestone" label="Milestone alert notifications" value={settings.milestoneAlerts} onChange={(v) => { void updatePreference('milestoneAlerts', v); }} />
                  </SettingRow>
                </div>

                {/* Preferences */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: C.panel, border: `1px solid ${C.border}` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Settings2 size={13} style={{ color: C.amber }} />
                    <span className="font-heading text-sm font-bold" style={{ color: C.cream }}>Preferences</span>
                  </div>
                  <SettingRow label="Units" sub="Switch between metric and imperial">
                    <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                      {['kg', 'lbs'].map(u => (
                        <button
                          key={u}
                          id={`unit-${u}`}
                          onClick={() => { void updatePreference('useMetric', u === 'kg'); }}
                          className="px-3 py-1 font-mono text-xs transition-colors"
                          style={{
                            background: (u === 'kg') === settings.useMetric ? C.greenLt : 'transparent',
                            color:      (u === 'kg') === settings.useMetric ? '#000' : C.muted,
                          }}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </SettingRow>
                  <SettingRow label="Default tracking category">
                    <select
                      id="default-category"
                      aria-label="Default tracking category"
                      value={settings.defaultCategory}
                      onChange={(e) => { void updatePreference('defaultCategory', e.target.value as typeof settings.defaultCategory); }}
                      className="rounded-lg px-2 py-1 font-mono text-xs outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.cream }}
                    >
                      <option value="transport">🚗 Transport</option>
                      <option value="food">🥗 Food</option>
                      <option value="energy">⚡ Energy</option>
                      <option value="lifestyle">📱 Lifestyle</option>
                    </select>
                  </SettingRow>
                  <SettingRow label="Location" sub="Affects electricity emission factor">
                    <div className="font-mono text-xs" style={{ color: C.amberLt }}>📍 {location}</div>
                  </SettingRow>
                </div>

                {/* Privacy */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: C.panel, border: `1px solid ${C.border}` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={13} style={{ color: C.amber }} />
                    <span className="font-heading text-sm font-bold" style={{ color: C.cream }}>Privacy</span>
                  </div>
                  <SettingRow label="Profile visibility">
                    <select
                      id="profile-visibility"
                      aria-label="Profile visibility"
                      value={settings.profileVisibility}
                      onChange={(e) => { void updatePreference('profileVisibility', e.target.value as typeof settings.profileVisibility); }}
                      className="rounded-lg px-2 py-1 font-mono text-xs outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.cream }}
                    >
                      <option value="public">🌍 Public</option>
                      <option value="friends">👥 Friends</option>
                      <option value="private">🔒 Private</option>
                    </select>
                  </SettingRow>
                  <SettingRow label="Appear on leaderboard" sub="Show your rank to others">
                    <Toggle id="toggle-leaderboard" label="Appear on global leaderboard" value={settings.showOnLeaderboard} onChange={(v) => { void updatePreference('showOnLeaderboard', v); }} />
                  </SettingRow>
                </div>

                {/* Data management */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'rgba(211,47,47,0.04)', border: '1px solid rgba(211,47,47,0.15)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Trash2 size={13} style={{ color: '#F44336' }} />
                    <span className="font-heading text-sm font-bold" style={{ color: '#F44336' }}>Data Management</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Export CSV */}
                    <button
                      id="export-csv-btn"
                      onClick={handleExport}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-heading text-sm transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.muted }}
                    >
                      <Download size={14} />
                      {exportDone ? '✅ Exported!' : 'Export as CSV'}
                    </button>

                    {/* Delete all */}
                    {!showDeleteConf ? (
                      <button
                        id="delete-data-btn"
                        onClick={() => setShowDeleteConf(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-heading text-sm transition-all hover:scale-[1.02]"
                        style={{ background: 'rgba(211,47,47,0.1)', border: '1px solid rgba(211,47,47,0.3)', color: '#F44336' }}
                      >
                        <Trash2 size={14} />
                        Delete All Data
                      </button>
                    ) : (
                      <div className="flex-1 space-y-2">
                        <p className="font-body text-xs" style={{ color: '#F44336' }}>
                          Type <strong>DELETE</strong> to confirm. This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <input
                            id="delete-confirm-input"
                            value={deleteInput}
                            onChange={e => setDeleteInput(e.target.value)}
                            placeholder="Type DELETE"
                            className="flex-1 rounded-lg px-3 py-1.5 font-mono text-sm outline-none"
                            style={{ background: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.4)', color: '#F44336' }}
                          />
                          <button
                            disabled={deleteInput !== 'DELETE' || isDeleting}
                            onClick={handleDeleteAll}
                            aria-busy={isDeleting}
                            className="px-3 py-1.5 rounded-lg font-heading text-sm disabled:opacity-30"
                            style={{ background: '#D32F2F', color: 'white' }}
                          >
                            {isDeleting ? 'Deleting…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => { setShowDeleteConf(false); setDeleteInput(''); }}
                            className="px-3 py-1.5 rounded-lg font-heading text-sm"
                            style={{ background: 'rgba(255,255,255,0.06)', color: C.muted }}
                          >
                            Cancel
                          </button>
                        </div>
                        {deleteError && (
                          <p className="font-body text-xs" role="alert" style={{ color: '#F44336' }}>{deleteError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 30-DAY CARBON HISTORY CHART */}
            <div>
              <SectionLabel icon={<BarChart2 size={16} />}>30-Day Carbon History</SectionLabel>
              <div
                className="rounded-2xl p-5"
                style={{ background: C.panel, border: `1px solid ${C.border}` }}
              >
                <div className="flex flex-wrap gap-6 mb-4">
                  <div>
                    <div className="font-mono text-[10px] tracking-widest" style={{ color: C.muted }}>30-DAY AVERAGE</div>
                    <div className="font-mono text-xl font-bold" style={{ color: last30Avg < globalAvg ? C.greenLt : C.amber }}>
                      {last30Avg.toFixed(1)} kg/day
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] tracking-widest" style={{ color: C.muted }}>GLOBAL AVERAGE</div>
                    <div className="font-mono text-xl font-bold" style={{ color: '#888' }}>13.0 kg/day</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] tracking-widest" style={{ color: C.muted }}>YOUR MONTHLY GOAL</div>
                    <div className="font-mono text-xl font-bold" style={{ color: C.amberLt }}>
                      {(monthlyGoal / 30).toFixed(1)} kg/day
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-3">
                  {[
                    { color: '#2E7D32', label: 'Below goal (great)' },
                    { color: '#FF8F00', label: 'Above goal (ok)' },
                    { color: '#D32F2F', label: 'Above avg (high)' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
                      <span className="font-mono text-[10px]" style={{ color: C.muted }}>{label}</span>
                    </div>
                  ))}
                </div>

                <div
                  role="img"
                  aria-label={`30-day carbon history chart. Daily average ${last30Avg.toFixed(1)} kg CO₂e versus global average ${globalAvg} kg per day.`}
                >
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={historyData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }} barCategoryGap="20%">
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fill: 'rgba(255,248,240,0.3)', fontFamily: 'DM Mono' }}
                      tickLine={false}
                      axisLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: 'rgba(255,248,240,0.3)', fontFamily: 'DM Mono' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1A120A',
                        border: `1px solid ${C.border}`,
                        borderRadius: 10,
                        fontSize: 11,
                        fontFamily: 'DM Mono',
                        color: C.cream,
                      }}
                      labelStyle={{ color: C.muted, marginBottom: 2 }}
                      formatter={(val: unknown) => [`${val} kg CO₂e`, 'Carbon']}
                    />
                    {/* Global avg reference */}
                    <ReferenceLine
                      y={globalAvg}
                      stroke="rgba(255,255,255,0.3)"
                      strokeDasharray="4 3"
                      label={{
                        value: 'Global avg',
                        position: 'insideTopRight',
                        fill: 'rgba(255,255,255,0.35)',
                        fontSize: 9,
                        fontFamily: 'DM Mono',
                      }}
                    />
                    {/* Monthly goal reference */}
                    <ReferenceLine
                      y={monthlyGoal / 30}
                      stroke={`${C.amberLt}80`}
                      strokeDasharray="4 3"
                      label={{
                        value: 'Your goal',
                        position: 'insideTopRight',
                        fill: `${C.amberLt}90`,
                        fontSize: 9,
                        fontFamily: 'DM Mono',
                      }}
                    />
                    <Bar dataKey="kg" radius={[3, 3, 0, 0]}>
                      {historyData.map((d, i) => (
                        <Cell key={i} fill={barColor(d.kg, monthlyGoal / 30)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>
                <p className="sr-only">
                  {historyData.map((day) => `${day.label}: ${day.kg} kg`).join('. ')}
                </p>
              </div>
            </div>

          </motion.div>
        </div>
      </div>

      {/* Travelling dot keyframe */}
      <style jsx global>{`
        @keyframes travel-dot {
          0%   { top: 0%;   opacity: 1; }
          90%  { top: 95%;  opacity: 0.8; }
          100% { top: 0%;   opacity: 0; }
        }
      `}</style>
      </div>
    </>
  );
}
