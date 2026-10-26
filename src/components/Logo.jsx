import React from 'react';

/**
 * Atithi Logo Component
 * Luxury branding matching the reference design:
 * Golden house & arch insignia with refined "ATITHI" serif wordmark and "HOTEL & RESORT" subtitle.
 */
export default function Logo({ light = false, full = false, palace = true }) {
  const textColor = light ? '#ffffff' : '#14213d';
  const goldColor = '#e2bf73';

  if (palace) {
    return (
      <div className="logo logo-palace" aria-label="Atithi Hotel & Resort">
        <svg
          className="logo-icon-svg"
          viewBox="0 0 44 42"
          width="40"
          height="38"
          aria-hidden="true"
        >
          {/* Outer golden roof chevron */}
          <path
            d="M5 18 L22 4 L39 18"
            fill="none"
            stroke={goldColor}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Main house body */}
          <path
            d="M9 18 V37 H35 V18"
            fill="none"
            stroke={goldColor}
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Royal Arched Doorway */}
          <path
            d="M17 37 V23 Q22 17 27 23 V37 Z"
            fill={goldColor}
          />
          {/* White door handle knob */}
          <circle cx="24.5" cy="27.5" r="1.3" fill="#ffffff" />
        </svg>

        <div className="logo-text-block">
          <span className="logo-wordmark-palace" style={{ color: textColor }}>
            ATITHI
          </span>
          <span className="logo-subtitle-palace" style={{ color: goldColor }}>
            HOTEL & RESORT
          </span>
        </div>
      </div>
    );
  }

  // Classic logo fallback
  const color = light ? '#fbf6ec' : '#14213d';
  return (
    <div className={`logo ${full ? 'logo-full' : ''}`}>
      <svg viewBox="0 0 64 62" aria-hidden="true" width="39" height="42">
        <path d="M8 27 32 7l24 20" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 27v27h34V27M23 54V39a9 9 0 0 1 18 0v15" fill="none" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M27 53V40a5 5 0 0 1 10 0v13" fill="#c9954a" />
        <circle cx="34" cy="41" r="1.3" fill="#fff" />
      </svg>
      <span className="wordmark" style={{ color }}>atithi</span>
      {full && (
        <>
          <span className="logo-tag">BETTER STAYS. HAPPIER GUESTS.</span>
          <span className="logo-dev">अतिथि देवो भव</span>
        </>
      )}
    </div>
  );
}
