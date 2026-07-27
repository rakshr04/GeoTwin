import React from 'react';
import { AuthScene } from '../components/auth/AuthScene';

export const LoginPage: React.FC = () => {
  return (
    <main className="w-full min-h-screen bg-background-deep">
      <AuthScene progress={1.0} interactive={true} />
    </main>
  );
};

export default LoginPage;
