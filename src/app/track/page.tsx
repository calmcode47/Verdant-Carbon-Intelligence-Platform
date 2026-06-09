/**
 * @file page.tsx
 * @description Dedicated Activity Tracker page for Verdant.
 * Theme: Neural Input Terminal — Cyberpunk mainframe style.
 * Palette: Carbon black, electric green, matrix green, cold white.
 * Typography: DM Mono dominant, Syne for headings.
 */

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useCarbonStore } from '@/store/carbon-store';
import { EMISSION_FACTORS, calculateCarbon } from '@/lib/carbon-calculator';
import { PageTransition } from '@/components/layout/PageTransition';
import { TrackBackground } from '@/components/backgrounds';
import { safeAsync } from '@/lib/errors';
import { ActivityCategory, Activity } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Plus, 
  Minus, 
  Sparkles, 
  Database
} from 'lucide-react';

// --- CO₂ TO TREE ABSORPTION FORMULA ---
// Mature tree absorbs ~22 kg CO2 per year
const getTreeEquivalent = (kg: number) => {
  const annualTreeAbs = 22.0;
  const percentage = (kg / annualTreeAbs) * 100;
  return percentage;
};

// --- CARBON MAGNITUDE COLORS ---
const getCarbonWeightColor = (kg: number) => {
  if (kg < 3.0) return 'text-[#00E676]';
  if (kg < 10.0) return 'text-[#FFB300]';
  return 'text-[#FF5252]';
};

// --- ANIMATED CARBON NUMBER ---
function AnimatedCarbonText({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = displayValue;
    const endVal = value;
    const duration = 250; // 250ms transition

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = startVal + (endVal - startVal) * progress;
      setDisplayValue(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (displayValue < 1.0) {
    const grams = displayValue * 1000;
    return <span>{grams.toFixed(0)}g CO₂e</span>;
  }
  return <span>{displayValue.toFixed(2)} kg CO₂e</span>;
}

// --- TYPEWRITER AI TEXT ---
function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, 12); // Speed of character generation
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}</span>;
}

// --- CYBERPUNK TERMINAL FRAME CORNERS ---
function CornerTicks() {
  return (
    <>
      <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#00E676] pointer-events-none" />
      <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#00E676] pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#00E676] pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#00E676] pointer-events-none" />
    </>
  );
}

// --- PRESET INTERFACES ---
interface Preset {
  label: string;
  category: ActivityCategory;
  subCategory: string;
  value: number;
  carbonStr: string;
}

// --- LOCAL AI TIP FALLBACK DICTIONARY ---
const FALLBACK_TIPS: Record<string, string> = {
  car_petrol: "Combustion engines release high greenhouse levels. Carpooling twice a week or shifting short commutes under 5km to walking saves ~150kg CO₂ annually.",
  car_diesel: "Diesel produces high particulate matter. Shifting even 15% of your travel to urban electric trains reduces local atmospheric carbon loads dramatically.",
  car_electric: "Charging from the regional grid generates indirect carbon. Powering up during off-peak night cycles (after 10 PM) draws cleaner base power loads.",
  flight_short: "A single domestic flight emits more than average daily budgets. Consider high-speed electric trains for cross-state travel to cut emissions by 80%.",
  flight_long: "Long flights release emissions directly into the stratosphere, multiplying their warming impact. Budget emissions with carbon offset investments.",
  train: "Rail transport is highly efficient. Moving cargo or passenger transits via electric rail emits 90% less carbon than equivalent heavy motorway commutes.",
  bus: "Public buses reduce grid congestion. Taking transit lines instead of single-passenger vehicles reduces footprint parameters by 60% per kilometer.",
  motorcycle: "Motorcycles offer high fuel efficiency but still burn fossil fuels. Shifting to lightweight electric scooters for city hops offers zero-emission operations.",
  beef: "Beef production has high land-use and methane impacts. Swapping beef for plant-based grains or poultry reduces agricultural footprint parameters by 85%.",
  lamb: "Sheep grazing produces significant methane emissions. Transitioning to local poultry or seasonal fish diets offers lighter footprint indices.",
  pork: "Pigs have lower methane metrics than cattle, but feed inputs carry carbon weight. Substituting with locally-harvested legumes saves 6kg CO₂ per meal.",
  chicken: "Poultry has a low carbon footprint compared to red meat. Transitioning further to organic plant proteins (soy, lentils) cuts food footprint values in half.",
  fish: "Wild catch requires marine fuel, while farmed fish depends on feed logistics. Choosing sustainably certified local species lowers transport overheads.",
  dairy: "Dairy cows release methane and require refrigeration. Switching to oat or almond milk alternatives reduces associated farming impacts by 70%.",
  eggs: "Egg carbon factors are relatively low, but feed production remains a factor. Substituting with local free-range options minimizes distribution logistics.",
  vegetables: "Root vegetables and local greens are carbon sinks. Avoid air-freighted out-of-season produce to maintain zero-kilometer food metrics.",
  fruits: "Farming fruit is low carbon. Focus on buying local varieties rather than imported items to avoid stratification shipping impacts.",
  grains: "Grains are the most carbon-efficient caloric resource. Building menus around brown rice and lentils supports carbon-neutral agricultural metrics.",
  electricity: "Grid power is tied to regional generation. Installing LED bulbs, turning off standby media hubs, and switching to smart thermostats reduces draw by 15%.",
  natural_gas: "Gas heating burns fossil fuels. Lowering household therms by 1.5°C and sealing frame leaks keeps thermal footprints within budget baselines.",
  heating_oil: "Heating oil has heavy combustion footprints. Upgrading to heat pump systems powered by clean energy credits eliminates local fuel usage.",
  lpg: "LPG cylinders are high-pressure fossil gases. Transitioning to induction cooktops reduces indoor carbon oxides and supports zero emissions.",
  clothing: "Fast fashion requires heavy water and textile logistics. Buying vintage clothing or repairing old pieces cuts apparel carbon indexes by 90%.",
  electronics: "Device manufacturing accounts for 80% of a gadget's lifetime footprint. Extend device cycles to 4 years to defer upstream factory emissions.",
  streaming: "Data hubs consume massive cooling power. Lowering streaming definitions from 4K to HD reduces server loads and network hub draws by 75%.",
  waste: "Methane generates as organic matter decays in landfills. Composting organic waste and recycling plastics prevents landfill emissions.",
};

export default function TrackPage() {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ActivityCategory>('transport');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('car_petrol');
  const [inputValue, setInputValue] = useState<string>('15');
  const [calcValue, setCalcValue] = useState<string>('15');
  const [notes, setNotes] = useState<string>('');

  const calcTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleValueChange = (value: string) => {
    setInputValue(value); // update display immediately
    clearTimeout(calcTimeoutRef.current);
    calcTimeoutRef.current = setTimeout(() => {
      setCalcValue(value);
    }, 200);
  };

  useEffect(() => {
    return () => clearTimeout(calcTimeoutRef.current);
  }, []);
  
  // Custom states
  const [toasts, setToasts] = useState<{ id: string; message: string; sub: string }[]>([]);
  const [aiTip, setAiTip] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Zustand Store
  const user = useCarbonStore((state) => state.user);
  const activities = useCarbonStore((state) => state.activities);
  const summary = useCarbonStore((state) => state.summary);
  const addActivity = useCarbonStore((state) => state.addActivity);
  const removeActivity = useCarbonStore((state) => state.removeActivity);

  // Seeding trigger inside empty tracker page
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update default subcategory when category changes
  useEffect(() => {
    const defaultSub = EMISSION_FACTORS.find(f => f.category === activeCategory);
    if (defaultSub) {
      setSelectedSubCategory(defaultSub.subCategory);
      // set sensible default values based on category
      let val = '1';
      if (activeCategory === 'transport') val = '15';
      else if (activeCategory === 'food') val = '0.5';
      else if (activeCategory === 'energy') val = '10';
      
      setInputValue(val);
      setCalcValue(val);
    }
  }, [activeCategory]);

  // Fetch AI tip when subcategory changes
  useEffect(() => {
    if (!mounted) return;
    loadAiTip(activeCategory, selectedSubCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubCategory, mounted]);

  const loadAiTip = async (cat: ActivityCategory, subCat: string) => {
    setAiLoading(true);
    try {
      const factor = EMISSION_FACTORS.find(f => f.subCategory === subCat);
      if (!factor) return;

      // Call real API insights by simulating a mock payload
      const mockActivity = {
        id: 'temp',
        userId: 'user',
        category: cat,
        subCategory: subCat,
        value: Number(calcValue) || 10,
        unit: factor.unit,
        carbonKg: calculateCarbon(subCat, Number(calcValue) || 10),
        timestamp: new Date(),
        notes: 'Simulated for logging advice',
      };

      const [data, error] = await safeAsync(
        fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activities: [mockActivity, ...activities],
            user: user || { monthlyBudgetKg: 400 },
          }),
        }).then(async (res) => {
          if (!res.ok) throw new Error('API request failed');
          return res.json();
        })
      );

      if (error) {
        console.warn('AI API fail, using local matrix fallback:', error.message);
        setAiTip(FALLBACK_TIPS[subCat] || "Reduce output parameters by optimizing schedules.");
        setAiLoading(false);
        return;
      }

      if (data && data.insights && data.insights.length > 0) {
        // Find if one matches the current category or subcategory
        const matchingInsight = data.insights.find((i: { category: string; description: string }) => i.category === cat) || data.insights[0];
        setAiTip(matchingInsight.description);
      } else {
        setAiTip(FALLBACK_TIPS[subCat] || "Reduce output parameters by optimizing schedules.");
      }
    } catch {
      console.warn('AI API fail, using local matrix fallback.');
      setAiTip(FALLBACK_TIPS[subCat] || "Reduce output parameters by optimizing schedules.");
    } finally {
      setAiLoading(false);
    }
  };

  // Toast Helper
  const showToast = (message: string, sub: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, sub }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Find active emission factor
  const activeFactor = useMemo(() => {
    return EMISSION_FACTORS.find(f => f.subCategory === selectedSubCategory) || EMISSION_FACTORS[0];
  }, [selectedSubCategory]);

  const numericValue = useMemo(() => {
    return Math.max(0, parseFloat(calcValue) || 0);
  }, [calcValue]);

  const tempEmissions = useMemo(() => {
    return calculateCarbon(selectedSubCategory, numericValue);
  }, [selectedSubCategory, numericValue]);

  // Adjust values with buttons
  const adjustValue = (amount: number) => {
    setInputValue((prev) => {
      const current = parseFloat(prev) || 0;
      const updated = Math.max(0, current + amount);
      const valStr = updated % 1 === 0 ? updated.toString() : Number(updated.toFixed(2)).toString();
      setCalcValue(valStr);
      return valStr;
    });
  };

  // Preset configuration list
  const presets: Preset[] = [
    { label: '🚗 20km commute', category: 'transport', subCategory: 'car_petrol', value: 20, carbonStr: '3.8 kg' },
    { label: '🥩 Beef meal', category: 'food', subCategory: 'beef', value: 0.25, carbonStr: '6.8 kg' },
    { label: '💡 8h home electricity', category: 'energy', subCategory: 'electricity', value: 4, carbonStr: '0.9 kg' },
  ];

  const applyPreset = (preset: Preset) => {
    setActiveCategory(preset.category);
    setTimeout(() => {
      setSelectedSubCategory(preset.subCategory);
      setInputValue(preset.value.toString());
      setCalcValue(preset.value.toString());
      showToast(`Preset Loaded`, `${preset.label}`);
    }, 50);
  };

  // Form submission handler
  const handleLogActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNumericValue = Math.max(0, parseFloat(inputValue) || 0);
    const finalEmissions = calculateCarbon(selectedSubCategory, finalNumericValue);
    if (finalNumericValue <= 0) {
      showToast('Error', 'Input value must exceed zero.');
      return;
    }

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      userId: 'user',
      category: activeCategory,
      subCategory: selectedSubCategory,
      value: finalNumericValue,
      unit: activeFactor.unit,
      carbonKg: finalEmissions,
      timestamp: new Date(),
      notes: notes.trim() || undefined,
    };

    addActivity(newActivity);
    showToast('Activity Logged', `${finalEmissions.toFixed(2)} kg CO₂ added`);
    
    // Reset Form fields
    setNotes('');
  };

  // Date/Time Formatter
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter today's activities
  const todayActivities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activities.filter((act) => new Date(act.timestamp) >= today);
  }, [activities]);

  const todayRunningTotal = summary?.today || 0;
  const projectedTotal = todayRunningTotal + tempEmissions;
  const budgetLimit = 13.0;

  // Impact Preview Bar percentage width scales (max 15.0kg)
  const scaleMax = 15.0;
  const barTodayPct = Math.min(100, (todayRunningTotal / scaleMax) * 100);
  const barNewPct = Math.min(100 - barTodayPct, (tempEmissions / scaleMax) * 100);

  // Carbon levels threshold color classes
  const getCarbonLevelColor = (kg: number) => {
    if (kg < 2.0) return 'text-[#00E676]';
    if (kg < 10.0) return 'text-amber-400';
    return 'text-[#FF5252]';
  };

  const getCategoryThemeColor = (category: string) => {
    if (category === 'transport') return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
    if (category === 'food') return 'bg-[#00E676]/20 text-[#00E676] border-[#00E676]/30';
    if (category === 'energy') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  };

  const getCategoryActiveBorderColor = (category: string) => {
    if (category === 'transport') return 'border-sky-500 bg-sky-500';
    if (category === 'food') return 'border-[#00E676] bg-[#00E676]';
    if (category === 'energy') return 'border-amber-400 bg-amber-400';
    return 'border-purple-500 bg-purple-500';
  };

  const getSubcategories = useMemo(() => {
    return EMISSION_FACTORS.filter((f) => f.category === activeCategory);
  }, [activeCategory]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#070B09] flex flex-col items-center justify-center text-[#00E676]">
        <div className="w-10 h-10 border-2 border-[#00E676]/20 border-t-[#00E676] rounded-full animate-spin mb-4" />
        <span className="font-mono text-xs tracking-widest uppercase">Syncing mainframes...</span>
      </div>
    );
  }

  return (
    <PageTransition>
      <>
        <TrackBackground />
        <div 
          className="min-h-screen text-[#F0FFF4] font-mono py-8 px-4 sm:px-6 lg:px-8 relative selection:bg-[#00E676]/30 selection:text-white pb-24"
          style={{ position: 'relative', zIndex: 1 }}
        >
        <div className="max-w-5xl mx-auto space-y-8 select-none">
          
          {/* ================= HERO TERMINAL BAR ================= */}
          <header className="relative border border-[#00E676]/30 bg-[#070B09]/90 p-6 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <CornerTicks />
            
            {/* Title / Subtitle */}
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-white tracking-wide uppercase leading-none">
                CARBON LOGGER
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-1.5 uppercase tracking-widest">
                Every action has an impact. Log yours.
              </p>
            </div>

            {/* Today's running total & LIVE indicator */}
            <div className="flex items-center space-x-6 shrink-0 sm:border-l border-[#1A2420] sm:pl-8">
              <div className="text-left">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block leading-none mb-1">Today&apos;s Logs</span>
                <span className="text-2xl font-bold font-mono text-white leading-none">
                  {todayRunningTotal.toFixed(2)} <span className="text-xs font-normal text-slate-500">kg CO₂</span>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 bg-[#004D00]/30 border border-[#00E676]/30 px-3 py-1.5 rounded-xl text-[10px] text-[#00E676] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse"></span>
                <span>● LIVE</span>
              </div>
            </div>
          </header>

          {/* ================= QUICK LOG PRESETS ================= */}
          <section className="flex flex-wrap gap-3 items-center">
            <span className="text-xs text-slate-500 uppercase tracking-widest mr-2">LOG PRESETS:</span>
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset)}
                className="bg-[#070B09] border border-[#1A2420] hover:border-[#00E676]/40 text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer"
              >
                <span>{preset.label}</span>
                <span className="text-[10px] text-slate-500">({preset.carbonStr})</span>
              </button>
            ))}
          </section>

          {/* ================= CATEGORY SELECTOR ================= */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['transport', 'food', 'energy', 'lifestyle'] as const).map((cat) => {
              const isActive = activeCategory === cat;
              // average daily footprint placeholders
              const avg = cat === 'transport' ? '4.5' : cat === 'food' ? '3.2' : cat === 'energy' ? '3.8' : '1.5';
              const iconEmoji = cat === 'transport' ? '🚗' : cat === 'food' ? '🍽️' : cat === 'energy' ? '⚡' : '👕';
              
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`h-20 rounded-2xl border transition-all duration-300 relative group flex flex-col items-center justify-center p-3 select-none cursor-pointer ${
                    isActive
                      ? `${getCategoryActiveBorderColor(cat)} text-black shadow-[0_0_20px_rgba(0,230,118,0.12)] border-transparent font-bold`
                      : 'bg-[#070B09] border-[#1A2420] text-slate-400 hover:border-[#00E676]/45 hover:text-[#00E676]'
                  }`}
                >
                  <span className={`text-xl group-hover:scale-110 transition-transform duration-300 ${isActive ? '' : 'grayscale-[40%]'}`}>
                    {iconEmoji}
                  </span>
                  <span className="font-display text-[19px] tracking-wider uppercase mt-1">
                    {cat}
                  </span>
                  <span className={`text-[9px] font-mono mt-0.5 opacity-60 ${isActive ? 'text-black font-bold' : 'text-slate-500'}`}>
                    avg {avg} kg/day
                  </span>
                </button>
              );
            })}
          </section>

          {/* ================= MAIN LOGGING PANEL ================= */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Panel: Sub-category selection (Grid) */}
            <div className="md:col-span-7 border border-[#1A2420] bg-[#070B09]/40 backdrop-blur-md rounded-2xl p-6 relative flex flex-col">
              <CornerTicks />
              <h3 className="font-heading font-extrabold text-sm uppercase text-white mb-4 tracking-wider select-none">
                Select Parameters
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 overflow-y-auto max-h-[360px] pr-1 scrollbar-thin">
                {getSubcategories.map((sub) => {
                  const isSelected = selectedSubCategory === sub.subCategory;
                  return (
                    <button
                      key={sub.subCategory}
                      onClick={() => setSelectedSubCategory(sub.subCategory)}
                      className={`h-[95px] p-3 rounded-xl border flex flex-col justify-between items-start text-left transition-all duration-300 relative group cursor-pointer ${
                        isSelected
                          ? 'border-[#00E676] bg-[#00E676]/10 text-white font-bold'
                          : 'bg-[#070B09]/80 border-[#1A2420] hover:-translate-y-1 text-slate-400 hover:text-[#00E676] hover:border-[#00E676]/30'
                      }`}
                    >
                      <span className="text-2xl leading-none select-none">{sub.icon}</span>
                      <div className="w-full">
                        <p className="text-[11px] font-mono truncate uppercase tracking-wide leading-tight">{sub.label}</p>
                        <p className="text-[9px] font-mono opacity-50 mt-0.5">unit: {sub.unit}</p>
                      </div>
                      {isSelected && (
                        <span className="absolute top-2 right-2 text-[#00E676] text-xs font-bold font-mono">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Value Input + Submit */}
            <form 
              onSubmit={handleLogActivity}
              className="md:col-span-5 border border-[#1A2420] bg-[#080C0A]/90 backdrop-blur-md rounded-2xl p-6 relative flex flex-col justify-between gap-6"
            >
              <CornerTicks />
              
              <div>
                <h3 className="font-heading font-extrabold text-sm uppercase text-white mb-4 tracking-wider">
                  Quantify Usage
                </h3>

                {/* Prominent Number Input */}
                <div className="flex items-center justify-center space-x-4 py-2 border-b border-[#1A2420] mb-4 relative group">
                  <button
                    type="button"
                    onClick={() => adjustValue(-1)}
                    className="p-2 bg-slate-900 border border-[#1A2420] hover:border-[#00E676]/40 text-[#00E676] rounded-xl hover:bg-[#004D00]/20 transition-all cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex items-baseline justify-center relative min-w-0 flex-1">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={inputValue}
                      onChange={(e) => handleValueChange(e.target.value)}
                      className="bg-transparent border-none text-center font-mono font-bold text-4xl text-white w-24 focus:outline-none placeholder-slate-700 min-w-0"
                    />
                    <span className="text-sm font-mono text-slate-500 uppercase tracking-widest ml-1 select-none">
                      {activeFactor.unit}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => adjustValue(1)}
                    className="p-2 bg-slate-900 border border-[#1A2420] hover:border-[#00E676]/40 text-[#00E676] rounded-xl hover:bg-[#004D00]/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Range Slider */}
                <div className="space-y-1 mt-6">
                  <input
                    type="range"
                    min="0"
                    max={activeCategory === 'transport' ? '200' : activeCategory === 'food' ? '5' : activeCategory === 'energy' ? '150' : '10'}
                    step={activeCategory === 'food' ? '0.05' : '1'}
                    value={inputValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    className="w-full h-1 bg-[#1A2420] rounded-lg appearance-none cursor-pointer accent-[#00E676] focus:outline-none"
                  />
                  <div className="flex justify-between text-[8px] text-slate-600 font-mono select-none">
                    <span>MIN: 0</span>
                    <span>SLIDER SCALE</span>
                  </div>
                </div>

                {/* Live calculation displays */}
                <div className="mt-8 p-4 bg-slate-950/40 border border-[#1A2420] rounded-xl text-center space-y-2 select-none relative overflow-hidden">
                  <span className="text-[9px] font-heading font-extrabold uppercase text-slate-500 tracking-wider block">Estimated Emissions</span>
                  <div className={`text-3xl font-mono font-bold leading-none ${getCarbonLevelColor(tempEmissions)}`}>
                    <AnimatedCarbonText value={tempEmissions} />
                  </div>
                  
                  {/* Context Comparison */}
                  <div className="text-[10px] font-mono text-slate-400 mt-2 flex items-center justify-center space-x-1.5">
                    <span className="bg-slate-900 border border-[#1A2420] px-2 py-0.5 rounded flex items-center space-x-1">
                      <span>🌲</span>
                      <span className="font-bold text-white">={getTreeEquivalent(tempEmissions).toFixed(2)}%</span>
                      <span className="text-slate-500">of tree absorption / yr</span>
                    </span>
                  </div>
                </div>

                {/* Optional Notes */}
                <div className="mt-6">
                  <textarea
                    rows={1}
                    placeholder="Add notes (optional)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#070B09] border border-[#1A2420] rounded-xl px-3 py-2 text-[11px] font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#00E676]/45"
                  />
                </div>
              </div>

              {/* Submit button with hover/tap animations */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 230, 118, 0.4)' }}
                whileTap={{ scale: 0.96 }}
                className="w-full py-3.5 rounded-xl bg-[#00E676] text-black font-display text-xl font-bold hover:brightness-105 tracking-wider uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>LOG ACTIVITY</span>
              </motion.button>

            </form>
          </div>

          {/* ================= DYNAMIC IMPACT PREVIEW ================= */}
          <section className="relative border border-[#1A2420] bg-[#070B09]/40 backdrop-blur-md p-6 rounded-2xl space-y-4">
            <CornerTicks />
            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-xs gap-2 select-none">
              <span className="font-heading font-extrabold uppercase text-white tracking-wider">Projected Daily Threshold</span>
              <span className="font-mono text-slate-400">
                Today: <span className="font-bold text-white">{todayRunningTotal.toFixed(1)}kg</span> + Entry: <span className="font-bold text-[#00E676]">{tempEmissions.toFixed(1)}kg</span> = <span className={`font-bold ${projectedTotal > budgetLimit ? 'text-[#FF5252]' : 'text-white'}`}>{projectedTotal.toFixed(1)}kg</span> of {budgetLimit.toFixed(1)}kg
              </span>
            </div>

            {/* Custom bar chart normalized to 15kg */}
            <div className="space-y-1.5 select-none">
              <div className="w-full h-3 bg-slate-950 border border-[#1A2420] rounded-full overflow-hidden flex relative">
                {/* Today's carbon */}
                <div 
                  className="h-full bg-slate-800 transition-all duration-300" 
                  style={{ width: `${barTodayPct}%` }}
                />
                {/* New carbon */}
                <div 
                  className={`h-full transition-all duration-300 ${
                    projectedTotal < 7.0 
                      ? 'bg-[#00E676]' 
                      : projectedTotal < 13.0 
                        ? 'bg-amber-400' 
                        : 'bg-[#FF5252]'
                  }`}
                  style={{ width: `${barNewPct}%` }}
                />
                
                {/* Budget Limit line */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-[#FF5252]" 
                  style={{ left: `${(budgetLimit / scaleMax) * 100}%` }}
                />
              </div>
              
              <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                <span>0.0 KG</span>
                <span style={{ marginRight: `${((scaleMax - budgetLimit) / scaleMax) * 100}%` }} className="text-[#FF5252] font-bold">BUDGET LIMIT ({budgetLimit} KG)</span>
                <span>{scaleMax.toFixed(0)} KG</span>
              </div>
            </div>
          </section>

          {/* ================= AI SUGGESTION TYPEWRITER SIDEBAR ================= */}
          <section className="relative border border-[#1A2420] bg-[#070B09]/40 backdrop-blur-md p-6 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-6 select-none min-h-[90px]">
            <CornerTicks />
            <div className="flex items-center space-x-3 shrink-0">
              <div className="p-3 bg-[#004D00]/20 border border-[#00E676]/30 text-[#00E676] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-heading font-extrabold uppercase text-white tracking-wider">AI Tip</p>
                <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">for {activeFactor.label}</p>
              </div>
            </div>

            <div className="flex-1 text-xs leading-relaxed text-slate-300 font-mono">
              {aiLoading ? (
                <div className="space-y-1.5 animate-pulse">
                  <div className="h-3 w-40 bg-slate-800 rounded" />
                  <div className="h-3 w-full bg-slate-900 rounded" />
                </div>
              ) : (
                aiTip && (
                  <p className="text-white/95">
                    💡 <TypewriterText text={aiTip} />
                  </p>
                )
              )}
            </div>
          </section>

          {/* ================= RECENT LOGS TABLE ================= */}
          <section className="relative border border-[#1A2420] bg-[#070B09]/40 backdrop-blur-md p-6 rounded-2xl space-y-6">
            <CornerTicks />
            <div className="flex items-center justify-between border-b border-[#1A2420]/80 pb-4">
              <h2 className="font-display text-2xl text-white uppercase tracking-wider">Today&apos;s Logs</h2>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                TELEMETRY REPORT
              </span>
            </div>

            {todayActivities.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-600 font-mono space-y-2 select-none">
                <Database className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                <p className="uppercase tracking-widest font-bold">No activities logged today</p>
                <p className="text-[10px] text-slate-700">Logs will populate this table automatically upon creation</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[#1A2420] text-slate-500 text-[10px] uppercase tracking-widest">
                      <th className="py-3 px-2">Time</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-2">Sub-category</th>
                      <th className="py-3 px-2 text-right">Value</th>
                      <th className="py-3 px-2 text-right">Carbon</th>
                      <th className="py-3 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {todayActivities.map((act) => {
                        const isSelectedForDelete = deleteConfirmId === act.id;
                        return (
                          <motion.tr
                            key={act.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            transition={{ duration: 0.3 }}
                            className="border-b border-[#1A2420]/45 hover:bg-slate-900/10 transition-colors group"
                          >
                            <td className="py-3.5 px-2 text-slate-450">{formatTime(act.timestamp)}</td>
                            <td className="py-3.5 px-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold border ${getCategoryThemeColor(act.category)}`}>
                                {act.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-2 text-white font-bold uppercase tracking-wider">{act.subCategory.replace('_', ' ')}</td>
                            <td className="py-3.5 px-2 text-right text-slate-400">
                              {act.value} {act.unit}
                            </td>
                            <td className={`py-3.5 px-2 text-right font-bold ${getCarbonWeightColor(act.carbonKg)}`}>
                              +{act.carbonKg.toFixed(2)} kg
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              {isSelectedForDelete ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => {
                                      removeActivity(act.id);
                                      setDeleteConfirmId(null);
                                      showToast('Deleted', 'Entry removed from memory');
                                    }}
                                    className="px-2 py-1 bg-[#FF5252]/10 border border-[#FF5252]/25 text-[#FF5252] rounded-lg hover:bg-[#FF5252] hover:text-white transition-all text-[9px] font-bold cursor-pointer"
                                  >
                                    YES
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-2 py-1 bg-slate-900 border border-[#1A2420] text-slate-500 rounded-lg hover:text-white transition-all text-[9px] font-bold cursor-pointer"
                                  >
                                    NO
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(act.id)}
                                  className="opacity-0 group-hover:opacity-100 p-2 bg-[#FF5252]/10 border border-[#FF5252]/20 text-[#FF5252] rounded-xl hover:bg-[#FF5252] hover:text-white transition-all focus:outline-none cursor-pointer"
                                  aria-label="Delete entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>

        {/* ================= FLOATING TOAST NOTIFICATIONS ================= */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 35, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="pointer-events-auto bg-[#070B09] border border-[#00E676] px-5 py-3.5 rounded-xl shadow-lg flex items-center space-x-3 select-none"
              >
                <span className="text-[#00E676] font-bold text-base select-none">✓</span>
                <div>
                  <p className="text-xs font-heading font-extrabold uppercase text-white leading-none">{t.message}</p>
                  <p className="text-[10px] font-mono text-[#00E676] mt-1 leading-none">{t.sub}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        </div>
      </>
    </PageTransition>
  );
}
