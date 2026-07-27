import React from 'react';

export const ContourOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-[1] opacity-25">
      <svg
        viewBox="0 0 1000 1000"
        className="w-full h-full stroke-olive-primary/20 fill-none stroke-[0.75]"
        preserveAspectRatio="none"
      >
        {/* Topographic Contour lines paths */}
        <path d="M-100,500 C150,550 200,300 400,350 C600,400 800,200 1100,250" />
        <path d="M-100,600 C180,620 230,410 430,460 C630,510 830,310 1100,360" />
        <path d="M-100,700 C210,690 260,520 460,570 C660,620 860,420 1100,470" />
        <path d="M-100,800 C240,760 290,630 490,680 C690,730 890,530 1100,580" />
        
        {/* Concentric topographic loops */}
        <path d="M150,150 C200,120 300,130 350,180 C400,230 380,320 300,350 C220,380 120,300 150,220 Z" />
        <path d="M180,180 C220,150 280,160 320,200 C360,240 340,300 280,320 C220,340 150,280 180,220 Z" />
        <path d="M210,210 C240,180 260,190 290,220 C320,250 300,280 260,290 C220,300 180,260 210,210 Z" />
      </svg>
    </div>
  );
};

export default ContourOverlay;
