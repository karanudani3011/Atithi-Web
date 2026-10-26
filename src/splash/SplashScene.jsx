import React, { useCallback, useEffect, useRef, useState } from 'react';
import Logo from '../components/Logo.jsx';
import TravelerAnimation from './TravelerAnimation.jsx';

/**
 * SplashScene
 * Cinematic, premium luxury hotel welcome animation for Atithi Hotel.
 *
 * Sequence:
 *  0.0s – 1.0s: Scene fades in (night sky, glowing moon, sunset horizon, luxury hotel, palm trees, red carpet)
 *  1.0s – 16.5s: Boy with red suitcase walks slowly & naturally across scene (~15.5s travel)
 *  16.5s – 17.5s: Boy pauses at hotel entrance
 *  17.5s – 18.5s: Grand glass doors slowly open with warm golden hospitality glow spilling out
 *  18.5s – 19.8s: Boy steps forward into the entrance doorway and seamlessly vanishes inside
 *  19.8s – 21.0s: Doors settle, warm golden light pulses, Atithi seal & tagline illuminate
 *  21.2s: Smooth dissolve into homepage
 */
export default function SplashScene({ onFinish }) {
  const [phase, setPhase] = useState('scene'); // 'scene' | 'walk' | 'pause' | 'entering' | 'entered'
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [sceneOpacity, setSceneOpacity] = useState(0);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [travelerX, setTravelerX] = useState(-10); // in %

  const rafRef = useRef(null);
  const startRef = useRef(null);
  const isFinishedRef = useRef(false);

  const finish = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setFlashOpacity(1);
    setTimeout(() => {
      onFinish?.();
    }, 650);
  }, [onFinish]);

  useEffect(() => {
    // Accessibility: Respect prefers-reduced-motion
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      setSceneOpacity(1);
      setLogoVisible(true);
      const timer = setTimeout(finish, 1800);
      return () => clearTimeout(timer);
    }

    let currentPhase = 'scene';

    const tick = (now) => {
      if (!startRef.current) startRef.current = now;
      const t = (now - startRef.current) / 1000; // elapsed time in seconds

      // 1. Initial Scene fade-in (0.0s -> 0.8s)
      if (t < 0.8) {
        setSceneOpacity(Math.min(1, t / 0.7));
      } else {
        setSceneOpacity(1);
      }

      // 2. Walking phase (0.8s -> 10.4s = 9.6s duration, brisk & natural travel)
      if (t >= 0.8 && t < 10.4) {
        if (currentPhase !== 'walk') {
          currentPhase = 'walk';
          setPhase('walk');
        }

        const rawProgress = (t - 0.8) / 9.6; // 0 to 1 over 9.6s
        // Smooth linear travel across middle with gentle ease-in & natural ease-out deceleration into stopping position
        let eased;
        if (rawProgress <= 0.1) {
          const p = rawProgress / 0.1;
          eased = 0.1 * 0.5 * (p * p);
        } else if (rawProgress >= 0.88) {
          const p = (rawProgress - 0.88) / 0.12;
          // Smooth deceleration into stopping position: 1 - (1-p)^2
          eased = 0.88 + 0.12 * (1 - Math.pow(1 - p, 2));
        } else {
          const p = (rawProgress - 0.1) / 0.78;
          eased = 0.05 + p * 0.83;
        }

        const clamped = Math.max(0, Math.min(1, eased));
        // Move from offscreen left (-10%) smoothly to entrance threshold (63.5%)
        const newX = -10 + clamped * 73.5;
        setTravelerX(newX);
      }

      // 3. Arrive and pause at entrance (10.4s -> 11.4s)
      if (t >= 10.4 && t < 11.4) {
        if (currentPhase !== 'pause') {
          currentPhase = 'pause';
          setPhase('pause');
          setTravelerX(63.5);
        }
      }

      // 4. Doors slowly open (11.4s -> 12.4s)
      if (t >= 11.4 && t < 12.4) {
        if (!doorsOpen) {
          setDoorsOpen(true);
        }
      }

      // 5. Boy walks inside hotel entrance (12.4s -> 13.6s)
      if (t >= 12.4 && t < 13.6) {
        if (currentPhase !== 'entering') {
          currentPhase = 'entering';
          setPhase('entering');
        }
        // Moves forward from 63.5% slightly deeper into lobby (66%)
        const enterProgress = (t - 12.4) / 1.2;
        setTravelerX(63.5 + enterProgress * 2.5);
      }

      // 6. Boy fully entered & hidden, logo overlay appears (13.6s -> 14.8s)
      if (t >= 13.6 && t < 14.8) {
        if (currentPhase !== 'entered') {
          currentPhase = 'entered';
          setPhase('entered');
        }
        if (!logoVisible) {
          setLogoVisible(true);
        }
      }

      // 7. Transition to homepage (15.0s)
      if (t >= 15.0) {
        finish();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [finish, doorsOpen, logoVisible]);

  return (
    <div
      className="splash-scene-root"
      aria-hidden="true"
      style={{ opacity: sceneOpacity }}
    >
      {/* ━━━━━━━━ 1. SKY & CELESTIAL LAYER ━━━━━━━━ */}
      <div className="ss-sky">
        {/* Deep twilight gradients */}
        <div className="ss-sky-gradient" />

        {/* Luminous Moon with atmospheric corona glow */}
        <div className="ss-moon-wrapper">
          <div className="ss-moon">
            <div className="ss-moon-craters" />
            <div className="ss-moon-corona" />
          </div>
        </div>

        {/* Twinkling Night Stars */}
        <div className="ss-stars">
          {Array.from({ length: 48 }, (_, i) => (
            <span
              key={i}
              className="ss-star"
              style={{
                left: `${(i * 67 + 13) % 100}%`,
                top: `${(i * 31 + 7) % 45}%`,
                width: `${1.2 + (i % 3) * 0.9}px`,
                height: `${1.2 + (i % 3) * 0.9}px`,
                animationDelay: `${(i * 0.23) % 4}s`,
                animationDuration: `${2.0 + (i % 5) * 0.6}s`,
                opacity: 0.2 + (i % 4) * 0.22,
              }}
            />
          ))}
        </div>

        {/* Warm sunset horizon glow overlay */}
        <div className="ss-horizon-glow" />

        {/* Distant palm silhouettes on horizon */}
        <div className="ss-horizon-silhouette" />
      </div>

      {/* ━━━━━━━━ 2. GROUND & DRIVEWAY LAYER ━━━━━━━━ */}
      <div className="ss-ground">
        {/* Dark polished forecourt surface */}
        <div className="ss-driveway" />

        {/* Subtle driveway paving lines */}
        <div className="ss-driveway-paving" />

        {/* Grand Red Entrance Carpet with Gold Piping */}
        <div className="ss-carpet-container">
          <div className="ss-carpet">
            <div className="ss-carpet-gold-edge-left" />
            <div className="ss-carpet-gold-edge-right" />
            <div className="ss-carpet-center-sheen" />
          </div>
        </div>

        {/* Entrance Walkway Bollard Lights */}
        <div className="ss-bollard ss-bollard-1" />
        <div className="ss-bollard ss-bollard-2" />
        <div className="ss-bollard ss-bollard-3" />
        <div className="ss-bollard ss-bollard-4" />
      </div>

      {/* ━━━━━━━━ 3. LUXURY PALM TREES ━━━━━━━━ */}
      <div className="ss-palm-wrap ss-palm-left">
        <LuxuryPalmTree scale={1.15} />
      </div>
      <div className="ss-palm-wrap ss-palm-mid-left">
        <LuxuryPalmTree scale={0.78} flip />
      </div>
      <div className="ss-palm-wrap ss-palm-right">
        <LuxuryPalmTree scale={1.05} flip />
      </div>

      {/* ━━━━━━━━ 4. LUXURY ATITHI HOTEL EXTERIOR ━━━━━━━━ */}
      <div className="ss-hotel">
        {/* Main Building Facade Structure */}
        <div className="ss-hotel-facade">

          {/* Roof Cornice with Warm Architectural Uplighting */}
          <div className="ss-hotel-roof">
            <div className="ss-roof-parapet" />
            <div className="ss-roof-lights">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="ss-roof-spot" />
              ))}
            </div>
          </div>

          {/* Upper Floor Balconies & Illuminated Suites */}
          <div className="ss-upper-suites">
            {/* Suite Windows Grid */}
            <div className="ss-suites-grid">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="ss-suite-bay">
                  <div className="ss-suite-window">
                    <div className="ss-window-curtains" />
                    <div className="ss-window-warmth" style={{ animationDelay: `${i * 0.15}s` }} />
                  </div>
                  <div className="ss-suite-balcony-railing">
                    <div className="ss-railing-bar" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mid Cornice / Belt Course */}
          <div className="ss-mid-cornice" />

          {/* Grand Central Entrance Portico */}
          <div className="ss-portico">
            {/* Grand ATITHI HOTEL Signboard */}
            <div className="ss-hotel-signboard">
              <div className="ss-signboard-frame">
                {/* Atithi Arch Insignia */}
                <svg className="ss-sign-arch" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path
                    d="M3 11 L12 4 L21 11"
                    fill="none"
                    stroke="#e2bf73"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 11 V20 H18 V11"
                    fill="none"
                    stroke="#e2bf73"
                    strokeWidth="2"
                  />
                  <path
                    d="M9 20 V14 Q12 12 15 14 V20"
                    fill="#e2bf73"
                  />
                </svg>

                <div className="ss-sign-text-group">
                  <span className="ss-sign-title">ATITHI</span>
                  <span className="ss-sign-subtitle">HOTEL & RESORT</span>
                </div>
              </div>
              <div className="ss-sign-halo" />
            </div>

            {/* Portico Canopy with Recessed Downlights */}
            <div className="ss-portico-canopy">
              <div className="ss-downlight ss-downlight-1" />
              <div className="ss-downlight ss-downlight-2" />
              <div className="ss-downlight ss-downlight-3" />
            </div>

            {/* Architectural Columns Flanking Entrance */}
            <div className="ss-column ss-column-left">
              <div className="ss-column-capital" />
              <div className="ss-column-shaft" />
              <div className="ss-column-base" />
            </div>
            <div className="ss-column ss-column-right">
              <div className="ss-column-capital" />
              <div className="ss-column-shaft" />
              <div className="ss-column-base" />
            </div>

            {/* Potted Luxury Palms beside Columns */}
            <div className="ss-planter ss-planter-left">
              <PottedPlant />
            </div>
            <div className="ss-planter ss-planter-right">
              <PottedPlant />
            </div>

            {/* Grand Glass Double Doors & Lobby Portal */}
            <div className="ss-entrance-portal">
              {/* Warm illuminated lobby interior visible through glass */}
              <div className="ss-lobby-interior">
                <div className="ss-lobby-chandelier" />
                <div className="ss-lobby-glow" />
                <div className="ss-lobby-marble-floor" />
              </div>

              {/* Doors Frame */}
              <div className="ss-doors-frame">
                {/* Left Glass Door */}
                <div
                  className={`ss-glass-door ss-door-left ${doorsOpen ? 'is-open' : ''}`}
                >
                  <div className="ss-door-glass-pane" />
                  <div className="ss-door-gold-handle" />
                </div>

                {/* Right Glass Door */}
                <div
                  className={`ss-glass-door ss-door-right ${doorsOpen ? 'is-open' : ''}`}
                >
                  <div className="ss-door-glass-pane" />
                  <div className="ss-door-gold-handle" />
                </div>

                {/* Warm Golden Beam spilling onto carpet when doors open */}
                <div className={`ss-doorway-light-beam ${doorsOpen ? 'is-active' : ''}`} />
              </div>

              {/* Entrance Marble Steps */}
              <div className="ss-steps-stack">
                <div className="ss-step ss-step-top" />
                <div className="ss-step ss-step-mid" />
                <div className="ss-step ss-step-bottom" />
              </div>
            </div>

          </div>

          {/* Ground Floor Windows & Wall Sconces */}
          <div className="ss-ground-flank ss-flank-left">
            <div className="ss-flank-window" />
            <div className="ss-wall-sconce" />
          </div>
          <div className="ss-ground-flank ss-flank-right">
            <div className="ss-flank-window" />
            <div className="ss-wall-sconce" />
          </div>

        </div>

        {/* Ambient Building Backlight & Warm Ground Reflection */}
        <div className="ss-hotel-ambient-glow" />
      </div>

      {/* ━━━━━━━━ 5. SEPARATE ANIMATED TRAVELER LAYER ━━━━━━━━ */}
      {(phase === 'walk' || phase === 'pause' || phase === 'entering') && (
        <div
          className="ss-traveler-layer"
          style={{
            left: `${travelerX}%`,
            transition: phase === 'pause' ? 'none' : undefined,
          }}
        >
          <TravelerAnimation phase={phase} />
        </div>
      )}

      {/* ━━━━━━━━ 6. ELEGANT ATITHI BRAND OVERLAY ━━━━━━━━ */}
      <div className={`ss-brand-reveal ${logoVisible ? 'is-visible' : ''}`}>
        <div className="ss-brand-card">
          <Logo full />
          <h2 className="ss-deva-motto">अतिथि देवो भव</h2>
          <p className="ss-luxury-tagline">A Welcome Beyond Compare</p>
        </div>
      </div>

      {/* ━━━━━━━━ 7. SMOOTH TRANSITION FLASH ━━━━━━━━ */}
      <div
        className="ss-transition-flash"
        style={{
          opacity: flashOpacity,
          pointerEvents: flashOpacity > 0 ? 'auto' : 'none',
        }}
      />
    </div>
  );
}

/* ── SVG Luxury Royal Palm Tree Sub-component ── */
function LuxuryPalmTree({ scale = 1, flip = false }) {
  return (
    <svg
      viewBox="0 0 100 240"
      width={100 * scale}
      height={240 * scale}
      aria-hidden="true"
      className="ss-palm-tree-svg"
      style={{
        transform: flip ? 'scaleX(-1)' : 'none',
      }}
    >
      {/* Curved Textured Trunk */}
      <path
        d="M48 238 Q42 160 52 100 Q56 60 50 25"
        stroke="#422c1b"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M48 238 Q42 160 52 100 Q56 60 50 25"
        stroke="#5a3d24"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bark rings */}
      {[50, 80, 110, 140, 170, 200].map((y, idx) => (
        <ellipse
          key={idx}
          cx={46 + (y < 120 ? 5 : 0)}
          cy={y}
          rx="5.5"
          ry="1.8"
          fill="#311d0f"
          opacity="0.8"
        />
      ))}

      {/* Lush Tropical Fronds */}
      <g className="ss-palm-fronds">
        {/* Crown base */}
        <circle cx="50" cy="24" r="5" fill="#2d4a1d" />

        {/* Arching Fronds */}
        <path d="M50 24 Q30 5 -10 18" stroke="#1c3e1c" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M50 24 Q30 5 -10 18" stroke="#2e682e" strokeWidth="3.5" strokeLinecap="round" fill="none" />

        <path d="M50 24 Q35 -15 15 -25" stroke="#1c3e1c" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        <path d="M50 24 Q35 -15 15 -25" stroke="#377e37" strokeWidth="3.2" strokeLinecap="round" fill="none" />

        <path d="M50 24 Q50 -25 55 -32" stroke="#1c3e1c" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M50 24 Q50 -25 55 -32" stroke="#419341" strokeWidth="3" strokeLinecap="round" fill="none" />

        <path d="M50 24 Q70 -12 92 -18" stroke="#1c3e1c" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        <path d="M50 24 Q70 -12 92 -18" stroke="#377e37" strokeWidth="3.2" strokeLinecap="round" fill="none" />

        <path d="M50 24 Q80 8 115 22" stroke="#1c3e1c" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M50 24 Q80 8 115 22" stroke="#2e682e" strokeWidth="3.5" strokeLinecap="round" fill="none" />

        <path d="M50 24 Q75 35 105 48" stroke="#1c3e1c" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M50 24 Q75 35 105 48" stroke="#285928" strokeWidth="3" strokeLinecap="round" fill="none" />

        <path d="M50 24 Q25 35 -5 45" stroke="#1c3e1c" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M50 24 Q25 35 -5 45" stroke="#285928" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Coconuts cluster */}
        <circle cx="46" cy="30" r="4.2" fill="#6d4827" />
        <circle cx="53" cy="31" r="4.5" fill="#583719" />
        <circle cx="49" cy="34" r="4.0" fill="#75502c" />
      </g>
    </svg>
  );
}

/* ── Potted Planter Sub-component ── */
function PottedPlant() {
  return (
    <svg viewBox="0 0 32 44" width="28" height="38" aria-hidden="true">
      {/* Terracotta/Brass Planter Urn */}
      <path d="M6 24 L8 42 H24 L26 24 Z" fill="#b45309" stroke="#78350f" strokeWidth="1" />
      <rect x="5" y="22" width="22" height="4" rx="2" fill="#d97706" />
      {/* Green foliage */}
      <ellipse cx="16" cy="18" rx="12" ry="9" fill="#15803d" />
      <ellipse cx="16" cy="13" rx="9" ry="7" fill="#16a34a" />
      <ellipse cx="16" cy="8" rx="6" ry="5" fill="#22c55e" />
    </svg>
  );
}
