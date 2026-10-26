import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, LoaderCircle, CalendarDays } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';
import { formatINR } from '../services/roomService.js';
import './TrackBooking.css';

const statusCopy = {
  pending: ['Pending approval', 'Tamari booking request admin approval mate pending chhe.'],
  confirmed: ['Confirmed', 'Tamari booking confirm thai gai chhe.'],
  checked_in: ['Checked in', 'Tamaro stay chalu chhe.'],
  checked_out: ['Completed', 'Tamaro stay complete thai gayo chhe.'],
  rejected: ['Rejected', 'Aa booking request approve thai nathi. Vadhare mahiti mate Atithi sathe sampark karo.'],
  cancelled: ['Cancelled', 'Aa booking cancel karvama aavi chhe.'],
};

export default function TrackBooking() {
  const [params] = useSearchParams();
  const [reference, setReference] = useState(params.get('ref') || '');
  const [email, setEmail] = useState('');
  const [row, setRow] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setRow(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('track_booking', { p_ref: reference.trim(), p_email: email.trim() });
      if (rpcError) throw rpcError;
      const booking = Array.isArray(data) ? data[0] : data;
      if (!booking) throw new Error('Booking reference ane email match nathi thayu. Details check karo.');
      setRow(booking);
    } catch (failure) { setError(failure?.message || 'Booking track na thayu. Fari try karo.'); }
    finally { setBusy(false); }
  }

  const [statusLabel, statusMessage] = statusCopy[row?.booking_status] || ['Booking status', 'Your booking status is being updated.'];
  return <main className="track-booking-page">
    <span className="room-detail-eyebrow">ATITHI STAY</span><h1>Track your <i>booking</i></h1><p>Booking reference ane booking vakhatnu email enter karo.</p>
    <form className="track-booking-form" onSubmit={submit}>
      <label>Booking reference<input required value={reference} onChange={event => setReference(event.target.value.toUpperCase())} placeholder="ATH-20261026-AB12" autoComplete="off"/></label>
      <label>Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email"/></label>
      {error && <p className="track-booking-error" role="alert">{error}</p>}
      <button className="btn gold" disabled={busy}>{busy ? <LoaderCircle className="booking-spin"/> : <Search size={16}/>}Track booking</button>
    </form>
    {row && <article className="track-booking-result">
      <div><span>BOOKING REFERENCE</span><strong>{row.booking_ref}</strong></div><h2>{row.room_name}</h2>
      <p><CalendarDays size={16}/>{row.check_in} – {row.check_out}</p><p>{row.adults} adults · {row.children} children</p>
      <div className="track-booking-status"><span>{statusLabel}</span><strong>{formatINR(row.total_amount)}</strong></div><p className="track-booking-message">{statusMessage}</p>
    </article>}
    <Link className="track-booking-back" to="/rooms">Back to Rooms</Link>
  </main>;
}
