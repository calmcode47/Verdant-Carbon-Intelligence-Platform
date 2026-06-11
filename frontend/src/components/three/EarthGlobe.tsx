'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVisibilityPause } from '@/hooks/useVisibilityPause';
import { safePixelRatio, getPerformanceTier, enableWebGLScenes } from '@/lib/performance';
import { WebGLErrorBoundary } from './WebGLErrorBoundary';

// ─── Seeded pseudo-random ────────────────────────────────────────────────────
function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 17), 0x9e3779b9) >>> 0;
    s = Math.imul(s ^ (s >>> 13), 0x6c62272e) >>> 0;
    return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
  };
}

// ─── Smooth value noise on a sphere ─────────────────────────────────────────
function smoothNoise(cx: number, cy: number, cz: number, scale: number): number {
  return (
    Math.sin(cx * scale + 1.2) * Math.cos(cy * scale * 0.9) +
    Math.sin(cy * scale * 1.1 + 2.4) * Math.cos(cz * scale * 0.8) +
    Math.sin(cz * scale * 0.95 + 3.7) * Math.cos(cx * scale * 1.05)
  ) / 3;
}

function fbm(cx: number, cy: number, cz: number): number {
  let v = 0, amp = 0.5, freq = 1;
  for (let o = 0; o < 5; o++) {
    v += smoothNoise(cx, cy, cz, freq * 3.8) * amp;
    amp *= 0.52;
    freq *= 1.95;
  }
  return v;
}

// ─── Build textures using ImageData (smooth pixels, no fillRect banding) ────
function buildEarthTextures(): {
  color: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  clouds: THREE.CanvasTexture;
} {
  const W = 2048, H = 1024;

  // --- Day / color map ---
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = W; colorCanvas.height = H;
  const colorCtx = colorCanvas.getContext('2d')!;
  const colorImg = colorCtx.createImageData(W, H);
  const cd = colorImg.data;

  // --- Roughness map (ocean=smooth/shiny, land=rough/matte) ---
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = W; roughCanvas.height = H;
  const roughCtx = roughCanvas.getContext('2d')!;
  const roughImg = roughCtx.createImageData(W, H);
  const rd = roughImg.data;

  for (let py = 0; py < H; py++) {
    const lat = (py / H) * Math.PI - Math.PI / 2; // −π/2 → π/2
    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);

    for (let px = 0; px < W; px++) {
      const lon = (px / W) * Math.PI * 2;
      const cx = cosLat * Math.cos(lon);
      const cy = cosLat * Math.sin(lon);
      const cz = sinLat;

      // fBm elevation
      const elev = fbm(cx, cy, cz);

      // Polar cap blend (smooth sigmoid)
      const absLat = Math.abs(lat);
      const iceFactor = Math.max(0, (absLat - 1.22) / 0.35); // smooth fade above ~70°
      const iceBlend  = Math.min(1, iceFactor * iceFactor * (3 - 2 * iceFactor));

      const i = (py * W + px) * 4;

      let r: number, g: number, b: number, roughVal: number;

      if (iceBlend > 0.5) {
        // ── Ice / polar caps ──────────────────────────────────────────────
        const t = (iceBlend - 0.5) * 2; // 0→1
        r = Math.round(215 + t * 35);
        g = Math.round(225 + t * 25);
        b = Math.round(240 + t * 15);
        roughVal = 220;
      } else {
        // Mix between ocean and land using elevation
        const isLand = elev > 0.03;

        if (isLand) {
          // ── Land ─────────────────────────────────────────────────────────
          const t = Math.min((elev - 0.03) / 0.55, 1); // 0=lowland, 1=highland

          // Lowland: tropical/forest green → highland: rocky brown → snow peaks
          if (t < 0.45) {
            // Forest / lowland green
            const s = t / 0.45;
            r = Math.round(18 + s * 35);
            g = Math.round(95 + s * 65);
            b = Math.round(28 + s * 20);
          } else if (t < 0.75) {
            // Highland scrub / savanna
            const s = (t - 0.45) / 0.30;
            r = Math.round(53 + s * 85);
            g = Math.round(160 - s * 60);
            b = Math.round(48 - s * 18);
          } else {
            // Mountain / snow cap
            const s = Math.min((t - 0.75) / 0.25, 1);
            r = Math.round(138 + s * 100);
            g = Math.round(100 + s * 120);
            b = Math.round(30  + s * 180);
          }

          // Mix in polar ice for high-latitude land
          if (iceBlend > 0.05) {
            const iM = iceBlend * 2;
            r = Math.round(r + (230 - r) * iM);
            g = Math.round(g + (235 - g) * iM);
            b = Math.round(b + (245 - b) * iM);
          }

          roughVal = 200 + Math.round(t * 45); // land = rough

        } else {
          // ── Ocean ─────────────────────────────────────────────────────────
          const depth = Math.min(1, (0.03 - elev) / 0.55);

          // Coast shallow → deep ocean
          if (depth < 0.25) {
            const s = depth / 0.25;
            r = Math.round(14  + s * 8);
            g = Math.round(100 + s * 30);
            b = Math.round(155 + s * 40);
          } else {
            const s = Math.min((depth - 0.25) / 0.75, 1);
            r = Math.round(22  - s * 10);
            g = Math.round(130 - s * 70);
            b = Math.round(195 - s * 90);
          }

          roughVal = 18; // ocean = very smooth / specular
        }
      }

      cd[i]     = r;
      cd[i + 1] = g;
      cd[i + 2] = b;
      cd[i + 3] = 255;

      rd[i]     = roughVal;
      rd[i + 1] = roughVal;
      rd[i + 2] = roughVal;
      rd[i + 3] = 255;
    }
  }

  colorCtx.putImageData(colorImg, 0, 0);
  roughCtx.putImageData(roughImg, 0, 0);

  // --- Cloud layer ---
  const cloudW = 1024, cloudH = 512;
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = cloudW; cloudCanvas.height = cloudH;
  const cloudCtx = cloudCanvas.getContext('2d')!;
  const cloudImg = cloudCtx.createImageData(cloudW, cloudH);
  const cloudD = cloudImg.data;
  const rng = createRng(17);

  for (let py = 0; py < cloudH; py++) {
    const lat = (py / cloudH) * Math.PI - Math.PI / 2;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    for (let px = 0; px < cloudW; px++) {
      const lon = (px / cloudW) * Math.PI * 2;
      const cx = cosLat * Math.cos(lon);
      const cy = cosLat * Math.sin(lon);
      const cz = sinLat;

      // Separate fBm for clouds, offset from terrain
      const c1 = fbm(cx + 10, cy + 5, cz + 7);
      const c2 = fbm(cx * 1.3 + 8, cy * 0.8 - 4, cz * 1.1 + 2);
      const cloud = (c1 * 0.6 + c2 * 0.4 + rng() * 0.06);

      const visible = Math.max(0, Math.min(1, (cloud - 0.04) * 5.5));
      const ci = (py * cloudW + px) * 4;
      const cv2 = Math.round(visible * 255);
      cloudD[ci]     = 255;
      cloudD[ci + 1] = 255;
      cloudD[ci + 2] = 255;
      cloudD[ci + 3] = cv2;
    }
  }

  cloudCtx.putImageData(cloudImg, 0, 0);

  const mkTex = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  };

  return {
    color:    mkTex(colorCanvas),
    roughness: mkTex(roughCanvas),
    clouds:   mkTex(cloudCanvas),
  };
}

// ─── Star field geometry ─────────────────────────────────────────────────────
function buildStars(count: number): Float32Array {
  const rng = createRng(99);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r     = 14 + rng() * 22;
    const theta = rng() * Math.PI * 2;
    const phi   = Math.acos(2 * rng() - 1);
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }
  return pos;
}

// ─── Scene component ─────────────────────────────────────────────────────────
function GlobeScene() {
  const globeRef  = useRef<THREE.Mesh>(null);
  const cloudRef  = useRef<THREE.Mesh>(null);
  const atmos1Ref = useRef<THREE.Mesh>(null);
  const atmos2Ref = useRef<THREE.Mesh>(null);
  const starsRef  = useRef<THREE.Points>(null);
  const ringRef   = useRef<THREE.Mesh>(null);

  const isVisible = useVisibilityPause();
  const tier      = getPerformanceTier();
  const segments  = tier === 'HIGH' ? 96 : 56;

  // Mouse
  const mouse   = useRef({ x: 0, y: 0 });
  const smoothM = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = (e: MouseEvent) => {
      mouse.current.x = ((e.clientX / window.innerWidth)  * 2 - 1) * 0.5;
      mouse.current.y = ((e.clientY / window.innerHeight) * 2 - 1) * 0.18;
    };
    window.addEventListener('mousemove', h, { passive: true });
    return () => window.removeEventListener('mousemove', h);
  }, []);

  // Textures (computed once, off the main thread in useMemo)
  const textures = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return buildEarthTextures();
  }, []);

  const starPos = useMemo(() => buildStars(tier === 'HIGH' ? 3000 : 1500), [tier]);

  // Animation
  useFrame((_, dt) => {
    if (!isVisible) return;
    const lf = 0.035; // lerp factor
    smoothM.current.x += (mouse.current.x - smoothM.current.x) * lf;
    smoothM.current.y += (mouse.current.y - smoothM.current.y) * lf;

    if (globeRef.current) {
      globeRef.current.rotation.y += dt * 0.045;
      globeRef.current.rotation.x = THREE.MathUtils.lerp(
        globeRef.current.rotation.x, smoothM.current.y, 0.05
      );
    }
    // Clouds drift slightly faster than surface
    if (cloudRef.current) {
      cloudRef.current.rotation.y  = (globeRef.current?.rotation.y ?? 0) + dt * 0.012;
      cloudRef.current.rotation.x  = globeRef.current?.rotation.x ?? 0;
    }
    // Atmospheres follow globe
    if (atmos1Ref.current) atmos1Ref.current.rotation.copy(globeRef.current?.rotation ?? new THREE.Euler());
    if (atmos2Ref.current) atmos2Ref.current.rotation.copy(globeRef.current?.rotation ?? new THREE.Euler());
    // Orbital ring tilts slightly with mouse
    if (ringRef.current) {
      ringRef.current.rotation.z += dt * 0.014;
      ringRef.current.rotation.x = THREE.MathUtils.lerp(ringRef.current.rotation.x, 0.44 + smoothM.current.y * 0.5, 0.04);
    }
    if (starsRef.current) starsRef.current.rotation.y += dt * 0.0025;
  });

  return (
    <group>
      {/* ── Lighting ─────────────────────────────────────────────────────── */}
      <ambientLight intensity={0.28} />
      {/* Sun — warm directional from upper-right front */}
      <directionalLight position={[8, 3, 6]}  intensity={2.2} color="#FFF5E8" castShadow={false} />
      {/* Blue space fill from the opposite side */}
      <directionalLight position={[-6, -2, -5]} intensity={0.18} color="#2255BB" />

      {/* ── Stars ────────────────────────────────────────────────────────── */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#D8E8FF" transparent opacity={0.9} sizeAttenuation depthWrite={false} />
      </points>

      {/* ── Outer atmospheric haze (back-lit blue Rayleigh rim) ────────── */}
      <mesh ref={atmos2Ref}>
        <sphereGeometry args={[1.32, 64, 64]} />
        <meshBasicMaterial
          color="#0044BB" transparent opacity={0.055}
          blending={THREE.AdditiveBlending} side={THREE.BackSide} depthWrite={false}
        />
      </mesh>

      {/* ── Inner atmosphere (soft green glow on earth edge) ─────────── */}
      <mesh ref={atmos1Ref}>
        <sphereGeometry args={[1.16, 64, 64]} />
        <meshBasicMaterial
          color="#00CC66" transparent opacity={0.07}
          blending={THREE.AdditiveBlending} side={THREE.BackSide} depthWrite={false}
        />
      </mesh>

      {/* ── Earth sphere ─────────────────────────────────────────────────── */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[1.1, segments, segments]} />
        {textures ? (
          <meshStandardMaterial
            map={textures.color}
            roughnessMap={textures.roughness}
            roughness={1}
            metalness={0.0}
            envMapIntensity={0.4}
          />
        ) : (
          <meshStandardMaterial color="#0a1628" roughness={0.8} metalness={0.0} />
        )}
      </mesh>

      {/* ── Cloud layer ──────────────────────────────────────────────────── */}
      {textures && (
        <mesh ref={cloudRef}>
          <sphereGeometry args={[1.115, segments, segments]} />
          <meshStandardMaterial
            alphaMap={textures.clouds}
            transparent
            opacity={0.88}
            color="#FFFFFF"
            roughness={1}
            metalness={0}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* ── Thin orbital ring ─────────────────────────────────────────────── */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[1.78, 0.0025, 8, 220]} />
        <meshBasicMaterial
          color="#00E676" transparent opacity={0.30}
          blending={THREE.AdditiveBlending} depthWrite={false}
        />
      </mesh>

      {/* ── Second faint tilted ring ────────────────────────────────────── */}
      <mesh rotation={[Math.PI / 4, 0.4, 0.1]}>
        <torusGeometry args={[2.1, 0.0015, 8, 220]} />
        <meshBasicMaterial
          color="#1DE9B6" transparent opacity={0.10}
          blending={THREE.AdditiveBlending} depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Fallback ────────────────────────────────────────────────────────────────
export function EarthGlobeFallback() {
  return (
    <div
      role="img"
      aria-label="Earth illustration"
      style={{
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 35%, #1a6e30 0%, #0d3820 40%, #060f18 100%)',
        boxShadow: '0 0 80px rgba(0,230,118,0.15), 0 0 180px rgba(0,230,118,0.05), inset -25px -25px 80px rgba(0,0,0,0.6)',
        border: '1px solid rgba(0,230,118,0.15)',
      }}
    />
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────
function EarthGlobeCanvas() {
  const tier = getPerformanceTier();
  const isVisible = useVisibilityPause();

  return (
    <Canvas
        dpr={safePixelRatio()}
        camera={{ position: [0, 0, 3.5], fov: 42 }}
        frameloop={isVisible ? 'always' : 'never'}
        gl={{
          antialias: tier === 'HIGH',
          alpha: true,
          powerPreference: tier === 'HIGH' ? 'high-performance' : 'default',
          stencil: false,
          depth: true,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <GlobeScene />
    </Canvas>
  );
}

export function EarthGlobeStatic() {
  return (
    <div
      role="img"
      aria-label="Earth illustration"
      style={{
        width: '100%',
        height: '100%',
        background:
          'radial-gradient(circle at 40% 35%, rgba(26,110,48,0.55) 0%, rgba(8,40,22,0.85) 38%, rgba(3,8,16,1) 72%)',
      }}
    />
  );
}

export default function EarthGlobe() {
  if (!enableWebGLScenes()) return <EarthGlobeStatic />;

  return (
    <WebGLErrorBoundary fallback={<EarthGlobeStatic />}>
      <EarthGlobeCanvas />
    </WebGLErrorBoundary>
  );
}
