import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Maximize2,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import Banner from '../components/Banner.jsx';
import Img from '../components/Img.jsx';
import Reveal from '../components/Reveal.jsx';
import RoomCard from '../components/RoomCard.jsx';
import useRooms from '../hooks/useRooms.js';

export default function RoomDetailsPage() {
  const { id } = useParams();
  const roomState = useRooms();
  const rooms = roomState.rooms;
  const room = rooms.find((r) => String(r.id) === String(id));
  const [activeImage, setActiveImage] = useState('');

  // Sync activeImage whenever the room changes
  useEffect(() => {
    setActiveImage(room?.image_urls?.[0] || '');
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [room?.id, room?.image_urls]);

  if (roomState.loading) return <div className="room-details-loading" aria-label="Loading room" />;
  if (roomState.error) return <section className="section"><p>{roomState.error}</p><button className="btn gold" onClick={roomState.retry}>Try again</button></section>;
  if (!room) return <Navigate to="/rooms" replace />;

  const gallery = Array.isArray(room.image_urls) ? room.image_urls.filter(Boolean) : [];

  // Prev / Next room calculation
  const currentIndex = rooms.findIndex((r) => String(r.id) === String(room.id));
  const prevRoom =
    rooms[(currentIndex - 1 + rooms.length) % rooms.length] || room;
  const nextRoom = rooms[(currentIndex + 1) % rooms.length] || room;

  // 3 other suggested rooms
  const suggestions = rooms
    .filter((r) => String(r.id) !== String(room.id))
    .slice(0, 3);

  const unavailable =
    room.status !== 'available' || Number(room.units_left) === 0;

  return (
    <div className="room-details-page">
      <Banner
        title={room.room_name}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Rooms', to: '/rooms' },
          { label: room.room_name }
        ]}
      />

      <section className="section room-details-section">
        {/* Navigation & back link */}
        <div className="room-details-top-bar">
          <Link to="/rooms" className="back-link">
            <ArrowLeft size={16} />
            <span>Back to All Rooms</span>
          </Link>

          <div className="prev-next-nav">
            <Link
              to={`/room/${prevRoom.id}`}
              className="prev-next-btn"
              title={`Previous: ${prevRoom.room_name}`}
            >
              <ChevronLeft size={16} />
              <span className="btn-label">
                <small>Previous</small>
                <b>{prevRoom.room_name}</b>
              </span>
            </Link>
            <span className="nav-divider">|</span>
            <Link
              to={`/room/${nextRoom.id}`}
              className="prev-next-btn"
              title={`Next: ${nextRoom.room_name}`}
            >
              <span className="btn-label" style={{ textAlign: 'right' }}>
                <small>Next</small>
                <b>{nextRoom.room_name}</b>
              </span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Two-column layout: Gallery (Left) & Room Specs / Sticky Booking Card (Right) */}
        <div className="room-details-layout">
          {/* Left Column: Main Image & Gallery Thumbnails */}
          <div className="room-gallery-column">
            <div className="room-main-image-wrap">
              <Img
                src={activeImage}
                alt={`${room.room_name} preview`}
                className="room-detail-main-img"
              />
              <span className="detail-badge-type">{room.room_type}</span>
              {unavailable && (
                <span className="unavailable-ribbon">
                  Not available
                </span>
              )}
            </div>

            <div
              className="room-gallery-strip"
              role="region"
              aria-label="Room photo gallery thumbnails"
            >
              {gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`gallery-thumb ${activeImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setActiveImage(imgUrl)}
                  aria-label={`View photo ${idx + 1} of ${room.room_name}`}
                >
                  <Img src={imgUrl} alt={`${room.room_name} thumbnail ${idx + 1}`} />
                </button>
              ))}
            </div>

            {/* In-room highlights banner */}
            <div className="room-highlights-box">
              <div className="highlight-item">
                <Sparkles size={20} className="gold-icon" />
                <div>
                  <strong>Bespoke Hospitality</strong>
                  <span>Personalized service rooted in Atithi Devo Bhava</span>
                </div>
              </div>
              <div className="highlight-item">
                <ShieldCheck size={20} className="gold-icon" />
                <div>
                  <strong>Best Rate Guarantee</strong>
                  <span>Zero hidden costs · Instant direct booking confirmation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Room Details, Full Description, Amenities, Policies & Sticky Booking Card */}
          <div className="room-info-column">
            <div className="room-header-meta">
              <div className="meta-pill-row">
                <span className="room-type-pill">{room.room_type}</span>
                <span className="room-rating-pill">
                  ★ {room.rating} <small>(Verified Guest Stay)</small>
                </span>
              </div>
              <h1 className="room-title-heading">{room.room_name}</h1>
            </div>

            {/* Quick Specs Grid */}
            <div className="room-specs-grid">
              <div className="spec-card">
                <Maximize2 size={18} className="spec-icon" />
                <div>
                  <small>Room Size</small>
                  <strong>{room.size_sqft ? `${room.size_sqft} sq ft` : 'Not listed'}</strong>
                </div>
              </div>
              <div className="spec-card">
                <Users size={18} className="spec-icon" />
                <div>
                  <small>Max Guests</small>
                  <strong>Up to {room.capacity}</strong>
                </div>
              </div>
              <div className="spec-card">
                <BedDouble size={18} className="spec-icon" />
                <div>
                  <small>Bedding</small>
                  <strong>{room.bed_info || 'King Bed'}</strong>
                </div>
              </div>
            </div>

            {/* Full Long Description */}
            <div className="room-full-desc">
              <h3 className="section-subtitle">About this Space</h3>
              <p>{room.description}</p>
            </div>

            {/* Complete Amenities List with icons/ticks */}
            <div className="room-amenities-section">
              <h3 className="section-subtitle">Room Amenities & Features</h3>
              <ul className="full-amenities-grid">
                {(room.amenities || []).map((amenity) => (
                  <li key={amenity} className="amenity-item">
                    <span className="amenity-check">
                      <Check size={14} />
                    </span>
                    <span>{amenity}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Policies Block */}
            <div className="room-policies-card">
              <h3 className="section-subtitle">Hotel Policies & Stay Rules</h3>
              <div className="policies-grid">
                <div className="policy-item">
                  <Clock size={18} className="policy-icon" />
                  <div>
                    <strong>Check-in</strong>
                    <p>From 12:00 PM</p>
                  </div>
                </div>
                <div className="policy-item">
                  <Clock size={18} className="policy-icon" />
                  <div>
                    <strong>Check-out</strong>
                    <p>Until 11:00 AM</p>
                  </div>
                </div>
                <div className="policy-item full-width">
                  <ShieldCheck size={18} className="policy-icon" />
                  <div>
                    <strong>Cancellation Policy</strong>
                    <p>Free cancellation up to 48 hours prior to check-in.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Booking Card */}
            <div className="sticky-booking-card">
              <div className="sticky-card-content">
                <div className="sticky-price-info">
                  <span className="price-label">Price per night</span>
                  <div className="sticky-price-amount">
                    <strong>₹{Number(room.price_per_night).toLocaleString('en-IN')}</strong>
                    <span className="price-suffix">/ night</span>
                  </div>
                  <span className="gst-notice">+ 12% GST applicable at checkout</span>
                </div>

                <div className="sticky-btn-wrap">
                  {unavailable ? (
                    <button className="btn outline disabled-btn" disabled>
                      Currently Unavailable
                    </button>
                  ) : (
                    <Link
                      to={`/booking/${room.id}`}
                      className="btn gold btn-book-hero"
                    >
                      Book Now <ArrowRight size={17} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* "You may also like" Section */}
        {suggestions.length > 0 && (
          <div className="related-rooms-section">
            <div className="section-head">
              <div className="eyebrow">CURATED RECOMMENDATIONS</div>
              <h2>
                You May <i>Also Like</i>
              </h2>
              <p>Discover other thoughtfully designed sanctuaries at Atithi.</p>
            </div>

            <div className="room-grid">
              {suggestions.map((otherRoom, i) => (
                <Reveal key={otherRoom.id} delay={i * 0.08}>
                  <RoomCard room={otherRoom} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
