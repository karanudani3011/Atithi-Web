import { useAdminAuth } from '../context/AdminAuthContext.jsx';

// AdminAuthProvider restores the Supabase session and fetches the matching active admin_profiles row.
export default function useRole() {
  const { user, session, loading, authError } = useAdminAuth();
  return {
    role: user?.role || 'none',
    user,
    session,
    loading,
    authError,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
  };
}
