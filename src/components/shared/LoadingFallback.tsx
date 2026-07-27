import React from 'react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="w-full h-screen bg-page-background flex flex-col items-center justify-center space-y-4 z-50">
      <div className="w-12 h-12 rounded-full border-[3px] border-border-muted border-t-olive-primary animate-spin" />
      <p className="text-xs font-mono tracking-wider uppercase text-text-secondary animate-pulse">
        Loading Land Intelligence...
      </p>
    </div>
  );
};

export default LoadingFallback;
