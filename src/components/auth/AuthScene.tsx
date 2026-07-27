import React from 'react';
import { AuthBranding } from './AuthBranding';
import { AuthPanel } from './AuthPanel';
import { SceneBackdrop } from '../visuals/SceneBackdrop';
import type { WaveParams } from '../ui/wave';

import { FluidParticles } from './FluidParticles';

type AuthSceneProps = {
  progress?: number;
  interactive?: boolean;
  controllerRef?: React.MutableRefObject<WaveParams>;
};

export const AuthScene: React.FC<AuthSceneProps> = ({
  progress = 1.0,
  interactive = true,
  controllerRef,
}) => {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16 xl:p-24 overflow-hidden bg-[#0A0F14]">
      {/* Underlay Backdrop */}
      <SceneBackdrop 
        progress={progress} 
        intensity={0.8} 
        interactive={interactive} 
        controllerRef={controllerRef}
      />

      {/* Interactive green environmental data particles (intensity increased) */}
      <FluidParticles 
        particleDensity={280}
        particleSize={1.8}
        particleColor="rgba(111,143,85,0.45)"
        activeColor="rgba(158,183,124,0.85)"
        maxBlastRadius={200}
        hoverDelay={120}
        interactionDistance={90}
      />
      
      {/* Balanced layout Grid: width 5xl (more compact) and gap-8 for tighter balance */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
        
        {/* Left Column: Branding Content */}
        <div className="lg:col-span-7 flex flex-col justify-center auth-branding-col">
          <AuthBranding />
        </div>
        
        {/* Right Column: Interaction Form */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end auth-panel-col">
          <div className="w-full max-w-md">
            <AuthPanel />
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default AuthScene;
