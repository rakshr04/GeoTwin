import React from 'react';

type TransitionSceneProps = {
  progress: number;
};

export const TransitionScene: React.FC<TransitionSceneProps> = ({ progress }) => {
  // We calculate the active position of our restoration scanner sweep
  const scanPosition = `${progress * 100}%`;
  
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-[8] w-full h-full overflow-hidden">
      {/* Scan line sweep effect */}
      {progress > 0.15 && progress < 0.85 && (
        <div 
          className="absolute left-0 w-full h-[1.5px] bg-restoration-green/60 shadow-[0_0_12px_rgba(139,155,105,0.4)]"
          style={{ top: scanPosition }}
        />
      )}
      
      {/* Dynamic vignette shift during transition */}
      <div 
        className="absolute inset-0 bg-radial-gradient from-transparent to-page-background transition-opacity duration-300"
        style={{ opacity: Math.max(0, 1.0 - progress * 1.3) }} 
      />
    </div>
  );
};

export default TransitionScene;
