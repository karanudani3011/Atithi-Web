import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import Logo from '../../components/Logo.jsx';
import '../admin.css';

export default function AdminLogin() {
  const { login, user, isAuthenticated, loading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(location.state?.authError || '');
  const [busy, setBusy] = useState(false);

  if (loading) {
    return <div className="admin-loading">Atithi Admin</div>;
  }

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'staff' ? '/admin/rooms' : '/admin/dashboard'} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);

    const form = new FormData(event.currentTarget);
    try {
      const signedInUser = await login(form.get('id'), form.get('password'));
      navigate(signedInUser?.role === 'staff' ? '/admin/rooms' : '/admin/dashboard', { replace: true });
    } catch (failure) {
      setError(failure.message);
      toast.error(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login">
      <div className="admin-login-blob one" aria-hidden="true" />
      <div className="admin-login-blob two" aria-hidden="true" />
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="admin-login-logo">
          <Logo light />
        </div>
        <span className="admin-eyebrow">SECURE ADMINISTRATOR SIGN-IN</span>
        <h1 id="admin-login-title">Admin Portal</h1>
        <p>Atithi Hotel Management</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label htmlFor="admin-id">ID</label>
          <input
            id="admin-id"
            name="id"
            autoComplete="username"
            placeholder="Admin ID or email"
            required
          />

          <label htmlFor="admin-password">Password</label>
          <div className="admin-password-field">
            <input
              id="admin-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(value => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p role="alert" className="admin-login-error">
              {error}
            </p>
          )}

          <button
            disabled={busy}
            className="admin-btn admin-btn-gold admin-login-submit"
          >
            {busy ? 'Signing in…' : 'Sign in'} <LogIn size={17} />
          </button>
        </form>

        <div className="admin-login-foot">PRIVATE ADMINISTRATION · ATITHI</div>
      </section>
    </main>
  );
}

