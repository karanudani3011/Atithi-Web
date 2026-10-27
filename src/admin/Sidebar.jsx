import { useCallback, useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, DoorOpen, CalendarCheck, Shield, LogOut, ExternalLink, X, ConciergeBell, Mail, Users, History } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo.jsx';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import useRealtimeTable from '../hooks/useRealtimeTable.js';
import { getPendingBookingCount } from '../services/admin/adminBookingService.js';

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [pendingCount, setPendingCount] = useState(0);
  const refreshPendingCount = useCallback(() => {
    getPendingBookingCount().then(setPendingCount).catch(() => {});
  }, []);
  useEffect(() => { if (user) refreshPendingCount(); }, [user?.id, refreshPendingCount]);
  useRealtimeTable({ table: user?.id ? 'bookings' : null, onChange: refreshPendingCount });
  const items = [
    ...(isAdmin ? [['Dashboard', '/admin/dashboard', LayoutDashboard]] : []),
    ['Bookings', '/admin/bookings', CalendarCheck],
    ['Rooms', '/admin/rooms', DoorOpen],
    ['Services', '/admin/services', ConciergeBell],
    ['Messages', '/admin/messages', Mail],
    ...(isAdmin ? [['Users', '/admin/users', Users], ['Login Activity', '/admin/login-activity', History], ['Access', '/admin/access', Shield]] : []),
  ];

  async function handleLogout() {
    try { await logout(); onClose?.(); navigate('/admin/login', { replace: true }); }
    catch { toast.error('Sign out na thayu. Please try again.'); }
  }

  return <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
    <div className="admin-brand"><Link to={isAdmin ? '/admin/dashboard' : '/admin/rooms'} onClick={onClose}><Logo light/></Link>
      <button aria-label="Close admin menu" className="admin-sidebar-close" onClick={onClose}><X/></button>
    </div>
    <span className="admin-side-label">MANAGEMENT</span>
    <nav className="admin-side-nav">{items.map(([label, to, Icon]) => <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => isActive ? 'active' : ''}>
      <Icon size={19}/><span>{label}</span>{to === '/admin/bookings' && pendingCount > 0 && <span className="admin-nav-count" aria-label={`${pendingCount} pending bookings`}>{pendingCount > 99 ? '99+' : pendingCount}</span>}
    </NavLink>)}</nav>
    <div className="admin-sidebar-bottom">
      <Link to="/" className="admin-view-site" onClick={onClose}><ExternalLink size={17}/>View Website</Link>
      <button className="admin-logout" onClick={handleLogout}><LogOut size={18}/>Logout</button>
      <div className="admin-side-foot">ATITHI · ADMINISTRATION</div>
    </div>
  </aside>;
}
