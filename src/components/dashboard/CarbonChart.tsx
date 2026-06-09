/**
 * @file CarbonChart.tsx
 * @description Carbon analytics charts dashboard component.
 * Uses Recharts to visualize emissions breakdown by category (Pie/Donut)
 * and daily emission trends over the past 7 days (Area). Connected to useCarbonStore.
 */

'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { useCarbonStore } from '@/store/carbon-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { BarChart3, PieChartIcon, Activity } from 'lucide-react';

const CATEGORY_COLORS = {
  transport: '#38bdf8', // sky-400
  food: '#fbbf24',      // amber-400
  energy: '#facc15',    // yellow-400
  lifestyle: '#c084fc', // purple-400
};

const CATEGORY_LABELS = {
  transport: 'Transport',
  food: 'Food',
  energy: 'Energy',
  lifestyle: 'Lifestyle',
};

export const CarbonChart = memo(function CarbonChart() {
  const [mounted, setMounted] = useState(false);
  const activities = useCarbonStore((state) => state.activities);
  const summary = useCarbonStore((state) => state.summary);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Prepare Pie Chart Data (Category Breakdown)
  const pieData = useMemo(() => {
    const breakdown = summary?.categoryBreakdown || {
      transport: 0,
      food: 0,
      energy: 0,
      lifestyle: 0,
    };
    return Object.entries(breakdown).map(([cat, val]) => ({
      name: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
      value: val,
      color: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] || '#10b981',
    })).filter(item => item.value > 0);
  }, [summary]);

  // 2. Prepare Trend Chart Data (Last 7 Days)
  const trendData = useMemo(() => {
    const data: Record<string, number> = {};
    // Pre-populate last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      data[dateStr] = 0;
    }

    // Populate from activities
    activities.forEach((activity) => {
      const actDate = new Date(activity.timestamp);
      const dateStr = actDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (dateStr in data) {
        data[dateStr] = Number((data[dateStr] + activity.carbonKg).toFixed(1));
      }
    });

    return Object.entries(data).map(([date, val]) => ({
      date,
      emissions: val,
    }));
  }, [activities]);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-[350px] animate-pulse bg-slate-900/30" />
        <Card className="h-[350px] animate-pulse bg-slate-900/30" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 7-Day Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-white flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Emission Trend</span>
            </CardTitle>
            <CardDescription>Daily carbon emissions (kg CO₂e)</CardDescription>
          </div>
          <Activity className="w-4 h-4 text-slate-500" />
        </CardHeader>
        <CardContent className="h-[260px] pb-4">
          {activities.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <p>No activity logs found.</p>
              <p className="text-[10px] text-slate-600">Start logging to see trend graphs.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#e2e8f0',
                  }}
                  itemStyle={{ color: '#10b981' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="emissions"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEmissions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-white flex items-center space-x-1.5">
              <PieChartIcon className="w-4 h-4 text-emerald-400" />
              <span>Carbon Share</span>
            </CardTitle>
            <CardDescription>Breakdown by lifestyle category</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="h-[260px] pb-4">
          {pieData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <p>No carbon shares recorded.</p>
              <p className="text-[10px] text-slate-600">Emissions are grouped as you log items.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#e2e8f0',
                  }}
                  formatter={(value) => [`${Number(value).toFixed(1)} kg`, 'Carbon']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconSize={10}
                  iconType="circle"
                  formatter={(value) => <span className="text-[11px] text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

CarbonChart.displayName = 'CarbonChart';
