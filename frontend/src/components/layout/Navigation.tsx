/**
 * @file Navigation.tsx
 * @description Glassmorphic global navigation header for the Verdant platform.
 * Implements Top Navbar, active page state detection using usePathname, custom font families
 * (Bebas Neue, Syne, DM Mono), dynamic SVG carbon score progress rings, hamburger mobile overlay,
 * and scroll-triggered background opacity transitions.
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useCarbonStore } from '@/store/carbon-store';
import { SimpleTooltip } from '../ui/Tooltip';
import { AnimatePresence, motion } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Track', href: '/track' },
  { label: 'Insights', href: '/insights' },
  { label: 'Challenges', href: '/challenges' },
  { label: 'Profile', href: '/profile' },
  { label: 'Demo', href: '/demo' },
];

export function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const todayCarbon = useCarbonStore((state) => state.summary?.today || 0);

  // Animate circular progress ring on mount
  const [animatedCarbon, setAnimatedCarbon] = useState(0);

  useEffect(() => {
    // Smooth opacity change on scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Animate carbon score progress on mount
    const timer = setTimeout(() => {
      setAnimatedCarbon(todayCarbon);
    }, 200);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [todayCarbon]);

  // Carbon Score configurations
  const carbonMax = 13.0; // World average baseline (kg CO2e)
  const percentage = Math.min(100, Math.round((animatedCarbon / carbonMax) * 100));
  const radius = 14;
  const circumference = 2 * Math.PI * radius; // 100.53
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Resolve widget colors based on carbon usage levels
  const getCarbonColor = (kg: number) => {
    if (kg < 7) return '#00E676'; // green
    if (kg < 13) return '#FFEB3B'; // yellow
    if (kg < 20) return '#FF9800'; // orange
    return '#F44336'; // red
  };

  const widgetColor = getCarbonColor(todayCarbon);

  return (
    <>
      <nav
        style={{
          backgroundColor: isScrolled ? 'rgba(10, 15, 13, 0.95)' : 'rgba(10, 15, 13, 0.7)',
          borderBottom: '1px solid rgba(0, 230, 118, 0.1)',
        }}
        className="fixed top-0 left-0 right-0 z-50 h-12 w-full px-3 md:px-6 flex items-center justify-between backdrop-blur-md transition-all duration-300 select-none"
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-1.5 group focus:outline-none" aria-label="Verdant Home">
          <span className="font-display text-[22px] tracking-wider text-white group-hover:text-verdant-green transition-colors duration-300">
            VERDANT
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verdant-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-verdant-green"></span>
          </span>
        </Link>

        {/* Central Nav Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textShadow: isActive ? '0 0 15px rgba(0, 230, 118, 0.5)' : undefined,
                }}
                className={`relative py-1 text-xs font-heading tracking-[0.05em] uppercase transition-colors duration-300 focus:outline-none focus:ring-1 focus:ring-verdant-green/45 px-1 rounded-sm ${
                  isActive ? 'text-verdant-green font-semibold' : 'text-white/60 hover:text-verdant-green'
                } group`}
              >
                <span>{item.label}</span>
                {/* Sliding underline */}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] bg-verdant-green transition-transform duration-300 origin-left ${
                    isActive ? 'w-full scale-x-100' : 'w-full scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* Carbon Score Widget & Hamburger Icon */}
        <div className="flex items-center space-x-3">
          
          {/* Carbon Score Progress Ring (Desktop/Mobile) */}
          <SimpleTooltip
            side="bottom"
            content={
              <div className="text-center space-y-0.5">
                <p className="font-bold">Today&apos;s Carbon Footprint</p>
                <p className="text-[10px] text-slate-400">Baseline Target: {carbonMax} kg/day</p>
              </div>
            }
          >
            <div className="flex items-center justify-center gap-1.5 px-2 py-1 bg-slate-900/30 rounded-lg border border-slate-800/40 hover:border-verdant-green/20 transition-all duration-300 cursor-help">
              <svg className="w-7 h-7 transform -rotate-90" viewBox="0 0 40 40">
                {/* Background track circle */}
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  className="stroke-slate-800 fill-none"
                  strokeWidth="3.5"
                />
                {/* Animated active carbon circle */}
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  className="fill-none transition-all duration-1000 ease-out"
                  stroke={widgetColor}
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Number reading under circle */}
              <span className="text-[9px] font-mono text-slate-300 font-medium leading-none">
                {todayCarbon.toFixed(1)} kg
              </span>
            </div>
          </SimpleTooltip>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-1.5 text-white/80 hover:text-verdant-green focus:outline-none focus:ring-2 focus:ring-verdant-green/50 rounded-lg"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Spacer to push page content down below the fixed header */}
      <div className="h-12 w-full" />

      {/* Hamburger full-screen layout */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-45 bg-[#0a0f0d]/98 backdrop-blur-lg flex flex-col items-center justify-center space-y-6 md:hidden select-none"
          >
            <div className="flex flex-col items-center space-y-6 text-center">
              {NAV_ITEMS.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      style={{
                        textShadow: isActive ? '0 0 20px rgba(0, 230, 118, 0.7)' : undefined,
                      }}
                      className={`text-2xl font-heading font-medium tracking-[0.08em] uppercase block py-2 ${
                        isActive ? 'text-verdant-green' : 'text-white/70 hover:text-verdant-green'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
