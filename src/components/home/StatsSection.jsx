import { useEffect, useMemo, useRef, useState } from 'react';
import './StatsSection.css';

const stats = [
  { icon: 'star', value: 25, suffix: '+', label: 'Years of hospitality' },
  { icon: 'bed', value: 150, suffix: '', label: 'Beautiful rooms' },
  { icon: 'guests', value: 50000, suffix: '+', label: 'Happy guests' },
  { icon: 'heart', value: 98, suffix: '%', label: 'Guest satisfaction', ring: true },
];

function StatIcon({ name }) {
  const paths = {
    star: <path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9L3.5 9.2l5.9-.8z" />,
    bed: <path d="M3 18v-7a2 2 0 012-2h14a2 2 0 012 2v7M3 18h18M3 14h18M7 9V6h4v3" />,
    guests: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-4 3.5-5.5 6.5-5.5s5.7 1.5 6.5 5.5M16 5a3.5 3.5 0 010 6.5M18 14.8c2 .7 3.2 2.3 3.5 5.2" /></>,
    heart: <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function StatTile({ stat }) {
  const tileRef = useRef(null);
  const frameRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [count, setCount] = useState(0);

  // Observe each tile once and disconnect immediately after it enters view.
  useEffect(() => {
    const tile = tileRef.current;
    if (!tile) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(tile);
    return () => observer.disconnect();
  }, []);

  // RAF cleanup keeps the count-up safe when React StrictMode replays effects.
  useEffect(() => {
    if (!inView) return undefined;
    const started = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - started) / 2000, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(stat.value * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [inView, stat.value]);

  return <div className={`st-tile${inView ? ' in' : ''}`} ref={tileRef}>
    {stat.ring && <svg className="st-ring" viewBox="0 0 46 46" aria-hidden="true"><circle className="bg" cx="23" cy="23" r="18" /><circle className="fg" cx="23" cy="23" r="18" /></svg>}
    <div className="st-ico"><StatIcon name={stat.icon} /></div>
    <div className="st-num">{count.toLocaleString('en-IN')}{count === stat.value ? stat.suffix : ''}</div>
    <div className="st-lbl">{stat.label}</div><div className="st-bar" />
  </div>;
}

export default function StatsSection() {
  const dots = useMemo(() => Array.from({ length: 35 }, (_, id) => ({
    id,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 4}s`,
  })), []);

  return <section className="st-section" id="stats">
    <div className="st-blob a" aria-hidden="true" /><div className="st-blob b" aria-hidden="true" />
    {dots.map((dot) => <i className="st-dot" key={dot.id} style={{ left: dot.left, top: dot.top, animationDelay: dot.delay }} aria-hidden="true" />)}
    <div className="st-head">
      <div className="st-eyebrow">ATITHI IN NUMBERS</div>
      <h2>A home that guests <em>keep coming back to</em></h2>
    </div>
    <div className="st-grid">{stats.map((stat) => <StatTile key={stat.label} stat={stat} />)}</div>
  </section>;
}
