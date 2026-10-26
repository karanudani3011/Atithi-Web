import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Eye, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../constants.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmDialog from '../ConfirmDialog.jsx';
import BookingDetailsModal from '../components/BookingDetailsModal.jsx';
import useRealtimeTable from '../../hooks/useRealtimeTable.js';
import { deleteBooking, listBookings, listConflictingPendingBookings, updateBooking, updateBookingStatus } from '../../services/admin/adminBookingService.js';

const formatDate = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const approvedStatuses = new Set(['confirmed', 'checked_in']);

export default function Bookings() {
  const [rows, setRows] = useState([]), [count, setCount] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [search, setSearch] = useState(''), [bookingStatus, setBookingStatus] = useState(''), [paymentStatus, setPaymentStatus] = useState('');
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [page, setPage] = useState(0);
  const [details, setDetails] = useState(null), [deleteTarget, setDeleteTarget] = useState(null), [statusDraft, setStatusDraft] = useState(null), [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await listBookings({ search, bookingStatus, paymentStatus, from, to, page }); setRows(result.data); setCount(result.count); }
    catch (failure) { setError(failure.message); toast.error(failure.message); }
    finally { setLoading(false); }
  }, [search, bookingStatus, paymentStatus, from, to, page]);
  useEffect(() => { refresh(); }, [refresh]);
  const onBookingChange = useCallback((payload) => {
    void refresh();
    if (payload.eventType === 'INSERT' && payload.new?.booking_status === 'pending') {
      toast.success('Navi booking request', { id: `new-booking-${payload.new.id}` });
    }
  }, [refresh]);
  const { liveAvailable } = useRealtimeTable({ table: 'bookings', onChange: onBookingChange });

  async function requestStatusChange(row, key, value) {
    if (String(row[key] || '').toLowerCase() === value) return;
    const draft = { row, key, value, conflicts: [], checking: key === 'booking_status' && approvedStatuses.has(value), autoReject: false };
    setStatusDraft(draft);
    if (draft.checking) {
      try { const conflicts = await listConflictingPendingBookings(row); setStatusDraft(current => current?.row.id === row.id ? { ...current, conflicts, checking: false } : current); }
      catch (failure) { setStatusDraft(null); toast.error(failure.message); }
    }
  }

  async function saveStatus() {
    if (!statusDraft || busy || statusDraft.checking) return;
    setBusy(true);
    try {
      if (statusDraft.key === 'booking_status') {
        await updateBookingStatus(statusDraft.row.id, statusDraft.value, statusDraft.autoReject);
        // TODO: invoke a booking-status email Edge Function when a mail provider is configured.
      }
      else await updateBooking(statusDraft.row.id, { [statusDraft.key]: statusDraft.value });
      toast.success(statusDraft.key === 'booking_status' ? `Booking ${statusDraft.value.replaceAll('_', ' ')}` : 'Payment status updated');
      setStatusDraft(null); await refresh();
    } catch (failure) { toast.error(failure.message); }
    finally { setBusy(false); }
  }

  async function removeBooking() {
    if (!deleteTarget || busy) return;
    setBusy(true);
    try { await deleteBooking(deleteTarget.id); toast.success('Booking deleted'); setDeleteTarget(null); await refresh(); }
    catch (failure) { toast.error(failure.message); }
    finally { setBusy(false); }
  }

  async function exportCSV() {
    try {
      const all = []; let exportPage = 0, total = 0;
      do { const batch = await listBookings({ search, bookingStatus, paymentStatus, from, to, page: exportPage, pageSize: 1000 }); all.push(...batch.data); total = batch.count; exportPage += 1; } while (all.length < total);
      const columns = ['id', 'guest_name', 'guest_email', 'guest_phone', 'room_name', 'check_in', 'check_out', 'nights', 'adults', 'children', 'total_amount', 'booking_status', 'payment_status'];
      const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
      const csv = [columns.join(','), ...all.map(row => columns.map(key => escape(key === 'room_name' ? row.rooms?.room_name : row[key])).join(','))].join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'atithi-bookings.csv'; anchor.click(); URL.revokeObjectURL(url);
    } catch (failure) { toast.error(failure.message); }
  }

  const pageCount = Math.max(1, Math.ceil(count / 20));
  const statusModalOpen = Boolean(statusDraft);
  const statusName = statusDraft?.value.replaceAll('_', ' ');
  const statusBody = statusDraft?.key === 'booking_status' ? <>
    <p>Booking status ne <b>{statusName}</b> karvu chhe?</p>
    {statusDraft.checking ? <p role="status">Checking other requests for these dates…</p> : statusDraft.conflicts.length > 0 && <>
      <p>Same room ane overlapping dates mate aa pending requests pan chhe:</p>
      <ul className="booking-conflict-list">{statusDraft.conflicts.map(row => <li key={row.id}><b>{row.guest_name}</b> · {formatDate(row.check_in)} – {formatDate(row.check_out)}</li>)}</ul>
      <label className="booking-auto-reject"><input type="checkbox" checked={statusDraft.autoReject} onChange={event => setStatusDraft(current => ({ ...current, autoReject: event.target.checked }))}/> Auto-reject these conflicting pending requests</label>
    </>}
  </> : <p>Payment status ne <b>{statusName}</b> karvu chhe?</p>;

  return <div className="admin-page">
    <div className="admin-page-heading"><div><span className="admin-eyebrow">RESERVATIONS</span><h1>Bookings <i>& stays</i></h1><p>Review guest requests and manage approval status.</p></div><button className="admin-btn admin-btn-light" onClick={exportCSV}><Download size={17}/>Export CSV</button></div>
    {liveAvailable === false && <p className="admin-live-unavailable" role="status">Live updates unavailable. Bookings still load normally; refresh to check for new requests.</p>}
    <div className="admin-toolbar booking-filterbar"><label className="admin-search"><Search/><input value={search} onChange={event => { setPage(0); setSearch(event.target.value); }} placeholder="Search name, phone, email or ID"/></label><select value={bookingStatus} onChange={event => { setPage(0); setBookingStatus(event.target.value); }} aria-label="Booking status"><option value="">All booking statuses</option>{BOOKING_STATUS.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select><select value={paymentStatus} onChange={event => { setPage(0); setPaymentStatus(event.target.value); }} aria-label="Payment status"><option value="">All payment statuses</option>{PAYMENT_STATUS.map(value => <option key={value}>{value}</option>)}</select><input aria-label="Check-in from" type="date" value={from} onChange={event => { setPage(0); setFrom(event.target.value); }}/><input aria-label="Check-in to" type="date" value={to} onChange={event => { setPage(0); setTo(event.target.value); }}/></div>
    {error ? <div className="admin-empty"><p>{error}</p><button className="admin-btn admin-btn-light" onClick={refresh}>Retry</button></div>
      : loading ? <div className="admin-room-grid">{[1, 2, 3].map(item => <div className="admin-panel admin-skeleton-card" key={item}><span/><span/><span/></div>)}</div>
      : rows.length ? <>
        <div className="admin-table-wrap bookings-table"><table className="admin-table"><thead><tr>{['Booking ID', 'Guest', 'Phone', 'Room', 'Stay dates', 'Nights', 'Guests', 'Total', 'Booking', 'Payment', 'Created', 'Actions'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><b className="booking-code">{row.id.slice(0, 8).toUpperCase()}</b><small>{row.booking_ref}</small></td><td>{row.guest_name}<small>{row.guest_email}</small></td><td>{row.guest_phone}</td><td>{row.rooms?.room_name || '—'}<small>{row.rooms?.room_type}</small></td><td>{formatDate(row.check_in)}<small>to {formatDate(row.check_out)}</small></td><td>{row.nights}</td><td>{row.adults} + {row.children || 0}</td><td><strong>{money(row.total_amount)}</strong></td><td><select className="admin-status-select" aria-label={`Booking status for ${row.guest_name}`} value={row.booking_status} onChange={event => requestStatusChange(row, 'booking_status', event.target.value)}>{BOOKING_STATUS.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select><StatusBadge status={row.booking_status}/></td><td><select className="admin-status-select" aria-label={`Payment status for ${row.guest_name}`} value={row.payment_status} onChange={event => requestStatusChange(row, 'payment_status', event.target.value)}>{PAYMENT_STATUS.map(value => <option key={value}>{value}</option>)}</select></td><td>{formatDate(row.created_at?.slice(0, 10))}</td><td><div className="admin-table-actions"><button className="admin-icon-btn" aria-label="View booking" onClick={() => setDetails(row)}><Eye size={16}/></button><button className="admin-icon-btn delete" aria-label="Delete booking" onClick={() => setDeleteTarget(row)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>
        <div className="admin-mobile-bookings">{rows.map(row => <article className="admin-panel admin-booking-card" key={row.id}><header><b>{row.booking_ref || row.id.slice(0, 8).toUpperCase()}</b><StatusBadge status={row.booking_status}/></header><h3>{row.guest_name}</h3><p>{row.rooms?.room_name || '—'} · {row.guest_phone}</p><p><CalendarDays size={14}/>{formatDate(row.check_in)} – {formatDate(row.check_out)}</p><strong>{money(row.total_amount)}</strong><div><select aria-label="Booking status" value={row.booking_status} onChange={event => requestStatusChange(row, 'booking_status', event.target.value)}>{BOOKING_STATUS.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select><select aria-label="Payment status" value={row.payment_status} onChange={event => requestStatusChange(row, 'payment_status', event.target.value)}>{PAYMENT_STATUS.map(value => <option key={value}>{value}</option>)}</select><button className="admin-btn admin-btn-light" onClick={() => setDetails(row)}>Details</button><button className="admin-icon-btn delete" aria-label="Delete booking" onClick={() => setDeleteTarget(row)}><Trash2 size={16}/></button></div></article>)}</div>
        <div className="admin-pagination"><span>{count} bookings · Page {page + 1} of {pageCount}</span><button className="admin-icon-btn" disabled={!page} onClick={() => setPage(value => value - 1)} aria-label="Previous page"><ChevronLeft/></button><button className="admin-icon-btn" disabled={page + 1 >= pageCount} onClick={() => setPage(value => value + 1)} aria-label="Next page"><ChevronRight/></button></div>
      </> : <div className="admin-empty"><CalendarDays/><h2>No bookings found</h2><p>Booking requests appear here when a guest submits dates.</p></div>}
    <BookingDetailsModal booking={details} onClose={() => setDetails(null)}/>
    <ConfirmDialog open={statusModalOpen} title="Confirm status change" confirmText={busy ? 'Saving…' : 'Confirm change'} danger={statusDraft?.value === 'rejected' || statusDraft?.value === 'cancelled'} onCancel={() => !busy && setStatusDraft(null)} onConfirm={saveStatus}>{statusBody}</ConfirmDialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete this booking?" confirmText={busy ? 'Deleting…' : 'Delete booking'} onCancel={() => !busy && setDeleteTarget(null)} onConfirm={removeBooking}>This permanently removes this booking record.</ConfirmDialog>
  </div>;
}
