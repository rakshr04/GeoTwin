import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SpotlightHeroProps {
  scrollProgress: number; // 0.0 to 1.0
  isMobile: boolean;
}

export const SpotlightHero: React.FC<SpotlightHeroProps> = ({
  scrollProgress,
  isMobile,
}) => {
  const reducedMotion = useReducedMotion();
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState<boolean>(false);

  // Fade out copy as the user scrolls
  const contentOpacity = Math.max(0, 1 - scrollProgress * 3.5);
  
  // Subtle scale-down effect as they scroll
  const scale = reducedMotion ? 1 : Math.max(0.95, 1 - scrollProgress * 0.05);

  useEffect(() => {
    if (reducedMotion || scrollProgress >= 0.2) return;

    const handleMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setIsHovering(true);
      if (!hasInteracted) {
        setHasInteracted(true);
      }
    };

    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        setIsHovering(true);
        if (!hasInteracted) {
          setHasInteracted(true);
        }
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchstart', handleTouch, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasInteracted, reducedMotion, scrollProgress]);

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col justify-between select-none z-20">
      {/* Very subtle dark full-screen overlay for readability */}
      <div className="absolute inset-0 bg-[#0A0F14]/25 pointer-events-none z-0" />

      {/* Spacer to align items correctly without header */}
      <div className="h-20 w-full z-10 pointer-events-none" />

      {/* Hero Typography: True visual center */}
      <main 
        className="w-full flex-1 flex flex-col justify-center items-center px-6 md:px-12 text-center z-10 transition-all duration-75 pointer-events-none"
        style={{ 
          opacity: contentOpacity,
          transform: `scale(${scale})`
        }}
      >
        <div className="max-w-4xl flex flex-col items-center select-text">
          {/* Main Title: GEOTWIN */}
          <h1 className="font-orbitron font-semibold text-text-primary text-6xl sm:text-7xl lg:text-[104px] tracking-[0.04em] leading-none uppercase filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] animate-[fadeInTitle_1.2s_ease-out_forwards]">
            GEOTWIN
          </h1>

          {/* Dialogue Line */}
          <h2 className="font-iceberg font-normal text-white/85 text-2xl sm:text-3xl lg:text-[40px] tracking-[0.035em] leading-tight mt-6 opacity-0 animate-[fadeInTagline_1.2s_ease-out_0.5s_forwards]">
            See beyond the surface.
          </h2>

          {/* Exploration Hint */}
          <div 
            className={`mt-10 font-mono text-[10px] sm:text-xs tracking-[0.2em] text-olive-bright/80 uppercase transition-opacity duration-700 ${
              hasInteracted ? 'opacity-0' : 'opacity-100 animate-pulse'
            }`}
          >
            {isMobile ? "Drag to reveal the restored landscape" : "Move to reveal what lies beneath"}
          </div>
        </div>
      </main>

      {/* Subtle Scroll Cue at the bottom center */}
      <footer 
        className="w-full pb-8 flex flex-col items-center justify-center gap-1 z-10 transition-opacity duration-300 pointer-events-none"
        style={{ opacity: contentOpacity }}
      >
        <span className="text-[11px] md:text-xs tracking-[0.25em] uppercase text-[#EEE9DC]/50 font-medium">
          Scroll to enter
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-[#EEE9DC]/55 ${
            reducedMotion ? '' : 'animate-bounce [animation-duration:2.5s]'
          }`} 
        />
      </footer>

      {/* Custom Trailing Cursor Indicator inside Reveal Area */}
      {isHovering && !reducedMotion && !isMobile && scrollProgress === 0 && (
        <div 
          className="pointer-events-none fixed z-50 mix-blend-screen"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            transform: 'translate(-50%, -50%)',
            transition: 'transform 0.08s ease-out'
          }}
        >
          {/* Inner Dot with neon green glow */}
          <div className="w-3.5 h-3.5 bg-olive-bright rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_#489F32,0_0_5px_#D0EEC9]" />
          
          {/* Subtle Label */}
          {!hasInteracted && (
            <span className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-[8px] tracking-widest uppercase text-olive-bright/70 whitespace-nowrap">
              Reveal
            </span>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeInTitle {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInTagline {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 0.85; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SpotlightHero;
