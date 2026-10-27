import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, History, Search, Users } from 'lucide-react';
import { adminSupabase } from '../../lib/adminSupabase.js';
import '../admin.css';
import './AdminLoginActivity.css';

const PAGE_SIZE = 20;

function localDayStart(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getFilterStart(filter) {
  if (filter === 'today') return localDayStart();
  if (filter === 'week') {
    const start = localDayStart();
    start.setDate(start.getDate() - 6);
    return start;
  }
  return null;
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date);
  return `${day}, ${time}`;
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
  const [filter, setFilter] = useState('all');
  const [summary, setSummary] = useState({ registered: 0, today: 0, uniqueToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLoginRows = useCallback(async () => {
    const queryText = escapeFilterText(search);
    let matchingUserIds = [];
    if (queryText) {
      const pattern = `%${queryText}%`;
      const [names, emails] = await Promise.all([
        adminSupabase.from('registered_users').select('id').ilike('full_name', pattern),
        adminSupabase.from('registered_users').select('id').ilike('email', pattern),
      ]);
      if (names.error) throw names.error;
      if (emails.error) throw emails.error;
      matchingUserIds = [...new Set([...(names.data || []), ...(emails.data || [])].map((user) => user.id))];
    }

    let query = adminSupabase.from('login_logs')
      .select('id,email,user_id,logged_in_at', { count: 'exact' })
      .order('logged_in_at', { ascending: false });
    const start = getFilterStart(filter);
    if (start) query = query.gte('logged_in_at', start.toISOString());
    if (queryText) {
      const emailPattern = `%${queryText}%`;
      query = matchingUserIds.length
        ? query.or(`email.ilike.${emailPattern},user_id.in.(${matchingUserIds.join(',')})`)
        : query.ilike('email', emailPattern);
    }

    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error: queryError } = await query.range(from, from + PAGE_SIZE - 1);
    if (queryError) throw queryError;
    const userIds = [...new Set((data || []).map((row) => row.user_id).filter(Boolean))];
    let namesById = {};
    if (userIds.length) {
      const { data: users, error: usersError } = await adminSupabase
        .from('registered_users').select('id,full_name').in('id', userIds);
      if (usersError) throw usersError;
      namesById = Object.fromEntries((users || []).map((user) => [user.id, user.full_name]));
    }
    setRows((data || []).map((row) => ({ ...row, full_name: namesById[row.user_id] || '' })));
    setTotal(count || 0);
  }, [filter, page, search]);

  const fetchRegisteredRows = useCallback(async () => {
    let query = adminSupabase.from('registered_users')
      .select('id,full_name,email,registered_at', { count: 'exact' })
      .order('registered_at', { ascending: false });
    const queryText = escapeFilterText(search);
    if (queryText) query = query.or(`full_name.ilike.%${queryText}%,email.ilike.%${queryText}%`);
    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error: queryError } = await query.range(from, from + PAGE_SIZE - 1);
    if (queryError) throw queryError;
    setRows(data || []);
    setTotal(count || 0);
  }, [page, search]);

  const fetchSummary = useCallback(async () => {
    const start = localDayStart().toISOString();
    const [registeredResult, todayResult] = await Promise.all([
      adminSupabase.from('registered_users').select('id', { count: 'exact', head: true }),
      adminSupabase.from('login_logs').select('id', { count: 'exact', head: true }).gte('logged_in_at', start),
    ]);
    const failed = registeredResult.error || todayResult.error;
    if (failed) throw failed;
    const uniqueUsers = new Set();
    for (let from = 0; ; from += 1000) {
      const { data, error: usersError } = await adminSupabase.from('login_logs')
        .select('user_id').gte('logged_in_at', start).range(from, from + 999);
      if (usersError) throw usersError;
      (data || []).forEach((row) => { if (row.user_id) uniqueUsers.add(row.user_id); });
      if (!data || data.length < 1000) break;
    }
    setSummary({
      registered: registeredResult.count || 0,
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
    const channel = adminSupabase.channel('admin-login-activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'login_logs' }, async ({ new: inserted }) => {
        const start = getFilterStart(filter);
        const matchesDate = !start || new Date(inserted.logged_in_at) >= start;
        let fullName = '';
        const { data: user, error: userError } = await adminSupabase.from('registered_users')
          .select('full_name').eq('id', inserted.user_id).maybeSingle();
        if (!userError) fullName = user?.full_name || '';
        const queryText = search.trim().toLowerCase();
        const matchesSearch = !queryText || inserted.email?.toLowerCase().includes(queryText) || fullName.toLowerCase().includes(queryText);
        if (matchesDate && matchesSearch && activeTab === 'logins') {
          setTotal((current) => current + 1);
          if (page === 1) setRows((current) => [{ ...inserted, full_name: fullName }, ...current.filter((row) => row.id !== inserted.id)].slice(0, PAGE_SIZE));
        }
        void fetchSummary().catch((failure) => setError(failure?.message || 'Could not refresh login summaries.'));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registered_users' }, ({ new: inserted }) => {
        if (activeTab === 'registered') {
          const queryText = search.trim().toLowerCase();
          const matchesSearch = !queryText || inserted.email?.toLowerCase().includes(queryText) || inserted.full_name?.toLowerCase().includes(queryText);
          if (matchesSearch) {
            setTotal((current) => current + 1);
            if (page === 1) setRows((current) => [inserted, ...current.filter((row) => row.id !== inserted.id)].slice(0, PAGE_SIZE));
          }
        } else {
          setRows((current) => current.map((row) => row.user_id === inserted.id ? { ...row, full_name: inserted.full_name || '' } : row));
        }
        void fetchSummary().catch((failure) => setError(failure?.message || 'Could not refresh login summaries.'));
      })
      .subscribe();
    return () => { void adminSupabase.removeChannel(channel); };
  }, [activeTab, fetchSummary, filter, page, search]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const cards = useMemo(() => [
    { label: 'Total registered users', value: summary.registered, Icon: Users },
    { label: 'Logins today', value: summary.today, Icon: CalendarDays },
    { label: 'Unique users logged in today', value: summary.uniqueToday, Icon: History },
  ], [summary]);

  function updateSearch(value) { setPage(1); setSearch(value); }
  function updateFilter(value) { setPage(1); setFilter(value); }
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
      <label className="admin-search"><Search/><input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search name or email" aria-label="Search by name or email"/></label>
      {activeTab === 'logins' && <label className="admin-login-activity-filter-label">
        <select className="admin-login-activity-filter" value={filter} onChange={(event) => updateFilter(event.target.value)} aria-label="Filter login history">
          <option value="today">Today</option><option value="week">Last 7 days</option><option value="all">All</option>
        </select>
      </label>}
    </div>

    {error ? <div className="admin-empty"><p>{error}</p><button className="admin-btn admin-btn-light" onClick={() => void refresh()}>Retry</button></div>
      : loading ? <div className="admin-empty admin-login-activity-loading" role="status">Loading {activeTab === 'logins' ? 'login history' : 'registered users'}…</div>
        : rows.length ? <>
          <div className="admin-table-wrap admin-login-activity-table-wrap"><table className="admin-table admin-login-activity-table">
            <thead><tr>{activeTab === 'logins'
              ? <><th>No.</th><th>Name</th><th>Email</th><th>Login date and time</th></>
              : <><th>No.</th><th>Name</th><th>Email</th><th>Registered date and time</th></>}</tr></thead>
            <tbody>{rows.map((row, index) => <tr key={row.id}>
              <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
              <td>{activeTab === 'logins' ? row.full_name || '—' : row.full_name || '—'}</td>
              <td>{row.email || '—'}</td>
              <td>{formatDateTime(activeTab === 'logins' ? row.logged_in_at : row.registered_at)}</td>
            </tr>)}</tbody>
          </table></div>
          <div className="admin-pagination"><span>{total.toLocaleString('en-IN')} {activeTab === 'logins' ? 'logins' : 'users'} · Page {page} of {pages}</span>
            <button className="admin-icon-btn" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft/></button>
            <button className="admin-icon-btn" disabled={page >= pages} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight/></button>
          </div>
        </> : <div className="admin-empty"><History/><h2>{activeTab === 'logins' ? 'No login history found' : 'No registered users found'}</h2><p>{search ? 'Try a different name or email.' : 'Records will appear here when available.'}</p></div>}
  </div>;
}
