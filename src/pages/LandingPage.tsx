import React from 'react';
import { CinematicExperience } from '../components/cinematic/CinematicExperience';

export const LandingPage: React.FC = () => {
  return (
    <main className="w-full min-h-screen bg-background-deep">
      <CinematicExperience />
    </main>
  );
};

export default LandingPage;
