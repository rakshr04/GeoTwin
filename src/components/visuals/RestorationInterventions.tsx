import React from 'react';

type RestorationInterventionsProps = {
  className?: string;
  style?: React.CSSProperties;
};

export const RestorationInterventions: React.FC<RestorationInterventionsProps> = ({
  className = "",
  style = {},
}) => {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none select-none z-[6] ${className}`}
      style={{ ...style }}
    >
      <div className="relative w-full max-w-4xl aspect-video px-4 mx-auto flex items-center justify-center">
        <svg
          viewBox="0 0 800 450"
          className="w-full h-full fill-none stroke-[1.2]"
        >
          {/* Contour Bunds Intervention Lines */}
          <path 
            d="M 170 300 C 230 320, 310 240, 410 270" 
            className="stroke-restoration-green stroke-[2.2] stroke-dashed opacity-80" 
          />
          <text x="180" y="325" className="fill-olive-deep font-mono text-[9px] uppercase tracking-wider font-semibold">
            [+] Contour Bunds Zone
          </text>
          
          {/* Check Dams Locations */}
          <g transform="translate(350, 265)">
            <circle r="6" className="stroke-restoration-green fill-surface-primary stroke-[1.5]" />
            <path d="M-3,0 L3,0 M0,-3 L0,3" className="stroke-restoration-green stroke-[1]" />
            <text x="12" y="3" className="fill-olive-deep font-mono text-[9px] uppercase tracking-wider font-semibold">Check Dam CD-01</text>
          </g>
          
          {/* Recharge Trenches */}
          <path 
            d="M 530 190 C 580 195, 600 240, 640 230" 
            className="stroke-olive-primary stroke-[2.5] opacity-75"
          />
          <text x="540" y="175" className="fill-olive-deep font-mono text-[9px] uppercase tracking-wider font-semibold">
            [+] Recharge Trench RT-04
          </text>
          
          {/* Native Plantation / Agroforestry Zone Boundary Box */}
          <rect 
            x="400" 
            y="70" 
            width="150" 
            height="90" 
            rx="6" 
            className="stroke-restoration-green/60 stroke-dashed fill-restoration-green/5 stroke-[1.2]"
          />
          <text x="410" y="90" className="fill-olive-deep font-mono text-[9px] uppercase tracking-wider font-semibold">Agroforestry A-12</text>
          <text x="410" y="105" className="fill-text-secondary/80 font-mono text-[7.5px] uppercase tracking-widest">Area: 18.5ac</text>
        </svg>
      </div>
    </div>
  );
};

export default RestorationInterventions;
