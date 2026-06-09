'use client';
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVisibilityPause } from '@/hooks/useVisibilityPause';
import { safePixelRatio, getPerformanceTier } from '@/lib/performance';

interface OrbData {
  position: [number, number, number];
  color: string;
  size: number;
  speed: number;
  phase: number;
}

const ORB_DATA: OrbData[] = [
  { position: [-1.8, 0.3, 0], color: '#ff6b35', size: 0.28, speed: 0.7, phase: 0 },
  { position: [0, 0.8, -0.5], color: '#00d4ff', size: 0.22, speed: 0.9, phase: 1.2 },
  { position: [1.6, -0.2, 0.3], color: '#00e676', size: 0.20, speed: 0.6, phase: 2.4 },
  { position: [-0.4, -0.7, 0.6], color: '#ffd700', size: 0.16, speed: 1.1, phase: 0.8 },
];

function SingleOrb({ orb }: { orb: OrbData }) {
  const ref = useRef<THREE.Mesh>(null);
  const isVisible = useVisibilityPause();
  const baseY = orb.position[1];

  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(orb.color),
    emissive: new THREE.Color(orb.color),
    emissiveIntensity: 0.3,
    roughness: 0.1,
    metalness: 0.05,
    transmission: 0.6,
    transparent: true,
    opacity: 0.85,
  }), [orb.color]);

  useFrame((state) => {
    if (!isVisible || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = baseY + Math.sin(t * orb.speed + orb.phase) * 0.15;
    ref.current.rotation.y += 0.003;
    ref.current.rotation.x += 0.001;
  });

  return (
    <mesh ref={ref} position={orb.position} material={mat}>
      <sphereGeometry args={[orb.size, 24, 24]} />
    </mesh>
  );
}

function OrbScene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 2, 2]} intensity={0.8} color="#00e676" />
      <pointLight position={[0, -2, -2]} intensity={0.4} color="#00d4ff" />
      {ORB_DATA.map((orb, i) => <SingleOrb key={i} orb={orb} />)}
    </>
  );
}

import { WebGLErrorBoundary } from './WebGLErrorBoundary';

export function DataOrbs() {
  const tier = getPerformanceTier();
  if (tier === 'LOW') return null;

  return (
    <WebGLErrorBoundary>
      <Canvas
        dpr={safePixelRatio()}
        camera={{ position: [0, 0, 4], fov: 50 }}
        frameloop="always"
        gl={{ antialias: tier === 'HIGH', alpha: true, stencil: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <OrbScene />
      </Canvas>
    </WebGLErrorBoundary>
  );
}

export default DataOrbs;
