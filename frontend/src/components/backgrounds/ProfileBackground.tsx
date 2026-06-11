'use client';

import { motionAnimation, shouldAnimateBackground, shouldShowGrain } from './background-utils';

export function ProfileBackground() {
  const animate = shouldAnimateBackground();

  return (
    <>
      {animate && (
        <style>{`
          @keyframes prof-bk1 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50%       { transform: translate(-3vw, 4vh) scale(1.06); }
          }
          @keyframes prof-bk2 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            45%       { transform: translate(5vw, -3vh) scale(1.08); }
          }
          @keyframes prof-bk3 {
            0%, 100% { transform: translate(0px, 0px); }
            60%       { transform: translate(-4vw, -2vh); }
          }
        `}</style>
      )}

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          background: '#0B0906',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '5%', left: '20%',
          width: '70vw', height: '60vh',
          background: 'radial-gradient(ellipse, rgba(245,158,11,0.075) 0%, rgba(217,119,6,0.03) 45%, transparent 70%)',
          animation: motionAnimation('prof-bk1 96s ease-in-out infinite'),
        }} />

        <div style={{
          position: 'absolute',
          bottom: '-12%', left: '-10%',
          width: '55vw', height: '55vh',
          background: 'radial-gradient(ellipse, rgba(20,184,166,0.035) 0%, transparent 60%)',
          animation: motionAnimation('prof-bk2 108s ease-in-out infinite'),
        }} />

        <div style={{
          position: 'absolute',
          top: '25%', right: '-10%',
          width: '35vw', height: '50vh',
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.03) 0%, transparent 65%)',
          animation: motionAnimation('prof-bk3 82s ease-in-out infinite'),
        }} />

        {shouldShowGrain() && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.05'/%3E%3C/svg%3E")`,
            opacity: 0.38,
            mixBlendMode: 'overlay' as const,
          }} />
        )}

        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, transparent 38%, rgba(11,9,6,0.68) 100%)',
        }} />
      </div>
    </>
  );
}
