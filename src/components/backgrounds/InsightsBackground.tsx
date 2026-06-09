'use client';

export function InsightsBackground() {
  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
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
          background: '#03020C',
        }}
      >
        {/* BOKEH 1 — large violet, top-center, slowest */}
        <div style={{
          position: 'absolute', width: '60vw', height: '60vh',
          top: '-12%', left: '18%',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.09) 0%, rgba(124,58,237,0.04) 45%, transparent 70%)',
          filter: 'blur(130px)',
          animation: 'bk1 97s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* BOKEH 2 — indigo, left */}
        <div style={{
          position: 'absolute', width: '50vw', height: '55vh',
          top: '15%', left: '-18%',
          background: 'radial-gradient(ellipse, rgba(79,70,229,0.07) 0%, transparent 65%)',
          filter: 'blur(110px)',
          animation: 'bk2 118s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* BOKEH 3 — teal, bottom-right */}
        <div style={{
          position: 'absolute', width: '45vw', height: '50vh',
          bottom: '-8%', right: '-12%',
          background: 'radial-gradient(ellipse, rgba(20,184,166,0.065) 0%, transparent 65%)',
          filter: 'blur(120px)',
          animation: 'bk3 88s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* BOKEH 4 — deep purple, center */}
        <div style={{
          position: 'absolute', width: '38vw', height: '38vh',
          top: '38%', left: '38%',
          background: 'radial-gradient(ellipse, rgba(168,85,247,0.055) 0%, transparent 60%)',
          filter: 'blur(140px)',
          animation: 'bk4 123s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* BOKEH 5 — periwinkle, top-right */}
        <div style={{
          position: 'absolute', width: '32vw', height: '32vh',
          top: '-6%', right: '3%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 60%)',
          filter: 'blur(95px)',
          animation: 'bk5 103s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* VIGNETTE */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 45%, transparent 22%, rgba(3,2,12,0.72) 78%, rgba(3,2,12,0.96) 100%)',
        }} />
      </div>
    </>
  );
}
