/**
 * @file ConstellationBackground.tsx
 * @description Self-contained, optimized Three.js component that renders a background
 * of 1000 drifting star particles connected by thin proximity lines.
 * Capped at 60fps and pauses rendering when the document is hidden.
 */

'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { safePixelRatio, getPerformanceTier, particleCount as getParticleCount } from '@/lib/performance';

interface ConstellationProps {
  color?: string;
  lineColor?: number;
  backgroundColor?: string;
  particleCount?: number;
}

export default function ConstellationBackground({
  color = 'rgba(124, 58, 237, 0.4)',
  lineColor = 0x7c3aed,
  backgroundColor = '#06041A',
  particleCount: customParticleCount
}: ConstellationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Setup Scene, Camera, and Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 200;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: getPerformanceTier() === 'HIGH',
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(safePixelRatio());

    // 2. Create Particles (1000 Stars)
    const particleCount = getParticleCount(customParticleCount ?? 1000);
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // Spread particles in a 3D box
    const boxWidth = 350;
    const boxHeight = 250;
    const boxDepth = 150;

    for (let i = 0; i < particleCount; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * boxWidth;
      positions[i * 3 + 1] = (Math.random() - 0.5) * boxHeight;
      positions[i * 3 + 2] = (Math.random() - 0.5) * boxDepth;

      // Velocity (slow drift)
      velocities[i * 3] = (Math.random() - 0.5) * 0.08;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Simple round dot particle texture/material
    const canvasDot = document.createElement('canvas');
    canvasDot.width = 16;
    canvasDot.height = 16;
    const ctx = canvasDot.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(240, 244, 255, 1)');
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, 'rgba(6, 4, 26, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
    }
    const dotTexture = new THREE.CanvasTexture(canvasDot);

    const particleMaterial = new THREE.PointsMaterial({
      size: 2.2,
      map: dotTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starField = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(starField);

    // 3. Create Line Segments for Proximity Connections
    // To keep it performant, we cap the maximum lines drawn.
    const maxLines = 450;
    const linePositions = new Float32Array(maxLines * 2 * 3); // 2 vertices per line, 3 coordinates per vertex
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    // Custom gradient line color: violet/teal
    const lineMaterial = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const connectionLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(connectionLines);

    // 4. Animation Frame Rate Control (60 FPS Cap)
    let lastFrameTime = performance.now();
    const fpsInterval = 1000 / 60; // 16.67 ms
    let animationFrameId: number;
    let isPageVisible = true;

    // Proximity threshold (in Three.js units, about 35 units corresponds to 100px)
    const proximityThreshold = 35;

    const animate = (time: number) => {
      if (!isPageVisible) return;

      animationFrameId = requestAnimationFrame(animate);

      const elapsed = time - lastFrameTime;
      if (elapsed < fpsInterval) return;

      // Adjust lastFrameTime, accounting for system lag
      lastFrameTime = time - (elapsed % fpsInterval);

      // Get the positions attribute from the points
      const posAttr = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;

      // Update particle positions
      for (let i = 0; i < particleCount; i++) {
        // Apply velocity
        posArr[i * 3] += velocities[i * 3];
        posArr[i * 3 + 1] += velocities[i * 3 + 1];
        posArr[i * 3 + 2] += velocities[i * 3 + 2];

        // Wrap around boundaries
        if (Math.abs(posArr[i * 3]) > boxWidth / 2) {
          posArr[i * 3] = -Math.sign(posArr[i * 3]) * (boxWidth / 2);
        }
        if (Math.abs(posArr[i * 3 + 1]) > boxHeight / 2) {
          posArr[i * 3 + 1] = -Math.sign(posArr[i * 3 + 1]) * (boxHeight / 2);
        }
        if (Math.abs(posArr[i * 3 + 2]) > boxDepth / 2) {
          posArr[i * 3 + 2] = -Math.sign(posArr[i * 3 + 2]) * (boxDepth / 2);
        }
      }
      posAttr.needsUpdate = true;

      // Update lines based on proximity (run only on a subset of particles for high performance)
      const linePosAttr = lineGeometry.getAttribute('position') as THREE.BufferAttribute;
      const linePosArr = linePosAttr.array as Float32Array;
      let lineIndex = 0;

      // We only check the first 250 particles to avoid O(N^2) bottlenecks
      const checkCount = Math.min(250, particleCount);
      for (let i = 0; i < checkCount; i++) {
        const x1 = posArr[i * 3];
        const y1 = posArr[i * 3 + 1];
        const z1 = posArr[i * 3 + 2];

        for (let j = i + 1; j < checkCount; j++) {
          if (lineIndex >= maxLines) break;

          const x2 = posArr[j * 3];
          const y2 = posArr[j * 3 + 1];
          const z2 = posArr[j * 3 + 2];

          const dx = x1 - x2;
          const dy = y1 - y2;
          const dz = z1 - z2;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < proximityThreshold * proximityThreshold) {
            // First point of line
            linePosArr[lineIndex * 6] = x1;
            linePosArr[lineIndex * 6 + 1] = y1;
            linePosArr[lineIndex * 6 + 2] = z1;

            // Second point of line
            linePosArr[lineIndex * 6 + 3] = x2;
            linePosArr[lineIndex * 6 + 4] = y2;
            linePosArr[lineIndex * 6 + 5] = z2;

            lineIndex++;
          }
        }
      }

      // Zero out remaining line coordinates in the buffer
      for (let i = lineIndex; i < maxLines; i++) {
        linePosArr[i * 6] = 0;
        linePosArr[i * 6 + 1] = 0;
        linePosArr[i * 6 + 2] = 0;
        linePosArr[i * 6 + 3] = 0;
        linePosArr[i * 6 + 4] = 0;
        linePosArr[i * 6 + 5] = 0;
      }
      linePosAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    // 5. Visibility API Listeners
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPageVisible = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        isPageVisible = true;
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animationFrameId = requestAnimationFrame(animate);

    // 6. Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      dotTexture.dispose();
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none overflow-hidden"
      style={{ mixBlendMode: 'screen', backgroundColor }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </div>
  );
}
