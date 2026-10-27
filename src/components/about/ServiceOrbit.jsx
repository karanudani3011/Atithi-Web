import { useEffect, useState } from 'react';

export default function ServiceOrbit({ services, active, onSelect }) {
  const [swap, setSwap] = useState(false);
  useEffect(() => {
    setSwap(true);
    const timeout = window.setTimeout(() => setSwap(false), 280);
    return () => window.clearTimeout(timeout);
  }, [active]);

  return <div className="ab-orbit ab-rv ab-d2" id="ab-orbit">
    <div className="ab-dash" /><div className="ab-trav" />
    <div className="ab-center"><div className={`ab-c-in${swap ? ' ab-out' : ''}`}>
      <span className="ab-ci">{services[active].icon}</span><h3>{services[active].t}</h3><p>{services[active].d}</p>
    </div></div>
    {services.map((service, index) => {
      const angle = (-90 + index * 360 / services.length) * Math.PI / 180;
      return <button key={service.t} type="button" className={`ab-node${active === index ? ' ab-on' : ''}`} aria-label={service.t} aria-pressed={active === index} style={{ left: `${50 + 43 * Math.cos(angle)}%`, top: `${50 + 43 * Math.sin(angle)}%` }} onClick={() => onSelect(index)}>{service.icon}</button>;
    })}
  </div>;
}
