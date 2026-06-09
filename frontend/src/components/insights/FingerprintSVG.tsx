/**
 * @file FingerprintSVG.tsx
 * @description Renders a unique SVG fingerprint based on the user's carbon category ratios.
 * Uses the SVG stroke-dashoffset trick to animate the drawing of the loops on mount.
 * Colors: Teal (transport), Green (food), Amber (energy), Violet (lifestyle).
 */

'use client';

import { useEffect, useState } from 'react';
import { useCarbonStore } from '@/store/carbon-store';

export default function FingerprintSVG() {
  const summary = useCarbonStore((state) => state.summary);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger path drawing animation after mount
    const timer = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Compute category ratios. Default to equal proportions if no data.
  const breakdown = summary?.categoryBreakdown || {
    transport: 0,
    food: 0,
    energy: 0,
    lifestyle: 0,
  };

  const total =
    breakdown.transport +
    breakdown.food +
    breakdown.energy +
    breakdown.lifestyle;

  const ratios = {
    transport: total > 0 ? breakdown.transport / total : 0.35,
    food: total > 0 ? breakdown.food / total : 0.25,
    energy: total > 0 ? breakdown.energy / total : 0.25,
    lifestyle: total > 0 ? breakdown.lifestyle / total : 0.15,
  };

  // Concentric loop specs for fingerprint whorl
  // Each loop represents a category, color, and custom geometric path
  const fingerprintLoops = [
    {
      category: 'transport',
      color: '#00E5FF', // Teal
      ratio: ratios.transport,
      d: 'M150,270 C90,270 40,220 40,150 C40,75 100,30 150,30 C200,30 260,75 260,150 C260,200 240,240 210,250 C185,258 175,240 170,220',
      length: 850,
      strokeWidth: 3.5,
    },
    {
      category: 'food',
      color: '#00E676', // Green
      ratio: ratios.food,
      d: 'M150,250 C105,250 60,205 60,150 C60,95 100,50 150,50 C200,50 240,95 240,150 C240,185 220,215 190,225 C170,232 160,215 160,195',
      length: 700,
      strokeWidth: 3.5,
    },
    {
      category: 'energy',
      color: '#FFB300', // Amber
      ratio: ratios.energy,
      d: 'M150,230 C120,230 80,190 80,150 C80,110 110,70 150,70 C190,70 220,110 220,150 C220,175 200,195 180,200 C165,204 150,190 150,170',
      length: 550,
      strokeWidth: 3.5,
    },
    {
      category: 'lifestyle',
      color: '#7C3AED', // Violet
      ratio: ratios.lifestyle,
      d: 'M150,210 C130,210 100,180 100,150 C100,120 120,90 150,90 C180,90 200,120 200,150 C200,165 185,175 170,175',
      length: 420,
      strokeWidth: 3.5,
    },
    // Mirroring some inner ridges for complex structure
    {
      category: 'transport',
      color: '#00E5FF',
      ratio: Math.max(0.2, ratios.transport * 0.8),
      d: 'M150,185 C140,185 120,165 120,150 C120,135 130,110 150,110 C170,110 180,135 180,150',
      length: 220,
      strokeWidth: 3.0,
    },
    {
      category: 'food',
      color: '#00E676',
      ratio: Math.max(0.2, ratios.food * 0.8),
      d: 'M150,160 C145,160 135,155 135,150 C135,145 140,130 150,130 C160,130 165,145 165,150 C165,155 160,160 155,160',
      length: 120,
      strokeWidth: 3.0,
    },
  ];

  return (
    <div className="relative w-72 h-72 mx-auto flex items-center justify-center bg-[#06041A]/40 border border-[#7C3AED]/20 rounded-full p-4 shadow-[0_0_35px_rgba(124,58,237,0.08)] backdrop-blur-md">
      {/* Decorative radar sweep overlay */}
      <div className="absolute inset-0 rounded-full border border-dashed border-[#00E5FF]/20 animate-[spin_40s_linear_infinite]" />
      
      <svg
        viewBox="0 0 300 300"
        className="w-full h-full filter drop-shadow-[0_0_8px_rgba(124,58,237,0.3)]"
        fill="none"
        strokeLinecap="round"
      >
        {/* Helper grids */}
        <circle cx="150" cy="150" r="140" stroke="rgba(0, 229, 255, 0.03)" strokeWidth="1" />
        <circle cx="150" cy="150" r="110" stroke="rgba(124, 90, 237, 0.03)" strokeWidth="1" />
        <circle cx="150" cy="150" r="80" stroke="rgba(0, 229, 255, 0.03)" strokeWidth="1" />

        {fingerprintLoops.map((loop, idx) => {
          // The dash offset is calculated so that the length drawn corresponds to the user's ratio.
          // Full loop length = loop.length.
          // Target length = loop.length * loop.ratio.
          // Offset = loop.length - targetLength.
          // When not animated, offset = loop.length (completely hidden).
          const targetLength = loop.length * Math.max(0.15, loop.ratio);
          const offset = animate ? loop.length - targetLength : loop.length;

          return (
            <path
              key={idx}
              d={loop.d}
              stroke={loop.color}
              strokeWidth={loop.strokeWidth}
              strokeDasharray={loop.length}
              strokeDashoffset={offset}
              className="transition-all duration-[2000ms] ease-out"
              opacity={animate ? 0.75 + 0.25 * loop.ratio : 0}
            />
          );
        })}
      </svg>
    </div>
  );
}
