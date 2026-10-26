import { Navigate, useLocation } from 'react-router-dom';
import useRole from '../hooks/useRole.js';

export function AdminRouteLoader() {
  return <div className="admin-loading admin-route-loader" role="status" aria-live="polite">
    <span className="admin-loading-spinner" aria-hidden="true" />
    <span>Checking team access…</span>
  </div>;
}

export default function AdminProtectedRoute({ children, allowedRoles = ['admin', 'staff'], fallback = '/admin/rooms' }) {
  const { role, session, loading, authError } = useRole();
  const location = useLocation();
  if (loading) return <AdminRouteLoader />;
  if (!session?.user || role === 'none') {
    return <Navigate to="/admin/login" replace state={authError ? { authError } : { from: location }} />;
  }
  if (!allowedRoles.includes(role)) return <Navigate to={fallback} replace />;
  return children;
}

export function AdminOnlyRoute({ children }) {
  return <AdminProtectedRoute allowedRoles={['admin']} fallback="/admin/rooms">{children}</AdminProtectedRoute>;
}
