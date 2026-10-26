import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ConciergeBell,
  Utensils,
  Waves,
  Sparkles,
  Car,
  Wifi,
  Quote,
  BedDouble,
} from 'lucide-react';
import PalaceHero from '../components/PalaceHero.jsx';
import Reveal from '../components/Reveal.jsx';
import Counter from '../components/Counter.jsx';
import Img from '../components/Img.jsx';
import DateField from '../components/common/DateField.jsx';
import GuestStepper from '../components/common/GuestStepper.jsx';
import { localDateString, nextDate } from '../components/common/dateOnly.js';
import useRooms from '../hooks/useRooms.js';
import { testimonials } from '../data/testimonials.js';

const services = [
  ['Concierge', ConciergeBell],
  ['Royal Dining', Utensils],
  ['Infinity Pool', Waves],
  ['Luxury Spa', Sparkles],
  ['Airport Pick-up', Car],
  ['Free WiFi', Wifi],
];

export default function Home() {
  const nav = useNavigate();
  const roomState = useRooms({ limit: 3, ratingFirst: true });
  const rooms = roomState.rooms;
  const [review, setReview] = useState(0);
  const [search, setSearch] = useState({ checkIn: '', checkOut: '', adults: 1, children: 0 });
  const [dateError, setDateError] = useState('');
  const touchStart = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const reviewTimer = window.setInterval(
      () => setReview((v) => (v + 1) % testimonials.length),
      6000
    );
    return () => clearInterval(reviewTimer);
  }, []);

  function swipeEnd(event) {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(distance) > 45) {
      setReview((value) => (value + (distance < 0 ? 1 : -1) + testimonials.length) % testimonials.length);
    }
  }

  return (
    <div className="home-page-root">
      {/* ── Magnificent Palace Hero Section (Matching Reference Image) ── */}
      <PalaceHero />

      {/* ── Seamless Booking Search Strip (Preserving Booking Logic) ── */}
      <section className="palace-search-strip">
        <form
          className="palace-search-form home-booking-search"
          onSubmit={(event) => {
            event.preventDefault();
            if (!search.checkIn || !search.checkOut) {
              setDateError('Check-in ane check-out date select karo');
              return;
            }
            const params = new URLSearchParams({
              checkIn: search.checkIn,
              checkOut: search.checkOut,
              adults: String(search.adults),
              children: String(search.children),
            });
            setDateError('');
            nav(`/rooms?${params.toString()}`);
          }}
        >
          <DateField label="CHECK IN" id="home-check-in" variant="hero" min={localDateString()} value={search.checkIn} error={dateError && !search.checkIn ? dateError : ''}
            onChange={(checkIn) => setSearch((current) => ({ ...current, checkIn, checkOut: current.checkOut && current.checkOut <= checkIn ? nextDate(checkIn) : current.checkOut }))} />
          <DateField label="CHECK OUT" id="home-check-out" variant="hero" min={search.checkIn ? nextDate(search.checkIn) : localDateString()} value={search.checkOut} error={dateError && search.checkIn && !search.checkOut ? dateError : ''}
            onChange={(checkOut) => setSearch((current) => ({ ...current, checkOut }))} />
          <GuestStepper id="home-adults" label="ADULTS" value={search.adults} min={1} max={6} variant="hero"
            onChange={(adults) => setSearch((current) => ({ ...current, adults }))} />
          <GuestStepper id="home-children" label="CHILDREN" value={search.children} min={0} max={4} variant="hero"
            onChange={(children) => setSearch((current) => ({ ...current, children }))} />

          <button type="submit" className="btn-search-submit">
            <span>Check Availability</span>
            <ArrowRight size={17} />
          </button>
        </form>
      </section>

      {/* ── Marquee Highlights Band ── */}
      <div className="marquee">
        <div>
          {[
            'Infinity Pool',
            'Free High-Speed WiFi',
            'Royal Dining',
            'Luxury Spa',
            '24×7 Concierge',
            'Airport Pick-up',
            'Banquet Halls',
            'Gujarati Thali',
          ].map((x, i) => (
            <span key={i}>
              ✦ <i>{x}</i>
            </span>
          ))}
        </div>
      </div>

      {/* ── About & Heritage Preview ── */}
      <section className="section about-preview">
        <Reveal className="about-images">
          <Img src={rooms[2]?.image || '/hotel-about-day.jpg'} alt="Elegant Atithi suite" />
          <Img src={rooms[0]?.image || '/daylight-hotel.jpg'} alt="Warm hotel bedroom" />
          <div className="experience">
            <strong><Counter to={25} suffix="+" /></strong>
            <span>YEARS OF<br />HOSPITALITY</span>
          </div>
        </Reveal>

        <Reveal className="about-copy" direction="right">
          <div className="eyebrow">A WARM WELCOME, ALWAYS</div>
          <h2>A home away from home, <i>with a royal touch</i></h2>
          <p>
            At Atithi, hospitality is more than a promise. It is the care in every detail,
            the welcome at every door, and the feeling that you truly belong.
          </p>
          <ul className="check-list">
            {[
              'Personalised service, with a human touch',
              'A quiet moment in the middle of the city',
              'Flavours inspired by home and heritage',
              'Thoughtful comforts, at every turn',
            ].map((x) => (
              <li key={x}>
                <Check size={17} />
                {x}
              </li>
            ))}
          </ul>
          <Link className="text-link" to="/about">
            Discover Our Story <ArrowRight size={16} />
          </Link>
        </Reveal>
      </section>

      {/* ── Services & Amenities ── */}
      <section className="section services-section">
        <Reveal className="section-head">
          <div className="eyebrow">MADE FOR YOUR COMFORT</div>
          <h2>Little luxuries. <i>Lovely moments.</i></h2>
          <p>Thoughtful comforts make a good stay feel extraordinary.</p>
        </Reveal>
        <div className="service-grid">
          {services.map(([name, Icon], i) => (
            <Reveal key={name} delay={i * 0.06}>
              <div className="service-card">
                <div className="service-icon"><Icon size={25} /></div>
                <h3>{name}</h3>
                <p>Considered details and warm service, whenever you need them.</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Featured Rooms ── */}
      <section className="section featured">
        <div className="section-head row-head">
          <div>
            <div className="eyebrow">FIND YOUR PERFECT STAY</div>
            <h2>Rooms to <i>remember</i></h2>
          </div>
          <Link className="text-link" to="/rooms">
            View All Rooms <ArrowRight size={16} />
          </Link>
        </div>

        {roomState.loading ? (
          <div className="room-grid featured-room-grid">
            {[1, 2, 3].map((x) => (
              <div className="room-card room-skeleton" key={x} />
            ))}
          </div>
        ) : roomState.error ? (
          <div className="empty-state">
            <h3>Rooms load na thaya</h3>
            <p>Please try again.</p>
            <button className="btn gold" onClick={roomState.retry}>
              Try again
            </button>
          </div>
        ) : rooms.length ? (
          <div className="room-grid featured-room-grid">
            {rooms.map((r, i) => (
              <Reveal delay={i * 0.08} key={r.id}>
                <RoomTeaser room={r} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            We’re preparing our rooms for you. Please check back soon.
          </div>
        )}
      </section>

      {/* ── Key Statistics Band ── */}
      <section className="stats-band">
        <div className="stats-inner">
          {[
            ['', 25, '+', 'Years of hospitality'],
            ['', 150, '', 'Beautiful rooms'],
            ['', 50000, '+', 'Happy guests'],
            ['', 98, '%', 'Guest satisfaction'],
          ].map(([p, n, s, l]) => (
            <div key={l}>
              <strong><Counter to={n} suffix={s} prefix={p} /></strong>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section testimonials">
        <Reveal className="section-head">
          <div className="eyebrow">KIND WORDS, KEPT CLOSE</div>
          <h2>Guests say it <i>best</i></h2>
        </Reveal>
        <div
          className="review-card"
          onTouchStart={(event) => {
            touchStart.current = event.touches[0].clientX;
          }}
          onTouchEnd={swipeEnd}
        >
          <Quote className="quote-mark" />
          <div className="review-stars">★★★★★</div>
          <p>“{testimonials[review].text}”</p>
          <div className="review-person">
            <span>{testimonials[review].name.slice(0, 1)}</span>
            <div>
              <b>{testimonials[review].name}</b>
              <small>{testimonials[review].city}</small>
            </div>
          </div>
          <div className="review-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={i === review ? 'selected' : ''}
                aria-label={`Review ${i + 1}`}
                onClick={() => setReview(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to Action Band ── */}
      <section className="cta-band">
        <div className="cta-rings" />
        <div className="eyebrow">YOUR NEXT LOVELY MEMORY</div>
        <h2>Ready for an <i>unforgettable</i> stay?</h2>
        <p>We would love to welcome you.</p>
        <Link className="btn gold" to="/booking">
          Find your stay <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  );
}

function RoomTeaser({ room }) {
  const [imageFailed, setImageFailed] = useState(false);
  const price = room.price;
  const formattedPrice = Number.isFinite(price) && price >= 0
    ? `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(price)}`
    : 'Price on request';
  const size = Number.isFinite(room.size) ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(room.size) : null;
  return (
    <article className="room-card featured-room-card">
      <div className="room-image">
        <Link to={`/room/${room.id}`} className="featured-room-image-link" aria-label={`Discover ${room.name}`}>
          {room.image && !imageFailed ? <img src={room.image} alt={room.name} loading="lazy" onError={() => setImageFailed(true)} /> : <div className="featured-room-placeholder" role="img" aria-label={`${room.name} photo unavailable`}><BedDouble size={38}/><span>Atithi Stay</span></div>}
        </Link>
        <span className="room-type">{room.type}</span>
        {Number.isFinite(room.rating) && <span className="rating">★ {room.rating.toFixed(1)}</span>}
      </div>
      <div className="room-body">
        <div className="room-title">
          <h3><Link to={`/room/${room.id}`} className="room-title-link">{room.name}</Link></h3>
        </div>
        <p className="featured-room-meta">{size ? `${size} m²` : 'Size not listed'} <span>·</span> Up to {room.guests ?? '—'} guests</p>
        <div className="room-bottom">
          <strong>
            {formattedPrice} {Number.isFinite(price) && <small>/ night</small>}
          </strong>
          <Link to={`/room/${room.id}`} className="featured-room-discover">Discover <ArrowRight size={15} /></Link>
        </div>
      </div>
    </article>
  );
}
