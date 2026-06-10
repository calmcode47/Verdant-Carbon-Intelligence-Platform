/**
 * @file page.tsx
 * @description AI Insights page for the Verdant Carbon Intelligence Platform.
 * Theme: Quantum Analysis Laboratory.
 * Palette: Deep indigo (#06041A), electric violet (#7C3AED), neon teal (#00E5FF), luminous white (#F0F4FF).
 * Renders Three.js constellation background, AI status header with rotating 3D core, masonry grid
 * with custom interactive cards (collapsible TIP, sparkline WARNING, confetti ACHIEVEMENT, projection PREDICTION),
 * an AI chat console, radar/bar category deep-dives, and an animated SVG fingerprint generator.
 */

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { WebGLErrorBoundary } from '@/components/three/WebGLErrorBoundary';
import { useCarbonStore } from '@/store/carbon-store';
import { useIsInView } from '@/hooks/useIsInView';
import { safeAsync } from '@/lib/errors';
import { ActivityCategory, AIInsight } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Award,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Send,
  User,
  Cpu,
  Share2,
  Check,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Legend
} from 'recharts';



const NeuralCore = dynamic(
  () => import('@/components/three/NeuralCore'),
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
import FingerprintSVG from '@/components/insights/FingerprintSVG';
import Confetti from '@/components/insights/Confetti';
import { PageTransition } from '@/components/layout/PageTransition';
import { InsightsBackground } from '@/components/backgrounds';

// --- CUSTOM TYPEWRITER COMPONENT ---
function Typewriter({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let idx = 0;
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(idx));
      idx++;
      if (idx >= text.length) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 12);
    return () => clearInterval(timer);
  }, [text, onComplete]);

  return <span className="whitespace-pre-line">{displayedText}</span>;
}

// --- CHAT MESSAGE INTERFACE ---
interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isNew?: boolean;
}


function WarningSparkline({ data }: { data: { day: string; carbon: number }[] }) {
  const { ref, inView } = useIsInView();
  return (
    <div ref={ref} className="flex-1 h-full pr-4">
      {inView ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey="carbon" 
              stroke="#FFB300" 
              strokeWidth={2} 
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="skeleton w-full h-full" />
      )}
    </div>
  );
}

function PredictionChart({ data }: { data: { day: string; actual: number | null; projected: number }[] }) {
  const { ref, inView } = useIsInView();
  return (
    <div ref={ref} className="h-24 bg-[#06041A]/50 border border-[#7C3AED]/15 rounded-xl p-2 pr-4">
      {inView ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis 
              dataKey="day" 
              stroke="#64748b" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false} 
            />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#00E5FF" 
              strokeWidth={2} 
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="projected" 
              stroke="#7C3AED" 
              strokeWidth={1.5} 
              strokeDasharray="4 4" 
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="skeleton w-full h-full" />
      )}
    </div>
  );
}

export default function InsightsPage() {
  const activities = useCarbonStore((state) => state.activities);
  const summary = useCarbonStore((state) => state.summary);
  const challenges = useCarbonStore((state) => state.challenges);
  const createChallengeFromInsight = useCarbonStore((state) => state.createChallengeFromInsight);
  const { ref: radarChartRef, inView: radarChartInView } = useIsInView();
  const { ref: barChartRef, inView: barChartInView } = useIsInView();

  // Component Mount check to prevent Recharts/Next hydration mismatch
  const [mounted, setMounted] = useState(false);

  // States
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [pageSummary, setPageSummary] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [activeTab, setActiveTab] = useState<ActivityCategory>('transport');
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);
  
  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am Verdant's Carbon Intelligence module. I've aggregated your recent carbon metrics and established a behavioral fingerprint. Ask me anything about your footprint or request a tailored reduction plan.",
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Toast States
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Initial Insights Fetching
  useEffect(() => {
    setMounted(true);
    const fetchInitialInsights = async () => {
      setIsAnalyzing(true);
      const [data, error] = await safeAsync(
        fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activities: activities,
            summary: summary,
          }),
        }).then(async (res) => {
          if (!res.ok) throw new Error('API request failed');
          return res.json();
        })
      );

      if (error) {
        console.error('Failed to load initial insights:', error.message);
        setIsAnalyzing(false);
        return;
      }

      if (data) {
        setInsights(data.insights || []);
        setPageSummary(data.summary || '');
      }
      setIsAnalyzing(false);
    };

    fetchInitialInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Chat Scroll-to-Bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // 3. Trigger Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 4. Create Challenge from Insight Tip
  const applyInsightAsChallenge = async (insight: AIInsight) => {
    // Check if challenge already exists
    const exists = challenges.some(c => c.title === insight.title);
    if (exists) {
      triggerToast('Challenge is already active in your command center!');
      return;
    }

    try {
      await createChallengeFromInsight(insight);
      triggerToast(`Added challenge: "${insight.title}"`);
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Unable to create challenge.');
    }
  };

  // 5. Send Chat Message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setUserInput('');
    setIsChatLoading(true);

    try {
      const [data, error] = await safeAsync(
        fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activities: activities,
            summary: summary,
            userQuestion: textToSend,
          }),
        }).then(async (res) => {
          if (!res.ok) throw new Error('API request failed');
          return res.json();
        })
      );

      if (error) {
        console.error(error);
        const errorMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: 'Connection error in the neural array. Unable to query Gemini core at this time.',
        };
        setChatMessages((prev) => [...prev, errorMsg]);
        return;
      }

      if (data) {
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: data.chatResponse || 'I could not generate an answer for that. Please try again.',
          isNew: true,
        };
        setChatMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 6. Share Fingerprint Actions
  const handleShareFingerprint = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('Check out my unique Carbon Fingerprint on Verdant! Lowering emissions, one day at a time.');
      triggerToast('Copied sharing template to clipboard!');
    } else {
      triggerToast('Sharing options initialized.');
    }
  };

  // --- CHART MOCK DATA GENERATORS ---
  const warningSparklineData = [
    { day: 'Mon', carbon: 3.2 },
    { day: 'Tue', carbon: 3.0 },
    { day: 'Wed', carbon: 4.8 },
    { day: 'Thu', carbon: 3.9 },
    { day: 'Fri', carbon: 6.5 },
    { day: 'Sat', carbon: 5.8 },
    { day: 'Sun', carbon: 8.2 },
  ];

  const predictionProjectionData = [
    { day: 'Wk 1', actual: 92, projected: 92 },
    { day: 'Wk 2', actual: 88, projected: 88 },
    { day: 'Wk 3', actual: null, projected: 85 },
    { day: 'Wk 4', actual: null, projected: 78 },
  ];

  // Radar chart comparing user category metrics vs global average
  const getRadarDataForCategory = (cat: ActivityCategory) => {
    const userVal = summary?.categoryBreakdown[cat] || 0;
    // Stand-in subcategory values for user vs global
    if (cat === 'transport') {
      return [
        { subject: 'Commutes', User: userVal * 0.5, Average: 2.2 },
        { subject: 'Roadtrips', User: userVal * 0.3, Average: 1.5 },
        { subject: 'Public Transit', User: userVal * 0.1, Average: 0.5 },
        { subject: 'Flights', User: userVal * 0.1, Average: 0.3 },
      ];
    }
    if (cat === 'food') {
      return [
        { subject: 'Red Meat', User: userVal * 0.6, Average: 1.8 },
        { subject: 'Dairy/Cheese', User: userVal * 0.2, Average: 0.8 },
        { subject: 'Vegetables', User: userVal * 0.1, Average: 0.4 },
        { subject: 'Processed Food', User: userVal * 0.1, Average: 0.2 },
      ];
    }
    if (cat === 'energy') {
      return [
        { subject: 'Heating', User: userVal * 0.4, Average: 1.5 },
        { subject: 'Aircon', User: userVal * 0.3, Average: 1.2 },
        { subject: 'Lighting', User: userVal * 0.15, Average: 0.6 },
        { subject: 'Electronics', User: userVal * 0.15, Average: 0.5 },
      ];
    }
    // lifestyle
    return [
      { subject: 'Apparel', User: userVal * 0.4, Average: 0.6 },
      { subject: 'Gadgets', User: userVal * 0.3, Average: 0.4 },
      { subject: 'Services', User: userVal * 0.2, Average: 0.3 },
      { subject: 'Delivery Goods', User: userVal * 0.1, Average: 0.2 },
    ];
  };

  const getSubcategories = (cat: ActivityCategory) => {
    if (cat === 'transport') return ['Driving (Gasoline)', 'Uber/Lyft Rides', 'Short Commutes'];
    if (cat === 'food') return ['Red Meat Consumption', 'Cheese & Dairy Intake', 'Imported Out-of-season Produce'];
    if (cat === 'energy') return ['Electric HVAC Heating', 'Standby Vampire Appliances', 'High Temp Laundry Cycles'];
    return ['Fast Fashion Apparel', 'Digital Device Upgrades', 'Express Home Deliveries'];
  };

  // 30 days daily trend mock generator
  const getHistoricalTrend = (cat: ActivityCategory) => {
    const base = cat === 'transport' ? 4.5 : cat === 'food' ? 3.2 : cat === 'energy' ? 3.8 : 1.5;
    return Array.from({ length: 10 }).map((_, idx) => ({
      name: `Day ${idx * 3 + 1}`,
      Emissions: Number((base * (0.6 + Math.random() * 0.8)).toFixed(1)),
      Average: base,
    }));
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#06041A] flex items-center justify-center text-slate-400 font-mono">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-t-[#00E5FF] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
          <span>CONNECTING TO QUANTUM TERMINAL...</span>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <>
        <InsightsBackground />
        <div 
          className="min-h-screen text-[#F0F4FF] font-sans pb-20 relative select-none"
          style={{ position: 'relative', zIndex: 1 }}
        >


        {/* Global Floating Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 right-6 z-50 bg-[#06041A]/95 border-2 border-[#00E5FF]/80 text-[#00E5FF] px-5 py-3 rounded-2xl shadow-[0_0_25px_rgba(0,229,255,0.4)] font-mono text-xs flex items-center space-x-2.5 backdrop-blur-md"
            >
              <Check className="w-4 h-4 text-[#00E676] stroke-[3]" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 space-y-12">
          
          {/* ================= HERO Status Header ================= */}
          <header className="bg-[#0b082e]/55 border border-[#7C3AED]/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md relative overflow-hidden">
            {/* Glowing Corner Ticks */}
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00E5FF]" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00E5FF]" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#7C3AED]" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#7C3AED]" />

            <div className="space-y-4 flex-1">
              <div>
                <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-wider leading-none text-white drop-shadow-[0_0_15px_rgba(124,58,237,0.35)]">
                  CARBON INTELLIGENCE
                </h1>
                <div className="flex items-center space-x-3 mt-2 font-mono text-sm text-[#00E5FF]">
                  <span>Powered by Google Gemini AI</span>
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05] animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] animate-bounce" style={{ animationDelay: '450ms' }} />
                  </div>
                </div>
              </div>

              {/* Loading Bar */}
              <div className="space-y-1.5 max-w-md">
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                  <span>{isAnalyzing ? 'RUNNING NEURAL MODEL...' : 'DATA PIPELINE ACTIVE'}</span>
                  <span>{isAnalyzing ? '78% RESOLVED' : '100% SYNCED'}</span>
                </div>
                <div className="h-2 bg-[#06041A] rounded-full overflow-hidden border border-[#7C3AED]/20 relative">
                  <div 
                    className={`h-full bg-gradient-to-r from-[#7C3AED] to-[#00E5FF] transition-all duration-[1500ms] ${
                      isAnalyzing ? 'w-[78%] animate-pulse' : 'w-full'
                    }`}
                  />
                </div>
              </div>

              {pageSummary && (
                <p className="font-sans text-xs md:text-sm text-slate-300 border-l-2 border-[#7C3AED]/50 pl-3.5 leading-relaxed max-w-2xl">
                  {pageSummary}
                </p>
              )}
            </div>

            {/* NeuralCore AI Core Widget */}
            <div className="w-[160px] h-[160px] flex justify-center md:justify-end flex-shrink-0 select-none">
              <Suspense fallback={null}>
                <div
                  role="img"
                  aria-label="AI intelligence core visualization"
                  style={{ width: '100%', height: '100%' }}
                >
                  <WebGLErrorBoundary>
                    <NeuralCore />
                  </WebGLErrorBoundary>
                </div>
              </Suspense>
            </div>
          </header>

          {/* ================= AI CHAT INTERFACE ================= */}
          <section className="space-y-6">
            <div className="border-b border-[#7C3AED]/10 pb-3 flex flex-col md:flex-row md:items-end justify-between gap-2">
              <div>
                <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-wider text-white">
                  GEMINI CARBON ADVISOR
                </h2>
                <p className="font-sans text-xs text-slate-400 mt-1">
                  Ask Gemini first: get a practical carbon reduction answer before exploring the detailed analysis grid.
                </p>
              </div>
            </div>

            {/* Chat Frame */}
            <div className="bg-[#0b082e]/55 border border-[#7C3AED]/20 rounded-3xl p-5 md:p-6 backdrop-blur-md flex flex-col h-[480px] relative overflow-hidden">
              {/* Corner Ticks */}
              <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#00E5FF]" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-[#00E5FF]" />
              <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-[#7C3AED]" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#7C3AED]" />

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 scrollbar-thin scrollbar-thumb-[#7C3AED]/20 scrollbar-track-transparent">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex items-start gap-3.5 max-w-[85%] ${
                      msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border flex-shrink-0 ${
                      msg.sender === 'user' 
                        ? 'bg-[#7C3AED]/20 border-[#7C3AED]' 
                        : 'bg-[#00E5FF]/20 border-[#00E5FF]'
                    }`}>
                      {msg.sender === 'user' ? <User className="w-4 h-4 text-[#7C3AED]" /> : <Cpu className="w-4 h-4 text-[#00E5FF]" />}
                    </div>

                    {/* Speech Bubble */}
                    <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-[#7C3AED]/65 text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
                        : 'bg-[#06041A]/75 text-slate-200 border border-[#7C3AED]/15'
                    }`}>
                      {msg.sender === 'ai' && msg.isNew ? (
                        <Typewriter
                          text={msg.text}
                          onComplete={() => {
                            setChatMessages((messages) =>
                              messages.map((message) =>
                                message.id === msg.id ? { ...message, isNew: false } : message
                              )
                            );
                          }}
                        />
                      ) : (
                        <span className="whitespace-pre-line">{msg.text}</span>
                      )}
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex items-start gap-3.5 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center border bg-[#00E5FF]/20 border-[#00E5FF] animate-pulse">
                      <Cpu className="w-4 h-4 text-[#00E5FF]" />
                    </div>
                    {/* Skeleton loading bubbles */}
                    <div className="bg-[#06041A]/75 border border-[#7C3AED]/15 rounded-2xl px-4 py-3 text-xs text-slate-400 space-y-1.5 w-64 animate-pulse">
                      <div className="h-3 bg-[#7C3AED]/25 w-3/4 rounded" />
                      <div className="h-3 bg-[#7C3AED]/15 w-5/6 rounded" />
                      <div className="h-3 bg-[#7C3AED]/15 w-2/3 rounded" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Chips Preset Questions */}
              <div className="flex flex-wrap gap-2 mb-4 border-t border-[#7C3AED]/10 pt-3">
                {[
                  "How can I reduce my transport emissions?",
                  "What's my biggest carbon source?",
                  "Give me a 7-day reduction plan",
                  "How does my footprint compare globally?"
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSendMessage(chip)}
                    className="bg-[#06041A] border border-[#7C3AED]/20 hover:border-[#00E5FF]/60 text-slate-400 hover:text-white px-3 py-1.5 rounded-full text-[10px] font-mono transition-colors cursor-pointer select-none"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input Field */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(userInput);
                }} 
                className="flex items-center gap-3 relative"
              >
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask Gemini Carbon Advisor (e.g. Give me a 7-day commute reduction plan...)"
                  className="flex-1 bg-[#06041A]/85 border border-[#7C3AED]/35 focus:border-[#00E5FF] focus:outline-none rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-500 font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || isChatLoading}
                  className="bg-gradient-to-tr from-[#7C3AED] to-[#00E5FF] hover:opacity-90 disabled:opacity-50 text-black p-3.5 rounded-2xl transition-all duration-300 flex-shrink-0 cursor-pointer shadow-[0_0_15px_rgba(124,58,237,0.2)]"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            </div>
          </section>

          {/* ================= MAIN INSIGHTS GRID ================= */}
          <section className="space-y-6">
            <h2 className="font-heading text-2xl font-bold tracking-wider text-white border-b border-[#7C3AED]/10 pb-3 flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-[#00E5FF]" />
              <span>MASONRY ANALYSIS GRID</span>
            </h2>

            {isAnalyzing ? (
              // Loading Skeleton Grid
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="bg-[#0b082e]/40 border border-[#7C3AED]/10 rounded-2xl p-6 h-60 animate-pulse space-y-4">
                    <div className="h-4 bg-[#7C3AED]/20 w-1/4 rounded" />
                    <div className="h-6 bg-[#00E5FF]/20 w-3/4 rounded" />
                    <div className="h-16 bg-[#F0F4FF]/10 w-full rounded" />
                    <div className="h-8 bg-[#7C3AED]/10 w-1/3 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              // Masonry layout with custom cards
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 [column-fill:_balance]">
                {insights.map((insight, idx) => {
                  const isExpanded = expandedTipId === insight.id;
                  
                  if (insight.type === 'tip') {
                    return (
                      <motion.div
                        key={insight.id || idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="break-inside-avoid bg-[#0b082e]/55 border-l-4 border-l-[#00E5FF] border border-[#7C3AED]/10 hover:border-[#00E5FF]/30 hover:shadow-[0_0_20px_rgba(0,229,255,0.06)] hover:scale-[1.02] rounded-r-2xl rounded-l-md p-6 space-y-4 transition-all duration-300 relative flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[10px] text-[#00E5FF] tracking-[0.15em] uppercase font-bold">
                              💡 INSIGHT
                            </span>
                            <span className="flex items-center space-x-1 bg-[#00E5FF]/10 text-[#00E5FF] px-2 py-0.5 rounded-full text-[9px] font-mono">
                              <span className="w-1 h-1 rounded-full bg-[#00E5FF]" />
                              <span className="capitalize">{insight.category}</span>
                            </span>
                          </div>

                          <h3 className="font-heading text-lg font-bold text-white leading-tight">
                            {insight.title}
                          </h3>
                          <p className="font-sans text-xs text-slate-300 leading-relaxed">
                            {insight.description}
                          </p>

                          {/* Collapsible Action Items */}
                          <div className="bg-[#06041A]/60 rounded-xl overflow-hidden border border-[#7C3AED]/10">
                            <button
                              onClick={() => setExpandedTipId(isExpanded ? null : (insight.id || ''))}
                              className="w-full px-3 py-2 flex items-center justify-between text-[10px] font-mono text-slate-400 hover:text-white transition-colors"
                            >
                              <span>ACTION RECOMMENDATIONS</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.ul
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="px-3 pb-3 space-y-1.5 font-sans text-xs text-slate-300 border-t border-[#7C3AED]/5"
                                >
                                  {insight.actionItems?.map((step, i) => (
                                    <li key={i} className="flex items-start space-x-2 pt-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] mt-1.5 flex-shrink-0" />
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </motion.ul>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Card Footer badges and Apply */}
                        <div className="pt-3.5 border-t border-[#7C3AED]/10 flex flex-wrap items-center justify-between gap-3 mt-3">
                          <div className="flex items-center space-x-3">
                            <span className="bg-[#00E5FF] text-black text-[10px] font-bold px-2 py-1 rounded-lg font-mono">
                              -{insight.potentialSavingKg} kg/week
                            </span>
                            <span className="flex items-center space-x-1 text-[10px] font-mono text-slate-400 capitalize">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                insight.difficulty === 'easy' ? 'bg-[#00E676]' : insight.difficulty === 'medium' ? 'bg-[#FFB300]' : 'bg-[#FF5252]'
                              }`} />
                              <span>{insight.difficulty}</span>
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              applyInsightAsChallenge(insight);
                            }}
                            className="bg-[#00E5FF]/10 border border-[#00E5FF]/30 hover:bg-[#00E5FF] hover:text-black text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all duration-300 cursor-pointer flex items-center space-x-1"
                          >
                            <span>APPLY THIS</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  }

                  if (insight.type === 'warning') {
                    return (
                      <motion.div
                        key={insight.id || idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="break-inside-avoid bg-[#0b082e]/55 border-l-4 border-l-[#FFB300] border border-[#7C3AED]/10 hover:border-[#FFB300]/30 hover:scale-[1.02] rounded-r-2xl rounded-l-md p-6 space-y-4 transition-all duration-300"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] text-[#FFB300] tracking-[0.15em] uppercase font-bold flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#FFB300]" />
                            <span>ALERT</span>
                          </span>
                          <span className="bg-[#FFB300]/10 text-[#FFB300] px-2 py-0.5 rounded-full text-[9px] font-mono capitalize">
                            {insight.category}
                          </span>
                        </div>

                        <h3 className="font-heading text-lg font-bold text-white leading-tight">
                          {insight.title}
                        </h3>
                        <p className="font-sans text-xs text-slate-300 leading-relaxed">
                          {insight.description}
                        </p>

                        {/* Sparkline chart */}
                        <div className="h-16 bg-[#06041A]/50 border border-[#FFB300]/15 rounded-xl p-2 flex items-center justify-between">
                          <WarningSparkline data={warningSparklineData} />
                          <div className="text-right flex flex-col justify-center">
                            <span className="text-[9px] font-mono text-slate-400 block leading-none">PEAK INC.</span>
                            <span className="text-lg font-bold text-[#FF5252] font-mono leading-none mt-1">+32%</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  if (insight.type === 'achievement') {
                    return (
                      <motion.div
                        key={insight.id || idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="break-inside-avoid bg-[#0b082e]/55 border-l-4 border-l-[#00E676] border border-[#7C3AED]/10 hover:border-[#00E676]/30 hover:scale-[1.02] rounded-r-2xl rounded-l-md p-6 space-y-4 transition-all duration-300 relative overflow-hidden"
                      >
                        {/* Confetti element triggers on mount */}
                        <Confetti />

                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] text-[#00E676] tracking-[0.15em] uppercase font-bold flex items-center space-x-1 relative z-10">
                            <Award className="w-3.5 h-3.5 text-[#00E676]" />
                            <span>MILESTONE</span>
                          </span>
                          <span className="bg-[#00E676]/10 text-[#00E676] px-2 py-0.5 rounded-full text-[9px] font-mono capitalize relative z-10">
                            {insight.category}
                          </span>
                        </div>

                        <h3 className="font-heading text-lg font-bold text-white leading-tight relative z-10">
                          {insight.title}
                        </h3>
                        <p className="font-sans text-xs text-slate-300 leading-relaxed relative z-10">
                          {insight.description}
                        </p>

                        {/* Comparison blocks */}
                        <div className="grid grid-cols-2 gap-3 relative z-10">
                          <div className="bg-[#06041A]/50 border border-[#7C3AED]/10 rounded-xl p-3 text-center">
                            <span className="text-[9px] font-mono text-slate-400 block mb-1">BEFORE (AVG)</span>
                            <span className="text-sm font-bold font-mono text-slate-300 line-through">45.2 kg</span>
                          </div>
                          <div className="bg-[#00E676]/5 border border-[#00E676]/25 rounded-xl p-3 text-center">
                            <span className="text-[9px] font-mono text-[#00E676] block mb-1">AFTER (CURRENT)</span>
                            <span className="text-sm font-bold font-mono text-[#00E676]">36.7 kg</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // Prediction type card
                  return (
                    <motion.div
                      key={insight.id || idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="break-inside-avoid bg-[#0b082e]/55 border-l-4 border-l-[#7C3AED] border border-[#7C3AED]/10 hover:border-[#7C3AED]/30 hover:scale-[1.02] rounded-r-2xl rounded-l-md p-6 space-y-4 transition-all duration-300"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] text-[#7C3AED] tracking-[0.15em] uppercase font-bold flex items-center space-x-1">
                          <TrendingUp className="w-3.5 h-3.5 text-[#7C3AED]" />
                          <span>FORECAST</span>
                        </span>
                        <span className="bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-0.5 rounded-full text-[9px] font-mono capitalize">
                          {insight.category}
                        </span>
                      </div>

                      <h3 className="font-heading text-lg font-bold text-white leading-tight">
                        {insight.title}
                      </h3>
                      <p className="font-sans text-xs text-slate-300 leading-relaxed">
                        {insight.description}
                      </p>

                      {/* Prediction Chart */}
                      <PredictionChart data={predictionProjectionData} />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ================= CATEGORY DEEP-DIVE ================= */}
          <section className="space-y-6">
            <h2 className="font-heading text-2xl font-bold tracking-wider text-white border-b border-[#7C3AED]/10 pb-3 flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-[#00E676]" />
              <span>CATEGORY DEEP-DIVE ANALYSIS</span>
            </h2>

            {/* Category Tabs */}
            <div className="grid grid-cols-4 gap-2 border-b border-[#7C3AED]/20 pb-3">
              {(['transport', 'food', 'energy', 'lifestyle'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`py-3.5 text-center text-xs font-mono tracking-widest uppercase transition-all relative select-none cursor-pointer ${
                    activeTab === cat
                      ? 'text-[#00E5FF] font-bold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {cat === 'transport' ? '🚗 TRANS' : cat === 'food' ? '🍽️ FOOD' : cat === 'energy' ? '⚡ ENERGY' : '👕 LIFE'}
                  {activeTab === cat && (
                    <motion.span 
                      layoutId="activeTabUnderline" 
                      className="absolute bottom-[-3px] left-0 right-0 h-1 bg-[#00E5FF] rounded-full shadow-[0_0_10px_#00E5FF]" 
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Panel Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-[#0b082e]/35 border border-[#7C3AED]/15 rounded-3xl p-6 md:p-8 backdrop-blur-md relative">
              
              {/* Left Side: RadarChart comparison */}
              <div className="space-y-4">
                <span className="font-mono text-[10px] text-slate-400 block tracking-widest uppercase">
                  USER VS WORLD AVERAGE
                </span>
                
                <div ref={radarChartRef} className="h-64 flex items-center justify-center relative">
                  {mounted && radarChartInView ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getRadarDataForCategory(activeTab)}>
                        <PolarGrid stroke="#2e2a56" />
                        <PolarAngleAxis dataKey="subject" stroke="#8b9bb4" fontSize={9} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#4f4c7d" fontSize={8} />
                        <Radar name="You" dataKey="User" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.25} />
                        <Radar name="Global Average" dataKey="Average" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.15} />
                        <Legend verticalAlign="bottom" height={24} fontSize={9} wrapperStyle={{ fontSize: '10px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="skeleton w-full h-full" style={{ height: 256, borderRadius: 24 }} />
                  )}
                </div>
              </div>

              {/* Right Side: Contributor list & daily bar chart */}
              <div className="space-y-6 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 block tracking-widest uppercase mb-3">
                    TOP METRIC CONTRIBUTORS
                  </span>
                  <ul className="space-y-2.5">
                    {getSubcategories(activeTab).map((item, idx) => (
                      <li key={idx} className="bg-[#06041A]/55 border border-[#7C3AED]/15 rounded-2xl px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="w-5 h-5 rounded-lg bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center font-mono text-xs">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-sans text-slate-200">{item}</span>
                        </div>
                        <span className="font-mono text-xs text-[#FF5252] font-semibold">
                          +{idx === 0 ? '42%' : idx === 1 ? '28%' : '14%'} impact
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Historical daily trend */}
                <div className="space-y-3">
                  <span className="font-mono text-[10px] text-slate-400 block tracking-widest uppercase">
                    30-DAY DAILY PATHWAY (KG CO₂)
                  </span>
                  <div ref={barChartRef} className="h-24 pr-4">
                    {mounted && barChartInView ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getHistoricalTrend(activeTab)}>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: '#06041A', border: '1px solid #7C3AED', fontSize: '10px' }} />
                          <Bar dataKey="Emissions" fill="#00E676" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="Average" fill="#7C3AED" opacity={0.3} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="skeleton w-full h-full" style={{ height: 96, borderRadius: 12 }} />
                    )}
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* ================= PERSONALIZATION SECTION ================= */}
          <section className="bg-gradient-to-r from-[#0b082e]/70 via-[#18114c]/40 to-[#0b082e]/70 border border-[#7C3AED]/35 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md relative overflow-hidden">
            {/* Corner Ticks */}
            <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#7C3AED]" />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#00E5FF]" />

            <div className="space-y-4 max-w-xl text-center md:text-left">
              <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-wider text-white">
                YOUR CARBON FINGERPRINT
              </h2>
              <p className="font-sans text-xs md:text-sm text-slate-300 leading-relaxed">
                This fingerprint represents your environmental identity. Its loops, coordinates, and color weights dynamically rearrange as your habits adjust in Transport, Food, Energy, and Lifestyle.
              </p>
              <button
                onClick={handleShareFingerprint}
                className="bg-gradient-to-tr from-[#7C3AED] to-[#00E5FF] text-black hover:opacity-95 font-mono text-xs font-bold px-5 py-3 rounded-2xl flex items-center justify-center md:justify-start space-x-2.5 transition-all shadow-[0_0_20px_rgba(124,58,237,0.25)] group cursor-pointer"
              >
                <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>SHARE YOUR FINGERPRINT</span>
              </button>
            </div>

            {/* Fingerprint Vector */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <FingerprintSVG />
            </div>
          </section>

        </div>
        </div>
      </>
    </PageTransition>
  );
}
