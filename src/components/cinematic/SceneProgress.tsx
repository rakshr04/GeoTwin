import React from 'react';

type SceneProgressProps = {
  progress: number;
  phase: "intro" | "transition" | "auth";
};

export const SceneProgress: React.FC<SceneProgressProps> = ({ progress, phase }) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[25] flex flex-col items-center space-y-1.5 font-mono text-[8px] md:text-[9px] text-text-secondary/70 select-none pointer-events-none">
      <div className="flex gap-6 tracking-widest uppercase">
        <span className={phase === 'intro' ? 'text-olive-primary font-bold' : 'opacity-50'}>Intro</span>
        <span className={phase === 'transition' ? 'text-olive-primary font-bold' : 'opacity-50'}>Transition</span>
        <span className={phase === 'auth' ? 'text-olive-primary font-bold' : 'opacity-50'}>Authentication</span>
      </div>
      <div className="w-40 h-[2px] bg-border-muted/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-olive-primary rounded-full transition-all duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
};

export default SceneProgress;
