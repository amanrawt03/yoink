import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LoadingState } from './PageStates.jsx';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingState label="Restoring your session…" />;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

export function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState label="Restoring your session…" />;
  const location = useLocation();
  return !user ? (
    <Navigate to="/login" replace state={{ from: location }} />
  ) : user.role === 'admin' ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
}
