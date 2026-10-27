import { Link } from 'react-router-dom';
import { ArrowRight, Facebook, Instagram, Mail, MapPin, Phone, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import Logo from './Logo.jsx';
import { siteConfig } from '../data/siteConfig.js';

const JUPICAL_URL = '';

export default function Footer() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  return <footer className="footer">
    <div className="footer-main">
      <div className="footer-brand-column">
        <Logo light full />
        <p className="footer-copy">An invitation to slow down, feel at home, and be looked after.</p>
        <div className="social">
          <a href="https://www.instagram.com/" aria-label="Instagram"><Instagram /></a>
          <a href="https://www.facebook.com/" aria-label="Facebook"><Facebook /></a>
        </div>
      </div>
      <nav className="footer-explore" aria-label="Explore">
        <h4>Explore</h4>
        <ul>
          <li><Link to="/rooms">Our rooms</Link></li><li><Link to="/about">Our story</Link></li>
          <li><Link to="/contact">Contact</Link></li><li><Link to="/booking">Book a stay</Link></li>
        </ul>
      </nav>
      <div className="footer-contact">
        <h4>Contact</h4>
        <p><MapPin aria-hidden="true"/><span>{siteConfig.address}</span></p>
        <a href={`tel:${siteConfig.phone.replaceAll(' ', '')}`}><Phone aria-hidden="true"/><span>{siteConfig.phone}</span></a>
        <a href={`mailto:${siteConfig.email}`}><Mail aria-hidden="true"/><span>{siteConfig.email}</span></a>
      </div>
      <div className="footer-newsletter">
        <h4>Stay in the know</h4>
        <p>Notes on good stays, seasonal menus and little moments.</p>
        {sent ? <p className="thanks" role="status">Thank you for joining us ✨</p> : <form className="newsletter" onSubmit={event => { event.preventDefault(); if (event.currentTarget.reportValidity()) setSent(true); }}>
          <label className="sr-only" htmlFor="footer-email">Your email address</label>
          <input id="footer-email" type="email" placeholder="Your email address" value={email} onChange={event => setEmail(event.target.value)} required />
          <button type="submit" aria-label="Subscribe"><ArrowRight size={18}/></button>
        </form>}
      </div>
    </div>
    <div className="footer-bottom">
      <div className="footer-credits">
        <span>© {new Date().getFullYear()} Atithi Hotel. All rights reserved.</span>
        <span className="footer-credit-line">
          Crafted by :{' '}
          {JUPICAL_URL ? <a href={JUPICAL_URL} target="_blank" rel="noopener noreferrer">Jupical Technologies Pvt. Ltd.</a> : <strong>Jupical Technologies Pvt. Ltd.</strong>}
        </span>
      </div>
      <span className="footer-blessing">अतिथि देवो भव · अतिथि भगवान है</span>
      <button type="button" className="footer-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"><ArrowUp size={17}/></button>
    </div>
  </footer>;
}
