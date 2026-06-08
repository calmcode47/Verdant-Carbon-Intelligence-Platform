/**
 * @file EarthGlobe.tsx
 * @description 3D WebGL Earth Globe component for the Hero section background.
 * Generates a procedural landmass texture using canvas pixel noise, adds a surrounding halo
 * atmosphere, and renders a floating 2000-particle system of red CO2 particles that fall
 * towards the Earth during scrolling to create a parallax effect.
 */

'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function EarthGlobe() {
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Generate a procedural Earth texture to guarantee self-containment
  const earthTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill ocean (deep space black-blue)
    ctx.fillStyle = '#050a15';
    ctx.fillRect(0, 0, 1024, 512);

    // Draw procedural continents using fractal sine/cosine frequencies
    for (let y = 0; y < 512; y += 2) {
      for (let x = 0; x < 1024; x += 2) {
        const lon = (x / 1024) * Math.PI * 2;
        const lat = (y / 512) * Math.PI - Math.PI / 2;

        const dx = Math.cos(lat) * Math.cos(lon);
        const dy = Math.cos(lat) * Math.sin(lon);
        const dz = Math.sin(lat);

        // Sinusoidal noise waves simulating landmass clusters
        const n =
          Math.sin(dx * 4) * Math.cos(dy * 4) +
          Math.sin(dz * 5) * Math.cos(dx * 2) +
          Math.sin(dy * 6) * Math.sin(dz * 3);

        if (n > 0.05) {
          // Draw electric green land dot
          ctx.fillStyle = '#00E676';
          ctx.fillRect(x, y, 2, 2);
        } else if (n > -0.1) {
          // Draw a transition shoreline (nebula blue)
          ctx.fillStyle = '#1565C0';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  // Create particle positions for the floating CO2 system (2000 items)
  const [particlePositions, particleSpeeds] = useMemo(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Place particles in a spherical shell around the Earth (radius 1.4 to 2.2)
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.4 + Math.random() * 0.8;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      speeds[i] = 0.2 + Math.random() * 0.8;
    }

    return [positions, speeds];
  }, []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

    // Slow Earth rotation: 0.001 rad/frame
    if (globeRef.current) {
      globeRef.current.rotation.y = elapsed * 0.06;
    }

    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = elapsed * 0.06;
    }

    // Floating CO2 particles update & parallax fall
    if (particlesRef.current) {
      // Slow rotation of the particle sphere
      particlesRef.current.rotation.y = elapsed * 0.03;
      particlesRef.current.rotation.x = elapsed * 0.01;

      // Parallax shift based on scroll
      particlesRef.current.position.y = -scrollY * 0.0012;

      // Bobbing particles to simulate float
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        const speed = particleSpeeds[i];
        // Apply tiny sinusoidal displacement
        positions[i * 3 + 1] += Math.sin(elapsed * speed + i) * 0.0003;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} color="#F8F9FF" />
      <directionalLight position={[-5, -3, -5]} intensity={0.4} color="#1565C0" />

      {/* Earth Sphere */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[1, 64, 64]} />
        {earthTexture ? (
          <meshStandardMaterial
            map={earthTexture}
            roughness={0.7}
            metalness={0.1}
          />
        ) : (
          <meshStandardMaterial
            color="#050a15"
            roughness={0.7}
            metalness={0.1}
            wireframe
          />
        )}
      </mesh>

      {/* Atmospheric Glow */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[1.04, 32, 32]} />
        <meshBasicMaterial
          color="#00E676"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Floating Red CO2 Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.018}
          color="#FF5252"
          transparent
          opacity={0.75}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
