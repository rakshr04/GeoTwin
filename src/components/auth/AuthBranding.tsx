import React from 'react';
import { GeotwinLogo } from '../shared/GeotwinLogo';

const Typewriter: React.FC<{ text: string; delay?: number; speed?: number }> = ({ text, delay = 0, speed = 40 }) => {
  const [displayedText, setDisplayedText] = React.useState('');
  const [isDone, setIsDone] = React.useState(false);

  React.useEffect(() => {
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    
    const startTyping = () => {
      timer = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.substring(0, index + 1));
          index++;
        }
        if (index >= text.length) {
          clearInterval(timer);
          setIsDone(true);
        }
      }, speed);
    };

    const delayTimeout = setTimeout(startTyping, delay);
    return () => {
      clearTimeout(delayTimeout);
      if (timer) clearInterval(timer);
    };
  }, [text, delay, speed]);

  return (
    <span>
      {displayedText}
      {!isDone && <span className="animate-blink font-light text-[#8A956B]">|</span>}
    </span>
  );
};

export const AuthBranding: React.FC = () => {
  return (
    <div className="w-full max-w-lg flex flex-col justify-center space-y-8 text-text-primary auth-branding-container relative">
      {/* Abstract Topographic Mountain Ridges (Earthy element) */}
      <div className="absolute -left-16 -bottom-36 w-80 h-80 opacity-15 pointer-events-none select-none mix-blend-screen hidden lg:block">
        <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10,170 Q60,110 110,170 T210,170" stroke="#8A956B" strokeWidth="0.8" />
          <path d="M25,170 Q85,90 145,170 T265,170" stroke="#8A956B" strokeWidth="0.8" />
          <path d="M-10,170 Q40,130 90,170 T190,170" stroke="#8A956B" strokeWidth="0.8" />
          <circle cx="130" cy="70" r="1.5" fill="#8A956B" />
          <line x1="130" y1="70" x2="130" y2="160" stroke="#8A956B" strokeWidth="0.5" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* Earth Coordinate Telemetry */}
      <div className="absolute -left-16 -bottom-40 font-mono text-[7.5px] text-[#8A956B]/30 tracking-[0.25em] uppercase select-none hidden lg:block">
        Ecosystem Grid Ref: 45.362Â° N, 122.188Â° W // Elevation: 1420m
      </div>
      <div className="space-y-6 text-center lg:text-left">
        {/* Glowing & Rotating Logo - Shifted Right & Enlarged */}
        <div className="flex justify-center lg:justify-start pl-0 lg:pl-16 w-full my-4 animate-fade-in opacity-0" style={{ animationDelay: '0.1s' }}>
          <div className="relative group p-2 flex items-center justify-center translate-x-4 lg:translate-x-12">
            {/* Ambient Radial Green Glow */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-3xl scale-175 animate-pulse pointer-events-none" />
            {/* Slowly Rotating & Glowing Emblem */}
            <div className="relative z-10 animate-[spin_40s_linear_infinite] drop-shadow-[0_0_40px_rgba(34,197,94,0.85)]">
              <GeotwinLogo size={160} iconOnly={true} />
            </div>
          </div>
        </div>
        
        <span className="inline-block text-[10px] font-semibold font-mono tracking-[0.35em] text-[#8A956B] uppercase animate-fade-in opacity-0" style={{ animationDelay: '0.3s' }}>
          LAND RESTORATION INTELLIGENCE
        </span>
        <h1 className="text-2xl md:text-3xl lg:text-[34px] font-bold tracking-tight text-text-primary leading-[1.2] font-orbitron min-h-[90px] md:min-h-[100px] lg:min-h-[110px]">
          <Typewriter text="EVERY RESTORATION DECISION" delay={450} speed={35} />
          <br />
          <Typewriter text="BEGINS WITH UNDERSTANDING." delay={1650} speed={35} />
        </h1>
        <p className="text-xs md:text-sm text-[#B8C7D1]/70 leading-relaxed max-w-md animate-fade-in opacity-0 font-sans" style={{ animationDelay: '2.8s' }}>
          Access environmental intelligence, collaborative planning tools, and real-time topographical datasets built for government agency workflows.
        </p>
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeUpEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeUpEntrance {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-start infinite;
        }
      `}</style>
    </div>
  );
};

export default AuthBranding;

