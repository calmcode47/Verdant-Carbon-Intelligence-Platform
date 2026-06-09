/**
 * @file AICore.tsx
 * @description Concentric 3D rotating rings with a pulsing, glowing central core.
 * Uses high-performance CSS 3D transforms for a futuristic quantum laboratory aesthetic.
 */

'use client';

export default function AICore() {
  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center select-none pointer-events-none">
      {/* Outer Glow Halo */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#7C3AED]/20 to-[#00E5FF]/20 rounded-full blur-2xl animate-pulse" />

      {/* 3D Scene Wrapper */}
      <div 
        className="w-full h-full relative flex items-center justify-center"
        style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
      >
        {/* Ring 1: Outer Teal Orbit (Rotated X-Axis) */}
        <div
          className="absolute w-40 h-40 md:w-48 md:h-48 border-2 border-dashed border-[#00E5FF]/60 rounded-full animate-[spin_10s_linear_infinite]"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(60deg) rotateY(20deg)',
          }}
        />

        {/* Ring 2: Middle Violet Orbit (Rotated Y-Axis) */}
        <div
          className="absolute w-32 h-32 md:w-36 md:h-36 border border-double border-[#7C3AED] rounded-full animate-[spin_8s_linear_infinite_reverse]"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(20deg) rotateY(60deg)',
          }}
        />

        {/* Ring 3: Inner Diagonal Orbit (Tilted Z-Axis) */}
        <div
          className="absolute w-24 h-24 md:w-28 md:h-28 border border-[#00E5FF]/30 border-t-[#7C3AED] rounded-full animate-[spin_6s_linear_infinite]"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(-45deg) rotateY(45deg)',
          }}
        />

        {/* Central Pulsing Quantum Core */}
        <div 
          className="absolute w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center"
          style={{ transform: 'translateZ(0px)' }}
        >
          {/* Inner Glowing Core */}
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#00E5FF] to-[#7C3AED] animate-ping opacity-25 absolute" />
          
          {/* Solid Core */}
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#00E5FF] via-[#7C3AED] to-[#06041A] shadow-[0_0_25px_#7C3AED,_0_0_10px_#00E5FF] relative flex items-center justify-center">
            {/* Center Core Pulse Dot */}
            <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse shadow-[0_0_12px_#ffffff]" />
          </div>
        </div>
      </div>
    </div>
  );
}
