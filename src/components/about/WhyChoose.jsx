import { Link } from 'react-router-dom';

const reasons = [
  { title: 'Premium Rooms & Suites', path: <path d="M3 18v-6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6M3 18h18M3 21v-3M21 21v-3M7 9V7h10v2" /> },
  { title: 'Safe & Secure Stay', path: <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z" /> },
  { title: '24/7 Support', path: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /><path d="M19 20c0 1.5-2 2-5 2" /></> },
  { title: 'Best Rates', path: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.3" /></> },
];

export default function WhyChoose() {
  return <section className="ab-why">
    <h2 className="ab-sec-t ab-rv">Why Choose Atithi?</h2>
    <div className="ab-list">
      {reasons.map((reason, index) => <div className={`ab-item ab-rv${index ? ` ab-d${index}` : ''}`} key={reason.title}>
        <div className="ab-ic"><svg className="ab-i" viewBox="0 0 24 24">{reason.path}</svg></div><span>{reason.title}</span>
      </div>)}
    </div>
    <div className="ab-book ab-rv"><Link to="/booking" className="ab-btn">Book Your Stay</Link></div>
  </section>;
}
