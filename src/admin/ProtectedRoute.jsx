import {Navigate} from 'react-router-dom';import {useAdminAuth} from '../context/AdminAuthContext.jsx';
export default function ProtectedRoute({children,superOnly=false}){const {isAuthenticated,isSuperAdmin}=useAdminAuth();if(!isAuthenticated)return <Navigate to="/admin/login" replace/>;if(superOnly&&!isSuperAdmin)return <Navigate to="/admin/dashboard" replace/>;return children}
