import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Header.css';

const links = [
  { label: 'Home', hoverLabel: 'Home', path: '/' },
  { label: 'Rooms', hoverLabel: 'Stay', path: '/rooms' },
  { label: 'Booking', hoverLabel: 'Reserve', path: '/booking' },
  { label: 'My Bookings', hoverLabel: 'My trips', path: '/my-bookings' },
  { label: 'About Us', hoverLabel: 'Our story', path: '/about' },
  { label: 'Contact Us', hoverLabel: 'Say hello', path: '/contact' },
];

function HouseMark() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    <path d="M4 19L20 5l16 14M8 17v17h24V17" />
    <path d="M16 34V24a4 4 0 018 0v10" />
  </svg>;
}

function LoginContents({ label = 'Login / Register' }) {
  return <>
    <span className="av"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.5 4.5-6 8-6s7 1.5 8 6" /></svg></span>
    {label}
    <svg className="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6" /></svg>
  </>;
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { user, logout } = useAuth();
  const pillRef = useRef(null);
  const linkItemRefs = useRef([]);
  const mobileMenuRef = useRef(null);
  const burgerRef = useRef(null);

  const userName = user?.name || user?.email?.split('@')[0] || 'Account';

  async function handleLogout() {
    try { await logout(); navigate('/'); }
    catch (error) { console.error('[auth] sign out failed', error); }
  }

  const activeIndex = Math.max(0, links.findIndex(({ path }) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }));

  // Position the capsule pill against a list item, using the original item offsets.
  const movePill = (item) => {
    if (!item || !pillRef.current) return;
    pillRef.current.style.left = `${item.offsetLeft}px`;
    pillRef.current.style.width = `${item.offsetWidth}px`;
  };
  const moveToActive = () => movePill(linkItemRefs.current[activeIndex]);

  // Keep the gold pill aligned after route, viewport, and font layout changes.
  useLayoutEffect(() => {
    let mounted = true;
    const recalculate = () => { if (mounted) moveToActive(); };
    recalculate();
    window.addEventListener('resize', recalculate);
    document.fonts?.ready?.then(recalculate);
    return () => {
      mounted = false;
      window.removeEventListener('resize', recalculate);
    };
  }, [location.pathname, activeIndex]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOutside = event => {
      if (!mobileMenuRef.current?.contains(event.target) && !burgerRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = event => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('pointerdown', closeOutside);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  // Update the thin progress bar while scrolling and remove its listener on unmount.
  useEffect(() => {
    const updateProgress = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return <header className="atithi-header">
    <NavLink className="logo" to="/" aria-label="Atithi Hotel & Resort home">
      <HouseMark />
      <div>ATITHI<small>HOTEL &amp; RESORT</small></div>
    </NavLink>

    <nav className="desktop-nav" aria-label="Main navigation">
      <ul onMouseLeave={moveToActive}>
        <i className="pill" ref={pillRef} aria-hidden="true" />
        {links.map(({ label, hoverLabel, path }, index) => (
          <li key={path} ref={(node) => { linkItemRefs.current[index] = node; }} onMouseEnter={(event) => movePill(event.currentTarget)}>
            <NavLink to={path} end={path === '/' && location.pathname !== '/home'}>
              <span className="roll"><span>{label}</span><span>{hoverLabel}</span></span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>

    {user?.isLoggedIn ? <div className="header-account desktop-account">{user.role === 'admin' ? <NavLink className="header-account-name" to="/admin">Admin Panel</NavLink> : <span className="header-account-name" title={userName}>{userName}</span>}<button type="button" className="login" onClick={handleLogout}>Logout</button></div>
      : <NavLink className="login desktop-login" to="/login" aria-label="Login or register"><LoginContents /></NavLink>}

    <button ref={burgerRef} className={`burger${menuOpen ? ' open' : ''}`} type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="atithi-mobile-menu" onClick={() => setMenuOpen((open) => !open)}>
      <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
    </button>

    {menuOpen && <button className="mobile-shade" type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />}
    <nav ref={mobileMenuRef} className={`mobile${menuOpen ? ' open' : ''}`} id="atithi-mobile-menu" aria-label="Mobile navigation" aria-hidden={!menuOpen}>
      {links.map(({ label, path }) => (
        <NavLink key={path} to={path} end={path === '/' && location.pathname !== '/home'} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'on' : undefined}>{label}</NavLink>
      ))}
      {user?.isLoggedIn ? <div className="mobile-account">{user.role === 'admin' ? <NavLink to="/admin" onClick={() => setMenuOpen(false)}>Admin Panel</NavLink> : <span>{userName}</span>}<button type="button" className="login" onClick={() => { setMenuOpen(false); handleLogout(); }}>Logout</button></div>
        : <NavLink className="login" to="/login" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)} aria-label="Login or register"><LoginContents /></NavLink>}
    </nav>

    <div className="header-progress" aria-hidden="true" style={{ width: `${scrollProgress}%` }} />
  </header>;
}
