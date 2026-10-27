import { Printer, X } from 'lucide-react';
import { getBookingSource } from '../../config/bookingSources.js';

const dateLabel = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function WalkInReceipt({ booking, onClose }) {
  if (!booking) return null;
  const nights = Number(booking.nights || 0);
  const subtotal = Number(booking.room_price || 0);
  const discount = Math.max(0, subtotal + Number(booking.taxes_amount || 0) - Number(booking.total_amount || 0));
  const paid = Number(booking.advance_paid || 0);
  const source = getBookingSource(booking.source);
  return <div className="admin-modal-backdrop walkin-receipt-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="admin-dialog walkin-receipt" role="dialog" aria-modal="true" aria-labelledby="walkin-receipt-title">
      <div className="walkin-receipt-actions"><button type="button" className="admin-icon-btn" aria-label="Close receipt" onClick={onClose}><X size={17}/></button></div>
      <header className="walkin-receipt-brand"><span className="admin-eyebrow">ATITHI HOTEL &amp; RESORT</span><h2 id="walkin-receipt-title">Booking receipt</h2><small>{source.label} · {dateLabel(booking.created_at?.slice(0, 10))}</small></header>
      <div className="walkin-receipt-meta"><div><small>Booking ID</small><b>{booking.booking_ref || booking.id}</b></div><div><small>Source</small><b>{source.label}</b></div>{booking.external_ref && <div><small>External Ref</small><b>{booking.external_ref}</b></div>}<div><small>Guest</small><b>{booking.guest_name}</b></div><div><small>Phone</small><b>{booking.guest_phone}</b></div>{booking.guest_email && <div><small>Email</small><b>{booking.guest_email}</b></div>}<div><small>Room</small><b>{booking.rooms?.room_name || booking.room_name || '—'} · {booking.rooms?.room_type || booking.room_type || 'Room'}</b></div><div><small>Stay</small><b>{dateLabel(booking.check_in)} – {dateLabel(booking.check_out)} · {nights} night{nights === 1 ? '' : 's'}</b></div></div>
      <div className="walkin-receipt-totals"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Tax</span><b>{money(booking.taxes_amount)}</b></div>{discount > 0 && <div><span>Discount</span><b>−{money(discount)}</b></div>}<div className="walkin-receipt-total"><span>Total</span><b>{money(booking.total_amount)}</b></div><div><span>Advance paid · {String(booking.payment_method || '').toUpperCase()}</span><b>{money(paid)}</b></div><div><span>Balance due</span><b>{money(Math.max(0, Number(booking.total_amount || 0) - paid))}</b></div></div>
      {booking.special_requests && <p className="walkin-receipt-note"><b>Special requests:</b> {booking.special_requests}</p>}
      <footer className="walkin-receipt-footer">Thank you for choosing Atithi. We wish you a pleasant stay.</footer>
      <div className="walkin-receipt-actions"><button type="button" className="admin-btn admin-btn-gold" onClick={() => window.print()}><Printer size={17}/>Print receipt</button></div>
    </section>
  </div>;
}
