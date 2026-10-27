import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Eye, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../constants.js';
import { BOOKING_SOURCES, getBookingSource } from '../../config/bookingSources.js';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusDropdown from '../../components/admin/StatusDropdown.jsx';
import ConfirmDialog from '../ConfirmDialog.jsx';
import BookingDetailsModal from '../components/BookingDetailsModal.jsx';
import useRealtimeTable from '../../hooks/useRealtimeTable.js';
import { deleteBooking, listBookings, listConflictingPendingBookings, updateBooking, updateBookingStatus } from '../../services/admin/adminBookingService.js';
import WalkInReceipt from '../components/WalkInReceipt.jsx';

const formatDate = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const compactDate = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const bookingStatusOptions = [
  { value: 'pending', label: 'Pending', color: 'amber' },
  { value: 'confirmed', label: 'Confirmed', color: 'green' },
  { value: 'checked_in', label: 'Checked-in', color: 'blue' },
  { value: 'checked_out', label: 'Checked-out', color: 'grey' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
];
const paymentStatusOptions = [
  { value: 'pending', label: 'Pending', color: 'amber' },
  { value: 'partial', label: 'Partial', color: 'orange' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'failed', label: 'Failed', color: 'red' },
  { value: 'refunded', label: 'Refunded', color: 'grey' },
];
const approvedStatuses = new Set(['confirmed', 'checked_in']);

export default function Bookings() {
  const [rows, setRows] = useState([]), [count, setCount] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [search, setSearch] = useState(''), [bookingStatus, setBookingStatus] = useState(''), [paymentStatus, setPaymentStatus] = useState('');
  const [source, setSource] = useState('');
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [page, setPage] = useState(0);
  const [details, setDetails] = useState(null), [deleteTarget, setDeleteTarget] = useState(null), [statusDraft, setStatusDraft] = useState(null), [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await listBookings({ search, bookingStatus, paymentStatus, source, from, to, page }); setRows(result.data); setCount(result.count); }
    catch (failure) { setError(failure.message); toast.error(failure.message); }
    finally { setLoading(false); }
  }, [search, bookingStatus, paymentStatus, source, from, to, page]);
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

  const clearFilters = () => { setSearch(''); setBookingStatus(''); setPaymentStatus(''); setSource(''); setFrom(''); setTo(''); setPage(0); };

  async function exportCSV() {
    try {
      const all = []; let exportPage = 0, total = 0;
      do { const batch = await listBookings({ search, bookingStatus, paymentStatus, source, from, to, page: exportPage, pageSize: 1000 }); all.push(...batch.data); total = batch.count; exportPage += 1; } while (all.length < total);
      const columns = ['id', 'guest_name', 'guest_email', 'guest_phone', 'room_name', 'check_in', 'check_out', 'nights', 'adults', 'children', 'total_amount', 'booking_status', 'payment_status', 'source', 'external_ref'];
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
    <div className="admin-page-heading"><div><span className="admin-eyebrow">RESERVATIONS</span><h1>Bookings <i>& stays</i></h1><p>Review guest requests and manage approval status.</p></div><div className="bookings-heading-actions"><Link className="admin-btn admin-btn-gold" to="/admin/bookings/new"><Plus size={17}/>New Walk-in Booking</Link><button className="admin-btn admin-btn-light" onClick={exportCSV}><Download size={17}/>Export CSV</button></div></div>
    {liveAvailable === false && <p className="admin-live-unavailable" role="status">Live updates unavailable. Bookings still load normally; refresh to check for new requests.</p>}
    <button className="booking-mobile-filter-toggle" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(value => !value)}><SlidersHorizontal size={17}/> Filters</button>
    {filtersOpen && <button className="booking-filter-backdrop" type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)}/>}
    <div className={`admin-toolbar booking-filterbar${filtersOpen ? ' is-open' : ''}`}><div className="booking-filter-sheet-heading"><strong>Filters</strong><button type="button" onClick={() => setFiltersOpen(false)}>Done</button></div><label className="admin-search"><Search/><input value={search} onChange={event => { setPage(0); setSearch(event.target.value); }} placeholder="Search name, phone, email, source or ref"/></label><select value={bookingStatus} onChange={event => { setPage(0); setBookingStatus(event.target.value); }} aria-label="Booking status"><option value="">All booking statuses</option>{BOOKING_STATUS.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select><select value={paymentStatus} onChange={event => { setPage(0); setPaymentStatus(event.target.value); }} aria-label="Payment status"><option value="">All payment statuses</option>{PAYMENT_STATUS.map(value => <option key={value}>{value}</option>)}</select><select value={source} onChange={event => { setPage(0); setSource(event.target.value); }} aria-label="Booking source"><option value="">All Sources</option>{BOOKING_SOURCES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select><input aria-label="Check-in from" type="date" value={from} onChange={event => { setPage(0); setFrom(event.target.value); }}/><input aria-label="Check-in to" type="date" value={to} onChange={event => { setPage(0); setTo(event.target.value); }}/></div>
    {error ? <div className="admin-empty"><p>{error}</p><button className="admin-btn admin-btn-light" onClick={refresh}>Retry</button></div>
      : loading ? <><div className="admin-table-wrap bookings-table"><table className="admin-table"><thead><tr>{['Booking ID', 'Guest', 'Room', 'Stay', 'Guests', 'Total', 'Booking', 'Payment', 'Source', 'Actions'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{[1, 2, 3, 4, 5].map(item => <tr className="booking-skeleton-row" key={item}>{Array.from({ length: 10 }, (_, index) => <td key={index}><span/></td>)}</tr>)}</tbody></table></div><div className="admin-mobile-bookings">{[1,2,3,4,5].map(item=><article className="admin-panel admin-booking-card booking-card-skeleton" key={item}><i/><i/><i/></article>)}</div></>
      : rows.length ? <>
        <div className="admin-table-wrap bookings-table"><table className="admin-table"><thead><tr>{['Booking ID', 'Guest', 'Room', 'Stay', 'Guests', 'Total', 'Booking', 'Payment', 'Source', 'Actions'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}>
          <td className="booking-id-cell" title={row.booking_ref || row.id}><b className="booking-code">{row.id.slice(0, 8).toUpperCase()}</b></td>
          <td className="booking-guest-cell" title={`${row.guest_name || ''}${row.guest_phone ? ` · ${row.guest_phone}` : ''}`}><b>{row.guest_name || '—'}</b><small className="booking-email" title={row.guest_email || ''}>{row.guest_email || 'Email unavailable'}</small></td>
          <td className="booking-room-cell" title={`${row.rooms?.room_name || 'Room unavailable'} · ${row.rooms?.room_type || ''}`}><b>{row.rooms?.room_name || '—'}</b><small>{row.rooms?.room_type || 'Room'}</small></td>
          <td className="booking-stay-cell" title={`${formatDate(row.check_in)} to ${formatDate(row.check_out)} · ${row.nights || 0} night${Number(row.nights) === 1 ? '' : 's'}`}><b>{compactDate(row.check_in)} to {compactDate(row.check_out)}</b><small>{row.nights || 0} night{Number(row.nights) === 1 ? '' : 's'}</small></td>
          <td className="booking-centered-cell booking-guests" title={`${row.adults || 1} Adult, ${row.children || 0} Child`}>{row.adults || 1}A+{row.children || 0}C</td>
          <td className="booking-total-cell">{money(row.total_amount)}</td>
          <td><StatusDropdown value={row.booking_status} options={bookingStatusOptions} onChange={value => requestStatusChange(row, 'booking_status', value)} disabled={busy} loading={busy && statusDraft?.row.id === row.id && statusDraft?.key === 'booking_status'}/></td>
          <td><StatusDropdown value={row.payment_status} options={paymentStatusOptions} onChange={value => requestStatusChange(row, 'payment_status', value)} disabled={busy} loading={busy && statusDraft?.row.id === row.id && statusDraft?.key === 'payment_status'}/></td>
          <td className="booking-source-cell" title={row.external_ref || getBookingSource(row.source).label}><span className={`booking-source-pill source-${getBookingSource(row.source).color}`}>{getBookingSource(row.source).label}</span></td>
          <td className="booking-actions-cell"><div className="booking-actions"><button className="admin-icon-btn" title="View booking details" aria-label="View booking details" onClick={() => setDetails(row)}><Eye size={16}/></button><button className="admin-icon-btn delete" title={`Delete booking ${row.booking_ref || row.id}`} aria-label={`Delete booking ${row.booking_ref || row.id}`} onClick={() => setDeleteTarget(row)}><Trash2 size={16}/></button></div></td>
        </tr>)}</tbody></table></div>
        <div className="admin-mobile-bookings">{rows.map(row => <article className="admin-panel admin-booking-card" key={row.id}><header><b>{row.booking_ref || row.id.slice(0, 8).toUpperCase()}</b><span><StatusBadge status={row.booking_status}/></span></header><h3>{row.guest_name}</h3><p>{row.rooms?.room_name || '—'} · {row.guest_phone}</p><p><CalendarDays size={14}/>{formatDate(row.check_in)} – {formatDate(row.check_out)}</p><span className={`booking-source-pill source-${getBookingSource(row.source).color}`}>{getBookingSource(row.source).label}</span><strong>{money(row.total_amount)}</strong><div><StatusDropdown value={row.booking_status} options={bookingStatusOptions} onChange={value => requestStatusChange(row, 'booking_status', value)} disabled={busy} loading={busy && statusDraft?.row.id === row.id && statusDraft?.key === 'booking_status'}/><StatusDropdown value={row.payment_status} options={paymentStatusOptions} onChange={value => requestStatusChange(row, 'payment_status', value)} disabled={busy} loading={busy && statusDraft?.row.id === row.id && statusDraft?.key === 'payment_status'}/><button className="admin-btn admin-btn-light" onClick={() => setDetails(row)}>Details</button><button className="admin-icon-btn delete" aria-label="Delete booking" onClick={() => setDeleteTarget(row)}><Trash2 size={16}/></button></div></article>)}</div>
        <div className="admin-pagination"><span>{count} bookings - Page {page + 1} of {pageCount}</span><button className="admin-icon-btn" disabled={!page} onClick={() => setPage(value => value - 1)} aria-label="Previous page"><ChevronLeft/></button><button className="admin-icon-btn" disabled={page + 1 >= pageCount} onClick={() => setPage(value => value + 1)} aria-label="Next page"><ChevronRight/></button></div>
      </> : <div className="admin-empty"><CalendarDays/><h2>No bookings found</h2><p>Try adjusting your search or filters.</p><button className="admin-btn admin-btn-light" onClick={clearFilters}>Clear filters</button></div>}
    <BookingDetailsModal booking={details} onClose={() => setDetails(null)} onPrint={row => setReceipt(row)}/>
    <WalkInReceipt booking={receipt} onClose={() => setReceipt(null)}/>
    <ConfirmDialog open={statusModalOpen} title="Confirm status change" confirmText={busy ? 'Saving…' : 'Confirm change'} danger={statusDraft?.value === 'rejected' || statusDraft?.value === 'cancelled'} onCancel={() => !busy && setStatusDraft(null)} onConfirm={saveStatus}>{statusBody}</ConfirmDialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title={`Delete booking ${deleteTarget?.booking_ref || ''}?`} confirmText={busy ? 'Deleting…' : 'Delete booking'} onCancel={() => !busy && setDeleteTarget(null)} onConfirm={removeBooking}>This cannot be undone.</ConfirmDialog>
  </div>;
}
