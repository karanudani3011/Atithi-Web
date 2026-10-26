import { Navigate } from 'react-router-dom';import { useAdminAuth } from '../context/AdminAuthContext.jsx';
export function AdminRouteLoader(){return <div className="admin-loading" role="status">Atithi Admin</div>}
export default function ProtectedRoute({children}){const {user,loading}=useAdminAuth();if(loading)return <AdminRouteLoader/>;return user?children:<Navigate to="/admin/login" replace/>}
export function SuperAdminRoute({children}){const {user,loading}=useAdminAuth();if(loading)return <AdminRouteLoader/>;if(!user)return <Navigate to="/admin/login" replace/>;return user.role==='super_admin'?children:<Navigate to="/admin/dashboard" replace/>}
