/**
 * @file CarbonMolecule.tsx
 * @description 3D WebGL CO2 Molecule component for the callout section.
 * Renders a central Carbon atom (gray) double-bonded to two Oxygen atoms (red).
 * Integrates frame loops to spin and bob the model. On pointer hover, the oxygen atoms
 * drift away and bonds stretch/break, reforming when the pointer exits.
 */

'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function CarbonMolecule() {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Position and bond length tracking refs for animation loop
  const distance = useRef(1.0); // Default bond distance
  const o1Ref = useRef<THREE.Mesh>(null);
  const o2Ref = useRef<THREE.Mesh>(null);
  const b1aRef = useRef<THREE.Mesh>(null);
  const b1bRef = useRef<THREE.Mesh>(null);
  const b2aRef = useRef<THREE.Mesh>(null);
  const b2bRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    // Bobbing and spinning group movement
    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed * 0.4;
      groupRef.current.rotation.x = Math.sin(elapsed * 0.3) * 0.15;
      groupRef.current.position.y = Math.sin(elapsed * 1.2) * 0.12;
    }

    // Smooth lerp of bond distance: 1.0 (default) -> 2.2 (broken on hover)
    const targetDist = hovered ? 2.4 : 1.0;
    distance.current += (targetDist - distance.current) * 0.12;

    // Update atom and bond transforms
    if (o1Ref.current) o1Ref.current.position.x = -distance.current;
    if (o2Ref.current) o2Ref.current.position.x = distance.current;

    // Left double bonds
    const halfDist = distance.current / 2;
    if (b1aRef.current) {
      b1aRef.current.position.x = -halfDist;
      b1aRef.current.scale.y = distance.current;
    }
    if (b1bRef.current) {
      b1bRef.current.position.x = -halfDist;
      b1bRef.current.scale.y = distance.current;
    }

    // Right double bonds
    if (b2aRef.current) {
      b2aRef.current.position.x = halfDist;
      b2aRef.current.scale.y = distance.current;
    }
    if (b2bRef.current) {
      b2bRef.current.position.x = halfDist;
      b2bRef.current.scale.y = distance.current;
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Ambient and directional lights local to molecule view */}
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#F8F9FF" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#FF5252" />

      {/* Central Carbon Atom (Gray, larger) */}
      <mesh>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial
          color="#374151" // Gray
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Oxygen Atom 1 (Red, left) */}
      <mesh ref={o1Ref} position={[-1, 0, 0]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial
          color="#EF4444" // Red
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Oxygen Atom 2 (Red, right) */}
      <mesh ref={o2Ref} position={[1, 0, 0]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial
          color="#EF4444" // Red
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* BOND CYLINDERS (Rotated 90deg on Z to lay horizontally) */}
      {/* Left Double Bond A */}
      <mesh ref={b1aRef} position={[-0.5, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, 1, 12]} />
        <meshStandardMaterial
          color="#6B7280"
          transparent
          opacity={hovered ? 0.3 : 0.8}
          roughness={0.4}
        />
      </mesh>

      {/* Left Double Bond B */}
      <mesh ref={b1bRef} position={[-0.5, -0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, 1, 12]} />
        <meshStandardMaterial
          color="#6B7280"
          transparent
          opacity={hovered ? 0.3 : 0.8}
          roughness={0.4}
        />
      </mesh>

      {/* Right Double Bond A */}
      <mesh ref={b2aRef} position={[0.5, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, 1, 12]} />
        <meshStandardMaterial
          color="#6B7280"
          transparent
          opacity={hovered ? 0.3 : 0.8}
          roughness={0.4}
        />
      </mesh>

      {/* Right Double Bond B */}
      <mesh ref={b2bRef} position={[0.5, -0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, 1, 12]} />
        <meshStandardMaterial
          color="#6B7280"
          transparent
          opacity={hovered ? 0.3 : 0.8}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}
