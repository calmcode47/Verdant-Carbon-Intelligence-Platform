/**
 * @file LeafParticles.tsx
 * @description Three.js particle system showing floating green leaves/fireflies
 * drifting upward slowly — used as the background for the Challenges (Eco Warrior Arena) page.
 * Performance: capped at 60fps, pauses on visibility change.
 */

'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { safePixelRatio, getPerformanceTier, particleCount as getParticleCount } from '@/lib/performance';

export default function LeafParticles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
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

    // Create a glowing dot texture for firefly/leaf particles
    const makeLeafTexture = (color: string) => {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, color);
        grad.addColorStop(0.4, color.replace('1)', '0.5)'));
        grad.addColorStop(1, 'rgba(0,200,83,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
      }
      return new THREE.CanvasTexture(c);
    };

    const greenTex = makeLeafTexture('rgba(0, 200, 83, 1)');
    const goldTex = makeLeafTexture('rgba(255, 214, 0, 1)');

    // Particle system
    const particleCount = getParticleCount(350);
    const positions = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; sway: number; swayOffset: number; speed: number }[] = [];
    const types = new Uint8Array(particleCount); // 0 = green leaf, 1 = gold firefly

    const boxW = 400;
    const boxH = 350;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * boxW;
      positions[i * 3 + 1] = (Math.random() - 0.5) * boxH;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      const speed = 0.05 + Math.random() * 0.12;
      velocities.push({
        x: (Math.random() - 0.5) * 0.03,
        y: speed,
        sway: 0.3 + Math.random() * 0.5,
        swayOffset: Math.random() * Math.PI * 2,
        speed,
      });

      types[i] = Math.random() < 0.85 ? 0 : 1; // 85% green, 15% gold
    }

    // Create two separate point systems for green and gold
    const greenPositions: number[] = [];
    const goldPositions: number[] = [];
    const greenIndices: number[] = [];
    const goldIndices: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      if (types[i] === 0) {
        greenIndices.push(i);
        greenPositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      } else {
        goldIndices.push(i);
        goldPositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      }
    }

    const makePoints = (posArr: number[], tex: THREE.CanvasTexture, size: number) => {
      const geo = new THREE.BufferGeometry();
      const buf = new Float32Array(posArr);
      geo.setAttribute('position', new THREE.BufferAttribute(buf, 3));
      const mat = new THREE.PointsMaterial({
        size,
        map: tex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.9,
      });
      return new THREE.Points(geo, mat);
    };

    const greenPoints = makePoints(greenPositions, greenTex, 3.5);
    const goldPoints = makePoints(goldPositions, goldTex, 2.5);
    scene.add(greenPoints);
    scene.add(goldPoints);

    // FPS control
    let lastFrameTime = performance.now();
    const fpsInterval = 1000 / 60;
    let animId: number;
    let isVisible = true;
    let elapsed2 = 0;

    const animate = (time: number) => {
      if (!isVisible) return;
      animId = requestAnimationFrame(animate);

      const delta = time - lastFrameTime;
      if (delta < fpsInterval) return;
      lastFrameTime = time - (delta % fpsInterval);
      elapsed2 += delta * 0.001;

      // Update all particle positions
      for (let i = 0; i < particleCount; i++) {
        const vel = velocities[i];
        const sway = Math.sin(elapsed2 * vel.sway + vel.swayOffset) * 0.04;

        positions[i * 3] += vel.x + sway;
        positions[i * 3 + 1] += vel.y;
        positions[i * 3 + 2] += 0;

        // Wrap Y: when particle floats past the top, respawn at bottom
        if (positions[i * 3 + 1] > boxH / 2) {
          positions[i * 3 + 1] = -boxH / 2;
          positions[i * 3] = (Math.random() - 0.5) * boxW;
        }
        // Wrap X
        if (Math.abs(positions[i * 3]) > boxW / 2) {
          positions[i * 3] = -Math.sign(positions[i * 3]) * (boxW / 2 - 5);
        }
      }

      // Push updated positions back to each geometry
      let gIdx = 0;
      let goIdx = 0;
      const gPosAttr = greenPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      const goPosAttr = goldPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      const gArr = gPosAttr.array as Float32Array;
      const goArr = goPosAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        if (types[i] === 0) {
          gArr[gIdx * 3] = positions[i * 3];
          gArr[gIdx * 3 + 1] = positions[i * 3 + 1];
          gArr[gIdx * 3 + 2] = positions[i * 3 + 2];
          gIdx++;
        } else {
          goArr[goIdx * 3] = positions[i * 3];
          goArr[goIdx * 3 + 1] = positions[i * 3 + 1];
          goArr[goIdx * 3 + 2] = positions[i * 3 + 2];
          goIdx++;
        }
      }

      gPosAttr.needsUpdate = true;
      goPosAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    const onVisibility = () => {
      if (document.hidden) {
        isVisible = false;
        cancelAnimationFrame(animId);
      } else {
        isVisible = true;
        lastFrameTime = performance.now();
        animId = requestAnimationFrame(animate);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    animId = requestAnimationFrame(animate);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      greenPoints.geometry.dispose();
      goldPoints.geometry.dispose();
      (greenPoints.material as THREE.PointsMaterial).dispose();
      (goldPoints.material as THREE.PointsMaterial).dispose();
      greenTex.dispose();
      goldTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </div>
  );
}
