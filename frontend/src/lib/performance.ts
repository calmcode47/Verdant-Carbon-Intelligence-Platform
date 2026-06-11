export type PerformanceTier = 'LOW' | 'MEDIUM' | 'HIGH';

let _cachedTier: PerformanceTier | null = null;
let _cachedWebGLSupport: boolean | null = null;

export function hasWebGLSupport(): boolean {
  if (typeof window === 'undefined') return true;
  if (_cachedWebGLSupport !== null) return _cachedWebGLSupport;

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  _cachedWebGLSupport = Boolean(gl);
  return _cachedWebGLSupport;
}

export function getPerformanceTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'HIGH'; // SSR: assume high
  if (_cachedTier) return _cachedTier;

  const cores = navigator.hardwareConcurrency ?? 2;
  const memGB = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!hasWebGLSupport()) return (_cachedTier = 'LOW');
  if (prefersReduced) return (_cachedTier = 'LOW');
  if (isMobile) return (_cachedTier = 'MEDIUM');

  if (cores <= 2 || memGB < 2) return (_cachedTier = 'LOW');
  if (cores <= 4 || memGB < 4) return (_cachedTier = 'MEDIUM');
  return (_cachedTier = 'HIGH');
}

export function safePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  const tier = getPerformanceTier();
  if (tier === 'LOW') return 1;
  if (tier === 'MEDIUM') return Math.min(window.devicePixelRatio, 1.5);
  return Math.min(window.devicePixelRatio, 2);
}

export function particleCount(base: number): number {
  const tier = getPerformanceTier();
  if (tier === 'LOW') return Math.max(8, Math.floor(base * 0.12));
  if (tier === 'MEDIUM') return Math.floor(base * 0.4);
  return base;
}

/** Full-screen WebGL scenes (globe, neural core, orb telemetry). */
export function enableWebGLScenes(): boolean {
  return getPerformanceTier() === 'HIGH' && hasWebGLSupport();
}

/** Typewriter / fast interval UI effects. */
export function enableRichMotion(): boolean {
  return getPerformanceTier() === 'HIGH';
}
