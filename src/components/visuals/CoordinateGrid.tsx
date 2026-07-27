import React from 'react';

export const CoordinateGrid: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-[2] opacity-35">
      {/* Grid lines */}
      <svg width="100%" height="100%" className="w-full h-full stroke-olive-primary/10 stroke-1">
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      {/* Ticks and coordinates label */}
      <div className="absolute top-6 left-6 font-mono text-[9px] text-text-secondary/70 tracking-widest uppercase">
        GRID REF: GT-09.28.11
      </div>
      
      <div className="absolute bottom-6 left-6 font-mono text-[9px] text-text-secondary/70 flex flex-col space-y-1">
        <div>COORD: 45° 31' 12" N</div>
        <div>SHIFT: 122° 40' 55" W</div>
      </div>

    </div>
  );
};

export default CoordinateGrid;
