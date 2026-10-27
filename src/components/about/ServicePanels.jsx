import { Link } from 'react-router-dom';

export default function ServicePanels({ services, active, onSelect, deckRef }) {
  const chooseOnHover = (index) => {
    if (window.matchMedia('(hover:hover) and (min-width:901px)').matches && active !== index) onSelect(index);
  };
  return <div className="ab-deck ab-rv ab-d3" id="ab-deck" ref={deckRef}>
    {services.map((service, index) => <article
      key={service.t}
      className={`ab-pn${active === index ? ' ab-on' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={active === index}
      onMouseEnter={() => chooseOnHover(index)}
      onClick={(event) => { if (!event.target.closest('.ab-pn-btn')) onSelect(index); }}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(index); } }}
    >
      <span className="ab-pn-no">0{index + 1}</span>
      <div className="ab-pn-ic">{service.icon}</div>
      <span className="ab-pn-v">{service.t}</span>
      <div className="ab-pn-body">
        <h3>{service.t}</h3><p>{service.d}</p>
        <ul className="ab-chips">{service.f.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        <Link to="/booking" className="ab-pn-btn" onClick={(event) => { event.stopPropagation(); onSelect(active); }}>Request this service →</Link>
      </div>
      <span className="ab-pn-ar" aria-hidden="true">→</span>
    </article>)}
  </div>;
}
