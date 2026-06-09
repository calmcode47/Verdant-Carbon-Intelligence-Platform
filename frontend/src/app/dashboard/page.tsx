/**
 * @file page.tsx
 * @description Main dashboard page route for the Verdant Carbon Intelligence Platform.
 * Theme: NASA Mission Control meets Environmental Observatory.
 * Palette: Near-black, terminal green, data amber, alert red, grid-line gray.
 * Layout: Desktop Left Sidebar + Content Area; Mobile Top Tabs.
 */

'use client';

import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCarbonStore } from '@/store/carbon-store';

import { useIsInView } from '@/hooks/useIsInView';
import { safeAsync } from '@/lib/errors';
import { PageTransition } from '@/components/layout/PageTransition';
import { DashboardBackground } from '@/components/backgrounds';
import { Button } from '@/components/ui/Button';
import {
  Home,
  LayoutDashboard,
  PlusCircle,
  Lightbulb,
  Trophy,
  User,
  Leaf,
  Calendar,
  Target,
  TrendingDown,
  Trash2,
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { WebGLErrorBoundary } from '@/components/three/WebGLErrorBoundary';
const DataOrbs = dynamic(
  () => import('@/components/three/DataOrbs'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{ width: '100%', height: '100%' }}
        aria-hidden="true"
      />
    ),
  }
);

// Recharts components loaded dynamically to avoid hydration mismatches
const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
const PieChart = dynamic(() => import('recharts').then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then((mod) => mod.Cell), { ssr: false });
const Sector = dynamic(() => import('recharts').then((mod) => mod.Sector), { ssr: false });

import { motion, AnimatePresence } from 'framer-motion';

// --- INLINE SPARKLINE UTILITY ---
function Sparkline({ data, color = '#00E676' }: { data: number[]; color?: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  
  const width = 60;
  const height = 24;
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="select-none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// --- MAIN PAGE COMPONENT ---
export default function DashboardPage() {
  const pathname = usePathname();
  const { ref: trendChartRef, inView: trendChartInView } = useIsInView();
  const { ref: shareChartRef, inView: shareChartInView } = useIsInView();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'scorecard'>('metrics');
  const [chartRange, setChartRange] = useState<'this_week' | 'last_week' | 'last_month'>('this_week');
  const [pieActiveIndex, setPieActiveIndex] = useState<number | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Zustand Store hooks
  const user = useCarbonStore((state) => state.user);
  const activities = useCarbonStore((state) => state.activities);
  const insights = useCarbonStore((state) => state.insights);
  const summary = useCarbonStore((state) => state.summary);
  const createActivity = useCarbonStore((state) => state.createActivity);
  const deleteActivity = useCarbonStore((state) => state.deleteActivity);
  const setInsights = useCarbonStore((state) => state.setInsights);

  useEffect(() => {
    setMounted(true);
    // Fetch insights once on mount if empty
    if (insights.length === 0) {
      fetchAIInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // API Call for insights
  const fetchAIInsights = async () => {
    setInsightsLoading(true);
    const [data, error] = await safeAsync(
      fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities, user }),
      }).then(async (res) => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
    );

    if (error) {
      console.error('Error fetching AI Insights:', error.message);
      setInsightsLoading(false);
      return;
    }

    if (data && data.insights) {
      setInsights(data.insights);
    }
    setInsightsLoading(false);
  };

  // Seeding realistic mock data
  const seedMockData = async () => {
    const now = new Date();
    // We add activities across the last 7 days
    const mockActs = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      // Transport
      mockActs.push({
        id: `seed-trans-${i}`,
        userId: 'user',
        category: 'transport' as const,
        subCategory: i % 2 === 0 ? 'car_electric' : 'car_petrol',
        value: 12 + (i * 4) % 18,
        unit: 'km',
        carbonKg: 0,
        timestamp: new Date(date.setHours(9, 0, 0, 0)),
        notes: 'Daily travel commute',
      });
      
      // Food
      mockActs.push({
        id: `seed-food-${i}`,
        userId: 'user',
        category: 'food' as const,
        subCategory: i % 3 === 0 ? 'beef' : i % 3 === 1 ? 'chicken' : 'vegetables',
        value: i % 3 === 0 ? 0.3 : i % 3 === 1 ? 0.4 : 0.8,
        unit: 'kg',
        carbonKg: 0,
        timestamp: new Date(date.setHours(13, 0, 0, 0)),
        notes: 'Lunch',
      });

      // Energy
      mockActs.push({
        id: `seed-energy-${i}`,
        userId: 'user',
        category: 'energy' as const,
        subCategory: 'electricity',
        value: 10 + (i * 2) % 8,
        unit: 'kWh',
        carbonKg: 0,
        timestamp: new Date(date.setHours(19, 30, 0, 0)),
        notes: 'Grid electricity usage',
      });

      // Lifestyle
      mockActs.push({
        id: `seed-life-${i}`,
        userId: 'user',
        category: 'lifestyle' as const,
        subCategory: 'streaming',
        value: 1.5 + (i * 0.5) % 3.5,
        unit: 'hour',
        carbonKg: 0,
        timestamp: new Date(date.setHours(21, 0, 0, 0)),
        notes: 'Smart TV streaming',
      });
    }

    for (const act of mockActs) {
      await createActivity({
        category: act.category,
        subCategory: act.subCategory,
        value: act.value,
        notes: act.notes,
        timestamp: act.timestamp,
      });
    }
    // Re-fetch insights based on seeded data
    setTimeout(() => {
      fetchAIInsights();
    }, 500);
  };

  // --- STATS & COMPUTATIONS ---
  const todayTotal = summary?.today || 0;
  const budgetLimit = 13.0; // daily budget limit
  const usedPercentage = Math.min(100, Math.round((todayTotal / budgetLimit) * 100));

  // 1. Daily Emissions computation (Helper)
  const getEmissionsForDay = useCallback((offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() - offsetDays);
    target.setHours(0, 0, 0, 0);
    const next = new Date(target);
    next.setDate(next.getDate() + 1);
    
    return activities
      .filter((act) => {
        const d = new Date(act.timestamp);
        return d >= target && d < next;
      })
      .reduce((sum, act) => sum + act.carbonKg, 0);
  }, [activities]);

  const getBreakdownForDay = useCallback((offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() - offsetDays);
    target.setHours(0, 0, 0, 0);
    const next = new Date(target);
    next.setDate(next.getDate() + 1);

    const dayActs = activities.filter((act) => {
      const d = new Date(act.timestamp);
      return d >= target && d < next;
    });

    return {
      transport: dayActs.filter(a => a.category === 'transport').reduce((sum, a) => sum + a.carbonKg, 0),
      food: dayActs.filter(a => a.category === 'food').reduce((sum, a) => sum + a.carbonKg, 0),
      energy: dayActs.filter(a => a.category === 'energy').reduce((sum, a) => sum + a.carbonKg, 0),
      lifestyle: dayActs.filter(a => a.category === 'lifestyle').reduce((sum, a) => sum + a.carbonKg, 0),
    };
  }, [activities]);

  // Deltas & Sparklines
  const yesterdayTotal = getEmissionsForDay(1);
  const todayDelta = todayTotal - yesterdayTotal;
  const todaySparkline = [
    getEmissionsForDay(4),
    getEmissionsForDay(3),
    getEmissionsForDay(2),
    yesterdayTotal,
    todayTotal,
  ];

  const weekTotal = summary?.week || 0;
  const weeklyAverage = budgetLimit * 7; // 91 kg
  const weekDelta = weekTotal - weeklyAverage;
  const weekSparkline = Array.from({ length: 7 }, (_, idx) => getEmissionsForDay(6 - idx));

  const monthTotal = summary?.month || 0;
  const monthlyBudget = user?.monthlyBudgetKg || 400.0;
  const monthPercentage = Math.round((monthTotal / monthlyBudget) * 100);
  const monthSparkline = [
    monthTotal * 0.4,
    monthTotal * 0.6,
    monthTotal * 0.75,
    monthTotal * 0.9,
    monthTotal,
  ];

  const carbonSaved = Math.max(0, weeklyAverage - weekTotal);
  const savedSparkline = weekSparkline.map((val) => Math.max(0, budgetLimit - val));

  // Gauge colors
  const gaugeColor = todayTotal < 7.0 ? '#00E676' : todayTotal < 13.0 ? '#FFB300' : '#FF5252';
  const sidebarRadius = 40;
  const sidebarCircumference = 2 * Math.PI * sidebarRadius;
  const sidebarDashoffset = sidebarCircumference - (usedPercentage / 100) * sidebarCircumference;

  // --- RECHARTS DATA ---
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    let numDays = 7;
    let offsetStart = 0;

    if (chartRange === 'last_week') {
      numDays = 7;
      offsetStart = 7;
    } else if (chartRange === 'last_month') {
      numDays = 30;
      offsetStart = 0;
    }

    const data = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - (i + offsetStart));
      const val = getEmissionsForDay(i + offsetStart);
      const breakdown = getBreakdownForDay(i + offsetStart);

      data.push({
        name: numDays === 30 ? `${targetDate.getMonth() + 1}/${targetDate.getDate()}` : days[targetDate.getDay()],
        carbon: Number(val.toFixed(1)),
        dateStr: targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        breakdown,
      });
    }
    return data;
  }, [chartRange, getEmissionsForDay, getBreakdownForDay]);

  const pieData = useMemo(() => {
    const catBreakdown = summary?.categoryBreakdown || { transport: 0, food: 0, energy: 0, lifestyle: 0 };
    const total = Object.values(catBreakdown).reduce((sum, v) => sum + v, 0) || 1;
    return [
      { name: 'Transport', value: catBreakdown.transport, color: '#4FC3F7', percentage: Math.round((catBreakdown.transport / total) * 100) },
      { name: 'Food', value: catBreakdown.food, color: '#A5D6A7', percentage: Math.round((catBreakdown.food / total) * 100) },
      { name: 'Energy', value: catBreakdown.energy, color: '#FFB74D', percentage: Math.round((catBreakdown.energy / total) * 100) },
      { name: 'Lifestyle', value: catBreakdown.lifestyle, color: '#CE93D8', percentage: Math.round((catBreakdown.lifestyle / total) * 100) },
    ].filter((item) => item.value > 0);
  }, [summary]);

  // Donut Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="p-3 rounded-xl border border-[#1A2420] bg-[#080C0A]/95 backdrop-blur-md shadow-lg text-xs font-mono select-none">
          <p className="font-heading font-bold" style={{ color: data.payload.color }}>
            {data.name?.toUpperCase()}
          </p>
          <p className="text-white mt-1">
            {Number(data.value).toFixed(1)} kg CO₂ ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Weekly Area Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-4 rounded-xl border border-[#1A2420] bg-[#080C0A]/95 backdrop-blur-md shadow-lg text-xs space-y-2 select-none">
          <p className="font-mono text-white/50">{data.dateStr || label}</p>
          <p className="font-heading font-bold text-verdant-green">Total: {Number(payload[0].value).toFixed(1)} kg CO₂</p>
          {data.breakdown && (
            <div className="border-t border-[#1A2420] pt-2 mt-1 space-y-1 font-mono text-[11px] text-slate-300">
              <p className="flex justify-between gap-6"><span>🚗 Transport:</span> <span className="text-[#4FC3F7]">{data.breakdown.transport.toFixed(1)} kg</span></p>
              <p className="flex justify-between gap-6"><span>🥩 Food:</span> <span className="text-[#A5D6A7]">{data.breakdown.food.toFixed(1)} kg</span></p>
              <p className="flex justify-between gap-6"><span>⚡ Energy:</span> <span className="text-[#FFB74D]">{data.breakdown.energy.toFixed(1)} kg</span></p>
              <p className="flex justify-between gap-6"><span>👕 Lifestyle:</span> <span className="text-[#CE93D8]">{data.breakdown.lifestyle.toFixed(1)} kg</span></p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Donut expansion slice renderer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  // Recent activities lists
  const recentActivities = activities.slice(0, 10);

  // Category Icon Mapper
  const getCategoryEmoji = (category: string) => {
    if (category === 'transport') return '🚗';
    if (category === 'food') return '🥩';
    if (category === 'energy') return '⚡';
    return '👕';
  };

  // Carbon Magnitude Colors
  const getCarbonWeightColor = (kg: number) => {
    if (kg < 3.0) return 'text-[#00E676]';
    if (kg < 10.0) return 'text-[#FFB300]';
    return 'text-[#FF5252]';
  };

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Track', href: '/track', icon: PlusCircle },
    { label: 'Insights', href: '/insights', icon: Lightbulb },
    { label: 'Challenges', href: '/challenges', icon: Trophy },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <PageTransition>
      <>
        <DashboardBackground />
        <div 
          className="min-h-screen text-[#F8F9FF] dashboard-grid-bg flex flex-col md:flex-row select-none"
          style={{ position: 'relative', zIndex: 1 }}
        >
        
        {/* ================= LEFT SIDEBAR (Desktop/Tablet) ================= */}
        <aside className={`${activeTab === 'scorecard' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-[240px] shrink-0 border-r border-[#1A2420] p-6 bg-[#080C0A]/70 backdrop-blur-md z-15`}>
          
          {/* Avatar Panel */}
          <div className="flex items-center space-x-3 mb-8">
            <span className="text-3xl p-2.5 bg-slate-950/60 border border-[#1A2420] rounded-2xl select-none">
              {user?.avatar || '🌱'}
            </span>
            <div>
              <h2 className="text-sm font-heading font-extrabold text-white leading-tight">{user?.name || 'Eco Warrior'}</h2>
              <p className="text-[10px] font-mono text-verdant-green mt-0.5 uppercase tracking-wider">Level {user?.level || 1} Operator</p>
            </div>
          </div>

          {/* Carbon score gauge */}
          <div className="flex flex-col items-center justify-center p-5 bg-[#080C0A]/40 border border-[#1A2420]/80 rounded-2xl mb-8 text-center relative overflow-hidden">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Outer ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={sidebarRadius}
                  fill="transparent"
                  stroke="#1A2420"
                  strokeWidth="6.5"
                />
                {/* Inner Ring used */}
                <circle
                  cx="50"
                  cy="50"
                  r={sidebarRadius}
                  fill="transparent"
                  stroke={gaugeColor}
                  strokeWidth="6.5"
                  strokeDasharray={sidebarCircumference}
                  strokeDashoffset={sidebarDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              {/* Number reading */}
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none mt-1">
                <span className="font-mono text-2xl font-bold text-white leading-none">
                  {todayTotal.toFixed(1)}
                </span>
                <span className="text-[8px] font-heading text-white/40 tracking-widest mt-1">KG CO₂</span>
              </div>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-4 leading-none">
              of {budgetLimit.toFixed(1)} kg daily budget
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl border border-transparent font-heading text-xs tracking-wider uppercase transition-all duration-300 ${
                    isActive
                      ? 'bg-verdant-green/10 border-verdant-green/20 text-verdant-green font-bold shadow-[0_0_15px_rgba(0,230,118,0.08)]'
                      : 'text-white/60 hover:bg-slate-900/40 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mini Streak Counter */}
          <div className="border-t border-[#1A2420] pt-4 mt-6 flex items-center justify-between text-xs font-heading">
            <span className="text-white/40 uppercase tracking-widest">Operator Streak</span>
            <span className="flex items-center space-x-1.5 font-bold text-orange-400 font-mono">
              <span>🔥</span>
              <span>{user?.streak || 0} DAYS</span>
            </span>
          </div>

        </aside>

        {/* ================= MAIN CONTENT AREA ================= */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Mobile navigation tab bar */}
          <div className="flex md:hidden border-b border-[#1A2420] bg-[#080C0A]/40 backdrop-blur-md z-15">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex-1 py-4 text-xs font-heading font-extrabold uppercase tracking-widest text-center focus:outline-none transition-colors ${
                activeTab === 'metrics' ? 'text-verdant-green border-b-2 border-verdant-green bg-verdant-green/5' : 'text-white/45'
              }`}
            >
              METRICS
            </button>
            <button
              onClick={() => setActiveTab('scorecard')}
              className={`flex-1 py-4 text-xs font-heading font-extrabold uppercase tracking-widest text-center focus:outline-none transition-colors ${
                activeTab === 'scorecard' ? 'text-verdant-green border-b-2 border-verdant-green bg-verdant-green/5' : 'text-white/45'
              }`}
            >
              SCORECARD
            </button>
          </div>

          {/* Main Content Layout Container */}
          <main className={`${activeTab === 'metrics' ? 'block' : 'hidden md:block'} flex-1 p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto relative`}>
            
            {/* Aesthetic 3D Ambient Canvas (DataOrbs) in top-right */}
            <div className="absolute top-4 right-4 hidden lg:block select-none z-0">
              <div className="w-[260px] h-[260px] rounded-2xl border border-[#1A2420]/80 bg-[#080C0A]/40 p-4 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-verdant-green/30" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-verdant-green/30" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-verdant-green/30" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-verdant-green/30" />
                <div className="font-mono text-[8px] text-slate-500 tracking-widest uppercase">3D TELEMETRY</div>
                <div style={{ width: 220, height: 220, position: 'absolute', right: 20, top: 20 }}>
                  <Suspense fallback={null}>
                    <div
                      role="img"
                      aria-label="Carbon category data orbs"
                      style={{ width: '100%', height: '100%' }}
                    >
                      <WebGLErrorBoundary>
                        <DataOrbs />
                      </WebGLErrorBoundary>
                    </div>
                  </Suspense>
                </div>
              </div>
            </div>

            {/* --- CASE: EMPTY LOGS HUB / GET STARTED VIEW --- */}
            {activities.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-xl mx-auto text-center py-20 px-6 rounded-3xl border border-[#1A2420] bg-[#080C0A]/40 backdrop-blur-md select-none space-y-6"
              >
                <div className="w-16 h-16 bg-verdant-green/10 border border-verdant-green/20 text-verdant-green rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="font-display text-4xl text-white uppercase leading-tight">Welcome to Mission Control</h2>
                <p className="text-sm text-slate-400 font-body leading-relaxed">
                  Start tracking your carbon parameters. You can input activities manually or seed the dashboard with realistic hackathon demo data to preview active charts and AI insights immediately.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Link href="/track" className="w-full sm:w-auto">
                    <Button className="w-full px-6 py-2.5 font-heading text-xs uppercase tracking-widest font-bold">
                      Log First Activity
                    </Button>
                  </Link>
                  <Button
                    onClick={seedMockData}
                    variant="outline"
                    className="w-full sm:w-auto px-6 py-2.5 border-verdant-green text-verdant-green hover:bg-verdant-green/5 font-heading text-xs uppercase tracking-widest font-bold"
                  >
                    Seed Demo Data
                  </Button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#1A2420]/80 pb-6">
                  <div>
                    <h1 className="font-display text-4xl md:text-5xl text-white tracking-wide uppercase leading-none">Observatory Console</h1>
                    <p className="text-xs text-slate-500 font-heading uppercase tracking-widest mt-1.5 flex items-center space-x-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verdant-green opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-verdant-green"></span>
                      </span>
                      <span>TELEMETRY ONLINE: {activities.length} logs synced</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <Link href="/track">
                      <Button size="sm" className="font-heading text-xs tracking-wider uppercase font-bold flex items-center space-x-1.5">
                        <PlusCircle className="w-4 h-4" />
                        <span>Log Activity</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* ================= ROW 1: 4 STAT CARDS ================= */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 z-10 relative"
                >
                  {/* Card 1: Today's Carbon */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 40 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
                    }}
                    className="p-5 rounded-2xl border border-[#1A2420] bg-[#080C0A]/50 backdrop-blur-sm flex flex-col justify-between h-[130px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-xs font-extrabold uppercase text-white/50">Today&apos;s Carbon</span>
                      <Leaf className="w-4 h-4 text-verdant-green" />
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="font-mono text-3xl font-bold text-white">{todayTotal.toFixed(1)}<span className="text-xs text-white/40 font-mono ml-0.5">kg</span></span>
                      <Sparkline data={todaySparkline} color="#00E676" />
                    </div>
                    <div className="mt-2 text-[10px] font-mono leading-none">
                      {todayDelta <= 0 ? (
                        <span className="text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/10">
                          {todayDelta.toFixed(1)} kg vs yesterday
                        </span>
                      ) : (
                        <span className="text-[#FF5252] bg-[#FF5252]/10 px-2 py-0.5 rounded border border-[#FF5252]/10">
                          +{todayDelta.toFixed(1)} kg vs yesterday
                        </span>
                      )}
                    </div>
                  </motion.div>

                  {/* Card 2: Week Total */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 40 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
                    }}
                    className="p-5 rounded-2xl border border-[#1A2420] bg-[#080C0A]/50 backdrop-blur-sm flex flex-col justify-between h-[130px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-xs font-extrabold uppercase text-white/50">Week Total</span>
                      <Calendar className="w-4 h-4 text-[#4FC3F7]" />
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="font-mono text-3xl font-bold text-white">{weekTotal.toFixed(1)}<span className="text-xs text-white/40 font-mono ml-0.5">kg</span></span>
                      <Sparkline data={weekSparkline} color="#4FC3F7" />
                    </div>
                    <div className="mt-2 text-[10px] font-mono leading-none">
                      {weekDelta <= 0 ? (
                        <span className="text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/10">
                          {weekDelta.toFixed(1)} kg vs target average
                        </span>
                      ) : (
                        <span className="text-[#FF5252] bg-[#FF5252]/10 px-2 py-0.5 rounded border border-[#FF5252]/10">
                          +{weekDelta.toFixed(1)} kg vs target average
                        </span>
                      )}
                    </div>
                  </motion.div>

                  {/* Card 3: Monthly Budget */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 40 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
                    }}
                    className="p-5 rounded-2xl border border-[#1A2420] bg-[#080C0A]/50 backdrop-blur-sm flex flex-col justify-between h-[130px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-xs font-extrabold uppercase text-white/50">Monthly Budget</span>
                      <Target className="w-4 h-4 text-[#FFB74D]" />
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="font-mono text-3xl font-bold text-white">{monthPercentage}%<span className="text-xs text-white/40 font-mono ml-1">used</span></span>
                      <Sparkline data={monthSparkline} color="#FFB74D" />
                    </div>
                    <div className="mt-2 text-[10px] font-mono leading-none">
                      {monthTotal <= monthlyBudget ? (
                        <span className="text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/10">
                          {(monthlyBudget - monthTotal).toFixed(0)} kg remaining
                        </span>
                      ) : (
                        <span className="text-[#FF5252] bg-[#FF5252]/10 px-2 py-0.5 rounded border border-[#FF5252]/10">
                          +{(monthTotal - monthlyBudget).toFixed(0)} kg over budget
                        </span>
                      )}
                    </div>
                  </motion.div>

                  {/* Card 4: Carbon Saved */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 40 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
                    }}
                    className="p-5 rounded-2xl border border-[#1A2420] bg-[#080C0A]/50 backdrop-blur-sm flex flex-col justify-between h-[130px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-xs font-extrabold uppercase text-white/50">Carbon Saved</span>
                      <TrendingDown className="w-4 h-4 text-[#CE93D8]" />
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="font-mono text-3xl font-bold text-white">{carbonSaved.toFixed(1)}<span className="text-xs text-white/40 font-mono ml-0.5">kg</span></span>
                      <Sparkline data={savedSparkline} color="#CE93D8" />
                    </div>
                    <div className="mt-2 text-[10px] font-mono leading-none">
                      {carbonSaved > 0 ? (
                        <span className="text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/10 font-bold">
                          +{((carbonSaved / weeklyAverage) * 100).toFixed(0)}% saved vs baseline
                        </span>
                      ) : (
                        <span className="text-[#FF5252] bg-[#FF5252]/10 px-2 py-0.5 rounded border border-[#FF5252]/10">
                          0.0% saved vs average
                        </span>
                      )}
                    </div>
                  </motion.div>
                </motion.div>

                {/* ================= ROW 2: MAIN CHART + DONUT BREAKDOWN ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 relative">
                  
                  {/* Weekly Trend AreaChart (60%) */}
                  <div className="lg:col-span-7 p-6 rounded-2xl border border-[#1A2420] bg-[#080C0A]/50 backdrop-blur-sm flex flex-col space-y-6">
                    <div className="flex items-center justify-between gap-4 border-b border-[#1A2420]/80 pb-4">
                      <h2 className="font-display text-2xl text-white tracking-wide uppercase">Weekly Footprint</h2>
                      
                      {/* Date Range Selector */}
                      <div className="flex items-center bg-slate-950/60 p-1 border border-[#1A2420] rounded-xl text-[10px] font-mono select-none">
                        {(['this_week', 'last_week', 'last_month'] as const).map((range) => (
                          <button
                            key={range}
                            onClick={() => setChartRange(range)}
                            className={`px-3 py-1.5 rounded-lg uppercase transition-all ${
                              chartRange === range
                                ? 'bg-verdant-green text-black font-bold'
                                : 'text-white/40 hover:text-white'
                            }`}
                          >
                            {range.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div ref={trendChartRef} className="w-full h-[300px]">
                      {mounted && trendChartInView ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00E676" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#00E676" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#1A2420" strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                              dataKey="name"
                              stroke="#888888"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                              dy={10}
                              className="font-mono text-white/40"
                            />
                            <YAxis
                              stroke="#888888"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                              dx={-10}
                              className="font-mono text-white/40"
                            />
                            <Tooltip content={<AreaTooltip />} cursor={{ stroke: '#1A2420', strokeWidth: 1 }} />
                            <Area
                              type="monotone"
                              dataKey="carbon"
                              stroke="#00E676"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#chartGlow)"
                              activeDot={{ r: 6, fill: '#00E676', stroke: '#080C0A', strokeWidth: 2 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="skeleton w-full h-full" style={{ height: 300, borderRadius: 12 }} />
                      )}
                    </div>
                  </div>

                  {/* Category Breakdown Donut (40%) */}
                  <div className="lg:col-span-5 p-6 rounded-2xl border border-[#1A2420] bg-[#080C0A]/50 backdrop-blur-sm flex flex-col justify-between">
                    <div className="border-b border-[#1A2420]/80 pb-4">
                      <h2 className="font-display text-2xl text-white tracking-wide uppercase">Category Shares</h2>
                    </div>

                    {/* Donut Chart View */}
                    <div ref={shareChartRef} className="relative w-full h-[200px] flex items-center justify-center my-2">
                      {mounted && shareChartInView ? (
                        <>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Tooltip content={<PieTooltip />} />
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                                {...{
                                  activeIndex: pieActiveIndex ?? undefined,
                                  activeShape: renderActiveShape,
                                  onMouseEnter: (_: unknown, index: number) => setPieActiveIndex(index),
                                  onMouseLeave: () => setPieActiveIndex(null)
                                }}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#080C0A" strokeWidth={2} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Absolute Center Text */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none mt-1">
                            <span className="font-mono text-2xl font-bold text-white leading-none">
                              {pieData.reduce((sum, item) => sum + item.value, 0).toFixed(0)}
                            </span>
                            <span className="text-[8px] font-heading text-white/40 tracking-wider mt-1">TOTAL KG</span>
                          </div>
                        </>
                      ) : (
                        <div className="skeleton w-full h-full" style={{ height: 200, borderRadius: 12 }} />
                      )}
                    </div>

                    {/* Legend list below */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#1A2420]/80 font-mono text-[10px] text-white/50">
                      {[['Transport', '#4FC3F7', 'transport'], ['Food', '#A5D6A7', 'food'], ['Energy', '#FFB74D', 'energy'], ['Lifestyle', '#CE93D8', 'lifestyle']].map(([name, color, categoryKey]) => {
                        const val = summary?.categoryBreakdown[categoryKey as keyof typeof summary.categoryBreakdown] || 0;
                        const total = Object.values(summary?.categoryBreakdown || {}).reduce((s, v) => s + v, 0) || 1;
                        const pct = Math.round((val / total) * 100);
                        return (
                          <div key={name} className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="truncate">{name}:</span>
                            <span className="font-bold text-white font-mono ml-auto">{val.toFixed(0)}kg ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* ================= ROW 3: RECENT ACTIVITIES + AI INSIGHTS ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 relative">
                  
                  {/* Recent Activities Feed (55%) */}
                  <div className="lg:col-span-7 p-6 rounded-2xl border border-[#1A2420] bg-[#080C0A]/50 backdrop-blur-sm flex flex-col space-y-6">
                    <div className="flex items-center justify-between border-b border-[#1A2420]/80 pb-4">
                      <h2 className="font-display text-2xl text-white tracking-wide uppercase">Mission Logs</h2>
                      <Link href="/track">
                        <span className="text-[10px] font-heading font-extrabold uppercase text-verdant-green hover:underline cursor-pointer">
                          Add Activity &rarr;
                        </span>
                      </Link>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[350px] scrollbar-thin pr-1">
                      <AnimatePresence initial={false}>
                        {recentActivities.map((act, index) => {
                          const date = new Date(act.timestamp);
                          return (
                            <motion.div
                              key={act.id}
                              initial={{ opacity: 0, x: 25 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="group flex items-center justify-between p-3 rounded-xl border border-[#1A2420]/60 bg-[#080C0A]/30 hover:border-verdant-green/20 hover:bg-slate-900/10 transition-all"
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <span className="text-xl p-2 bg-slate-950 border border-[#1A2420]/40 rounded-xl leading-none select-none">
                                  {getCategoryEmoji(act.category)}
                                </span>
                                <div className="truncate">
                                  <p className="text-xs font-heading font-bold text-white truncate uppercase tracking-wider">{act.subCategory.replace('_', ' ')}</p>
                                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                    {act.value} {act.unit} {act.notes ? `• ${act.notes}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4 shrink-0">
                                <div className="text-right">
                                  <p className={`font-mono text-sm font-bold ${getCarbonWeightColor(act.carbonKg)}`}>
                                    +{act.carbonKg.toFixed(1)} <span className="text-[9px] font-normal opacity-50">kg</span>
                                  </p>
                                  <p className="text-[9px] font-mono text-slate-600 mt-0.5">
                                    {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                
                                {/* Delete Button on Hover */}
                                <button
                                  onClick={() => {
                                    deleteActivity(act.id).catch((error) => {
                                      console.error('Delete activity failed:', error instanceof Error ? error.message : error);
                                    });
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-2 bg-rose-500/10 border border-rose-500/20 text-[#FF5252] rounded-xl hover:bg-rose-500 hover:text-white transition-all focus:outline-none"
                                  aria-label="Delete entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* AI Insights Snapshot (45%) */}
                  <div className="lg:col-span-5 p-6 rounded-2xl border border-[#1A2420] bg-[#080C0A]/50 backdrop-blur-sm flex flex-col justify-between space-y-6">
                    <div className="flex items-center justify-between border-b border-[#1A2420]/80 pb-4">
                      <div className="flex items-center space-x-2">
                        {/* pulsing AI indicator */}
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verdant-green opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-verdant-green"></span>
                        </span>
                        <h2 className="font-display text-2xl text-white tracking-wide uppercase">Gemini Insights</h2>
                      </div>
                      
                      <button
                        onClick={fetchAIInsights}
                        disabled={insightsLoading}
                        className="p-2 bg-slate-950/80 hover:bg-verdant-green/10 border border-[#1A2420] rounded-xl text-white/50 hover:text-verdant-green transition-all disabled:opacity-40"
                        title="Refresh AI suggestions"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${insightsLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <div className="space-y-4 flex-1">
                      {insightsLoading ? (
                        // Shimmer Skeleton Loaders
                        Array.from({ length: 3 }).map((_, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-[#1A2420]/30 bg-slate-950/20 space-y-2 select-none">
                            <div className="h-3 w-16 bg-slate-800 rounded animate-pulse" />
                            <div className="h-4 w-40 bg-slate-800 rounded animate-pulse" />
                            <div className="h-3 w-full bg-slate-900 rounded animate-pulse" />
                          </div>
                        ))
                      ) : (
                        insights.slice(0, 3).map((insight) => (
                          <div
                            key={insight.id}
                            className="p-4 rounded-xl border border-[#1A2420]/50 bg-slate-950/15 hover:border-verdant-green/10 transition-colors relative group"
                          >
                            <div className="flex items-center justify-between mb-1.5 select-none">
                              {/* Insight Badge */}
                              <span className={`text-[8px] font-heading font-extrabold uppercase px-2 py-0.5 rounded border ${
                                insight.type === 'warning'
                                  ? 'bg-[#FF5252]/10 border-[#FF5252]/20 text-[#FF5252]'
                                  : 'bg-verdant-green/10 border-verdant-green/20 text-verdant-green'
                              }`}>
                                {insight.type}
                              </span>
                              <Link href="/insights">
                                <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-verdant-green group-hover:translate-x-0.5 transition-all cursor-pointer" />
                              </Link>
                            </div>
                            <h3 className="text-xs font-heading font-bold text-white mb-0.5">{insight.title}</h3>
                            <p className="text-[11px] text-slate-400 font-body leading-normal">{insight.description}</p>
                            <p className="text-[10px] font-mono text-[#00E676] font-semibold mt-2 leading-none">
                              Potential saving: {insight.potentialSavingKg.toFixed(1)} kg/week
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest leading-none pt-4 border-t border-[#1A2420]/80">
                      Last Updated: {insights[0] ? new Date(insights[0].generatedAt).toLocaleTimeString() : 'N/A'}
                    </div>
                  </div>

                </div>
              </>
            )}

          </main>
        </div>

        </div>
      </>
    </PageTransition>
  );
}
