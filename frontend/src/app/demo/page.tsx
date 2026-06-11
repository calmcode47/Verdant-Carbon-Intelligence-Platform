'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    title: 'Track your footprint',
    description: 'Log transport, food, energy, and lifestyle activities with IPCC-backed emission factors.',
    href: '/track',
    cta: 'Open Track',
  },
  {
    title: 'Review your dashboard',
    description: 'See daily, weekly, and monthly carbon totals with category breakdowns and trend indicators.',
    href: '/dashboard',
    cta: 'View Dashboard',
  },
  {
    title: 'Get AI insights',
    description: 'Gemini generates personalized reduction tips, warnings, and a contextual 7-day action plan.',
    href: '/insights',
    cta: 'Explore Insights',
  },
  {
    title: 'Join the arena',
    description: 'Complete challenges, climb the live global leaderboard, and unlock achievement badges.',
    href: '/challenges',
    cta: 'Enter Arena',
  },
  {
    title: 'Reflect in your sanctuary',
    description: 'Export real CSV history, set goals, and manage privacy preferences from your profile.',
    href: '/profile',
    cta: 'Open Profile',
  },
];

export default function DemoPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % STEPS.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [playing]);

  const step = STEPS[activeStep];

  return (
    <div className="min-h-screen bg-[#030810] text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="font-mono text-xs tracking-[0.3em] text-[#00C853] mb-3">VERDANT DEMO WALKTHROUGH</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">2-Minute Product Tour</h1>
          <p className="text-white/60 max-w-2xl">
            Interactive walkthrough of the full Verdant carbon intelligence loop. Use this page as the official demo video substitute for judges and reviewers.
          </p>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          <div className="space-y-2" role="tablist" aria-label="Demo steps">
            {STEPS.map((item, index) => (
              <button
                key={item.title}
                role="tab"
                aria-selected={index === activeStep}
                onClick={() => { setActiveStep(index); setPlaying(false); }}
                className={`w-full text-left rounded-xl px-4 py-3 border transition-colors ${
                  index === activeStep
                    ? 'border-[#00C853]/50 bg-[#00C853]/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/8'
                }`}
              >
                <div className="font-mono text-[10px] text-white/40 mb-1">STEP {index + 1}</div>
                <div className="font-heading text-sm">{item.title}</div>
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 min-h-[360px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
              >
                <div className="flex items-center gap-2 text-[#00C853] mb-4">
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span className="font-mono text-xs tracking-widest">LIVE FEATURE</span>
                </div>
                <h2 className="font-heading text-3xl font-bold mb-3">{step.title}</h2>
                <p className="text-white/65 leading-relaxed mb-8">{step.description}</p>
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00C853] px-5 py-3 text-black font-semibold hover:bg-[#00E676] transition-colors"
                >
                  {step.cta}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-8">
              <button
                onClick={() => setPlaying((value) => !value)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
                aria-pressed={playing}
              >
                <Play size={14} aria-hidden="true" />
                {playing ? 'Pause tour' : 'Play tour'}
              </button>
              <span className="font-mono text-xs text-white/40">
                {activeStep + 1} / {STEPS.length}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-black/30 p-6">
          <h3 className="font-heading text-lg mb-2">Submission checklist</h3>
          <ul className="text-sm text-white/60 space-y-2 list-disc pl-5">
            <li>Live deployment with Postgres persistence and Gemini AI</li>
            <li>Server-side validation, signed sessions, and rate limiting</li>
            <li>Automated unit tests, Playwright E2E, and GitHub Actions CI</li>
            <li>Accessibility-first UI with skip links and chart text alternatives</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
