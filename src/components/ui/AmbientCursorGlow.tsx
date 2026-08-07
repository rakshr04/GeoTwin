import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AmbientCursorGlowProps {
  color?: string; // e.g. '#387A4E' or '#76B78C'
  className?: string;
}

/**
 * AmbientCursorGlow
 * Soft environmental cursor glow for enterprise GIS interfaces.
 * 
 * Specs:
 * - 300px radial radius (600px diameter)
 * - 100px blur (blur-[100px])
 * - 4-8% opacity (opacity-[0.06])
 * - Smooth lerp interpolation with slight lag via requestAnimationFrame
 * - Behind cards & modals (z-0 pointer-events-none)
 * - Disabled on mobile & touch devices
 * - Respects prefers-reduced-motion
 */
export const AmbientCursorGlow: React.FC<AmbientCursorGlowProps> = ({
  color = 'rgba(56, 122, 78, 0.35)',
  className = '',
}) => {
  const glowRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    // Check touch devices
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const animate = () => {
      if (document.visibilityState === 'hidden') {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      // Smooth lerp (0.08 factor for slight natural lag)
      currentX += (mouseX - currentX) * 0.08;
      currentY += (mouseY - currentY) * 0.08;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${currentX - 250}px, ${currentY - 250}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden hidden md:block ${className}`}
      aria-hidden="true"
    >
      <div
        ref={glowRef}
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[80px] opacity-[0.08] transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color} 0%, rgba(118, 183, 140, 0.2) 50%, transparent 75%)`,
          willChange: 'transform',
        }}
      />
    </div>
  );
};

export default AmbientCursorGlow;
