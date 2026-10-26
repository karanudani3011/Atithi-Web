import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, DoorOpen, CalendarCheck, Shield, LogOut, ExternalLink, X, ConciergeBell, Mail, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo.jsx';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const items = [
    ...(isAdmin ? [['Dashboard', '/admin/dashboard', LayoutDashboard]] : []),
    ['Rooms', '/admin/rooms', DoorOpen],
    ['Bookings', '/admin/bookings', CalendarCheck],
    ['Services', '/admin/services', ConciergeBell],
    ['Messages', '/admin/messages', Mail],
    ...(isAdmin ? [['Users', '/admin/users', Users], ['Access', '/admin/access', Shield]] : []),
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
      <Icon size={19}/><span>{label}</span>
    </NavLink>)}</nav>
    <div className="admin-sidebar-bottom">
      <Link to="/" className="admin-view-site" onClick={onClose}><ExternalLink size={17}/>View Website</Link>
      <button className="admin-logout" onClick={handleLogout}><LogOut size={18}/>Logout</button>
      <div className="admin-side-foot">ATITHI · ADMINISTRATION</div>
    </div>
  </aside>;
}
