import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingFallback } from './components/shared/LoadingFallback';

// Lazy loading pages for quick initial payload delivery
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DemoPlaceholder = lazy(() => import('./pages/DemoPlaceholder'));
const DashboardPlaceholder = lazy(() => import('./pages/DashboardPlaceholder'));
const SupervisorDashboardPlaceholder = lazy(() => import('./pages/SupervisorDashboardPlaceholder'));

import { getCurrentUser } from './utils/auth';
import type { ReactElement } from 'react';

const ProtectedRoute = ({ children, allowedRole }: { children: ReactElement; allowedRole: 'officer' | 'supervisor' }) => {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== allowedRole) {
    // If authenticated but role mismatch, direct to correct dashboard or landing
    return <Navigate to={user.role === 'officer' ? '/field/dashboard' : '/supervisor/dashboard'} replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/demo" element={<DemoPlaceholder />} />
          <Route 
            path="/field/dashboard" 
            element={
              <ProtectedRoute allowedRole="officer">
                <DashboardPlaceholder />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supervisor/dashboard" 
            element={
              <ProtectedRoute allowedRole="supervisor">
                <SupervisorDashboardPlaceholder />
              </ProtectedRoute>
            } 
          />
          <Route path="/dashboard" element={<Navigate to="/field/dashboard" replace />} />
          {/* Redirect any other path back to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
