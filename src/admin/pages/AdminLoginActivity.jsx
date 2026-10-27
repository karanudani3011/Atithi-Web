import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, History, Search, Users } from 'lucide-react';
import { adminSupabase } from '../../lib/adminSupabase.js';
import '../admin.css';
import './AdminLoginActivity.css';

const PAGE_SIZE = 20;

function indiaTodayStart() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return new Date(`${values.year}-${values.month}-${values.day}T00:00:00+05:30`);
}

function getFilterStart(filter) {
  const days = { today: 1, week: 7, month: 30 }[filter];
  if (!days) return null;
  return new Date(indiaTodayStart().getTime() - (days - 1) * 24 * 60 * 60 * 1000);
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(value));
}

function parseDevice(userAgent = '') {
  const ua = userAgent.toLowerCase();
  const browser = /edg\//.test(ua) ? 'Edge'
    : /firefox\//.test(ua) ? 'Firefox'
      : /chrome\//.test(ua) ? 'Chrome'
        : /safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /windows/.test(ua) ? 'Windows'
    : /android/.test(ua) ? 'Android'
      : /iphone|ipad|ipod/.test(ua) ? 'iOS'
        : /mac os/.test(ua) ? 'macOS'
          : /linux/.test(ua) ? 'Linux' : 'Device';
  return `${browser} · ${os}`;
}

function escapeFilterText(value) {
  return value.replace(/[,%()]/g, ' ').trim();
}

export default function AdminLoginActivity() {
  const [activeTab, setActiveTab] = useState('logins');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [summary, setSummary] = useState({ registered: 0, today: 0, uniqueToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLoginRows = useCallback(async () => {
    let query = adminSupabase.from('login_history')
      .select('id,user_id,full_name,email,role,user_agent,logged_in_at', { count: 'exact' })
      .order('logged_in_at', { ascending: false });
    const start = getFilterStart(timeFilter);
    if (start) query = query.gte('logged_in_at', start.toISOString());
    if (roleFilter !== 'all') query = query.eq('role', roleFilter);
    const queryText = escapeFilterText(search);
    if (queryText) query = query.or(`full_name.ilike.%${queryText}%,email.ilike.%${queryText}%`);
    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error: queryError } = await query.range(from, from + PAGE_SIZE - 1);
    if (queryError) throw queryError;
    setRows(data || []);
    setTotal(count || 0);
  }, [page, roleFilter, search, timeFilter]);

  const fetchRegisteredRows = useCallback(async () => {
    let query = adminSupabase.from('profiles')
      .select('id,full_name,email,role,created_at', { count: 'exact' })
      .order('created_at', { ascending: false });
    if (roleFilter !== 'all') query = query.eq('role', roleFilter);
    const queryText = escapeFilterText(search);
    if (queryText) query = query.or(`full_name.ilike.%${queryText}%,email.ilike.%${queryText}%`);
    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error: queryError } = await query.range(from, from + PAGE_SIZE - 1);
    if (queryError) throw queryError;
    setRows(data || []);
    setTotal(count || 0);
  }, [page, roleFilter, search]);

  const fetchSummary = useCallback(async () => {
    const start = indiaTodayStart().toISOString();
    const [profilesResult, todayResult] = await Promise.all([
      adminSupabase.from('profiles').select('id', { count: 'exact', head: true }),
      adminSupabase.from('login_history').select('id', { count: 'exact', head: true }).gte('logged_in_at', start),
    ]);
    const failed = profilesResult.error || todayResult.error;
    if (failed) throw failed;

    const uniqueUsers = new Set();
    for (let from = 0; ; from += 1000) {
      const { data, error: usersError } = await adminSupabase.from('login_history')
        .select('user_id').gte('logged_in_at', start).range(from, from + 999);
      if (usersError) throw usersError;
      (data || []).forEach((row) => { if (row.user_id) uniqueUsers.add(row.user_id); });
      if (!data || data.length < 1000) break;
    }

    setSummary({
      registered: profilesResult.count || 0,
      today: todayResult.count || 0,
      uniqueToday: uniqueUsers.size,
    });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([activeTab === 'logins' ? fetchLoginRows() : fetchRegisteredRows(), fetchSummary()]);
    } catch (failure) {
      setError(failure?.message || 'Could not load login activity. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchLoginRows, fetchRegisteredRows, fetchSummary]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const channel = adminSupabase.channel('admin-login-history')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'login_history' }, ({ new: inserted }) => {
        const start = getFilterStart(timeFilter);
        const matchesDate = !start || new Date(inserted.logged_in_at) >= start;
        const queryText = search.trim().toLowerCase();
        const matchesSearch = !queryText || inserted.email?.toLowerCase().includes(queryText) || inserted.full_name?.toLowerCase().includes(queryText);
        const matchesRole = roleFilter === 'all' || inserted.role === roleFilter;
        if (activeTab === 'logins' && matchesDate && matchesSearch && matchesRole) {
          setTotal((current) => current + 1);
          if (page === 1) setRows((current) => [inserted, ...current.filter((row) => row.id !== inserted.id)].slice(0, PAGE_SIZE));
        }
        void fetchSummary().catch((failure) => setError(failure?.message || 'Could not refresh login summaries.'));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, ({ new: inserted }) => {
        const queryText = search.trim().toLowerCase();
        const matchesSearch = !queryText || inserted.email?.toLowerCase().includes(queryText) || inserted.full_name?.toLowerCase().includes(queryText);
        const matchesRole = roleFilter === 'all' || inserted.role === roleFilter;
        if (activeTab === 'registered' && matchesSearch && matchesRole) {
          setTotal((current) => current + 1);
          if (page === 1) setRows((current) => [inserted, ...current.filter((row) => row.id !== inserted.id)].slice(0, PAGE_SIZE));
        } else if (activeTab === 'logins') {
          setRows((current) => current.map((row) => row.user_id === inserted.id
            ? { ...row, full_name: inserted.full_name || row.full_name }
            : row));
        }
        void fetchSummary().catch((failure) => setError(failure?.message || 'Could not refresh login summaries.'));
      })
      .subscribe();
    return () => { void adminSupabase.removeChannel(channel); };
  }, [activeTab, fetchSummary, page, roleFilter, search, timeFilter]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const cards = useMemo(() => [
    { label: 'Total registered users', value: summary.registered, Icon: Users },
    { label: 'Logins today', value: summary.today, Icon: CalendarDays },
    { label: 'Unique users logged in today', value: summary.uniqueToday, Icon: History },
  ], [summary]);

  function changeSearch(value) { setPage(1); setSearch(value); }
  function changeRole(value) { setPage(1); setRoleFilter(value); }
  function changeTime(value) { setPage(1); setTimeFilter(value); }
  function selectTab(value) { setPage(1); setActiveTab(value); }

  return <div className="admin-page">
    <div className="admin-page-heading">
      <div><span className="admin-eyebrow">ACCOUNT SECURITY</span><h1>Login <i>Activity</i></h1><p>Review sign-ins and registered Atithi users.</p></div>
      <span className="admin-count-pill">{total.toLocaleString('en-IN')} {activeTab === 'logins' ? 'logins' : 'users'}</span>
    </div>

    <div className="admin-stats-grid admin-login-activity-stats">
      {cards.map(({ label, value, Icon }) => <article className="admin-stat" key={label}>
        <span>{label}</span><strong>{value.toLocaleString('en-IN')}</strong><i className="admin-stat-icon"><Icon size={19}/></i>
      </article>)}
    </div>

    <div className="admin-login-activity-tabs" role="tablist" aria-label="Activity type">
      <button type="button" role="tab" aria-selected={activeTab === 'logins'} className={activeTab === 'logins' ? 'active' : ''} onClick={() => selectTab('logins')}>Login History</button>
      <button type="button" role="tab" aria-selected={activeTab === 'registered'} className={activeTab === 'registered' ? 'active' : ''} onClick={() => selectTab('registered')}>Registered Users</button>
    </div>

    <div className="admin-toolbar admin-login-activity-toolbar">
      <label className="admin-search"><Search/><input value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Search name or email" aria-label="Search by name or email"/></label>
      {activeTab === 'logins' && <label className="admin-login-activity-filter-label">
        <select className="admin-login-activity-filter" value={timeFilter} onChange={(event) => changeTime(event.target.value)} aria-label="Filter by time range">
          <option value="all">All time</option><option value="today">Today</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option>
        </select>
      </label>}
      <label className="admin-login-activity-filter-label">
        <select className="admin-login-activity-filter" value={roleFilter} onChange={(event) => changeRole(event.target.value)} aria-label="Filter by role">
          <option value="all">All roles</option><option value="user">User</option><option value="admin">Admin</option><option value="staff">Staff</option>
        </select>
      </label>
    </div>

    {error ? <div className="admin-empty"><p>{error}</p><button className="admin-btn admin-btn-light" onClick={() => void refresh()}>Retry</button></div>
      : loading ? <div className="admin-empty admin-login-activity-loading" role="status">Loading {activeTab === 'logins' ? 'login history' : 'registered users'}…</div>
        : rows.length ? <>
          <div className="admin-table-wrap admin-login-activity-table-wrap"><table className="admin-table admin-login-activity-table">
            <thead><tr>{activeTab === 'logins'
              ? <><th>No.</th><th>Name</th><th>Email</th><th>Role</th><th>Login date and time</th><th>Device / browser</th></>
              : <><th>No.</th><th>Name</th><th>Email</th><th>Role</th><th>Registered date and time</th></>}</tr></thead>
            <tbody>{rows.map((row, index) => <tr key={row.id}>
              <td>{(page - 1) * PAGE_SIZE + index + 1}</td><td>{row.full_name || '—'}</td><td>{row.email || '—'}</td><td>{row.role || 'user'}</td>
              <td>{formatDateTime(activeTab === 'logins' ? row.logged_in_at : row.created_at)}</td>
              {activeTab === 'logins' && <td>{parseDevice(row.user_agent)}</td>}
            </tr>)}</tbody>
          </table></div>
          <div className="admin-pagination"><span>{total.toLocaleString('en-IN')} {activeTab === 'logins' ? 'logins' : 'users'} · Page {page} of {pages}</span>
            <button className="admin-icon-btn" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft/></button>
            <button className="admin-icon-btn" disabled={page >= pages} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight/></button>
          </div>
        </> : <div className="admin-empty"><History/><h2>{activeTab === 'logins' ? 'No login history found' : 'No registered users found'}</h2><p>{search || roleFilter !== 'all' || (activeTab === 'logins' && timeFilter !== 'all') ? 'Try different search terms or filters.' : 'Records will appear here when available.'}</p></div>}
  </div>;
}
