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
} from 'lucide-react';
import PalaceHero from '../components/PalaceHero.jsx';
import Reveal from '../components/Reveal.jsx';
import Counter from '../components/Counter.jsx';
import Img from '../components/Img.jsx';
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
  const roomState = useRooms();
  const rooms = roomState.rooms;
  const [review, setReview] = useState(0);
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
          className="palace-search-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            nav('/booking', {
              state: {
                checkin: f.get('in'),
                checkout: f.get('out'),
                guests: f.get('guests'),
              },
            });
          }}
        >
          <div className="search-field">
            <label htmlFor="search-in">CHECK IN</label>
            <input
              id="search-in"
              name="in"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>

          <div className="search-field">
            <label htmlFor="search-out">CHECK OUT</label>
            <input
              id="search-out"
              name="out"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>

          <div className="search-field">
            <label htmlFor="search-guests">GUESTS</label>
            <select id="search-guests" name="guests" defaultValue="2">
              {[1, 2, 3, 4, 5, 6].map((x) => (
                <option key={x} value={x}>
                  {x} {x === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>

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
          <div className="room-grid">
            {[1, 2, 3].map((x) => (
              <div className="room-card room-skeleton" key={x} />
            ))}
          </div>
        ) : roomState.error ? (
          <div className="empty-state">
            <p>{roomState.error}</p>
            <button className="btn gold" onClick={roomState.retry}>
              Try again
            </button>
          </div>
        ) : rooms.length ? (
          <div className="room-grid">
            {rooms.slice(0, 3).map((r, i) => (
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
  const unavailable = room.status === 'Maintenance' || room.status === 'Booked';
  return (
    <article className="room-card">
      <div className="room-image">
        <Img src={room.image} alt={room.name} />
        <span className="room-type">{room.type}</span>
        {unavailable && (
          <span className="unavailable-ribbon">
            {room.status === 'Maintenance' ? 'Not available' : 'Booked'}
          </span>
        )}
      </div>
      <div className="room-body">
        <div className="room-title">
          <h3>{room.name}</h3>
          <span>★ {room.rating}</span>
        </div>
        <p>
          {room.size} m² <span>·</span> Up to {room.guests} guests
        </p>
        <div className="room-bottom">
          <strong>
            ₹{Number(room.price).toLocaleString('en-IN')}{' '}
            <small>/ night</small>
          </strong>
          {unavailable ? (
            <span className="unavailable-text">
              {room.status === 'Maintenance' ? 'Not available' : 'Booked'}
            </span>
          ) : (
            <Link to="/rooms">
              Discover <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
