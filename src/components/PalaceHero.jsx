import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';

export default function PalaceHero() {
  return (
    <section className="palace-hero-section" aria-label="Atithi Luxury Palace Hero">
      {/* ── Background Palace Visual Layer (Fixed Hotel Image) ── */}
      <div className="palace-hero-bg-container">
        <div
          className="palace-hero-slide is-active"
          style={{ backgroundImage: `url('/palace-hero.jpg')` }}
          role="img"
          aria-label="Atithi Luxury Palace & Resort"
        />

        {/* Cinematic Dusk Overlays: Deep navy-blue twilight gradient across left for text readability */}
        <div className="palace-overlay-left" />
        <div className="palace-overlay-bottom" />
        <div className="palace-overlay-top" />
        <div className="palace-overlay-vignette" />
      </div>

      {/* ── Main Left-Side Hero Content ── */}
      <div className="palace-hero-container">
        <div className="palace-hero-content">
          {/* Small Gold Outlined Badge */}
          <div className="palace-gold-badge" role="text">
            <span className="badge-star" aria-hidden="true">✦</span>
            <span className="badge-text">PREMIUM STAY · LUXURY HOTEL & RESORT</span>
          </div>

          {/* Main Headline in Large Royal Serif Typography */}
          <h1 className="palace-main-title">
            Experience Royal<br />
            Comfort at <em className="palace-title-italic">Atithi</em>
          </h1>

          {/* Supporting Description */}
          <p className="palace-main-desc">
            Indulge in a perfect blend of luxury, tradition and modern amenities.
            Your dream getaway awaits at Atithi Hotel & Resort — where every stay feels special.
          </p>

          {/* Two CTA Buttons */}
          <div className="palace-cta-row">
            <Link
              to="/booking"
              className="palace-btn-gold"
              aria-label="Book your stay at Atithi Hotel"
            >
              <Calendar size={18} className="btn-icon" />
              <span>Book Your Stay</span>
              <ArrowRight size={17} className="btn-arrow" />
            </Link>

            <Link
              to="/rooms"
              className="palace-btn-outline"
              aria-label="Explore hotel rooms and luxury suites"
            >
              <span>Explore Rooms</span>
              <ArrowRight size={17} className="btn-arrow" />
            </Link>
          </div>

          {/* Guest Rating & Social Proof */}
          <div className="palace-proof-box">
            <div className="palace-stars" aria-label="5 out of 5 stars">
              ★★★★★
            </div>
            <span className="palace-proof-label">
              4.9 / 5 from 2,400+ happy guests
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
