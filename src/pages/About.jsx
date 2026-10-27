import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AboutHero, { AboutStats } from '../components/about/AboutHero.jsx';
import ServiceOrbit from '../components/about/ServiceOrbit.jsx';
import ServicePanels from '../components/about/ServicePanels.jsx';
import BellboyGuide from '../components/about/BellboyGuide.jsx';
import WhyChoose from '../components/about/WhyChoose.jsx';
import './About.css';

// Service data and inline SVG paths are copied from the supplied design's S array.
export const services = [
  { t: 'Housekeeping', d: 'Daily room cleaning service.', f: ['Daily cleaning', 'Fresh linens', 'Turn-down on request'], bubble: 'Spotless rooms, every single day!', icon: <svg className="ab-i" viewBox="0 0 24 24"><path d="M10 3h4v8h4l2 4v6H4v-6l2-4h4z"/><path d="M8 21v-4M12 21v-4M16 21v-4"/></svg> },
  { t: 'Laundry', d: 'Laundry service for guest clothing.', f: ['Wash & press', 'Same-day on request', 'Dry cleaning'], bubble: 'Fresh, folded and ready for you!', icon: <svg className="ab-i" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2.5"/><circle cx="12" cy="14" r="4"/><path d="M8 6.5h.01M11 6.5h.01"/></svg> },
  { t: 'Free Wi-Fi', d: 'Internet access for guests.', f: ['All rooms', 'Lobby & lawns', 'Work-friendly speed'], bubble: 'Stay connected. It is on us!', icon: <svg className="ab-i" viewBox="0 0 24 24"><path d="M2 9a15 15 0 0 1 20 0"/><path d="M5 12.5a10.5 10.5 0 0 1 14 0"/><path d="M8.5 16a5.5 5.5 0 0 1 7 0"/><circle cx="12" cy="19.3" r="1" fill="currentColor"/></svg> },
  { t: 'Room Service', d: 'Convenient in-room assistance.', f: ['Breakfast in bed', 'Late-night menu', 'Essentials on call'], bubble: 'Hot meals, right at your door!', icon: <svg className="ab-i" viewBox="0 0 24 24"><path d="M3 18h18"/><path d="M5 18a7 7 0 0 1 14 0"/><path d="M12 8V6.5M10.5 6.5h3"/><path d="M2 21h20"/></svg> },
  { t: '24/7 Reception', d: 'Reception assistance for guests.', f: ['Easy check-in', 'Travel desk', 'Always staffed'], bubble: 'I am here 24/7. Just ask!', icon: <svg className="ab-i" viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19c0 1.7-2 2.5-5 2.5"/><circle cx="12" cy="11.5" r="2.4"/></svg> },
];

export default function About() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const deckRef = useRef(null);
  const boyRef = useRef(null);

  const selectService = (index) => {
    setActive(index);
    setTimerKey((value) => value + 1);
  };

  // Scroll reveals match the source's .rv/.in behavior, and are observed only once.
  useEffect(() => {
    const elements = document.querySelectorAll('.ab-rv');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('ab-in'));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('ab-in');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.15 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  // Every user selection clears the old interval and starts a fresh 2.8 second cycle.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % services.length), 2800);
    return () => window.clearInterval(timer);
  }, [timerKey]);

  // Source positioning formula, recalculated after active-panel layout and on resize.
  useLayoutEffect(() => {
    const placeBoy = () => {
      const deck = deckRef.current;
      const boy = boyRef.current;
      if (!deck || !boy) return;
      const mobile = window.matchMedia('(max-width:900px)').matches;
      let x = 0;
      if (!mobile) {
        const g = 14;
        const u = (deck.clientWidth - 4 * g) / 7.8;
        x = active * (u + g) + 3.8 * u / 2 - boy.offsetWidth / 2;
      }
      boy.style.transform = `translateX(${x}px)`;
    };
    placeBoy();
    window.addEventListener('resize', placeBoy);
    return () => window.removeEventListener('resize', placeBoy);
  }, [active]);

  return <main className="ab-page">
    <div className="ab-container">
      <div className="ab-back ab-rv"><a href="#" aria-label="Back" onClick={(event) => { event.preventDefault(); navigate(-1); }}>←</a><h2>About Atithi</h2></div>
      <section className="ab-top">
        <AboutHero />
        <div className="ab-about ab-rv ab-d1">
          <h1>Atithi</h1><span className="ab-uline" id="ab-ul" />
          <p>Welcome to Atithi Demo Hotel. Enjoy comfortable rooms, friendly service, and a relaxing stay.</p>
          <AboutStats />
        </div>
      </section>
      <section className="ab-sv">
        <h2 className="ab-sec-t ab-rv">Our Services</h2>
        <p className="ab-sv-sub ab-rv ab-d1">Tap a service, or just watch them glow.</p>
        <ServiceOrbit services={services} active={active} onSelect={selectService} />
      </section>
      <section className="ab-offer">
        <span className="ab-eyebrow ab-rv">Atithi Demo Hotel</span>
        <h2 className="ab-sec-t ab-rv ab-d1">What we offer</h2>
        <span className="ab-uline ab-rv ab-d2" />
        <p className="ab-sv-sub ab-rv ab-d2 ab-offer-sub">Everything you need for a comfortable stay.</p>
        <ServicePanels services={services} active={active} onSelect={selectService} deckRef={deckRef} />
        <BellboyGuide services={services} active={active} boyRef={boyRef} deckRef={deckRef} />
      </section>
      <WhyChoose />
    </div>
  </main>;
}
