import { useEffect, useRef, useState } from 'react';
import './Testimonials.css';

const data = [
  { n: 'Priya Shah', c: 'Ahmedabad', t: 'Beautiful rooms, wonderful food and a team that made us feel at home from the very first minute.', m: 'feel at home', s: 'DELUXE ROOM · 3 NIGHTS' },
  { n: 'Rahul Mehta', c: 'Mumbai', t: 'The riverside view at sunrise was unreal. Check-in took two minutes and the staff remembered our names.', m: 'remembered our names', s: 'SUITE · 2 NIGHTS' },
  { n: 'Ananya Desai', c: 'Surat', t: 'We hosted our family wedding here. Every detail was handled so calmly that we simply enjoyed the day.', m: 'handled so calmly', s: 'WEDDING · 2 DAYS' },
  { n: 'Karan Patel', c: 'Vadodara', t: 'Quiet, spotless and the breakfast spread is something I still think about. Already booked again.', m: 'Already booked again', s: 'BUSINESS · 4 NIGHTS' },
  { n: 'Meera Joshi', c: 'Rajkot', t: 'Our kids loved the courtyard and we loved the chai. It truly felt like staying with relatives.', m: 'staying with relatives', s: 'FAMILY · 5 NIGHTS' },
];
const N = data.length;

function HighlightedText({ text, phrase }) {
  const start = text.indexOf(phrase);
  if (start === -1) return text;
  return <>{text.slice(0, start)}<mark>{phrase}</mark>{text.slice(start + phrase.length)}</>;
}

export default function Testimonials() {
  const [cur, setCur] = useState(0);
  const touchX = useRef(null);

  // Every manual or automatic index change starts a fresh five-second interval.
  useEffect(() => {
    const timer = setTimeout(() => setCur((c) => (c + 1) % N), 5000);
    return () => clearTimeout(timer);
  }, [cur]);

  function onTouchEnd(event) {
    if (touchX.current == null) return;
    const dx = event.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) setCur((c) => (c + (dx < 0 ? 1 : -1) + N) % N);
  }

  return <section className="tm-section">
    <div className="tm-left">
      <div className="tm-eyebrow">KIND WORDS, KEPT CLOSE</div>
      <h2>Guests say it <em>best</em></h2>
      <p className="tm-sub">Real notes from people who stayed, celebrated and relaxed with us.</p>
      <div className="tm-score"><b>4.9</b><div><span className="st">★★★★★</span><small>Average guest rating</small></div></div>
      <div className="tm-ctrl">
        <button className="tm-btn" type="button" aria-label="Previous review" onClick={() => setCur((c) => (c - 1 + N) % N)}>
          <svg className="tm-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M20 12H4M10 6l-6 6 6 6" /></svg>
        </button>
        <button className="tm-btn tm-next" type="button" aria-label="Next review" onClick={() => setCur((c) => (c + 1) % N)}>
          <span className="tm-ring run" key={cur}><svg viewBox="0 0 100 100"><circle className="track" cx="50" cy="50" r="48" pathLength="100" /><circle className="prog" cx="50" cy="50" r="48" pathLength="100" /></svg></span>
          <svg className="tm-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 12h16M14 6l6 6-6 6" /></svg>
        </button>
      </div>
    </div>
    <div className="tm-deck" aria-live="polite" onTouchStart={(event) => { touchX.current = event.touches[0].clientX; }} onTouchEnd={onTouchEnd}>
      {data.map((item, i) => {
        const p = (i - cur + N) % N;
        const position = p === 0 ? '0' : p === 1 ? '1' : p === 2 ? '2' : p === N - 1 ? 'out' : 'h';
        return <div className="tm-card" data-p={position} key={item.n}>
          <div className="tm-qm">”</div>
          <div className="tm-stars">{'★★★★★'.split('').map((star, index) => <i key={index}>{star}</i>)}</div>
          <p>“<HighlightedText text={item.t} phrase={item.m} />”</p>
          <div className="tm-by"><div className="tm-pic">{item.n[0]}</div><div><b>{item.n}</b><small>{item.c}</small></div><span className="tm-tag">{item.s}</span></div>
        </div>;
      })}
    </div>
  </section>;
}
