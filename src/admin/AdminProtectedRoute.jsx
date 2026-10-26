import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

export function AdminRouteLoader() {
  return <div className="admin-loading admin-route-loader" role="status" aria-live="polite">
    <span className="admin-loading-spinner" aria-hidden="true" />
    <span>Checking admin access…</span>
  </div>;
}

export default function AdminProtectedRoute({ children }) {
  const { user, session, loading, authError } = useAdminAuth();
  const location = useLocation();

  if (loading) return <AdminRouteLoader />;
  if (!session?.user || !user) {
    return <Navigate to="/admin/login" replace state={authError ? { authError } : { from: location }} />;
  }
  // AdminAuthProvider validates this session's id against admin_profiles before exposing `user`.
  return children;
}

export function SuperAdminRoute({ children }) {
  const { user, session, loading, authError } = useAdminAuth();
  if (loading) return <AdminRouteLoader />;
  if (!session?.user || !user) {
    return <Navigate to="/admin/login" replace state={authError ? { authError } : undefined} />;
  }
  return user.role === 'super_admin' ? children : <Navigate to="/admin/dashboard" replace />;
}
