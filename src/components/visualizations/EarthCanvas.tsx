'use client';

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EmissionGlobe } from './EmissionGlobe';
import { Leaf } from 'lucide-react';
import { safePixelRatio, getPerformanceTier } from '@/lib/performance';
import { WebGLErrorBoundary } from '../three/WebGLErrorBoundary';

export default function EarthCanvas() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/20 backdrop-blur-md rounded-3xl border border-slate-800/80 min-h-[300px]">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <Leaf className="w-6 h-6 text-emerald-500 animate-pulse" />
        </div>
        <p className="mt-4 text-xs text-slate-400 font-medium tracking-wide">Initializing Eco-Engine...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] bg-gradient-to-b from-slate-950/10 to-slate-900/10 backdrop-blur-md rounded-3xl border border-slate-800/80 overflow-hidden relative group">
      {/* Absolute overlay indicators for premium UI feel */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center space-x-2 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-800 text-[10px] text-slate-300 font-mono tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span>SYSTEM MODEL: ACTIVE</span>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none text-right">
        <p className="text-[10px] font-mono text-slate-500">DRAG TO ROTATE</p>
      </div>

      <div
        role="img"
        aria-label="Rotating Earth globe showing carbon emission zones"
        style={{ width: '100%', height: '100%' }}
      >
        <WebGLErrorBoundary>
          <Canvas
            camera={{ position: [0, 0, 5.5], fov: 60 }}
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
            <EmissionGlobe />
          </Canvas>
        </WebGLErrorBoundary>
      </div>
    </div>
  );
}
