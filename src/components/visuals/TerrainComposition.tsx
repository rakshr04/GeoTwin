import React from 'react';

type TerrainCompositionProps = {
  progress?: number;
  className?: string;
  style?: React.CSSProperties;
};

export const TerrainComposition: React.FC<TerrainCompositionProps> = ({
  progress = 0,
  className = "",
  style = {},
}) => {
  // Gentle slow zoom calculation linked to scroll progress
  // Active when progress is beyond the spotlight intro stage (>= 0.16)
  const baseScale = 1.0;
  const zoomFactor = 0.25;
  const scale = baseScale + Math.max(0, progress - 0.16) * zoomFactor;

  return (
    <div 
      className={`absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden ${className}`}
      style={{ ...style }}
    >
      {/* Natural aerial forest landscape background */}
      <img
        src="/images/geotwin-reveal.png"
        alt="Geotwin analyzed terrain perspective"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-75 ease-out"
        style={{
          transform: `scale(${scale})`,
          filter: 'brightness(0.9) contrast(1.05)',
        }}
      />
    </div>
  );
};

export default TerrainComposition;

