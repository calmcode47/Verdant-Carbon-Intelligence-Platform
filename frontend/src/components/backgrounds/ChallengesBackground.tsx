'use client';

import { motionAnimation, shouldAnimateBackground } from './background-utils';

export function ChallengesBackground() {
  const animate = shouldAnimateBackground();

  return (
    <>
      {animate && (
        <style>{`
          @keyframes ch-bk1 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50%       { transform: translate(-5vw, 3vh) scale(1.05); }
          }
          @keyframes ch-bk2 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            40%       { transform: translate(6vw, -4vh) scale(1.08); }
            75%       { transform: translate(-3vw, 2vh) scale(0.95); }
          }
          @keyframes ch-bk3 {
            0%, 100% { transform: translate(0px, 0px); }
            60%       { transform: translate(4vw, 5vh); }
          }
          @keyframes ch-bk4 {
            0%, 100% { transform: translate(0px, 0px); }
            50%       { transform: translate(-3vw, -4vh); }
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
          background: '#040C06',
        }}
      >
        <div style={{
          position: 'absolute', width: '65vw', height: '65vh',
          top: '-15%', left: '15%',
          background: 'radial-gradient(ellipse, rgba(0,230,118,0.08) 0%, rgba(0,230,118,0.03) 45%, transparent 70%)',
          animation: motionAnimation('ch-bk1 92s ease-in-out infinite'),
        }} />

        <div style={{
          position: 'absolute', width: '55vw', height: '60vh',
          top: '20%', left: '-15%',
          background: 'radial-gradient(ellipse, rgba(46,125,50,0.065) 0%, transparent 65%)',
          animation: motionAnimation('ch-bk2 110s ease-in-out infinite'),
        }} />

        <div style={{
          position: 'absolute', width: '50vw', height: '55vh',
          bottom: '-10%', right: '-10%',
          background: 'radial-gradient(ellipse, rgba(29,233,182,0.06) 0%, transparent 65%)',
          animation: motionAnimation('ch-bk3 85s ease-in-out infinite'),
        }} />

        <div style={{
          position: 'absolute', width: '42vw', height: '42vh',
          top: '35%', left: '30%',
          background: 'radial-gradient(ellipse, rgba(0,200,83,0.05) 0%, transparent 60%)',
          animation: motionAnimation('ch-bk4 118s ease-in-out infinite'),
        }} />

        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 85%, transparent 30%, rgba(4,12,6,0.72) 78%, rgba(4,12,6,0.96) 100%)',
        }} />
      </div>
    </>
  );
}
