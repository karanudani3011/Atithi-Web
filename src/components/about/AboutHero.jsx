import { useEffect, useRef } from 'react';

export default function AboutHero() {
  return <div className="ab-hero-card ab-rv">
    <div className="ab-ring ab-r4" /><div className="ab-ring ab-r3" /><div className="ab-ring ab-r2" /><div className="ab-ring ab-r1" />
    <div className="ab-ripple" /><div className="ab-ripple" /><div className="ab-ripple" />
    <span className="ab-sp" style={{ left: '14%', top: '30%' }} /><span className="ab-sp" style={{ left: '82%', top: '26%', animationDelay: '-1s' }} />
    <span className="ab-sp" style={{ left: '12%', top: '66%', animationDelay: '-2s', width: 5, height: 5 }} /><span className="ab-sp" style={{ left: '90%', top: '56%', animationDelay: '-.5s' }} />
    <span className="ab-sp" style={{ left: '26%', top: '76%', animationDelay: '-3s', width: 5, height: 5 }} /><span className="ab-sp" style={{ left: '48%', top: '12%', animationDelay: '-1.6s', width: 5, height: 5 }} />
    <div className="ab-core"><svg className="ab-i" viewBox="0 0 24 24" style={{ fill: 'currentColor', stroke: 'none' }}><path d="M4 21V9a1 1 0 0 1 1-1h5V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17z"/><g fill="#2d4259"><rect x="12" y="6" width="1.8" height="1.8"/><rect x="15" y="6" width="1.8" height="1.8"/><rect x="12" y="9.5" width="1.8" height="1.8"/><rect x="15" y="9.5" width="1.8" height="1.8"/><rect x="12" y="13" width="1.8" height="1.8"/><rect x="15" y="13" width="1.8" height="1.8"/><rect x="6" y="11" width="1.8" height="1.8"/><rect x="6" y="14.5" width="1.8" height="1.8"/><rect x="9" y="11" width="1.8" height="1.8"/><rect x="9" y="14.5" width="1.8" height="1.8"/></g></svg></div>
    <div className="ab-cap"><span>A refined stay, warmly remembered</span></div>
  </div>;
}

export function AboutStats() {
  const statsRef = useRef(null);
  useEffect(() => {
    const values = statsRef.current?.querySelectorAll('[data-n]');
    if (!values?.length) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      values.forEach((element) => { element.textContent = Number(element.dataset.n).toFixed(Number(element.dataset.d || 0)); });
      return undefined;
    }
    const frames = [];
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const n = Number(element.dataset.n);
      const decimals = Number(element.dataset.d || 0);
      const start = performance.now();
      let frame;
      const tick = (now) => {
        const progress = Math.min((now - start) / 1600, 1);
        element.textContent = (n * (1 - Math.pow(1 - progress, 4))).toFixed(decimals);
        if (progress < 1) {
          frame = requestAnimationFrame(tick);
          frames.push(frame);
        }
      };
      frame = requestAnimationFrame(tick);
      frames.push(frame);
      observer.unobserve(element);
    }), { threshold: 0.6 });
    values.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      frames.forEach((frame) => cancelAnimationFrame(frame));
    };
  }, []);

  return <div className="ab-stats" ref={statsRef}>
    <div className="ab-stat ab-rv ab-d2"><b><span data-n="8">0</span>+</b><span>Rooms</span></div>
    <div className="ab-stat ab-rv ab-d3"><b>24/7</b><span>Support</span></div>
    <div className="ab-stat ab-rv ab-d4"><b><span data-n="4.6" data-d="1">0.0</span>★</b><span>Rating</span></div>
  </div>;
}
