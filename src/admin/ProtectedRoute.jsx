import { Navigate } from 'react-router-dom';
import useRole from '../hooks/useRole.js';
export function AdminRouteLoader() { return <div className="admin-loading" role="status">Checking team access…</div>; }
export default function ProtectedRoute({ children, allowedRoles = ['admin', 'staff'] }) {
  const { role, loading } = useRole();
  if (loading) return <AdminRouteLoader />;
  if (role === 'none') return <Navigate to="/admin/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/admin/rooms" replace />;
  return children;
}
export function AdminOnlyRoute({ children }) { return <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>; }
