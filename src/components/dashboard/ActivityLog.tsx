/**
 * @file ActivityLog.tsx
 * @description Renders the carbon logging panel and recent activities feed.
 * Allows users to choose an activity category, select a matching scientific subcategory
 * (e.g., Petrol Car, Beef, Electricity), input values, and log it to useCarbonStore.
 */

'use client';

import React, { useState, memo } from 'react';
import { useCarbonStore } from '@/store/carbon-store';
import { EMISSION_FACTORS } from '@/lib/carbon-calculator';
import { ActivityCategory, Activity } from '@/types';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Car, Utensils, Zap, ShoppingBag, Trash2, Plus, Calendar, Compass } from 'lucide-react';
import { formatCarbon } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

const CATEGORIES: { id: ActivityCategory; label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }[] = [
  { id: 'transport', label: 'Transport', icon: Car, color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-500/20' },
  { id: 'food', label: 'Food', icon: Utensils, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-500/20' },
  { id: 'energy', label: 'Energy', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-500/20' },
  { id: 'lifestyle', label: 'Lifestyle', icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-500/20' },
];

interface ActivityLogItemProps {
  act: Activity;
  onRemove: (id: string) => void;
}

const ActivityLogItem = memo(function ActivityLogItem({ act, onRemove }: ActivityLogItemProps) {
  const catMeta = CATEGORIES.find((c) => c.id === act.category) || CATEGORIES[0];
  const factorMeta = EMISSION_FACTORS.find((f) => f.subCategory === act.subCategory);
  const label = factorMeta?.label || act.subCategory;
  const iconEmoji = factorMeta?.icon || '🌱';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-between p-3 rounded-xl border border-slate-800/60 bg-slate-950/20 group hover:border-slate-700/80 transition-all"
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${catMeta.bg} border text-base select-none`}>
          {iconEmoji}
        </div>
        <div>
          <p className="text-xs font-semibold text-white">{label}</p>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className="text-[10px] text-slate-400">
              {act.value} {act.unit}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-800" />
            <span className="text-[10px] text-slate-500 flex items-center">
              <Calendar className="w-2.5 h-2.5 mr-0.5" />
              {new Date(act.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          {act.notes && (
            <p className="text-[10px] text-slate-500 italic mt-0.5">{act.notes}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <span className="text-xs font-bold text-slate-200">
          {formatCarbon(act.carbonKg)}
        </span>
        <button
          onClick={() => onRemove(act.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all duration-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
});
ActivityLogItem.displayName = 'ActivityLogItem';

export function ActivityLog() {
  const activities = useCarbonStore((state) => state.activities);
  const addActivity = useCarbonStore((state) => state.addActivity);
  const removeActivity = useCarbonStore((state) => state.removeActivity);
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<ActivityCategory>('transport');
  const [subCategory, setSubCategory] = useState<string>('car_petrol');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // Filter factors belonging to currently selected category
  const filteredFactors = EMISSION_FACTORS.filter(f => f.category === category);
  
  // Find current factor metadata
  const currentFactor = EMISSION_FACTORS.find(f => f.subCategory === subCategory) || filteredFactors[0];

  const handleCategoryChange = (cat: ActivityCategory) => {
    setCategory(cat);
    const firstSub = EMISSION_FACTORS.find(f => f.category === cat);
    if (firstSub) {
      setSubCategory(firstSub.subCategory);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCategory || !amount || parseFloat(amount) <= 0 || !currentFactor) return;

    const newActivity: Activity = {
      id: Math.random().toString(36).substring(2, 9),
      userId: 'user',
      category,
      subCategory,
      value: parseFloat(amount),
      unit: currentFactor.unit,
      carbonKg: 0, // Recalculated reactively in the store
      timestamp: new Date(date),
      notes: notes || undefined,
    };

    addActivity(newActivity);

    // Reset Form
    setAmount('');
    setNotes('');
    setIsOpen(false);
  };

  return (
    <div className="space-y-6" id="activities">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <span>Activity Logs</span>
          </h2>
          <p className="text-xs text-slate-400">Track and manage your carbon metrics</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center space-x-1" id="btn-log-activity">
              <Plus className="w-4 h-4" />
              <span>Log Activity</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Log Carbon Activity</DialogTitle>
              <DialogDescription>Input your activity details below to calculate emissions.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? 'bg-slate-900 border-emerald-500 text-white shadow-emerald-500/10 shadow-lg'
                            : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${cat.color}`} />
                        <span className="text-[10px] font-medium">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SubCategory Select */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {filteredFactors.map((f) => (
                    <option key={f.subCategory} value={f.subCategory}>
                      {f.icon} {f.label} ({f.kgCO2PerUnit} kg CO₂/{f.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Date Input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Amount ({currentFactor?.unit || 'units'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 15"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., commute to office"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button type="submit" className="w-full" id="btn-save-activity">
                  Save Activity
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white">Recent Activities</CardTitle>
          <CardDescription>Review and manage logs</CardDescription>
        </CardHeader>
        <CardContent className="-mt-2">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2 stroke-[1.5]" />
              <p className="text-xs text-slate-500">No activities logged yet.</p>
              <p className="text-[10px] text-slate-600">Click &apos;Log Activity&apos; to start tracking your footprint.</p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
              <AnimatePresence initial={false}>
                {activities.map((act) => (
                  <ActivityLogItem key={act.id} act={act} onRemove={removeActivity} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
