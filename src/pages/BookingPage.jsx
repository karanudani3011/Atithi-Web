import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarDays, Check, Users } from 'lucide-react';
import Banner from '../components/Banner.jsx';
import Img from '../components/Img.jsx';
import Reveal from '../components/Reveal.jsx';
import useRooms from '../hooks/useRooms.js';
import { saveBooking } from '../services/bookingService.js';
import { getRoomCover, getRoomAmenities, isRoomBookable, roomCapacity, roomPrice } from '../lib/roomUtils.js';

const today = new Date().toISOString().slice(0, 10);

export default function BookingPage() {
  const loc = useLocation();
  const roomState = useRooms();
  const rooms = roomState.rooms;
  const searchParams = new URLSearchParams(loc.search);
  const queryRoom = searchParams.get('room');
  const initial = loc.state || {};

  const bookable = rooms.filter(
    isRoomBookable
  );

  const initialRoomId =
    queryRoom ||
    initial.roomId ||
    (bookable.length > 0 ? bookable[0].id : rooms[0]?.id || 1);

  const [data, setData] = useState({
    name: '',
    phone: '',
    email: '',
    roomId: initialRoomId,
    checkin: initial.checkin || '',
    checkout: initial.checkout || '',
    guests: Number(initial.guests) || 2,
    requests: ''
  });

  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(null);

  // Sync roomId when query string (?room=...) changes or on room list change
  useEffect(() => {
    if (queryRoom) {
      setData((prev) => ({ ...prev, roomId: queryRoom }));
    } else if (loc.state?.roomId) {
      setData((prev) => ({ ...prev, roomId: loc.state.roomId }));
    }
  }, [queryRoom, loc.state]);

  const room =
    rooms.find((r) => String(r.id) === String(data.roomId)) ||
    bookable[0] ||
    rooms[0];

  useEffect(() => {
    if (
      bookable.length &&
      !bookable.some((r) => String(r.id) === String(data.roomId))
    ) {
      setData((prev) => ({ ...prev, roomId: bookable[0].id }));
    }
  }, [rooms]);

  const nights = useMemo(() => {
    if (!data.checkin || !data.checkout) return 0;
    const diff = new Date(data.checkout) - new Date(data.checkin);
    return Math.max(0, Math.round(diff / 86400000));
  }, [data.checkin, data.checkout]);

  const subtotal = room ? roomPrice(room) * nights : 0;
  const gst = Math.round(subtotal * 0.12);
  const total = subtotal + gst;

  const update = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: name === 'guests' || name === 'roomId' ? Number(value) : value
    }));
  };

  function submit(e) {
    e.preventDefault();

    if (!room || room.status === 'Maintenance' || room.status === 'Booked') {
      setError(
        'This room is not available to book right now. Please choose another room.'
      );
      return;
    }

    if (!data.checkin || !data.checkout || nights < 1) {
      setError('Please choose a check-out date after your check-in date.');
      return;
    }

    if (Number(data.guests) > roomCapacity(room)) {
      setError(
        `This room welcomes up to ${roomCapacity(room)} guests. Please choose a room with more space.`
      );
      return;
    }

    setError('');
    const id = `ATH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const result = {
      ...data,
      roomId: room.id,
      roomName: room.room_name,
      roomImage: getRoomCover(room),
      nights,
      subtotal,
      gst,
      total,
      bookingId: id,
      createdAt: new Date().toISOString()
    };

    saveBooking(result);
    setConfirmed(result);
  }

  if (!room) {
    return (
      <>
        <Banner
          eyebrow="A FEW DETAILS, THEN WE'LL BE READY"
          title={
            <>
              Make it <i>your stay</i>
            </>
          }
          subtitle="There are no rooms available to book right now. Please check back soon."
        />
      </>
    );
  }

  return (
    <>
      <Banner
        eyebrow="A FEW DETAILS, THEN WE'LL BE READY"
        title={
          <>
            Make it <i>your stay</i>
          </>
        }
        subtitle="Let us take care of the rest."
      />

      <section className="booking-layout section">
        <Reveal>
          <div className="form-card">
            <div className="form-heading">
              <div>
                <div className="eyebrow">BOOK DIRECT, STAY HAPPY</div>
                <h2>Your reservation</h2>
              </div>
              <CalendarDays />
            </div>

            <form className="field-grid" onSubmit={submit}>
              <label className="span-two">
                Full name
                <input
                  name="name"
                  value={data.name}
                  onChange={update}
                  required
                  placeholder="Your full name"
                />
              </label>

              <label>
                Phone
                <input
                  type="tel"
                  name="phone"
                  value={data.phone}
                  onChange={update}
                  required
                  placeholder="+91 98765 43210"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={data.email}
                  onChange={update}
                  required
                  placeholder="you@example.com"
                />
              </label>

              <label className="span-two">
                Choose your room
                <select
                  name="roomId"
                  value={room.id}
                  onChange={update}
                  aria-label="Select room"
                >
                  {bookable.map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.room_name} · ₹{roomPrice(r).toLocaleString('en-IN')} / night
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Check-in
                <input
                  type="date"
                  name="checkin"
                  value={data.checkin}
                  min={today}
                  onChange={update}
                  required
                />
              </label>

              <label>
                Check-out
                <input
                  type="date"
                  name="checkout"
                  value={data.checkout}
                  min={data.checkin || today}
                  onChange={update}
                  required
                />
              </label>

              <label>
                Guests
                <select
                  name="guests"
                  value={data.guests}
                  onChange={update}
                  aria-label="Number of guests"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </label>

              <label className="span-two">
                Special requests
                <textarea
                  name="requests"
                  rows="3"
                  value={data.requests}
                  onChange={update}
                  placeholder="Anything we can prepare for your arrival?"
                />
              </label>

              {error && <p className="form-error span-two">{error}</p>}

              <button className="btn gold span-two" type="submit">
                Confirm Booking <Check size={17} />
              </button>

              <p className="form-note span-two">
                Zero advance payment collected in this demo. Guaranteed reservation.
              </p>
            </form>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <aside className="booking-summary">
            <h3>Your stay at a glance</h3>
            <Img src={getRoomCover(room)} alt={room.room_name} />

            <div className="summary-room">
              <div>
                <span>{room.room_type}</span>
                <h2>{room.room_name}</h2>
              </div>
              <strong>★ {room.rating}</strong>
            </div>

            <div className="summary-info">
              <span>
                <CalendarDays size={17} />
                {nights || '—'} {nights === 1 ? 'night' : 'nights'}
              </span>
              <span>
                <Users size={17} />
                {data.guests} {data.guests === 1 ? 'guest' : 'guests'}
              </span>
            </div>

            <div className="summary-line">
              <span>
                ₹{roomPrice(room).toLocaleString('en-IN')} × {nights || 0} nights
              </span>
              <b>₹{subtotal.toLocaleString('en-IN')}</b>
            </div>

            <div className="summary-line">
              <span>GST (12%)</span>
              <b>₹{gst.toLocaleString('en-IN')}</b>
            </div>

            <div className="summary-total">
              <span>Total incl. GST</span>
              <strong>₹{total.toLocaleString('en-IN')}</strong>
            </div>

            <small>Warm hospitality included, always.</small>
          </aside>
        </Reveal>
      </section>

      {confirmed && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmed-title"
        >
          <div className="confirmed-card">
            <div className="success-check">
              <Check />
            </div>
            <div className="eyebrow" style={{ justifyContent: 'center' }}>
              IT'S OFFICIAL
            </div>
            <h2 id="confirmed-title">Booking Confirmed!</h2>
            <p>Your Atithi welcome is waiting.</p>

            <div className="booking-id">{confirmed.bookingId}</div>

            <p>
              {confirmed.roomName} · {confirmed.nights}{' '}
              {confirmed.nights === 1 ? 'night' : 'nights'}
            </p>

            <strong className="confirmed-total">
              ₹{confirmed.total.toLocaleString('en-IN')} incl. GST
            </strong>

            <button
              className="btn gold"
              onClick={() => setConfirmed(null)}
              style={{ width: '100%' }}
            >
              Wonderful, thank you
            </button>
          </div>
        </div>
      )}
    </>
  );
}
