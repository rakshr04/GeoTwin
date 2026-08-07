import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useState,
  type ReactElement,
  type ErrorInfo,
} from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactElement;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Uncaught Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0E130D] text-[#EEE9DC] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#1A2017] border border-[#44503E]/50 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-red-400">Something went wrong</h2>
            <p className="text-xs text-[#B9B6A7] leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred while loading the workspace.'}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  localStorage.removeItem('gt_auth_user');
                  window.location.href = '/login';
                }}
                className="px-4 py-2 bg-[#8A956B] text-[#171C15] font-bold text-xs rounded-xl hover:bg-[#A5B17C] transition-colors"
              >
                Return to Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#2D352B] text-[#EEE9DC] font-bold text-xs rounded-xl hover:bg-[#3E4A3B] transition-colors border border-[#44503E]/40"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { LoadingFallback } from './components/shared/LoadingFallback';
import {
  getCurrentUser,
  subscribeToAuthChanges,
  type GeoTwinRole,
  type UserSession,
} from './utils/auth';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

const DemoPlaceholder = lazy(
  () => import('./pages/DemoPlaceholder'),
);

const DashboardPlaceholder = lazy(
  () => import('./pages/DashboardPlaceholder'),
);

const SupervisorDashboardPlaceholder = lazy(
  () => import('./pages/SupervisorDashboardPlaceholder'),
);

const ResetPasswordPage = lazy(
  () => import('./pages/ResetPasswordPage'),
);
const FieldAssignmentsPage = lazy(
  () => import('./pages/FieldAssignmentsPage'),
);
const FieldAssignmentDetailPage = lazy(
  () => import('./pages/FieldAssignmentDetailPage'),
);
const FieldTasksPage = lazy(
  () => import('./pages/FieldTasksPage'),
);
const FieldTaskDetailPage = lazy(
  () => import('./pages/FieldTaskDetailPage'),
);
const AssignedLandMapPage = lazy(
  () => import('./pages/AssignedLandMapPage'),
);
const ReportChangePage = lazy(
  () => import('./pages/ReportChangePage'),
);
const FieldNotificationsPage = lazy(
  () => import('./pages/FieldNotificationsPage'),
);

type ProtectedRouteProps = {
  children: ReactElement;
  allowedRole?: GeoTwinRole | GeoTwinRole[];
  user: UserSession | null;
  loading: boolean;
};

function ProtectedRoute({
  children,
  allowedRole,
  user,
  loading,
}: ProtectedRouteProps) {
  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole) {
    const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!roles.includes(user.role)) {
      return (
        <Navigate
          to={
            user.role === 'officer'
              ? '/field/dashboard'
              : '/supervisor/dashboard'
          }
          replace
        />
      );
    }
  }

  return children;
}

function DashboardRedirect({
  user,
  loading,
}: {
  user: UserSession | null;
  loading: boolean;
}) {
  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={
        user.role === 'supervisor'
          ? '/supervisor/dashboard'
          : '/field/dashboard'
      }
      replace
    />
  );
}

function AppRoutes() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const currentUser = await getCurrentUser();

        if (active) {
          setUser(currentUser);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    void restoreSession();

    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      if (active) {
        setUser(nextUser);
        setAuthLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        <Route
          path="/auth/callback"
          element={
            <DashboardRedirect
              user={user}
              loading={authLoading}
            />
          }
        />

        <Route
          path="/demo"
          element={<DemoPlaceholder />}
        />

        <Route
          path="/field/dashboard"
          element={
            <ProtectedRoute
              allowedRole="officer"
              user={user}
              loading={authLoading}
            >
              <DashboardPlaceholder />
            </ProtectedRoute>
          }
        />

        <Route
          path="/field/assignments"
          element={
            <ProtectedRoute
              allowedRole="officer"
              user={user}
              loading={authLoading}
            >
              <FieldAssignmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/field/assignments/:assignmentId"
          element={
            <ProtectedRoute
              allowedRole="officer"
              user={user}
              loading={authLoading}
            >
              <FieldAssignmentDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/field/tasks"
          element={
            <ProtectedRoute
              allowedRole="officer"
              user={user}
              loading={authLoading}
            >
              <FieldTasksPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/field/evidence"
          element={
            <ProtectedRoute
              allowedRole="officer"
              user={user}
              loading={authLoading}
            >
              <FieldTasksPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/field/verification"
          element={
            <ProtectedRoute
              allowedRole="officer"
              user={user}
              loading={authLoading}
            >
              <FieldTasksPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/field/tasks/:taskId"
          element={
            <ProtectedRoute
              allowedRole="officer"
              user={user}
              loading={authLoading}
            >
              <FieldTaskDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/field/map"
          element={
            <ProtectedRoute
              allowedRole={['officer', 'supervisor']}
              user={user}
              loading={authLoading}
            >
              <AssignedLandMapPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assigned-land"
          element={
            <ProtectedRoute
              allowedRole={['officer', 'supervisor']}
              user={user}
              loading={authLoading}
            >
              <AssignedLandMapPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/field/report-change"
          element={
            <ProtectedRoute
              allowedRole="officer"
              user={user}
              loading={authLoading}
            >
              <ReportChangePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/field/notifications"
          element={
            <ProtectedRoute
              allowedRole="officer"
              user={user}
              loading={authLoading}
            >
              <FieldNotificationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/supervisor/dashboard"
          element={
            <ProtectedRoute
              allowedRole="supervisor"
              user={user}
              loading={authLoading}
            >
              <SupervisorDashboardPlaceholder />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <DashboardRedirect
              user={user}
              loading={authLoading}
            />
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
