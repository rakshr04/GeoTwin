import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
const BG_IMAGE_1 = "/images/geotwin-base.png";
const BG_IMAGE_2 = "/images/geotwin-reveal.png";

export const GEOTWIN_BASE_IMAGE = BG_IMAGE_1;
export const GEOTWIN_REVEAL_IMAGE = BG_IMAGE_2;

interface SpotlightRevealLayerProps {
  scrollProgress: number; // 0.0 to 1.0 within the Hero section
  isMobile: boolean;
}

export const SpotlightRevealLayer: React.FC<SpotlightRevealLayerProps> = ({
  scrollProgress,
  isMobile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const revealImgRef = useRef<HTMLImageElement>(null);
  const baseImgRef = useRef<HTMLImageElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Pointer position tracking refs
  const rawX = useRef<number>(0);
  const rawY = useRef<number>(0);
  const smoothX = useRef<number>(0);
  const smoothY = useRef<number>(0);
  const isInitialized = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  // Check if it's a touch device
  const [isTouch, setIsTouch] = useState<boolean>(false);

  useEffect(() => {
    // Detect touch capability
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    
    // Set initial pointer to center of viewport
    rawX.current = window.innerWidth / 2;
    rawY.current = window.innerHeight / 2;
    smoothX.current = window.innerWidth / 2;
    smoothY.current = window.innerHeight / 2;
  }, []);

  // Update pointer coordinates on mouse/pointer move
  useEffect(() => {
    if (reducedMotion || scrollProgress >= 0.2) return;

    const handlePointerMove = (e: PointerEvent) => {
      rawX.current = e.clientX;
      rawY.current = e.clientY;
      if (!isInitialized.current) {
        smoothX.current = e.clientX;
        smoothY.current = e.clientY;
        isInitialized.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        rawX.current = e.touches[0].clientX;
        rawY.current = e.touches[0].clientY;
        if (!isInitialized.current) {
          smoothX.current = e.touches[0].clientX;
          smoothY.current = e.touches[0].clientY;
          isInitialized.current = true;
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
    };
  }, [reducedMotion, scrollProgress]);

  // RequestAnimationFrame loop for interpolation
  useEffect(() => {
    let active = true;

    const updateSpotlight = () => {
      if (!active) return;

      const revealEl = revealImgRef.current;
      const baseEl = baseImgRef.current;
      const glowEl = glowRef.current;
      if (!revealEl) {
        rafIdRef.current = requestAnimationFrame(updateSpotlight);
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      const centerX = width / 2;
      const centerY = height / 2;

      // Base Spotlight Radius (reduced by 50%)
      const baseRadius = isMobile ? 130 : 240;
      
      // Determine targeted coordinates and radius based on scroll progress
      let targetX = rawX.current;
      let targetY = rawY.current;
      let currentRadius = baseRadius;

      let maskString = '';

      if (reducedMotion) {
        // If reduced motion is preferred, reveal everything instantly
        currentRadius = Math.max(width, height) * 1.5;
        smoothX.current = centerX;
        smoothY.current = centerY;
        if (glowEl) glowEl.style.display = 'none';
        maskString = 'radial-gradient(circle at center, black 0%, black 100%)';
      } else if (scrollProgress > 0) {
        if (scrollProgress < 0.2) {
          // Under 20% scroll, hero is active and interactive cursor reveal is functional
          const easeFactor = isTouch || isMobile ? 0.06 : 0.09;
          smoothX.current += (targetX - smoothX.current) * easeFactor;
          smoothY.current += (targetY - smoothY.current) * easeFactor;
          
          maskString = `radial-gradient(
            circle ${currentRadius}px at ${smoothX.current}px ${smoothY.current}px,
            black 0%,
            black 45%,
            rgba(0,0,0,0.7) 65%,
            rgba(0,0,0,0.2) 85%,
            transparent 100%
          )`;

          if (baseEl) baseEl.style.opacity = '1';
          if (glowEl) {
            glowEl.style.opacity = '0.85';
            glowEl.style.display = 'block';
          }
        } else if (scrollProgress <= 0.75) {
          // 20% - 75%: Restoration gradually spreads bottom-to-top / diagonally
          const p = (scrollProgress - 0.2) / (0.75 - 0.2);
          const percent = p * 150 - 20; // -20% to 130%
          
          // Organic soft mask with a wide feathered boundary (40% width)
          maskString = `linear-gradient(135deg, black 0%, black ${percent}% , rgba(0,0,0,0.6) ${percent + 15}%, rgba(0,0,0,0.15) ${percent + 30}%, transparent ${percent + 40}%)`;

          if (baseEl) {
            baseEl.style.opacity = `${Math.max(0, 1 - p * 1.4)}`;
          }
          if (glowEl) {
            glowEl.style.opacity = '0';
          }
        } else {
          // 75% - 100%: Fully restored landscape settles
          maskString = 'linear-gradient(135deg, black 0%, black 100%)';
          if (baseEl) baseEl.style.opacity = '0';
          if (glowEl) glowEl.style.opacity = '0';
        }
      } else {
        // Desktop/Mobile normal interactive smoothing (scrollProgress === 0)
        const easeFactor = isTouch || isMobile ? 0.06 : 0.09;
        smoothX.current += (targetX - smoothX.current) * easeFactor;
        smoothY.current += (targetY - smoothY.current) * easeFactor;
        
        maskString = `radial-gradient(
          circle ${currentRadius}px at ${smoothX.current}px ${smoothY.current}px,
          black 0%,
          black 45%,
          rgba(0,0,0,0.7) 65%,
          rgba(0,0,0,0.2) 85%,
          transparent 100%
        )`;

        if (baseEl) baseEl.style.opacity = '1';
        if (glowEl) {
          glowEl.style.opacity = '0.85';
          glowEl.style.display = 'block';
        }
      }

      // Apply camera push-in zoom parallax directly
      const scale = reducedMotion ? 1.0 : 1.0 + Math.min(scrollProgress, 0.75) * 0.06;

      revealEl.style.webkitMaskImage = maskString;
      revealEl.style.maskImage = maskString;
      revealEl.style.transform = `scale(${scale})`;

      if (baseEl) {
        baseEl.style.transform = `scale(${scale})`;
      }

      // Update glow element position & transform (low-cost DOM update)
      if (glowEl && !reducedMotion) {
        glowEl.style.transform = `translate3d(${smoothX.current}px, ${smoothY.current}px, 0) translate(-50%, -50%) scale(${scale})`;
      }

      rafIdRef.current = requestAnimationFrame(updateSpotlight);
    };

    rafIdRef.current = requestAnimationFrame(updateSpotlight);

    return () => {
      active = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [scrollProgress, isTouch, isMobile, reducedMotion]);

  // Image preloading to prevent flickering
  useEffect(() => {
    const baseImg = new Image();
    const revealImg = new Image();
    baseImg.src = GEOTWIN_BASE_IMAGE;
    revealImg.src = GEOTWIN_REVEAL_IMAGE;
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full overflow-hidden bg-[#0A0F14]"
    >
      {/* Degraded Base Image Layer */}
      <img
        ref={baseImgRef}
        src={GEOTWIN_BASE_IMAGE}
        alt="Degraded landscape viewport"
        className="absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-300 pointer-events-none"
        style={{ zIndex: 1, filter: 'saturate(1.2)' }}
      />

      {/* Restored/Analyzed Reveal Image Layer */}
      <img
        ref={revealImgRef}
        src={GEOTWIN_REVEAL_IMAGE}
        alt="Restored landscape analysis"
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        style={{ 
          zIndex: 2,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          filter: 'saturate(1.2)',
        }}
      />

      {/* High-performance cursor light glow */}
      <div 
        ref={glowRef}
        className="absolute pointer-events-none mix-blend-screen opacity-85 filter blur-md"
        style={{
          width: isMobile ? '260px' : '480px',
          height: isMobile ? '260px' : '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(180,130,70,0.3) 0%, rgba(130,90,50,0.55) 45%, rgba(210,170,110,0.7) 65%, transparent 80%)',
          zIndex: 3,
          transform: 'translate(-50%, -50%)',
          display: reducedMotion ? 'none' : 'block'
        }}
      />
    </div>
  );
};

export default SpotlightRevealLayer;

