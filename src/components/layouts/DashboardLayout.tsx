import React from 'react';
import { Velaris } from '../ui/velaris';
import { AmbientCursorGlow } from '../ui/AmbientCursorGlow';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * DashboardLayout
 * Enterprise Dark Forest Theme Layout Wrapper for authenticated dashboards.
 * 
 * Dark Forest Theme Specs:
 * Background: #0E1411
 * Secondary Background: #121A16
 * Surface: #18211D
 * Card Surface: rgba(24, 33, 29, 0.88)
 * Sidebar: #102419
 * Text: #F8FAF8
 * Secondary Text: #AEB9B3
 * Muted Text: #819089
 * 
 * Layer Hierarchy:
 * AmbientCursorGlow (rgba(56,122,78,0.12), z-0)
 * ↓
 * Velaris WebGL Ambient Terrain Layer (z-0)
 * ↓
 * Dark Forest Background (#0E1411) (z-0)
 * ↓
 * Dashboard Content (z-10)
 * ↓
 * Cards (rgba(24,33,29,0.88), z-10)
 * ↓
 * MapLibre Map (z-10)
 * ↓
 * Dialogs (z-50)
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-[#0E1411] text-[#F8FAF8] font-sans antialiased selection:bg-[#387A4E]/30">
      {/* Velaris Ambient Terrain WebGL Layer */}
      <Velaris speed={0.1} grain={0.02} height="100%" />

      {/* Subtle Interactive Ambient Cursor Glow */}
      <AmbientCursorGlow color="rgba(56, 122, 78, 0.12)" />

      {/* Main Authenticated Page Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
