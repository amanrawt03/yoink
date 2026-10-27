import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p role="status">Restoring your session…</p>;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

export function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p role="status">Restoring your session…</p>;
  return !user ? (
    <Navigate to="/login" replace />
  ) : user.role === 'admin' ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
}
