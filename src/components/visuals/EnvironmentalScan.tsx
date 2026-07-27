import React from 'react';

export const EnvironmentalScan: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-[4] overflow-hidden">
      {/* Laser Scanning Sweep Bar */}
      <div className="absolute left-0 w-full h-[150px] bg-gradient-to-b from-transparent via-restoration-green/8 to-transparent border-y border-restoration-green/20 opacity-40 animate-[scanSweep_6s_ease-in-out_infinite]" />
      
      {/* Laser Grid points */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,155,105,0.05)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
      
      <style>{`
        @keyframes scanSweep {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(100vh); }
          100% { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  );
};

export default EnvironmentalScan;
