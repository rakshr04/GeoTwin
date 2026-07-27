import React from 'react';
import { GeotwinLogo } from '../shared/GeotwinLogo';
import { ArrowDown } from 'lucide-react';

export const IntroScene: React.FC = () => {
  return (
    <div className="relative w-full h-screen flex flex-col justify-between p-6 md:p-12 text-text-primary z-10">
      {/* Header */}
      <div className="flex justify-between items-center w-full">
        <GeotwinLogo />
        <span className="font-mono text-[9px] tracking-widest uppercase text-text-secondary/70">
          PROTOTYPE v1.0
        </span>
      </div>

      {/* Hero Headings */}
      <div className="max-w-4xl mx-auto text-center space-y-6 my-auto">
        <span className="inline-block text-[10px] font-semibold font-mono tracking-[0.3em] text-olive-primary uppercase">
          GEOGRAPHIC INTEGRITY SYSTEM
        </span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary max-w-3xl leading-[1.15] mx-auto">
          See the land. <br />
          <span className="text-olive-deep">Understand the damage.</span> <br />
          Restore its future.
        </h1>
        <p className="text-sm md:text-base text-text-secondary max-w-lg mx-auto leading-relaxed">
          Geotwin pairs satellite radar topography with high-fidelity modeling to restore degraded forest and wetlands ecosystems.
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="flex flex-col items-center justify-center space-y-2 animate-bounce">
        <span className="font-mono text-[8px] tracking-widest uppercase text-text-secondary/80">
          Scroll to enter
        </span>
        <ArrowDown className="w-4 h-4 text-olive-primary" />
      </div>
    </div>
  );
};

export default IntroScene;
