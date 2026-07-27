import React from 'react';
import { Wave } from '../ui/wave';
import type { WaveParams } from '../ui/wave';
import { CoordinateGrid } from './CoordinateGrid';
import { ContourOverlay } from './ContourOverlay';

type SceneBackdropProps = {
  progress?: number;
  intensity?: number;
  interactive?: boolean;
  controllerRef?: React.MutableRefObject<WaveParams>;
};

export const SceneBackdrop: React.FC<SceneBackdropProps> = ({
  progress = 0,
  intensity = 1.0,
  interactive = true,
  controllerRef,
}) => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-background-deep z-0 pointer-events-none">
      {/* Contour topographic layers */}
      <ContourOverlay />
      
      {/* Coordinate reference grid */}
      <CoordinateGrid />
      
      {/* WebGL Wave canvas wrapper controlled by GSAP */}
      <div className="absolute inset-0 w-full h-full wave-container-parent">
        <Wave
          speed={0.4}
          intensity={intensity}
          progress={progress}
          pointerStrength={interactive ? 0.6 : 0.0}
          disablePointerTracking={!interactive}
          theme="light"
          controllerRef={controllerRef}
        />
      </div>
      
      {/* Ambient gradient vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-background-deep/30 via-transparent to-background-deep/40 pointer-events-none mix-blend-multiply" />
    </div>
  );
};

export default SceneBackdrop;

