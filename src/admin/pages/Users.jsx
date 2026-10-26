import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, UserRoundCheck, UserRoundX } from 'lucide-react';
import toast from 'react-hot-toast';
import { listUsers, setUserActive } from '../../services/admin/adminUserService.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import useRealtimeTable from '../../hooks/useRealtimeTable.js';

const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listUsers({ search, page });
      setRows(response?.data || []);
      setPagination(response?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (failure) {
      const message = failure?.message || 'Could not load users. Please try again.';
      setError(message);
      toast.error(message, { id: 'admin-users-error' });
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { refresh(); }, [refresh]);
  const { liveAvailable } = useRealtimeTable({ table: 'users', onChange: () => { void refresh(); } });

  async function saveStatus() {
    if (!pending) return;
    setBusy(true);
    try {
      await setUserActive(pending.id, !pending.is_active);
      toast.success(pending.is_active ? 'User blocked' : 'User unblocked');
      setPending(null);
      await refresh();
    } catch (failure) {
      toast.error(failure?.message || 'Could not update this user.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="admin-page">
    <div className="admin-page-heading">
      <div><span className="admin-eyebrow">GUEST ACCOUNTS</span><h1>Users <i>& accounts</i></h1><p>Search and manage registered Atithi users.</p></div>
      <span className="admin-count-pill">{pagination.total} users</span>
    </div>
    {liveAvailable === false && <p className="admin-live-unavailable" role="status">Live updates unavailable. Users still load normally.</p>}
    <div className="admin-toolbar booking-filterbar">
      <label className="admin-search"><Search/><input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Search name or email" aria-label="Search users"/></label>
    </div>
    {error ? <div className="admin-empty"><p>{error}</p><button className="admin-btn admin-btn-light" onClick={refresh}>Retry</button></div>
      : loading ? <div className="admin-room-grid">{[1, 2, 3].map((item) => <div className="admin-panel admin-skeleton-card" key={item}><span/><span/><span/></div>)}</div>
      : rows.length ? <>
        <div className="admin-table-wrap bookings-table"><table className="admin-table"><thead><tr>{['Name', 'Email', 'Status', 'Last login', 'Joined', 'Actions'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td><strong>{row.name || '—'}</strong></td><td>{row.email || '—'}</td>
            <td><span className={`admin-state-badge ${row.is_active ? 'green' : 'red'}`}>{row.is_active ? 'Active' : 'Blocked'}</span></td>
            <td>{formatDate(row.last_login_at)}</td><td>{formatDate(row.created_at)}</td>
            <td><button className="admin-icon-btn" aria-label={`${row.is_active ? 'Block' : 'Unblock'} ${row.name || row.email}`} title={row.is_active ? 'Block user' : 'Unblock user'} onClick={() => setPending(row)}>{row.is_active ? <UserRoundX size={16}/> : <UserRoundCheck size={16}/>}</button></td>
          </tr>)}
        </tbody></table></div>
        <div className="admin-mobile-bookings">{rows.map((row) => <article className="admin-panel admin-booking-card" key={row.id}>
          <header><strong>{row.name || '—'}</strong><span className={`admin-state-badge ${row.is_active ? 'green' : 'red'}`}>{row.is_active ? 'Active' : 'Blocked'}</span></header>
          <p>{row.email}</p><p>Last login: {formatDate(row.last_login_at)}</p><p>Joined: {formatDate(row.created_at)}</p>
          <button className="admin-btn admin-btn-light" onClick={() => setPending(row)}>{row.is_active ? 'Block' : 'Unblock'}</button>
        </article>)}</div>
        <div className="admin-pagination"><span>{pagination.total} users · Page {page} of {pagination.pages}</span>
          <button className="admin-icon-btn" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft/></button>
          <button className="admin-icon-btn" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight/></button>
        </div>
      </> : <div className="admin-empty"><h2>No users found</h2><p>Try another name or email.</p></div>}

    <ConfirmDialog open={Boolean(pending)} title={pending?.is_active ? 'Block this user?' : 'Unblock this user?'} confirmText={busy ? 'Please wait…' : pending?.is_active ? 'Block user' : 'Unblock user'} onCancel={() => setPending(null)} onConfirm={saveStatus}>
      {pending?.is_active ? 'The user will be marked inactive.' : 'The user will be marked active again.'}
    </ConfirmDialog>
  </div>;
}
