/**
 * @file DataOrb.tsx
 * @description 3D WebGL DataOrb ambient component for the Dashboard.
 * Renders a slowly rotating wireframe sphere with chaotic interior floating particles.
 * Color shifts dynamically between green, amber, and red based on today's carbon usage.
 */

'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCarbonStore } from '@/store/carbon-store';

export default function DataOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const todayCarbon = useCarbonStore((state) => state.summary?.today || 0);

  // Compute color based on today's carbon level
  // green (#00E676) if < 7, amber (#FFB300) if < 13, red (#FF5252) otherwise
  const orbColor = useMemo(() => {
    if (todayCarbon < 7.0) return new THREE.Color('#00E676');
    if (todayCarbon < 13.0) return new THREE.Color('#FFB300');
    return new THREE.Color('#FF5252');
  }, [todayCarbon]);

  // Particle positions inside the sphere (radius 0.7)
  const particlePositions = useMemo(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Uniform random point inside a sphere of radius 0.7
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 0.7; // cbrt ensures uniform density

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  // Chaotic noise velocities for particles
  const particleVelocities = useMemo(() => {
    const count = 120;
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      velocities[i] = (Math.random() - 0.5) * 0.15;
    }
    return velocities;
  }, []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    // Slow wireframe rotation
    if (meshRef.current) {
      meshRef.current.rotation.y = elapsed * 0.15;
      meshRef.current.rotation.x = elapsed * 0.08;
    }

    // Chaotic particle movements (brownian style bobbing + slow rotation)
    if (particlesRef.current) {
      particlesRef.current.rotation.y = -elapsed * 0.1;
      
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        // Apply chaotic sin wave offsets based on velocity and elapsed time
        const vx = particleVelocities[i * 3];
        const vy = particleVelocities[i * 3 + 1];
        const vz = particleVelocities[i * 3 + 2];

        positions[i * 3] += Math.sin(elapsed * 2 + i) * vx * 0.02;
        positions[i * 3 + 1] += Math.cos(elapsed * 1.5 + i) * vy * 0.02;
        positions[i * 3 + 2] += Math.sin(elapsed * 3 + i) * vz * 0.02;

        // Keep them bounded within a radius of 0.72
        const distSq =
          positions[i * 3] ** 2 +
          positions[i * 3 + 1] ** 2 +
          positions[i * 3 + 2] ** 2;

        if (distSq > 0.52) {
          // pull back slightly toward center
          positions[i * 3] *= 0.95;
          positions[i * 3 + 1] *= 0.95;
          positions[i * 3 + 2] *= 0.95;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.4} />
      <pointLight position={[2, 2, 2]} intensity={1.0} color="#ffffff" />
      
      {/* Outer Wireframe Sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.75, 18, 18]} />
        <meshBasicMaterial
          color={orbColor}
          wireframe
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Subtle glowing center sphere */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color={orbColor}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Chaotic particles inside */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color={orbColor}
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
