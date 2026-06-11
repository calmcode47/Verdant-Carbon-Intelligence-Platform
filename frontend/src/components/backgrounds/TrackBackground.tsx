'use client';

import { motionAnimation, shouldAnimateBackground } from './background-utils';

export function TrackBackground() {
  const animate = shouldAnimateBackground();

  return (
    <>
      {animate && (
        <style>{`
          @keyframes track-blink {
            0%, 48%  { opacity: 0.07; }
            49%, 100% { opacity: 0; }
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
          background: '#030504',
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,230,118,0.012) 2px, rgba(0,230,118,0.012) 3px)',
          backgroundSize: '100% 3px',
        }} />

        <div style={{
          position: 'absolute',
          bottom: '-8%',
          right: '-8%',
          width: '38vw',
          height: '38vw',
          background: 'radial-gradient(circle, rgba(0,230,118,0.045) 0%, transparent 60%)',
        }} />

        <div style={{
          position: 'absolute',
          top: '-5%',
          left: '-5%',
          width: '28vw',
          height: '28vw',
          background: 'radial-gradient(circle, rgba(0,176,255,0.03) 0%, transparent 60%)',
        }} />

        {animate && (
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: '13%',
            width: '1px',
            background: 'rgba(0,230,118,0.07)',
            animation: motionAnimation('track-blink 1.5s step-end infinite'),
          }} />
        )}

        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(3,5,4,0.55) 100%)',
        }} />
      </div>
    </>
  );
}
