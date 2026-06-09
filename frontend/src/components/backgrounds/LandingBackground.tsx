'use client';

export function LandingBackground() {
  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes land-drift-1 {
            0%, 100% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
            33%       { transform: translate(3vw, 2vh) scale(1.07) rotate(2deg); }
            66%       { transform: translate(-2vw, 4vh) scale(0.95) rotate(-1deg); }
          }
          @keyframes land-drift-2 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            40%       { transform: translate(-5vw, -3vh) scale(1.10); }
            80%       { transform: translate(3vw, 2vh) scale(0.93); }
          }
          @keyframes land-drift-3 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50%       { transform: translate(2vw, -5vh) scale(1.14); }
          }
          @keyframes land-drift-4 {
            0%, 100% { transform: translate(0px, 0px); }
            45%       { transform: translate(-4vw, 3vh); }
            75%       { transform: translate(2vw, -2vh); }
          }
          @keyframes nebula-pulse {
            0%, 100% { opacity: 0.55; }
            50%       { opacity: 0.85; }
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
          background: 'radial-gradient(ellipse at 50% 0%, #061220 0%, #030810 60%)',
        }}
      >
        {/* Subtle dot-grid overlay for depth */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0,230,118,0.055) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.45,
        }} />

        {/* PRIMARY — large green aurora, top-left */}
        <div style={{
          position: 'absolute',
          width: '100vw', height: '90vh',
          top: '-30%', left: '-30%',
          background: 'radial-gradient(ellipse at 40% 40%, rgba(0,230,118,0.10) 0%, rgba(0,230,118,0.04) 45%, transparent 70%)',
          filter: 'blur(180px)',
          animation: 'land-drift-1 92s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* SECONDARY — teal-blue, right side */}
        <div style={{
          position: 'absolute',
          width: '80vw', height: '75vh',
          top: '5%', right: '-30%',
          background: 'radial-gradient(ellipse at 60% 50%, rgba(0,176,255,0.08) 0%, rgba(29,233,182,0.05) 50%, transparent 70%)',
          filter: 'blur(160px)',
          animation: 'land-drift-2 112s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* TERTIARY — deep emerald, bottom center */}
        <div style={{
          position: 'absolute',
          width: '65vw', height: '65vh',
          bottom: '-25%', left: '12%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(29,233,182,0.08) 0%, transparent 65%)',
          filter: 'blur(200px)',
          animation: 'land-drift-3 80s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* QUATERNARY — indigo nebula, top-right */}
        <div style={{
          position: 'absolute',
          width: '45vw', height: '45vh',
          top: '-10%', right: '5%',
          background: 'radial-gradient(ellipse, rgba(79,70,229,0.07) 0%, transparent 65%)',
          filter: 'blur(130px)',
          animation: 'land-drift-4 100s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* NEBULA ACCENT — pulsing central glow */}
        <div style={{
          position: 'absolute',
          width: '40vw', height: '40vh',
          top: '20%', left: '30%',
          background: 'radial-gradient(ellipse, rgba(0,230,118,0.045) 0%, transparent 60%)',
          filter: 'blur(120px)',
          animation: 'nebula-pulse 14s ease-in-out infinite',
          willChange: 'opacity',
        }} />

        {/* VIGNETTE */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 38%, transparent 24%, rgba(3,8,16,0.72) 72%, rgba(3,8,16,0.97) 100%)',
        }} />

        {/* GRAIN TEXTURE */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.055'/%3E%3C/svg%3E")`,
          opacity: 0.4,
          mixBlendMode: 'overlay' as const,
        }} />
      </div>
    </>
  );
}
