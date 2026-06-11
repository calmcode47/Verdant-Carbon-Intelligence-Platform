'use client';
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVisibilityPause } from '@/hooks/useVisibilityPause';
import { safePixelRatio, getPerformanceTier, enableWebGLScenes } from '@/lib/performance';
import { WebGLErrorBoundary } from './WebGLErrorBoundary';

function CoreMesh() {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const isVisible = useVisibilityPause();

  const outerMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#7c3aed'),
    emissive: new THREE.Color('#4c1d95'),
    emissiveIntensity: 0.5,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.7,
    transparent: true,
    opacity: 0.8,
    wireframe: false,
  }), []);

  const wireMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#a78bfa'),
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  }), []);

  useFrame((state) => {
    if (!isVisible) return;
    const t = state.clock.elapsedTime;
    if (outerRef.current) {
      outerRef.current.rotation.y = t * 0.2;
      outerRef.current.rotation.x = Math.sin(t * 0.15) * 0.3;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.35;
      innerRef.current.rotation.z = t * 0.1;
      const pulse = 1 + Math.sin(t * 1.5) * 0.04;
      innerRef.current.scale.setScalar(pulse);
    }
    if (ring1.current) ring1.current.rotation.z = t * 0.3;
    if (ring2.current) ring2.current.rotation.x = t * 0.2;
  });

  return (
    <group>
      <mesh ref={innerRef} material={outerMat}>
        <sphereGeometry args={[0.5, 32, 32]} />
      </mesh>

      <mesh ref={outerRef} material={wireMat}>
        <icosahedronGeometry args={[0.85, 1]} />
      </mesh>

      <mesh ref={ring1} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.006, 2, 80]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.4} />
      </mesh>
      <mesh ref={ring2} rotation={[0, Math.PI / 3, Math.PI / 4]}>
        <torusGeometry args={[1.3, 0.004, 2, 70]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

const fallback = (
  <div
    style={{
      width: '100%',
      height: '100%',
      minWidth: 120,
      minHeight: 120,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 40% 40%, rgba(124,58,237,0.62), rgba(0,229,255,0.18) 46%, rgba(79,70,229,0.08) 72%)',
      boxShadow: '0 0 40px rgba(124,58,237,0.3), inset 0 0 28px rgba(0,0,0,0.38)',
      border: '1px solid rgba(0,229,255,0.2)',
    }}
    aria-hidden="true"
  />
);

function NeuralCoreCanvas() {
  const tier = getPerformanceTier();
  const isVisible = useVisibilityPause();

  return (
    <Canvas
      dpr={safePixelRatio()}
      camera={{ position: [0, 0, 3], fov: 50 }}
      frameloop={isVisible ? 'always' : 'never'}
      gl={{ antialias: tier === 'HIGH', alpha: true, stencil: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.15} />
      <pointLight position={[2, 2, 2]} intensity={1.0} color="#7c3aed" />
      <pointLight position={[-2, -1, -1]} intensity={0.5} color="#a78bfa" />
      <CoreMesh />
    </Canvas>
  );
}

export function NeuralCore() {
  if (!enableWebGLScenes()) return fallback;

  return (
    <WebGLErrorBoundary fallback={fallback}>
      <NeuralCoreCanvas />
    </WebGLErrorBoundary>
  );
}

export default NeuralCore;
