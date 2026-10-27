import { useMemo } from 'react';
import TravelerAnimation from './TravelerAnimation.jsx';

export default function SplashScene({ play, done, onSkip }) {
  const stars = useMemo(() => Array.from({ length: 70 }, (_, id) => ({
    id,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 58}%`,
    delay: `${Math.random() * 3}s`,
    scale: 0.6 + Math.random() * 0.9,
  })), []);
  const windows = Array.from({ length: 6 }, (_, index) => index);
  const lamps = [
    { left: '34%', bottom: '17%' },
    { left: '44%', bottom: '10%' },
    { left: '80%', bottom: '17%' },
    { left: '89.5%', bottom: '10%' },
  ];

  return (
    <main className={`spx-stage${play ? ' spx-play' : ''}${done ? ' spx-done' : ''}`} aria-label="Atithi Hotel and Resort welcome animation">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <linearGradient id="skn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6d0ab" /><stop offset="1" stopColor="#dc9e72" /></linearGradient>
          <linearGradient id="jkt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4c243" /><stop offset="1" stopColor="#c98a18" /></linearGradient>
          <linearGradient id="pnt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2d5299" /><stop offset="1" stopColor="#17305e" /></linearGradient>
          <linearGradient id="bpk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#26396e" /><stop offset="1" stopColor="#121c3f" /></linearGradient>
          <linearGradient id="csr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#e6443d" /><stop offset="1" stopColor="#a51e1c" /></linearGradient>
          <path id="lf" d="M74 70C100 34 142 40 164 82C132 62 102 64 74 70Z" />
          <g id="palmG">
            <path d="M58 300C56 220 66 140 74 70" stroke="#4b2e1b" strokeWidth="11" fill="none" strokeLinecap="round" />
            <path d="M58 300C56 220 66 140 74 70" stroke="#2a190d" strokeWidth="11" strokeDasharray="2 12" />
            <g fill="#1d6a33">
              <use href="#lf" transform="rotate(-140 74 70)" /><use href="#lf" transform="rotate(140 74 70)" /><use href="#lf" transform="rotate(180 74 70)" />
            </g>
            <g fill="#2b8a43">
              <use href="#lf" /><use href="#lf" transform="rotate(40 74 70)" /><use href="#lf" transform="rotate(-40 74 70)" /><use href="#lf" transform="rotate(-90 74 70)" />
            </g>
          </g>
        </defs>
      </svg>

      <div className="spx-sky-stars" aria-hidden="true">
        {stars.map((star) => <i key={star.id} style={{ left: star.left, top: star.top, animationDelay: star.delay, transform: `scale(${star.scale})` }} />)}
      </div>
      <div className="spx-moon" aria-hidden="true" />
      <div className="spx-ground" aria-hidden="true" />
      {lamps.map((lamp, index) => <span className="spx-lamp" key={index} style={lamp} aria-hidden="true" />)}

      <svg className="spx-palm spx-p1" viewBox="-40 0 200 300" aria-hidden="true"><use href="#palmG" /></svg>
      <svg className="spx-palm spx-p2" viewBox="-40 0 200 300" aria-hidden="true"><use href="#palmG" /></svg>

      <div className="spx-hotel" aria-hidden="true">
        <div className="spx-roof" />
        <div className="spx-body">
          <div className="spx-row spx-r1">{windows.map((window) => <div className="spx-win" key={window} />)}</div>
          <div className="spx-row spx-r2">{windows.map((window) => <div className="spx-win" key={window} />)}</div>
          <div className="spx-band" />
          <div className="spx-big spx-l" /><div className="spx-big spx-r" />
          <div className="spx-pillar spx-l" /><div className="spx-pillar spx-r" />
        </div>
        <div className="spx-canopy" />
        <div className="spx-sign">
          <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 15 16 4l13 11M7 13v14h18V13M13 27v-8a3 3 0 0 1 6 0v8" /></svg>
          <div><b>ATITHI</b><small>HOTEL &amp; RESORT</small></div>
        </div>
        <div className="spx-door">
          <div className="spx-light" />
          <div className="spx-panel spx-l"><i /></div><div className="spx-panel spx-r"><i /></div>
        </div>
        <div className="spx-pot spx-l" /><div className="spx-pot spx-r" />
        <div className="spx-steps" /><div className="spx-carpet" />
      </div>

      <svg className="spx-palm spx-p3" viewBox="-40 0 200 300" aria-hidden="true"><use href="#palmG" /></svg>
      <div className="spx-track"><TravelerAnimation /></div>
      <div className="spx-dots" aria-hidden="true"><i /><i /><i /></div>
      <button className="spx-skip" type="button" onClick={onSkip} aria-label="Skip intro and enter website">SKIP ›</button>
    </main>
  );
}
