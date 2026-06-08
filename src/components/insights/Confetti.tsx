/**
 * @file Confetti.tsx
 * @description Lightweight, CSS-animated confetti explosion for milestone achievement cards.
 * Generates floating, spinning particles in neon green, violet, teal, and amber.
 */

'use client';

import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotation: number;
}

const COLORS = ['#00E676', '#7C3AED', '#00E5FF', '#FFB300', '#FF5252'];

export default function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const generated: ConfettiPiece[] = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage across container
      delay: Math.random() * 0.4, // delay in seconds
      duration: 1.2 + Math.random() * 1.5, // duration in seconds
      size: 4 + Math.random() * 8, // size in pixels
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
    }));
    setPieces(generated);

    // Self-destruct after 4 seconds to free DOM resources
    const timer = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (pieces.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 rounded-2xl">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute rounded-sm animate-[fall_linear_both]"
          style={{
            left: `${piece.x}%`,
            width: `${piece.size}px`,
            height: `${piece.size * 1.5}px`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotation}deg)`,
            top: '-20px',
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(280px) rotate(540deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
