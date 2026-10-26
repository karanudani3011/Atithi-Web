import { Link } from 'react-router-dom';
import HeroScene from './HeroScene.jsx';

export default function Banner({
  title,
  eyebrow,
  subtitle,
  breadcrumbs = null,
  compact = true
}) {
  return (
    <section className="inner-banner">
      <HeroScene compact={compact} />
      <div className="banner-copy">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="banner-breadcrumbs">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="breadcrumb-item">
                {crumb.to ? (
                  <Link to={crumb.to} className="breadcrumb-link">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="breadcrumb-current" aria-current="page">
                    {crumb.label}
                  </span>
                )}
                {idx < breadcrumbs.length - 1 && (
                  <span className="breadcrumb-sep">·</span>
                )}
              </span>
            ))}
          </nav>
        ) : eyebrow ? (
          <div className="eyebrow">{eyebrow}</div>
        ) : null}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}
