/**
 * @file page.tsx
 * @description Landing page for the Verdant Carbon Intelligence Platform.
 * Theme: Cosmic Environmental Observatory.
 * Palette: Deep space black, electric green, nebula blue, star white.
 * Renders hero WebGL Earth sphere, statistical counters, staggered how-it-works workflow,
 * 3D-tilting features with custom animated SVGs, WebGL carbon molecule callout, and a newsletter subscription footer.
 */

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { PageTransition } from '@/components/layout/PageTransition';
import { LandingBackground } from '@/components/backgrounds';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { ChevronDown, ArrowRight, ShieldCheck, Mail, Zap, RefreshCw, Database } from 'lucide-react';
import dynamic from 'next/dynamic';
import { safePixelRatio, getPerformanceTier } from '@/lib/performance';
import { WebGLErrorBoundary } from '@/components/three/WebGLErrorBoundary';

// Dynamic imports of 3D Canvas and scenes to prevent SSR evaluation issues
const Canvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
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
const EarthGlobe = dynamic(
  () => import('@/components/three/EarthGlobe'),
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
const CarbonMolecule = dynamic(
  () => import('@/components/three/CarbonMolecule'),
  {
    ssr: false,
    loading: () => null,
  }
);

// 1. Counter Ticker Component using Intersection Observer
function StatCounter({ target, decimals = 0, suffix = '' }: { target: number; decimals?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [inView, setInView] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentElement = elementRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!inView) return;
    
    const start = 0;
    const duration = 1800; // 1.8 seconds animation
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Quadratic ease out
      const ease = progress * (2 - progress);
      const currentVal = start + (target - start) * ease;
      
      setCount(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [inView, target]);

  return (
    <div ref={elementRef} className="font-display text-7xl md:text-8xl text-verdant-green drop-shadow-[0_0_15px_rgba(0,230,118,0.25)]">
      {count.toFixed(decimals)}
      {suffix}
    </div>
  );
}

// 2. Custom Animated SVGs for Features
function AIInsightsIcon() {
  return (
    <svg className="w-6 h-6 text-verdant-green transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="animate-spin" style={{ animationDuration: '10s', transformOrigin: 'center' }} />
      <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1" fill="currentColor" className="animate-pulse" />
      <circle cx="12" cy="16" r="1" fill="currentColor" className="animate-pulse" />
      <circle cx="8" cy="12" r="1" fill="currentColor" className="animate-pulse" />
      <circle cx="16" cy="12" r="1" fill="currentColor" className="animate-pulse" />
    </svg>
  );
}

function CarbonBudgetIcon() {
  return (
    <svg className="w-6 h-6 text-verdant-green" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 12L15.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:rotate-[25deg] transition-transform duration-500 ease-out" style={{ transformOrigin: '12px 12px' }} />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

function ChallengesIcon() {
  return (
    <svg className="w-6 h-6 text-verdant-green" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 8 12 2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" className="group-hover:fill-opacity-35 transition-all duration-300" />
      <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="6" r="0.8" fill="currentColor" className="animate-ping" style={{ animationDelay: '0.1s' }} />
      <circle cx="18" cy="18" r="0.8" fill="currentColor" className="animate-ping" style={{ animationDelay: '0.5s' }} />
    </svg>
  );
}

// 3. Feature Card with 3D Tilt Effect
interface FeatureCardProps {
  title: string;
  desc: string;
  icon: React.ComponentType;
  stepNum: string;
}

function FeatureCard({ title, desc, icon: Icon, stepNum }: FeatureCardProps) {
  return (
    <div
      className="gradient-border-card relative p-8 rounded-2xl border border-verdant-border/20 bg-gradient-to-br from-[#0d1f17] to-[#0a1510] shadow-card group select-none overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 font-display text-7xl text-verdant-green/5 font-bold">
        {stepNum}
      </div>
      <div className="p-3 bg-verdant-green/10 border border-verdant-green/20 rounded-2xl w-12 h-12 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon />
      </div>
      <h3 className="text-xl font-heading font-bold text-white mb-2 group-hover:text-verdant-green transition-colors">
        {title}
      </h3>
      <p className="text-[13px] text-slate-400 font-body leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

// Staggered animation variants
const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

const slideInCard = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
} as const;

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-2 border-verdant-green/20 border-t-verdant-green rounded-full animate-spin mb-4" />
        <span className="font-mono text-xs tracking-wider uppercase text-emerald-500/80">Opening Observatory...</span>
      </div>
    );
  }

  return (
    <PageTransition>
      <>
        <LandingBackground />
        <div 
          className="min-h-screen text-[#F8F9FF] selection:bg-verdant-green/35 selection:text-white"
          style={{ position: 'relative', zIndex: 1 }}
        >
        
        {/* ================= SECTION 1: HERO ================= */}
        <section className="relative w-full h-[calc(100vh-48px)] min-h-[680px] flex flex-col items-center justify-center overflow-hidden border-b border-slate-900">
          
          {/* Earth Background: WebGL when available, polished fallback otherwise */}
          <div className="absolute inset-0 z-0">
            <Suspense fallback={null}>
              <div
                role="img"
                aria-label="Interactive Earth globe visualization"
                style={{ width: '100%', height: '100%' }}
              >
                <WebGLErrorBoundary>
                  <EarthGlobe />
                </WebGLErrorBoundary>
              </div>
            </Suspense>
          </div>

          {/* Vignette Overlay for dark atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-transparent to-[#050810]/40 pointer-events-none z-10" />

          {/* Hero Content Overlay */}
          <div className="relative z-20 text-center px-4 sm:px-6 max-w-3xl mx-auto flex flex-col items-center justify-center select-none">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full space-y-4 flex flex-col items-center"
            >
              {/* Eyebrow */}
              <span className="font-mono text-[10px] sm:text-xs tracking-[0.28em] uppercase text-verdant-green leading-none mb-1 text-center">
                REAL-TIME CARBON INTELLIGENCE
              </span>

              {/* Title */}
              <h1 className="font-display text-[clamp(3.4rem,9.4vw,9rem)] leading-[0.88] uppercase tracking-wide text-white whitespace-pre-line text-center">
                KNOW YOUR<br />
                <span className="gradient-text drop-shadow-[0_0_25px_rgba(0,230,118,0.25)]">CARBON.</span><br />
                OWN YOUR<br />
                FUTURE.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg font-heading text-white/70 max-w-[560px] mx-auto mt-4 leading-relaxed text-center">
                Verdant tracks your daily emissions, learns your habits, and guides you toward a sustainable life — powered by AI.
              </p>

              {/* CTAs */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-7">
                <Link href="/dashboard" className="w-full sm:w-auto focus:outline-none">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(0, 230, 118, 0.5)' }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-48 h-12 px-6 rounded-xl bg-verdant-green text-black font-heading font-bold text-sm sm:text-base hover:brightness-105 transition-all flex items-center justify-center"
                  >
                    START TRACKING
                  </motion.button>
                </Link>

                <a href="#how-it-works" className="w-full sm:w-auto focus:outline-none">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-48 h-12 px-6 rounded-xl border border-verdant-green text-verdant-green font-heading font-bold text-sm sm:text-base bg-transparent hover:bg-verdant-green/5 transition-all flex items-center justify-center"
                  >
                    SEE HOW IT WORKS
                  </motion.button>
                </a>
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none text-white/40">
            <span className="font-mono text-[9px] tracking-[0.2em] mb-1">SCROLL TO EXPLORE</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <ChevronDown className="w-4 h-4 text-verdant-green" />
            </motion.div>
          </div>
        </section>

        {/* ================= SECTION 2: STATS TICKER ================= */}
        <section className="bg-[#070b13] border-b border-slate-900 py-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto select-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0">
              
              {/* Stat 1 */}
              <div className="flex flex-col items-center text-center space-y-2 md:py-4">
                <StatCounter target={13.0} decimals={1} suffix=" kg" />
                <span className="font-heading text-base text-white/50 tracking-wider uppercase">Average Daily CO₂ Per Person</span>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col items-center text-center space-y-2 md:border-l md:border-r border-slate-800/60 md:px-4 md:py-4">
                <StatCounter target={37} suffix=" Billion tons" />
                <span className="font-heading text-base text-white/50 tracking-wider uppercase">CO₂ Emitted Globally Per Year</span>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col items-center text-center space-y-2 md:py-4">
                <StatCounter target={1.5} decimals={1} suffix="°C" />
                <span className="font-heading text-base text-white/50 tracking-wider uppercase">Paris Agreement Target Limit</span>
              </div>
              
            </div>
          </div>
        </section>

        {/* ================= SECTION 3: HOW IT WORKS ================= */}
        <section id="how-it-works" className="py-24 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-16">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="font-mono text-[10px] text-verdant-green tracking-widest uppercase">THE VERDANT CYCLE</span>
            <h2 className="font-heading text-3xl md:text-5xl font-extrabold text-white">How it works</h2>
            <p className="text-xs text-slate-400 font-body">Four modular coordinates to recalibrate your relationship with carbon emissions.</p>
          </div>

          {/* Steps Horizontal/Vertical timeline */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="flex flex-col md:flex-row overflow-x-auto md:overflow-x-scroll scrollbar-none snap-x snap-mandatory gap-6 pb-8 md:-mx-8 md:px-8 select-none"
          >
            {/* Step 1 */}
            <motion.div
              variants={slideInCard}
              className="min-w-[280px] md:min-w-[250px] flex-1 snap-center p-8 rounded-2xl border-l-4 border-l-verdant-green border border-slate-900 bg-slate-950/20 glass relative overflow-hidden"
            >
              <div className="font-display text-[120px] text-verdant-green absolute -right-2 -bottom-6 font-bold opacity-10 select-none">01</div>
              <div className="w-10 h-10 bg-verdant-green/10 rounded-xl border border-verdant-green/20 flex items-center justify-center mb-6">
                <Database className="w-4 h-4 text-verdant-green" />
              </div>
              <h3 className="text-2xl font-heading font-extrabold text-white mb-2">LOG</h3>
              <p className="text-[15px] text-slate-400 font-body leading-relaxed">
                Log activities dynamically across 4 categories: Transport, Food, Energy, and Lifestyle.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              variants={slideInCard}
              className="min-w-[280px] md:min-w-[250px] flex-1 snap-center p-8 rounded-2xl border-l-4 border-l-verdant-green border border-slate-900 bg-slate-950/20 glass relative overflow-hidden"
            >
              <div className="font-display text-[120px] text-verdant-green absolute -right-2 -bottom-6 font-bold opacity-10 select-none">02</div>
              <div className="w-10 h-10 bg-verdant-green/10 rounded-xl border border-verdant-green/20 flex items-center justify-center mb-6">
                <RefreshCw className="w-4 h-4 text-verdant-green" />
              </div>
              <h3 className="text-2xl font-heading font-extrabold text-white mb-2">ANALYZE</h3>
              <p className="text-[15px] text-slate-400 font-body leading-relaxed">
                Our carbon calculator processes entries with exact emission factors backed by IPCC metrics.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              variants={slideInCard}
              className="min-w-[280px] md:min-w-[250px] flex-1 snap-center p-8 rounded-2xl border-l-4 border-l-verdant-green border border-slate-900 bg-slate-950/20 glass relative overflow-hidden"
            >
              <div className="font-display text-[120px] text-verdant-green absolute -right-2 -bottom-6 font-bold opacity-10 select-none">03</div>
              <div className="w-10 h-10 bg-verdant-green/10 rounded-xl border border-verdant-green/20 flex items-center justify-center mb-6">
                <Zap className="w-4 h-4 text-verdant-green" />
              </div>
              <h3 className="text-2xl font-heading font-extrabold text-white mb-2">UNDERSTAND</h3>
              <p className="text-[15px] text-slate-400 font-body leading-relaxed">
                AI parses your profiles to output highly custom action tips, difficulty levels, and checklist items.
              </p>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              variants={slideInCard}
              className="min-w-[280px] md:min-w-[250px] flex-1 snap-center p-8 rounded-2xl border-l-4 border-l-verdant-green border border-slate-900 bg-slate-950/20 glass relative overflow-hidden"
            >
              <div className="font-display text-[120px] text-verdant-green absolute -right-2 -bottom-6 font-bold opacity-10 select-none">04</div>
              <div className="w-10 h-10 bg-verdant-green/10 rounded-xl border border-verdant-green/20 flex items-center justify-center mb-6">
                <ShieldCheck className="w-4 h-4 text-verdant-green" />
              </div>
              <h3 className="text-2xl font-heading font-extrabold text-white mb-2">REDUCE</h3>
              <p className="text-[15px] text-slate-400 font-body leading-relaxed">
                Tackle active community challenges, earn level progression XP, and unlock badges for tracking habits.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* ================= SECTION 4: FEATURE SHOWCASE ================= */}
        <section className="py-24 bg-[#060a13]/40 border-y border-slate-900 px-4 md:px-8">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="font-mono text-[10px] text-verdant-green tracking-widest uppercase">OBSERVATORY BLUEPRINT</span>
              <h2 className="font-heading text-3xl md:text-5xl font-extrabold text-white">Observatory Features</h2>
              <p className="text-xs text-slate-400 font-body">An integrated stack built to visualize carbon, track level progression, and gamify sustainability.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                title="AI Insights"
                desc="Gemini analyzes your patterns and gives personalized advice, providing action items with specific difficulty levels."
                icon={AIInsightsIcon}
                stepNum="01"
              />
              <FeatureCard
                title="Carbon Budget"
                desc="Set monthly budget carbon limits and track your allocations in real-time across four core daily categories."
                icon={CarbonBudgetIcon}
                stepNum="02"
              />
              <FeatureCard
                title="Challenges"
                desc="Join cooperative community challenges. Advance your level progress coordinates and unlock unique collector badges."
                icon={ChallengesIcon}
                stepNum="03"
              />
            </div>
          </div>
        </section>

        {/* ================= SECTION 5: MOLECULE CALLOUT ================= */}
        <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto select-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            {/* Left: 3D Carbon Molecule Canvas */}
            <div className="h-[380px] bg-gradient-to-b from-[#09111c]/30 to-[#050810]/30 border border-slate-900 rounded-3xl overflow-hidden relative group">
              <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <span className="font-mono text-[9px] text-slate-500 bg-slate-950/80 border border-slate-900 px-2 py-0.5 rounded">
                  3D MOLECULAR LAB: CO₂
                </span>
              </div>
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-500">
                  Loading Molecule Model...
                </div>
              }>
                <div
                  role="img"
                  aria-label="3D carbon molecule visualization"
                  style={{ width: '100%', height: '100%' }}
                >
                  <WebGLErrorBoundary>
                    <Canvas
                      camera={{ position: [0, 0, 3], fov: 45 }}
                      dpr={safePixelRatio()}
                      performance={{ min: 0.5, max: 1 }}
                      frameloop="always"
                      gl={{
                        antialias: getPerformanceTier() === 'HIGH',
                        alpha: true,
                        powerPreference: 'default',
                        stencil: false,
                        depth: true,
                      }}
                    >
                      <CarbonMolecule />
                    </Canvas>
                  </WebGLErrorBoundary>
                </div>
              </Suspense>
              <div className="absolute bottom-4 right-4 pointer-events-none">
                <span className="font-mono text-[9px] text-slate-600">3D MOLECULAR STRUCTURE</span>
              </div>
            </div>

            {/* Right: Callout Text */}
            <div className="space-y-6">
              <span className="font-mono text-[10px] text-verdant-green tracking-widest uppercase">THE CO₂ MATRIX</span>
              <h2 className="font-display text-5xl md:text-[64px] leading-tight text-white uppercase whitespace-pre-line">
                CO₂ IS INVISIBLE.{"\n"}
                WE MAKE IT REAL.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-body leading-relaxed">
                Carbon emissions are invisible byproducts of our daily choices. By mapping your activity logs to verified physical conversion multipliers, Verdant turns complex emissions data into a visual 3D space. 
              </p>
              
              <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-950/5 text-xs text-slate-350 space-y-1 font-body">
                <p className="font-bold text-rose-400">Average Annual Output</p>
                <p>The average individual generates <span className="font-bold text-white">4.7 tons of CO₂</span> annually without realizing it. Knowledge is the first step of change.</p>
              </div>

              <div>
                <Link href="/track" className="inline-flex items-center space-x-2 text-verdant-green hover:text-emerald-400 font-heading font-semibold text-sm transition-all focus:outline-none focus:ring-1 focus:ring-verdant-green/40 px-1 rounded">
                  <span>Track Your Footprint</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            
          </div>
        </section>

        {/* ================= SECTION 6: FOOTER ================= */}
        <footer className="border-t border-slate-900 bg-[#04060c] pt-20 pb-10 px-4 md:px-8 relative">
          {/* Accent animated line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] shimmer-line opacity-60" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 pb-16">
            {/* Footer Left Column */}
            <div className="md:col-span-5 space-y-6 select-none">
              <span className="font-display text-3xl text-white tracking-widest">VERDANT</span>
              <p className="text-xs text-slate-400 max-w-[320px] font-body leading-relaxed">
                Know your carbon. Own your future. Providing real-time carbon footprint metrics and AI recommendations to guide ecological choices.
              </p>
              <div className="flex items-center space-x-4">
                <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="Verdant GitHub" className="text-slate-500 hover:text-verdant-green transition-colors">
                  {/* Inline GitHub Icon to avoid lucide import warnings */}
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Footer Navigation Columns */}
            <div className="md:col-span-4 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">Platform</h4>
                <div className="flex flex-col space-y-2 text-xs text-slate-400 font-body">
                  <Link href="/" className="hover:text-verdant-green transition-colors">Home</Link>
                  <Link href="/dashboard" className="hover:text-verdant-green transition-colors">Dashboard</Link>
                  <Link href="/track" className="hover:text-verdant-green transition-colors">Track Activities</Link>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">Insights</h4>
                <div className="flex flex-col space-y-2 text-xs text-slate-400 font-body">
                  <Link href="/insights" className="hover:text-verdant-green transition-colors">AI Insights</Link>
                  <Link href="/challenges" className="hover:text-verdant-green transition-colors">Challenges</Link>
                  <Link href="/profile" className="hover:text-verdant-green transition-colors">Profile Hub</Link>
                </div>
              </div>
            </div>

            {/* Footer Right Column - Newsletter */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-white">JOIN THE MISSION</h4>
              <p className="text-xs text-slate-400 font-body">Subscribe for weekly ecological challenges and tips.</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex space-x-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="bg-[#070b13] border border-slate-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-verdant-green flex-1"
                />
                <Button type="submit" size="sm" className="h-9 px-4">
                  <Mail className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="max-w-7xl mx-auto border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-body gap-4 select-none">
            <p>&copy; {new Date().getFullYear()} Verdant. Built for Hackathon. All rights reserved.</p>
            <div className="flex space-x-4">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </footer>
        
      </div>
      </>
    </PageTransition>
  );
}
