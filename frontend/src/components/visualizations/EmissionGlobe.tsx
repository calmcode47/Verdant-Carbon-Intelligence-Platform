'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useCarbonStore } from '@/store/carbon-store';
import { useVisibilityPause } from '@/hooks/useVisibilityPause';

export function EmissionGlobe() {
  const globeRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Points>(null);
  const isVisible = useVisibilityPause();
  
  const activities = useCarbonStore((state) => state.activities);
  const totalEmissions = useCarbonStore((state) => state.user?.totalCarbonKg || 0);

  // Speed and scale dynamically change based on emissions logged
  const rotationSpeed = useMemo(() => {
    return 0.005 + Math.min(totalEmissions / 5000, 0.05);
  }, [totalEmissions]);

  const emissionIntensity = useMemo(() => {
    return Math.min(2 + activities.length * 0.5, 12);
  }, [activities]);

  useFrame((state) => {
    if (!isVisible) return;
    const elapsed = state.clock.getElapsedTime();
    if (globeRef.current) {
      globeRef.current.rotation.y = elapsed * rotationSpeed;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y = -elapsed * (rotationSpeed * 0.5);
    }
  });

  // Generate coordinates for hotspots based on activities
  const particlePositions = useMemo(() => {
    const count = Math.min(100 + activities.length * 10, 400);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Generate points on the surface of a sphere of radius 2.2
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.2 + Math.random() * 0.4; // Slightly offset from surface

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, [activities]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#10b981" />
      <directionalLight position={[-5, -5, -5]} intensity={0.4} color="#06b6d4" />

      {/* Main Earth Globe representation */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.6}
          metalness={0.8}
          wireframe={true}
        />
        {/* Inner solid glow sphere */}
        <mesh>
          <sphereGeometry args={[1.98, 32, 32]} />
          <meshBasicMaterial
            color="#047857"
            transparent
            opacity={0.15}
          />
        </mesh>
      </mesh>

      {/* Emission Hotspot Particles */}
      <points ref={cloudRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color={totalEmissions > 1000 ? '#f43f5e' : '#10b981'}
          transparent
          opacity={0.8}
          sizeAttenuation={true}
        />
      </points>

      {/* Atmospheric Space Particles */}
      <Sparkles
        count={60}
        scale={6}
        size={emissionIntensity}
        speed={0.5}
        color={totalEmissions > 1000 ? '#f43f5e' : '#34d399'}
      />

      <OrbitControls
        enableZoom={false}
        autoRotate={true}
        autoRotateSpeed={1.0}
        enablePan={false}
        enableRotate={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
}
