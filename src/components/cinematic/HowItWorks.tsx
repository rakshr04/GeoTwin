import React from 'react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: "I",
      title: "DETECT",
      desc: "Analyse terrain, vegetation, water availability and signs of degradation.",
    },
    {
      num: "II",
      title: "UNDERSTAND",
      desc: "Combine GIS data, satellite insights, field observations and expert inputs.",
    },
    {
      num: "III",
      title: "RESTORE",
      desc: "Generate coordinated, practical and reviewable restoration plans.",
    },
  ];

  return (
    <section className="w-full bg-[#272B22] text-[#EEE9DC] pb-32 pt-16 px-6 md:px-12 relative overflow-hidden border-t border-[#3E3F30]/30">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
          
          {/* Horizontal animated connected line for desktop (0.35mm / 1.3px thickness with soft glow) */}
          <div className="hidden md:block absolute top-[18px] left-[10%] right-[10%] h-[1.3px] bg-gradient-to-r from-[#3E3F30]/15 via-[#3E3F30]/80 to-[#3E3F30]/15 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-olive-primary/70 to-transparent w-1/3 animate-[shimmerLine_4s_ease-in-out_infinite] shadow-[0_0_6px_rgba(138,149,107,0.6)]" />
          </div>

          {steps.map((s, idx) => {
            return (
              <div 
                key={idx} 
                className="flex flex-col items-center text-center relative z-10 group px-4"
              >
                {/* Minimalist marker instead of icons */}
                <div className="w-9 h-9 rounded-full border border-[#3E3F30] bg-[#272B22] flex items-center justify-center font-mono text-[11px] text-olive-bright mb-6 group-hover:border-olive-primary transition-colors duration-300">
                  {s.num}
                </div>

                <h3 className="font-orbitron font-semibold text-sm tracking-[0.2em] text-white mb-4 uppercase">
                  {s.title}
                </h3>
                <p className="font-sans text-xs md:text-sm text-white/70 leading-relaxed max-w-[280px]">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes shimmerLine {
          0% { left: -30%; }
          100% { left: 100%; }
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;
