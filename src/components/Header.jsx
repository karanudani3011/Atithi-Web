import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronDown, LogOut, Menu, UserRound, X } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { supabase } from '../lib/supabaseClient.js';
import './Header.css';

const links = [
  ['Home', '/'],
  ['Rooms', '/rooms'],
  ['Booking', '/booking'],
  ['About Us', '/about'],
  ['Contact Us', '/contact'],
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [guest, setGuest] = useState(null);
  const loc = useLocation();
  const overlayRoute = loc.pathname === '/' || loc.pathname === '/home' || loc.pathname === '/rooms';
  const menuButton = useRef(null);
  const accountRef = useRef(null);
  const { user: teamUser, logout: logoutTeam } = useAdminAuth();
  const account = teamUser || guest;

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) setGuest(data.session?.user || null); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setGuest(session?.user || null));
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    const closeOutside = (event) => { if (!accountRef.current?.contains(event.target)) setAccountOpen(false); };
    const closeEscape = (event) => { if (event.key === 'Escape') setAccountOpen(false); };
    document.addEventListener('pointerdown', closeOutside);
    window.addEventListener('keydown', closeEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); window.removeEventListener('keydown', closeEscape); };
  }, [accountOpen]);

  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(overlayRoute && window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loc.pathname, overlayRoute]);

  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <header className={`header palace-header ${overlayRoute ? 'overlay-route' : 'solid-route'} ${scrolled ? 'solid' : 'transparent'} ${open ? 'menu-open' : ''}`}>
      {/* Brand: Golden house icon + ATITHI HOTEL & RESORT */}
      <Link to="/" className="brand" aria-label="Go to homepage">
        <Logo light palace />
      </Link>

      {/* Mobile Menu Toggle Button */}
      <button
        ref={menuButton}
        className="menu-toggle"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="site-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Navigation */}
      <nav id="site-navigation" className={open ? 'nav open' : 'nav'}>
        {links.map(([name, to]) => (
          <NavLink
            key={name}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `palace-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            {name}
          </NavLink>
        ))}

        {account ? (
          <div className="palace-account" ref={accountRef}>
            <button className="palace-login-btn palace-account-trigger" type="button" aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => setAccountOpen((value) => !value)}>
              <span className="palace-avatar"><UserRound size={15}/></span><span>{teamUser?.name || account.user_metadata?.name || account.email?.split('@')[0] || 'Account'}</span><ChevronDown size={14}/>
            </button>
            {accountOpen && <div className="palace-account-menu" role="menu">
              {(teamUser?.role === 'admin' || teamUser?.role === 'staff') && <Link role="menuitem" to={teamUser.role === 'admin' ? '/admin/dashboard' : '/admin/rooms'} onClick={() => { setAccountOpen(false); setOpen(false); }}>Admin Panel</Link>}
              <Link role="menuitem" to="/profile" onClick={() => { setAccountOpen(false); setOpen(false); }}>Profile</Link>
              <Link role="menuitem" to="/my-bookings" onClick={() => { setAccountOpen(false); setOpen(false); }}>My Bookings</Link>
              <button role="menuitem" type="button" onClick={async () => { setAccountOpen(false); setOpen(false); if (teamUser) await logoutTeam(); else await supabase.auth.signOut(); }}> <LogOut size={15}/>Logout</button>
            </div>}
          </div>
        ) : <Link className="palace-login-btn" to="/login" onClick={() => setOpen(false)}><span>Login</span><ArrowRight size={13} className="login-arrow" /></Link>}
      </nav>

      {open && (
        <button
          className="drawer-shade"
          aria-label="Close menu"
          onClick={() => {
            setOpen(false);
            menuButton.current?.focus();
          }}
        />
      )}
    </header>
  );
}
