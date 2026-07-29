import {
  Suspense,
  lazy,
  useEffect,
  useState,
  type ReactElement,
} from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

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
  allowedRole: GeoTwinRole;
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

  if (user.role !== allowedRole) {
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
          element={
            !authLoading && user ? (
              <DashboardRedirect
                user={user}
                loading={authLoading}
              />
            ) : (
              <LoginPage />
            )
          }
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
              allowedRole="officer"
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
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
