import { useEffect, useState } from 'react';

export default function BellboyGuide({ services, active, boyRef }) {
  const [walking, setWalking] = useState(false);
  const [swapping, setSwapping] = useState(false);
  useEffect(() => {
    setWalking(true);
    const walkTimer = window.setTimeout(() => setWalking(false), 950);
    setSwapping(true);
    const sayTimer = window.setTimeout(() => setSwapping(false), 250);
    return () => { window.clearTimeout(walkTimer); window.clearTimeout(sayTimer); };
  }, [active]);

  return <div className="ab-guide" id="ab-guide">
    <div className={`ab-boy${walking ? ' ab-walking' : ''}${active >= 3 ? ' ab-flip' : ''}`} id="ab-boy" ref={boyRef}>
      <div className={`ab-say${swapping ? ' ab-swap' : ''}`} id="ab-say"><span>{services[active].bubble}</span></div>
      <svg viewBox="0 0 200 300" aria-hidden="true">
        <ellipse cx="100" cy="294" rx="54" ry="6" fill="#0d214920" />
        <g className="ab-bob">
          <g className="ab-lL"><rect x="72" y="208" width="28" height="74" rx="9" fill="#0a1a3b" /><rect x="72" y="208" width="4" height="74" fill="#d6ad55" /><ellipse cx="82" cy="287" rx="19" ry="8" fill="#161616" /></g>
          <g className="ab-lR"><rect x="100" y="208" width="28" height="74" rx="9" fill="#0a1a3b" /><rect x="124" y="208" width="4" height="74" fill="#d6ad55" /><ellipse cx="118" cy="287" rx="19" ry="8" fill="#161616" /></g>

          {/* Far arm holds the active service's matching item. */}
          <path d="M134 132 L152 188" stroke="#10244f" strokeWidth="22" strokeLinecap="round" />
          <path d="M152 188 L158 160" stroke="#10244f" strokeWidth="20" strokeLinecap="round" />
          <circle cx="158" cy="152" r="11" fill="#d9a273" />

          <g data-k="0" className={`ab-item${active === 0 ? ' ab-on' : ''}`}>
            <line x1="158" y1="160" x2="160" y2="84" stroke="#8a5a2b" strokeWidth="5" strokeLinecap="round" />
            <g fill="#e8c987"><ellipse cx="160" cy="68" rx="9" ry="17" /><ellipse cx="148" cy="75" rx="8" ry="14" transform="rotate(-25 148 75)" /><ellipse cx="172" cy="75" rx="8" ry="14" transform="rotate(25 172 75)" /></g>
            <g fill="#fff"><circle cx="176" cy="52" r="2.2" /><circle cx="144" cy="56" r="1.8" /></g>
          </g>
          <g data-k="1" className={`ab-item${active === 1 ? ' ab-on' : ''}`}><rect x="138" y="136" width="42" height="9" rx="2.5" fill="#fff" /><rect x="140" y="127" width="38" height="9" rx="2.5" fill="#f3e6c4" /><rect x="138" y="118" width="42" height="9" rx="2.5" fill="#d6ad55" /><rect x="141" y="109" width="36" height="9" rx="2.5" fill="#fff" /></g>
          <g data-k="2" className={`ab-item${active === 2 ? ' ab-on' : ''}`}><rect x="141" y="84" width="36" height="62" rx="7" fill="#0a1a3b" stroke="#e8c987" strokeWidth="2" /><g stroke="#e8c987" strokeWidth="2.4" fill="none" strokeLinecap="round"><path d="M148 106a15 15 0 0 1 22 0" /><path d="M152 112a9.5 9.5 0 0 1 14 0" /></g><circle cx="159" cy="120" r="2.2" fill="#e8c987" /></g>
          <g data-k="3" className={`ab-item${active === 3 ? ' ab-on' : ''}`}><rect x="134" y="144" width="48" height="4" rx="2" fill="#c0c7d6" /><path d="M142 144a16 16 0 0 1 32 0z" fill="#e8c987" /><circle cx="158" cy="126" r="3.2" fill="#d6ad55" /><path d="M147 135a12 12 0 0 1 8-6" stroke="#fff" opacity=".7" fill="none" strokeWidth="2" strokeLinecap="round" /></g>
          <g data-k="4" className={`ab-item${active === 4 ? ' ab-on' : ''}`}><rect x="140" y="142" width="36" height="6" rx="3" fill="#d6ad55" /><path d="M144 142a14 14 0 0 1 28 0z" fill="#e8c987" /><rect x="156" y="124" width="4" height="5" fill="#d6ad55" /><circle cx="158" cy="122" r="3.6" fill="#d6ad55" /></g>

          {/* Torso */}
          <path d="M60 118Q100 104 140 118L148 216H52Z" fill="#10244f" />
          <path d="M100 124V216" stroke="#d6ad55" strokeWidth="2" />
          <g fill="#e8c987"><circle cx="89" cy="146" r="3.4" /><circle cx="89" cy="168" r="3.4" /><circle cx="89" cy="190" r="3.4" /><circle cx="111" cy="146" r="3.4" /><circle cx="111" cy="168" r="3.4" /><circle cx="111" cy="190" r="3.4" /></g>
          <rect x="52" y="114" width="22" height="7" rx="3.5" fill="#d6ad55" transform="rotate(-14 63 118)" />
          <rect x="126" y="114" width="22" height="7" rx="3.5" fill="#d6ad55" transform="rotate(14 137 118)" />
          <rect x="118" y="152" width="16" height="10" rx="2" fill="#d6ad55" />
          <path d="M88 106L100 128L112 106Z" fill="#fff" />
          <path d="M100 119L87 111V127Z M100 119L113 111V127Z" fill="#c8964a" /><circle cx="100" cy="119" r="3.6" fill="#e8c987" />

          {/* Head */}
          <rect x="91" y="94" width="18" height="18" rx="6" fill="#c98f5f" />
          <circle cx="70" cy="68" r="6" fill="#d9a273" /><circle cx="130" cy="68" r="6" fill="#d9a273" />
          <ellipse cx="100" cy="66" rx="30" ry="33" fill="#d9a273" />
          <path d="M71 58Q100 36 129 58V48Q100 26 71 48Z" fill="#1a1410" />
          <path d="M68 50L75 20H125L132 50Z" fill="#10244f" />
          <rect x="68" y="41" width="64" height="9" fill="#d6ad55" />
          <ellipse cx="100" cy="20" rx="25" ry="5" fill="#1b3366" /><circle cx="100" cy="14" r="3.2" fill="#e8c987" />
          <rect x="66" y="50" width="68" height="5" rx="2.5" fill="#0a1a3b" />
          <path d="M72 58C76 98 124 98 128 58" fill="none" stroke="#d6ad55" strokeWidth="1.6" />
          <g className="ab-eyes"><circle cx="88" cy="68" r="3.3" fill="#2a1a10" /><circle cx="112" cy="68" r="3.3" fill="#2a1a10" /></g>
          <path d="M81 60Q88 56 95 60M105 60Q112 56 119 60" stroke="#1a1410" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M100 70Q95 79 101 80" stroke="#a8703f" fill="none" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M89 84Q100 78 111 84Q100 82 89 84Z" fill="#1a1410" />
          <path d="M90 88Q100 99 110 88" stroke="#7a3b2a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="80" cy="82" r="5" fill="#e58a6a" opacity=".3" /><circle cx="120" cy="82" r="5" fill="#e58a6a" opacity=".3" />

          {/* Pointing arm */}
          <g className="ab-armPose"><g className="ab-armWig">
            <line x1="66" y1="132" x2="66" y2="88" stroke="#10244f" strokeWidth="22" strokeLinecap="round" />
            <rect x="55" y="92" width="22" height="7" rx="3" fill="#d6ad55" />
            <ellipse cx="66" cy="76" rx="11" ry="12" fill="#d9a273" />
            <rect x="62.5" y="40" width="7" height="40" rx="3.5" fill="#d9a273" />
            <ellipse cx="55.5" cy="76" rx="4.5" ry="7" fill="#d9a273" transform="rotate(-20 55.5 76)" />
          </g></g>
        </g>
      </svg>
    </div>
  </div>;
}
