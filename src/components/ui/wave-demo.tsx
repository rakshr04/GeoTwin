import React, { useState } from 'react';
import { Wave } from './wave';

export const WaveDemo: React.FC = () => {
  const [speed, setSpeed] = useState(0.5);
  const [intensity, setIntensity] = useState(1.0);
  const [progress, setProgress] = useState(0.5);
  const [pointerStrength, setPointerStrength] = useState(0.5);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <div className="w-full min-h-screen bg-background-deep flex flex-col items-center justify-center p-6 text-text-primary">
      <div className="absolute inset-0 z-0 opacity-40">
        <Wave
          speed={speed}
          intensity={intensity}
          progress={progress}
          pointerStrength={pointerStrength}
          theme={theme}
        />
      </div>

      <div className="relative z-10 w-full max-w-md bg-surface-primary border border-border-muted p-6 rounded-2xl shadow-xl space-y-4">
        <h2 className="text-2xl font-semibold text-text-primary">Wave Shader Control</h2>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Speed: {speed.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full accent-olive-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Intensity: {intensity.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            className="w-full accent-olive-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Progress: {progress.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={progress}
            onChange={(e) => setProgress(parseFloat(e.target.value))}
            className="w-full accent-olive-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Pointer Strength: {pointerStrength.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={pointerStrength}
            onChange={(e) => setPointerStrength(parseFloat(e.target.value))}
            className="w-full accent-olive-primary"
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-sm font-medium">Theme: {theme}</span>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="px-4 py-2 bg-olive-primary hover:bg-olive-bright text-[#1F241C] rounded-lg transition-colors font-medium cursor-pointer"
          >
            Toggle Theme
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaveDemo;
