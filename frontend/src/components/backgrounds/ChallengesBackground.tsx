'use client';

export function ChallengesBackground() {
  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
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
          background: '#040C06',
        }}
      >
        {/* BOKEH 1 — large emerald, top-center */}
        <div style={{
          position: 'absolute', width: '65vw', height: '65vh',
          top: '-15%', left: '15%',
          background: 'radial-gradient(ellipse, rgba(0,230,118,0.08) 0%, rgba(0,230,118,0.03) 45%, transparent 70%)',
          filter: 'blur(140px)',
          animation: 'ch-bk1 92s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* BOKEH 2 — mint green, left */}
        <div style={{
          position: 'absolute', width: '55vw', height: '60vh',
          top: '20%', left: '-15%',
          background: 'radial-gradient(ellipse, rgba(46,125,50,0.065) 0%, transparent 65%)',
          filter: 'blur(120px)',
          animation: 'ch-bk2 110s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* BOKEH 3 — teal-green, bottom-right */}
        <div style={{
          position: 'absolute', width: '50vw', height: '55vh',
          bottom: '-10%', right: '-10%',
          background: 'radial-gradient(ellipse, rgba(29,233,182,0.06) 0%, transparent 65%)',
          filter: 'blur(130px)',
          animation: 'ch-bk3 85s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* BOKEH 4 — deep forest, center */}
        <div style={{
          position: 'absolute', width: '42vw', height: '42vh',
          top: '35%', left: '30%',
          background: 'radial-gradient(ellipse, rgba(0,200,83,0.05) 0%, transparent 60%)',
          filter: 'blur(145px)',
          animation: 'ch-bk4 118s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* VIGNETTE */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 85%, transparent 30%, rgba(4,12,6,0.72) 78%, rgba(4,12,6,0.96) 100%)',
        }} />
      </div>
    </>
  );
}
