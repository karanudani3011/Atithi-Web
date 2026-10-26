import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function PalaceHero() {
  const [, setSlideIndex] = useState(0);

  // Manual slider arrow controls (preserved functionality without rotating image)
  const prevSlide = () => {
    setSlideIndex((prev) => (prev - 1 + 2) % 2);
  };

  const nextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % 2);
  };

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

        {/* ── Hero Slider Controls (Bottom-Right Circular Buttons) ── */}
        <div className="palace-slider-controls" aria-label="Hero slider navigation">
          <button
            type="button"
            className="palace-slider-btn"
            onClick={prevSlide}
            aria-label="Previous view"
            title="Previous view"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            className="palace-slider-btn"
            onClick={nextSlide}
            aria-label="Next view"
            title="Next view"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
