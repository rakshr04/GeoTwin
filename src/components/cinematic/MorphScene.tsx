import React from 'react';

type MorphSceneProps = {
  progress: number;
};

export const MorphScene: React.FC<MorphSceneProps> = ({ progress }) => {
  // Calculated opacity to highlight the crossfade area
  const opacity = progress > 0.68 && progress < 0.84 
    ? Math.min(1, (progress - 0.68) * 6.25)
    : 0;

  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none z-[7] transition-opacity duration-100"
      style={{ opacity }}
    >
      {/* Blend vignette during visual morph phase */}
      <div className="w-full h-full bg-radial-gradient from-transparent to-page-background/50" />
    </div>
  );
};

export default MorphScene;
