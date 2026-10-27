import './ScrollTopButton.css';

export default function ScrollTopButton() {
  return <button className="ast-top" type="button" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V4M6 10l6-6 6 6" /></svg>
  </button>;
}
