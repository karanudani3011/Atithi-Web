import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';

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
  const loc = useLocation();
  const menuButton = useRef(null);

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loc.pathname]);

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
    <header className={`header palace-header ${scrolled ? 'solid' : 'transparent'} ${open ? 'menu-open' : ''}`}>
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

        {/* Login Pill Button with fine gold border */}
        <Link
          className="palace-login-btn"
          to="/login"
          onClick={() => setOpen(false)}
        >
          <span>Login</span>
          <ArrowRight size={12} className="login-arrow" />
        </Link>
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
