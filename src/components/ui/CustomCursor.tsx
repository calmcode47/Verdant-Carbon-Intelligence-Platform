/**
 * @file CustomCursor.tsx
 * @description Advanced custom pointer system for desktop interfaces.
 * Uses requestAnimationFrame to implement a physics-based linear interpolation (lerp)
 * lag effect for the outer ring, checks element tags under the cursor to scale on hover,
 * and converts the inner dot into a crosshair when moving over 3D WebGL canvases.
 */

'use client';

import { useEffect, useState, useRef } from 'react';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isCanvasHovered, setIsCanvasHovered] = useState(false);

  // Position references to maintain physics updates outside React render cycle
  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Check if device supports touch input
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      return;
    }

    setIsVisible(true);

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Check for buttons, links, selects, inputs, or pointers
      const isInteractive =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'INPUT' ||
        target.closest('button') !== null ||
        target.closest('a') !== null ||
        target.style.cursor === 'pointer';

      // Check if hovering a Three.js canvas area
      const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') !== null;

      setIsHovered(isInteractive);
      setIsCanvasHovered(isCanvas);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', onMouseOver);

    let animationFrameId: number;

    const renderLoop = () => {
      // Ring lerp interpolation (0.15 speed factor)
      ring.current.x += (mouse.current.x - ring.current.x) * 0.15;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.15;

      // Update positions directly via ref styles to avoid react rendering bottlenecks
      if (dotRef.current) {
        // Offset by half of dot dimension (4px for dot, 8px for crosshair)
        const isCanvas = dotRef.current.getAttribute('data-canvas') === 'true';
        const offset = isCanvas ? 8 : 4;
        dotRef.current.style.transform = `translate3d(${mouse.current.x - offset}px, ${mouse.current.y - offset}px, 0)`;
      }

      if (ringRef.current) {
        // Offset by half of ring dimension (16px for regular, 24px for hover)
        const isHover = ringRef.current.getAttribute('data-hover') === 'true';
        const offset = isHover ? 24 : 16;
        ringRef.current.style.transform = `translate3d(${ring.current.x - offset}px, ${ring.current.y - offset}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* 1. Inner Dot / Crosshair */}
      <div
        ref={dotRef}
        data-canvas={isCanvasHovered}
        className="fixed top-0 left-0 pointer-events-none z-[9999] transition-opacity duration-300 hidden md:block"
      >
        {isCanvasHovered ? (
          // Crosshair graphic for 3D navigation
          <svg width="16" height="16" viewBox="0 0 16 16" className="text-[#00E676] drop-shadow-[0_0_4px_rgba(0,230,118,0.5)]">
            <line x1="8" y1="0" x2="8" y2="16" stroke="currentColor" strokeWidth="1.5" />
            <line x1="0" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ) : (
          // Regular dot
          <div
            className="w-2 h-2 rounded-full transition-all duration-200"
            style={{
              backgroundColor: isHovered ? '#1DE9B6' : '#00E676',
              boxShadow: '0 0 8px rgba(0, 230, 118, 0.8)',
            }}
          />
        )}
      </div>

      {/* 2. Outer Lerped Ring */}
      <div
        ref={ringRef}
        data-hover={isHovered}
        className="fixed top-0 left-0 pointer-events-none z-[9999] border rounded-full transition-all duration-300 ease-out hidden md:block"
        style={{
          width: isHovered ? '48px' : '32px',
          height: isHovered ? '48px' : '32px',
          backgroundColor: isHovered ? 'rgba(0, 230, 118, 0.15)' : 'rgba(0, 0, 0, 0)',
          borderColor: isHovered ? '#00E676' : 'rgba(0, 230, 118, 0.4)',
          boxShadow: isHovered ? '0 0 15px rgba(0, 230, 118, 0.2)' : 'none',
        }}
      />
    </>
  );
}
