'use client';

import { motionAnimation, shouldAnimateBackground } from './background-utils';

export function InsightsBackground() {
  const animate = shouldAnimateBackground();

  return (
    <>
      {animate && (
        <style>{`
          @keyframes bk1 {
            0%, 100% { transform: translate(0px, 0px); }
            50%       { transform: translate(-6vw, 4vh); }
          }
          @keyframes bk2 {
            0%, 100% { transform: translate(0px, 0px); }
            40%       { transform: translate(5vw, -5vh); }
            80%       { transform: translate(-2vw, 3vh); }
          }
          @keyframes bk3 {
            0%, 100% { transform: translate(0px, 0px); }
            60%       { transform: translate(3vw, 6vh); }
          }
          @keyframes bk4 {
            0%, 100% { transform: translate(0px, 0px); }
            50%       { transform: translate(-4vw, -3vh); }
          }
          @keyframes bk5 {
            0%, 100% { transform: translate(0px, 0px); }
            45%       { transform: translate(6vw, 4vh); }
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
          background: '#03020C',
        }}
      >
        <div style={{
          position: 'absolute', width: '60vw', height: '60vh',
          top: '-12%', left: '18%',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.09) 0%, rgba(124,58,237,0.04) 45%, transparent 70%)',
          animation: motionAnimation('bk1 97s ease-in-out infinite'),
        }} />

        <div style={{
          position: 'absolute', width: '50vw', height: '55vh',
          top: '15%', left: '-18%',
          background: 'radial-gradient(ellipse, rgba(79,70,229,0.07) 0%, transparent 65%)',
          animation: motionAnimation('bk2 118s ease-in-out infinite'),
        }} />

        <div style={{
          position: 'absolute', width: '45vw', height: '50vh',
          bottom: '-8%', right: '-12%',
          background: 'radial-gradient(ellipse, rgba(20,184,166,0.065) 0%, transparent 65%)',
          animation: motionAnimation('bk3 88s ease-in-out infinite'),
        }} />

        <div style={{
          position: 'absolute', width: '38vw', height: '38vh',
          top: '38%', left: '38%',
          background: 'radial-gradient(ellipse, rgba(168,85,247,0.055) 0%, transparent 60%)',
          animation: motionAnimation('bk4 123s ease-in-out infinite'),
        }} />

        <div style={{
          position: 'absolute', width: '32vw', height: '32vh',
          top: '-6%', right: '3%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 60%)',
          animation: motionAnimation('bk5 103s ease-in-out infinite'),
        }} />

        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 45%, transparent 22%, rgba(3,2,12,0.72) 78%, rgba(3,2,12,0.96) 100%)',
        }} />
      </div>
    </>
  );
}
