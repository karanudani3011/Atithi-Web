import {Menu} from 'lucide-react';import {useLocation} from 'react-router-dom';import {useAdminAuth} from '../context/AdminAuthContext.jsx';
const titles={dashboard:'Dashboard',users:'Users',rooms:'Rooms',bookings:'Bookings',services:'Services',messages:'Messages',access:'Access'};
export default function Topbar({onMenu}){const {user}=useAdminAuth(),location=useLocation(),title=titles[location.pathname.split('/').pop()]||'Atithi Admin';return <header className="admin-topbar"><button className="admin-mobile-menu" aria-label="Open admin menu" onClick={onMenu}><Menu/></button><strong className="admin-topbar-title">{title}</strong><div className="admin-topbar-spacer"/><div className="admin-user"><div className="admin-avatar">{user?.name?.slice(0,1).toUpperCase()||'A'}</div><div className="admin-user-meta"><strong>{user?.name}</strong><span className={`admin-role ${user?.role==='admin'?'super':''}`}>{user?.role==='admin'?'Admin':'Staff'}</span></div></div></header>}



