import React, { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { SpotlightHero } from './SpotlightHero';
import { SpotlightRevealLayer } from './SpotlightRevealLayer';
import { HowItWorks } from './HowItWorks';
import { GeotwinLogo } from '../shared/GeotwinLogo';
import Wave from '../ui/wave';

export const CinematicExperience: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const isMobile = useRef<boolean>(false);
  const lenisRef = useRef<Lenis | null>(null);
  
  const [progress, setProgress] = useState<number>(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Detect mobile viewport
    isMobile.current = window.innerWidth < 768;

    if (reducedMotion) {
      setProgress(1.0);
      return;
    }

    // Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: isMobile.current ? 0.8 : 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Setup GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
          pin: pinRef.current,
          anticipatePin: 1,
          onUpdate: (self) => {
            setProgress(self.progress);
          },
        }
      });

      // --- Timeline Label Keys ---
      tl.addLabel('hero', 0);
      tl.addLabel('speaking', 0.20);
      tl.addLabel('terrain', 0.28);
      tl.addLabel('water', 0.36);
      tl.addLabel('veg', 0.44);
      tl.addLabel('time', 0.52);
      tl.addLabel('signals', 0.60);
      tl.addLabel('final', 0.75);

      // --- Atmospheric Scroll Adjustments ---
      tl.fromTo('.atmosphere-overlay',
        { backgroundColor: 'rgba(10, 15, 20, 0.4)', backdropFilter: 'grayscale(0%) saturate(120%) brightness(0.95)' },
        { backgroundColor: 'rgba(208, 238, 201, 0.02)', backdropFilter: 'grayscale(0%) saturate(120%) brightness(1.02)', duration: 0.55 },
        'speaking'
      );

      // --- 1. THE LAND IS ALWAYS SPEAKING. (0.20 - 0.28) ---
      tl.fromTo('.narrative-1', 
        { opacity: 0, y: 35, filter: 'blur(8px)' }, 
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.04, ease: 'power2.out' }, 
        'speaking'
      )
      .to('.narrative-1', { opacity: 0, y: -35, filter: 'blur(8px)', duration: 0.04, ease: 'power2.in' }, 'speaking+=0.04');

      // --- 2. Through terrain. (0.28 - 0.36) ---
      tl.fromTo('.narrative-2', 
        { opacity: 0, y: 35, filter: 'blur(8px)' }, 
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.04, ease: 'power2.out' }, 
        'terrain'
      )
      .to('.narrative-2', { opacity: 0, y: -35, filter: 'blur(8px)', duration: 0.04, ease: 'power2.in' }, 'terrain+=0.04');

      // --- 3. Through water. (0.36 - 0.44) ---
      tl.fromTo('.narrative-3', 
        { opacity: 0, y: 35, filter: 'blur(8px)' }, 
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.04, ease: 'power2.out' }, 
        'water'
      )
      .to('.narrative-3', { opacity: 0, y: -35, filter: 'blur(8px)', duration: 0.04, ease: 'power2.in' }, 'water+=0.04');

      // --- 4. Through vegetation. (0.44 - 0.52) ---
      tl.fromTo('.narrative-4', 
        { opacity: 0, y: 35, filter: 'blur(8px)' }, 
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.04, ease: 'power2.out' }, 
        'veg'
      )
      .to('.narrative-4', { opacity: 0, y: -35, filter: 'blur(8px)', duration: 0.04, ease: 'power2.in' }, 'veg+=0.04');

      // --- 5. Through time. (0.52 - 0.60) ---
      tl.fromTo('.narrative-5', 
        { opacity: 0, y: 35, filter: 'blur(8px)' }, 
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.04, ease: 'power2.out' }, 
        'time'
      )
      .to('.narrative-5', { opacity: 0, y: -35, filter: 'blur(8px)', duration: 0.04, ease: 'power2.in' }, 'time+=0.04');

      // --- 6. GEOTWIN TURNS THESE SIGNALS... (0.60 - 0.72) ---
      tl.fromTo('.narrative-6', 
        { opacity: 0, y: 35, filter: 'blur(8px)' }, 
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.06, ease: 'power2.out' }, 
        'signals'
      )
      .to('.narrative-6', { opacity: 0, y: -35, filter: 'blur(8px)', duration: 0.06, ease: 'power2.in' }, 'signals+=0.06');

      // --- 7. Transition into HOW GEOTWIN WORKS (0.75 - 1.00) ---
      // Logo centerpiece fades in and constructs in the center
      tl.fromTo('.pinned-logo-wrapper', 
        { opacity: 0, scale: 0.9, y: 40 }, 
        { opacity: 1, scale: 1.15, y: 0, duration: 0.12, ease: 'power2.out' }, 
        'final'
      )
      // Logo moves & scales upward, and "HOW GEOTWIN WORKS" fades in beneath it
      .to('.pinned-logo-wrapper', { y: -80, scale: 0.85, duration: 0.13, ease: 'power2.inOut' }, 'final+=0.12');

      tl.fromTo('.narrative-7', 
        { opacity: 0, y: 60, filter: 'blur(8px)' }, 
        { opacity: 1, y: 25, filter: 'blur(0px)', duration: 0.13, ease: 'power2.out' }, 
        'final+=0.12'
      );

      // --- Continuous Cinematic Landscape-to-Dark-Olive Transition ---
      tl.to('.background-landscape-wrapper', {
        yPercent: -15,
        scale: 1.05,
        duration: 0.25,
        ease: 'none'
      }, 'final');

      tl.fromTo('.transition-overlay',
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power1.out' },
        'final'
      );

    }, containerRef);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      ctx.revert();
      
      const allTriggers = ScrollTrigger.getAll();
      allTriggers.forEach((t) => t.kill());
    };
  }, [reducedMotion]);

  const containerHeight = reducedMotion ? 'min-h-screen' : 'h-[500vh]';

  return (
    <div className="w-full bg-[#272B22] overflow-x-hidden">
      
      {/* Pinned Experience Container */}
      <div ref={containerRef} className={`relative w-full ${containerHeight}`}>
        <div 
          ref={pinRef} 
          className="pinned-container w-full h-screen overflow-hidden flex flex-col justify-center items-center bg-[#0A0F14]"
        >
          {/* Continuous Background Landscape reveal layer */}
          <div className="absolute inset-0 w-full h-full z-0 background-landscape-wrapper pointer-events-auto">
            <SpotlightRevealLayer scrollProgress={progress} isMobile={isMobile.current} />
          </div>

          {/* Atmospheric Haze/Light Filter */}
          <div className="absolute inset-0 z-[1] pointer-events-none atmosphere-overlay" />

          {/* Continuous Landscape-to-Dark-Olive Gradient Transition Overlay */}
          <div className="absolute inset-0 z-[2] pointer-events-none transition-overlay bg-gradient-to-t from-[#272B22] via-[#272B22]/80 to-transparent opacity-0" />

          {/* Spotlight Hero (Interactive Hover Reveal active below 20% progress) */}
          {progress < 0.2 && (
            <SpotlightHero 
              scrollProgress={progress / 0.2} 
              isMobile={isMobile.current}
            />
          )}

          {/* Pinned Narrative Text Overlay Stages (z-10 on top of background) */}
          {progress >= 0.2 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-6">
              <div className="relative w-full max-w-4xl min-h-[350px] flex flex-col items-center justify-center text-center">
                
                {/* Geotwin Logo centerpiece for final transition (0.75 - 1.0) */}
                <div className="pinned-logo-wrapper absolute opacity-0 scale-90">
                  <GeotwinLogo size={120} iconOnly={true} animate={progress >= 0.75} />
                </div>
                
                {/* 1. THE LAND IS ALWAYS SPEAKING */}
                <h2 className="narrative-1 absolute font-orbitron font-semibold text-[#EEE9DC] text-3xl sm:text-4xl lg:text-[44px] uppercase tracking-widest leading-normal max-w-2xl opacity-0">
                  THE LAND IS ALWAYS SPEAKING.
                </h2>

                {/* 2. Through terrain */}
                <h2 className="narrative-2 absolute font-iceberg text-white/90 text-4xl sm:text-5xl lg:text-6xl tracking-widest opacity-0">
                  Through terrain.
                </h2>

                {/* 3. Through water */}
                <h2 className="narrative-3 absolute font-iceberg text-white/90 text-4xl sm:text-5xl lg:text-6xl tracking-widest opacity-0">
                  Through water.
                </h2>

                {/* 4. Through vegetation */}
                <h2 className="narrative-4 absolute font-iceberg text-white/90 text-4xl sm:text-5xl lg:text-6xl tracking-widest opacity-0">
                  Through vegetation.
                </h2>

                {/* 5. Through time */}
                <h2 className="narrative-5 absolute font-iceberg text-white/90 text-4xl sm:text-5xl lg:text-6xl tracking-widest opacity-0">
                  Through time.
                </h2>

                {/* 6. GEOTWIN TURNS THESE SIGNALS INTO PLANS */}
                <h2 className="narrative-6 absolute font-orbitron font-semibold text-[#D0EEC9] text-2xl sm:text-3xl lg:text-[38px] uppercase tracking-wider leading-snug max-w-3xl opacity-0">
                  GEOTWIN TURNS THESE SIGNALS<br />INTO ACTIONABLE RESTORATION PLANS.
                </h2>

                {/* 7. Transition into HOW GEOTWIN WORKS (Final State) */}
                <div className="narrative-7 absolute flex flex-col items-center justify-center space-y-4 opacity-0">
                  <span className="font-mono text-[10px] text-olive-bright tracking-[0.35em] uppercase">
                    Methodology
                  </span>
                  <h2 className="font-orbitron font-bold text-white text-2xl sm:text-3xl lg:text-[34px] uppercase tracking-wider">
                    HOW GEOTWIN WORKS
                  </h2>
                  <div className="w-12 h-[2px] bg-olive-primary mx-auto" />
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* 4. How GeoTwin Works Section */}
      <HowItWorks />

      {/* 5. GeoTwin Philosophy Section */}
      <section className="w-full bg-[#272B22] text-[#EEE9DC] py-20 px-6 md:px-12 relative overflow-hidden border-t border-[#3E3F30]/30 text-center">
        <div className="max-w-3xl mx-auto relative z-10">
          <p className="font-raleway font-light italic text-white/90 text-lg sm:text-xl lg:text-2xl leading-relaxed">
            "Visualizing ecological futures through continuous planetary observation."
          </p>
          <div className="w-8 h-[1px] bg-olive-bright/40 mx-auto my-6" />
          <span className="font-mono text-[10px] text-olive-bright tracking-[0.25em] uppercase">
            The GeoTwin Philosophy
          </span>
        </div>
      </section>

      {/* 6. Final Closing Section */}
      <section className="w-full bg-[#272B22] text-[#EEE9DC] py-32 px-6 md:px-12 relative overflow-hidden border-t border-[#3E3F30]/30 flex flex-col items-center justify-center text-center">
        {/* WebGL Wave background (Fluid texture) */}
        <div className="absolute inset-0 w-full h-full z-0 opacity-15 pointer-events-none mix-blend-screen">
          <Wave 
            speed={0.3} 
            intensity={0.7} 
            pointerStrength={0} 
            disablePointerTracking={true} 
            theme="dark" 
          />
        </div>
        
        <div className="max-w-3xl space-y-6 relative z-10">
          <h2 className="font-orbitron font-bold text-white text-3xl sm:text-4xl lg:text-[44px] leading-tight uppercase tracking-wider">
            EVERY RESTORATION DECISION<br />BEGINS WITH UNDERSTANDING.
          </h2>
          <p className="font-sans text-xs sm:text-sm lg:text-base text-white/70 max-w-xl mx-auto leading-relaxed">
            GeoTwin transforms land signals into coordinated restoration action.
          </p>
          <div className="pt-6">
            <a
              href="/login"
              className="inline-block font-mono text-[11px] sm:text-xs tracking-[0.25em] text-white hover:text-[#D0EEC9] uppercase border border-[#3E3F30] hover:border-olive-primary/50 px-8 py-3.5 rounded-xl transition-all duration-300 bg-[#0E1513]/40 cursor-pointer shadow-lg hover:shadow-olive-primary/10"
            >
              ENTER GEOTWIN
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};

export default CinematicExperience;
