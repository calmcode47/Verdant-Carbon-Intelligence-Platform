'use client';

export function DashboardBackground() {
  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes dash-scan {
            0%   { transform: translateY(-2px); opacity: 0; }
            3%   { opacity: 1; }
            96%  { opacity: 1; }
            100% { transform: translateY(100vh); opacity: 0; }
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          background: '#070C09',
        }}
      >
        {/* GRID LINES — 48px spacing, 2.5% opacity (barely visible) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'linear-gradient(rgba(0,230,118,0.025) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(0,230,118,0.025) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '48px 48px',
        }} />

        {/* SCAN LINE — sweeps top to bottom every 14 seconds */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '1px',
          top: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,230,118,0.4) 20%, rgba(0,230,118,0.55) 50%, rgba(0,230,118,0.4) 80%, transparent 100%)',
          boxShadow: '0 0 10px rgba(0,230,118,0.18), 0 2px 20px rgba(0,230,118,0.08)',
          animation: 'dash-scan 14s linear infinite',
          willChange: 'transform',
        }} />

        {/* CORNER GLOW — top-left terminal indicator */}
        <div style={{
          position: 'absolute',
          top: '-8%',
          left: '-8%',
          width: '32vw',
          height: '32vw',
          background: 'radial-gradient(circle, rgba(0,230,118,0.05) 0%, transparent 60%)',
          filter: 'blur(50px)',
        }} />

        {/* VIGNETTE */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(7,12,9,0.65) 100%)',
        }} />
      </div>
    </>
  );
}
