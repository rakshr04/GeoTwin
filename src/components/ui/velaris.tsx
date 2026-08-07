import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export interface VelarisProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  grain?: number;
  height?: string;
  className?: string;
}

/**
 * Velaris WebGL Ambient Terrain Component
 * 
 * Provides a subtle environmental lighting layer resembling gentle terrain elevation
 * and topographic contours.
 * 
 * Rules:
 * - Speed = 0.18
 * - Grain = 0.02
 * - Opacity ~ 5%
 * - Pauses when tab is hidden (document.visibilityState === 'hidden')
 * - Respects prefers-reduced-motion
 * - Disabled on mobile devices (replaced with static gradient)
 * - Exists ONLY behind the dashboard background
 */
export const Velaris: React.FC<VelarisProps> = ({
  speed = 0.1,
  grain = 0.02,
  height = '100%',
  className,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let canvasHeight = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      canvasHeight = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    let time = 0;
    let lastTime = performance.now();
    const targetFps = 30;
    const interval = 1000 / targetFps;

    // Soft topographic terrain contour function
    const terrainHeight = (x: number, y: number, t: number) => {
      const nx = x * 0.0015;
      const ny = y * 0.0015;
      return (
        Math.sin(nx * 2.0 + t * speed) * Math.cos(ny * 2.0 + t * speed * 0.7) * 45 +
        Math.sin(nx * 4.5 - t * speed * 0.5) * Math.sin(ny * 3.5 + t * speed * 0.8) * 20 +
        Math.cos(nx * 1.0 + ny * 1.0 + t * speed * 0.3) * 30
      );
    };

    const draw = (now: number) => {
      if (document.visibilityState === 'hidden') {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      const elapsed = now - lastTime;
      if (elapsed < interval) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      lastTime = now - (elapsed % interval);
      time += 0.015;

      ctx.clearRect(0, 0, width, canvasHeight);

      // Topographic contour color bands (Dark Forest Theme Transparent)
      const colors = [
        'rgba(56, 122, 78, 0.12)',   // #387A4E (Primary Dark Green)
        'rgba(118, 183, 140, 0.08)', // #76B78C (Medium Green)
        'rgba(148, 199, 165, 0.05)', // #94C7A5 (Light Green Accent)
      ];

      const contourStep = 36;
      const numLines = Math.ceil(canvasHeight / contourStep) + 8;

      ctx.lineWidth = 1.1;

      for (let i = -4; i < numLines; i++) {
        const baseY = i * contourStep;
        ctx.beginPath();

        const colorIndex = Math.abs(i) % colors.length;
        ctx.strokeStyle = colors[colorIndex];

        let isFirst = true;
        const stepX = 20;

        for (let x = 0; x <= width + stepX; x += stepX) {
          const elev = terrainHeight(x, baseY, time);
          const y = baseY + elev;

          if (isFirst) {
            ctx.moveTo(x, y);
            isFirst = false;
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      // Add micro film grain texture if grain > 0
      if (grain > 0) {
        ctx.fillStyle = 'rgba(31, 41, 55, 0.015)';
        for (let g = 0; g < 150; g++) {
          const gx = Math.random() * width;
          const gy = Math.random() * canvasHeight;
          ctx.fillRect(gx, gy, 1, 1);
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [speed, grain, reducedMotion]);

  if (reducedMotion) {
    return (
      <div
        className={cn(
          'fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#FBFCFB] via-[#F8FBF8] to-[#EEF6F1] hidden md:block opacity-[0.05]',
          className
        )}
        style={{ height }}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        'fixed inset-0 pointer-events-none z-0 overflow-hidden',
        className
      )}
      style={{ height }}
      {...props}
    >
      {/* WebGL/Canvas Animation (Desktop & Tablet) */}
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-[0.025] hidden md:block transition-opacity duration-1000"
        aria-hidden="true"
      />

      {/* Static Ambient Gradient Replacement for Mobile Devices */}
      <div className="md:hidden absolute inset-0 bg-gradient-to-b from-[#0E1411] via-[#121A16] to-[#0D2A26] opacity-40 pointer-events-none" />
    </div>
  );
};

export default Velaris;
