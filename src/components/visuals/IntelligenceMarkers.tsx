import React from 'react';

type IntelligenceMarkersProps = {
  className?: string;
  style?: React.CSSProperties;
};

export const IntelligenceMarkers: React.FC<IntelligenceMarkersProps> = ({
  className = "",
  style = {},
}) => {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none select-none z-[5] ${className}`}
      style={{ ...style }}
    >
      {/* Indicator 1: Vegetation Condition */}
      <div className="absolute top-[22%] left-[16%] flex items-start gap-3">
        <div className="flex flex-col border border-olive-primary/30 bg-surface-primary/75 px-2.5 py-1.5 rounded-lg">
          <span className="font-mono text-[8px] text-text-secondary tracking-wider uppercase">VEG. CONDITION</span>
          <span className="font-sans text-xs font-semibold text-red-700">31% - Critical</span>
        </div>
        <svg width="40" height="40" className="stroke-olive-primary/30 stroke-[0.75] fill-none">
          <path d="M0,10 L30,10 L40,30" />
        </svg>
      </div>

      {/* Indicator 2: Soil Erosion */}
      <div className="absolute bottom-[24%] left-[12%] flex items-end gap-3">
        <div className="flex flex-col border border-olive-primary/30 bg-surface-primary/75 px-2.5 py-1.5 rounded-lg">
          <span className="font-mono text-[8px] text-text-secondary tracking-wider uppercase">SOIL EROSION</span>
          <span className="font-sans text-xs font-semibold text-text-primary">Severe Loss</span>
        </div>
        <svg width="50" height="30" className="stroke-olive-primary/30 stroke-[0.75] fill-none">
          <path d="M0,20 L35,20 L50,0" />
        </svg>
      </div>

      {/* Indicator 3: Water Stress */}
      <div className="absolute top-[18%] right-[18%] flex items-start gap-3 flex-row-reverse">
        <div className="flex flex-col border border-olive-primary/30 bg-surface-primary/75 px-2.5 py-1.5 rounded-lg text-right">
          <span className="font-mono text-[8px] text-text-secondary tracking-wider uppercase">HYDROLOGY</span>
          <span className="font-sans text-xs font-semibold text-text-primary">Water Stress - High</span>
        </div>
        <svg width="40" height="40" className="stroke-olive-primary/30 stroke-[0.75] fill-none">
          <path d="M40,10 L10,10 L0,30" />
        </svg>
      </div>

      {/* Indicator 4: Restoration Priority */}
      <div className="absolute top-[48%] right-[10%] flex items-center gap-3 flex-row-reverse">
        <div className="flex flex-col border border-olive-primary/30 bg-surface-primary/75 px-2.5 py-1.5 rounded-lg text-right">
          <span className="font-mono text-[8px] text-text-secondary tracking-wider uppercase">REST. PRIORITY</span>
          <span className="font-sans text-xs font-semibold text-olive-deep uppercase tracking-wider">Immediate Action</span>
        </div>
        <svg width="50" height="20" className="stroke-olive-primary/30 stroke-[0.75] fill-none">
          <path d="M50,10 L10,10 L0,10" />
        </svg>
      </div>

      {/* Indicator 5: Terrain Risk */}
      <div className="absolute bottom-[20%] right-[15%] flex items-end gap-3 flex-row-reverse">
        <div className="flex flex-col border border-olive-primary/30 bg-surface-primary/75 px-2.5 py-1.5 rounded-lg text-right">
          <span className="font-mono text-[8px] text-text-secondary tracking-wider uppercase">TERRAIN RISK</span>
          <span className="font-sans text-xs font-semibold text-text-primary">Moderate Risk</span>
        </div>
        <svg width="40" height="30" className="stroke-olive-primary/30 stroke-[0.75] fill-none">
          <path d="M40,20 L15,20 L0,0" />
        </svg>
      </div>
    </div>
  );
};

export default IntelligenceMarkers;
