import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, RotateCw, XCircle } from 'lucide-react';
import { formatINR } from '../services/roomService.js';
import { supabase } from '../lib/supabaseClient.js';
import './MyBookings.css';

const statusLabel = (booking) => {
  if (booking.display_status) return booking.display_status;
  if (['cancelled', 'rejected'].includes(booking.booking_status)) return 'Cancelled';
  if (booking.booking_status === 'checked_out') return 'Completed';
  return 'Upcoming';
};
const dateLabel = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function MyBookings({ user }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyRef, setBusyRef] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data, error: queryError } = await supabase.from('bookings')
        .select('*, rooms(room_name,room_type)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      const today = new Date();
      const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() + 1);
      const cutoffDate = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
      setRows((data || []).map(row => ({
        ...row,
        room_name: row.rooms?.room_name || row.room_name,
        room_type: row.rooms?.room_type || row.room_type,
        display_status: ['cancelled', 'rejected'].includes(row.booking_status) ? 'Cancelled'
          : row.booking_status === 'checked_out' || row.check_out < localToday ? 'Completed' : 'Upcoming',
        cancellation_allowed: ['pending', 'confirmed'].includes(row.booking_status) && row.check_in > cutoffDate,
      })));
    } catch (failure) { setError(failure?.message || 'Your bookings could not load.'); }
    finally { setLoading(false); }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  async function cancel(bookingRef) {
    setBusyRef(bookingRef); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ bookingRef }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'This booking could not be cancelled.');
      await load();
    } catch (failure) { setError(failure?.message || 'This booking could not be cancelled.'); }
    finally { setBusyRef(''); }
  }

  return <main className="my-bookings-page">
    <span className="room-detail-eyebrow">YOUR ATITHI STAYS</span><h1>My <i>Bookings</i></h1><p>Upcoming stays and past visits in one place.</p>
    {loading ? <div className="my-booking-state" role="status">Loading your bookings…</div> : error ? <div className="my-booking-state" role="alert"><h2>Your bookings could not load</h2><p>{error}</p><button className="btn gold" type="button" onClick={load}>Try again</button></div> : rows.length ? <div className="my-booking-list">{rows.map(row => {
      const label = statusLabel(row);
      return <article key={row.booking_ref}>
        <div className="my-booking-icon"><CalendarDays/></div>
        <div className="my-booking-copy">
          <header><strong>{row.room_name || row.room_type || 'Atithi room'}</strong><span className={`my-booking-badge ${label.toLowerCase()}`}>{label}</span></header>
          <small>Booking reference · {row.booking_ref}</small>
          <span>{dateLabel(row.check_in)} – {dateLabel(row.check_out)} · {row.adults} adults, {row.children || 0} children</span>
          <span>Booked on {dateLabel(row.created_at?.slice(0, 10))} · Payment {row.payment_status || 'pending'}</span>
          <span>Booking status: {String(row.booking_status || 'pending').replaceAll('_', ' ')}</span>
        </div>
        <div className="my-booking-total"><b>{formatINR(row.total_amount)}</b>{row.cancellation_allowed && <button type="button" disabled={Boolean(busyRef)} onClick={() => cancel(row.booking_ref)}><XCircle size={15}/>{busyRef === row.booking_ref ? 'Cancelling…' : 'Cancel booking'}</button>}</div>
      </article>;
    })}</div> : <div className="my-booking-state"><h2>No bookings yet</h2><p>Your next stay is waiting to be planned.</p><Link to="/rooms" className="btn gold">Book a room</Link></div>}
    {!loading && <button className="my-bookings-retry" type="button" onClick={load}><RotateCw size={14}/> Refresh bookings</button>}
  </main>;
}
