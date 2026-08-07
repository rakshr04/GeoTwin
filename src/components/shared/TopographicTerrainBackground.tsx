import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * TopographicTerrainBackground
 * Soft WebGL/Canvas ambient topographic terrain layer.
 * 
 * Rules:
 * - 55% white (#F8FBF8), 20% off white (#EEF6F1), 15% light green (#DCEFE2), 8% medium green (#76B78C), 2% dark green (#387A4E)
 * - Opacity 5-8%
 * - Slow 30 FPS frame rate limit
 * - Pauses when tab is hidden (document.visibilityState === 'hidden')
 * - Respects prefers-reduced-motion
 * - Sits behind dashboard elements (pointer-events-none, z-0)
 * - Hidden on mobile screens (hidden md:block)
 */
export const TopographicTerrainBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    let time = 0;
    let lastFrameTime = performance.now();
    const targetFps = 30;
    const frameInterval = 1000 / targetFps;

    // Perlin-like 2D noise approximation for contour heightmaps
    const noise2D = (x: number, y: number, t: number) => {
      return (
        Math.sin(x * 0.002 + t * 0.08) * Math.cos(y * 0.002 + t * 0.06) * 1.2 +
        Math.sin(x * 0.005 - t * 0.04) * Math.sin(y * 0.004 + t * 0.05) * 0.8 +
        Math.cos(x * 0.001 + y * 0.001 + t * 0.02) * 2.0
      );
    };

    const draw = (now: number) => {
      if (document.visibilityState === 'hidden') {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      const elapsed = now - lastFrameTime;
      if (elapsed < frameInterval) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      lastFrameTime = now - (elapsed % frameInterval);
      time += 0.008;

      ctx.clearRect(0, 0, width, height);

      // Base background color #F8FBF8 (55% distribution)
      ctx.fillStyle = '#F8FBF8';
      ctx.fillRect(0, 0, width, height);

      // Soft topographic contour lines
      ctx.lineWidth = 1.2;

      // Color distribution layers
      const colors = [
        'rgba(238, 246, 241, 0.45)', // #EEF6F1 (20%)
        'rgba(220, 239, 226, 0.35)', // #DCEFE2 (15%)
        'rgba(118, 183, 140, 0.22)', // #76B78C (8%)
        'rgba(56, 122, 78, 0.12)',   // #387A4E (2%)
      ];

      const contourStep = 45;
      const numLines = Math.ceil(height / contourStep) + 6;

      for (let i = -3; i < numLines; i++) {
        const baseY = i * contourStep;
        ctx.beginPath();

        const colorIndex = Math.abs(i) % colors.length;
        ctx.strokeStyle = colors[colorIndex];

        let firstPoint = true;
        const stepX = 24;

        for (let x = 0; x <= width + stepX; x += stepX) {
          const elevation = noise2D(x, baseY, time) * 38;
          const y = baseY + elevation;

          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-[#F8FBF8] opacity-50 hidden md:block" 
        aria-hidden="true" 
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-[0.07] hidden md:block transition-opacity duration-1000"
      aria-hidden="true"
    />
  );
};
