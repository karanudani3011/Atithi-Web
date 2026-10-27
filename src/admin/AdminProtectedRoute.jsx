import ProtectedRoute from '../components/ProtectedRoute.jsx';

export function AdminRouteLoader() {
  return <div className="admin-loading admin-route-loader" role="status" aria-live="polite">
    <span className="admin-loading-spinner" aria-hidden="true" />
    <span>Checking access…</span>
  </div>;
}
export default function AdminProtectedRoute({ children }) {
  return <ProtectedRoute role="admin">{children}</ProtectedRoute>;
}
export function AdminOnlyRoute({ children }) {
  return <ProtectedRoute role="admin">{children}</ProtectedRoute>;
}
