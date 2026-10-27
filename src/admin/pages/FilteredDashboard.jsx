import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BedDouble, Eye, CalendarDays, IndianRupee, Users, Mail, Plus, ArrowUpRight, DoorOpen, MessageSquare } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { loadDashboard } from '../../services/admin/adminDashboardService.js';
import { dashboardRangeLabel } from '../../services/admin/adminDashboardDates.js';
import StatCard from '../StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import useRealtimeTable from '../../hooks/useRealtimeTable.js';

const RANGES = [
  { key: 'today', label: 'Today', name: 'Today' },
  { key: '3d', label: 'Last 3 days', name: 'Last 3 days' },
  { key: '7d', label: 'Last 7 days', name: 'Last 7 days' },
  { key: 'all', label: 'All time', name: 'All time' },
];
const VALID_RANGES = new Set(RANGES.map(({ key }) => key));

export default function FilteredDashboard() {
  const { user, isSuperAdmin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawRange = searchParams.get('range');
  const range = VALID_RANGES.has(rawRange) ? rawRange : 'today';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangeError, setRangeError] = useState(false);
  const requestId = useRef(0);
  const previousRange = useRef(range);
  const activeRange = useRef(range);
  activeRange.current = range;
  if (previousRange.current !== range) {
    previousRange.current = range;
    requestId.current += 1;
  }
  const selectedRange = RANGES.find(item => item.key === range);
  const displayDate = dashboardRangeLabel(range);

  useEffect(() => {
    if (rawRange === range) return;
    const params = new URLSearchParams(searchParams);
    params.set('range', range);
    setSearchParams(params, { replace: true });
  }, [rawRange, range, searchParams, setSearchParams]);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    const requestedRange = activeRange.current;
    setLoading(true);
    setRangeError(false);
    try {
      const result = await loadDashboard(requestedRange);
      if (currentRequest !== requestId.current) return;
      setData(result);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      console.error('[admin dashboard] booking stats request failed', error);
      setRangeError(true);
      if (error?.status === 401 || error?.status === 403) {
        await logout().catch(() => {});
        navigate('/admin/login', { replace: true, state: { authError: 'Your session expired. Please sign in again.' } });
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => { refresh(); }, [refresh, range]);

  const chooseRange = (nextRange) => {
    const params = new URLSearchParams(searchParams);
    params.set('range', nextRange);
    setSearchParams(params);
  };

  const bookingsLive = useRealtimeTable({ table: 'bookings', onChange: refresh }).liveAvailable;
  const roomsLive = useRealtimeTable({ table: 'rooms', onChange: refresh }).liveAvailable;
  const messagesLive = useRealtimeTable({ table: 'contact_messages', onChange: refresh }).liveAvailable;
  const usersLive = useRealtimeTable({ table: 'users', onChange: refresh }).liveAvailable;
  const realtimeUnavailable = [bookingsLive, roomsLive, messagesLive, usersLive].includes(false);
  const stats = data?.stats;
  const cards = [
    { label: 'Total Rooms', value: stats?.rooms, icon: BedDouble, errorKey: 'Total rooms' },
    { label: 'Published Rooms', value: stats?.published, icon: Eye, errorKey: 'Published rooms' },
    { label: 'Bookings', value: stats?.bookings, icon: CalendarDays, filtered: true, subtitle: selectedRange.name },
    { label: 'Pending Bookings', value: stats?.pending, icon: CalendarDays, filtered: true, subtitle: selectedRange.name },
    { label: 'Revenue', value: stats?.revenue, icon: IndianRupee, format: 'currency', filtered: true, subtitle: selectedRange.name },
    { label: "Today's Check-ins", value: stats?.checkins, icon: DoorOpen, errorKey: "Today's check-ins" },
    { label: 'Total Messages', value: stats?.messages, icon: MessageSquare, errorKey: 'Total messages' },
    { label: 'Total Users', value: stats?.users, icon: Users, errorKey: 'Total users' },
  ];
  const max = Math.max(1, ...(data?.chart || []).map(item => item.value));
  const comparison = data?.comparison;
  const dateChip = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata',
  }).format(new Date());

  return <div className="admin-page">
    <div className="admin-page-heading admin-dashboard-heading">
      <div>
        <span className="admin-eyebrow">YOUR ATITHI AT A GLANCE</span>
        <h1>Welcome, <i>{user?.name?.split(' ')[0] || 'Admin'}</i></h1>
        <p>Here’s what’s happening at your property today.</p>
        <small className="admin-dashboard-date">{dateChip}</small>
      </div>
      <div className="admin-dashboard-filter">
        <div className="admin-dashboard-range-tabs" role="group" aria-label="Booking date range">
          {RANGES.map(item => {
            const countKey = item.key === '3d' ? 'last_3_days' : item.key === '7d' ? 'last_7_days' : item.key === 'all' ? 'all_time' : 'today';
            const count = comparison?.[countKey];
            return <button key={item.key} type="button" aria-pressed={range === item.key}
              className={range === item.key ? 'is-selected' : ''} onClick={() => chooseRange(item.key)}>
              <span>{item.label} ·</span><small>{loading || count == null || rangeError ? '—' : count}</small>
            </button>;
          })}
        </div>
        <small className="admin-dashboard-range-label">{displayDate}</small>
        {rangeError && <button type="button" className="admin-dashboard-filter-retry" onClick={refresh}>Retry</button>}
      </div>
    </div>

    {realtimeUnavailable && <p className="admin-live-unavailable" role="status">Live updates unavailable. Dashboard data still loads normally.</p>}

    <div className={`admin-stats-grid ${cards.length > 4 ? 'five' : ''}`}>
      {cards.map((card, index) => <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon}
        format={card.format} delay={index * .045} subtitle={card.subtitle} loading={Boolean(card.filtered && loading && data)}
        error={Boolean(card.filtered ? rangeError : data?.errors.includes(card.errorKey))} onRetry={refresh}/>)}
    </div>

    <div className="admin-dashboard-bottom">
      <section className="admin-panel recent-panel">
        <div className="admin-panel-title"><div><span className="admin-eyebrow">THE LATEST · {selectedRange.label.toUpperCase()}</span><h2>Recent Bookings</h2></div><Link className="admin-text-link" to="/admin/bookings">All bookings <ArrowUpRight size={16}/></Link></div>
        {loading ? <div className="admin-skeleton-card"><span/><span/><span/></div>
          : rangeError ? <div className="admin-empty small"><p>Couldn't load recent bookings.</p><button className="admin-btn admin-btn-light" onClick={refresh}>Retry</button></div>
          : data?.recent.length ? <div className="admin-recent-list">{data.recent.map(booking => <div className="admin-recent-row" key={booking.id}>
            <div className="admin-recent-avatar">{booking.guest_name?.slice(0, 1).toUpperCase() || 'G'}</div>
            <div className="admin-recent-guest"><strong>{booking.guest_name}</strong><span>{booking.rooms?.room_name || 'Room'} · {booking.id.slice(0, 8).toUpperCase()}</span></div>
            <span><StatusBadge status={booking.booking_status}/></span><strong className="admin-recent-total">₹{Number(booking.total_amount || 0).toLocaleString('en-IN')}</strong>
          </div>)}</div>
          : <div className="admin-empty small"><CalendarDays/><h3>No bookings in this period.</h3></div>}
      </section>

      <section className="admin-panel admin-revenue-panel">
        <div className="admin-panel-title"><div><span className="admin-eyebrow">LAST SIX MONTHS</span><h2>Revenue</h2></div><IndianRupee/></div>
        {loading && !data ? <div className="admin-skeleton-card"><span/><span/></div>
          : <div className="admin-revenue-chart" aria-label="Last six months revenue chart">{(data?.chart || []).map((item, index) => <div key={index} title={`${item.label}: ₹${item.value.toLocaleString('en-IN')}`}><span style={{ height: `${Math.max(6, item.value / max * 100)}%` }}/><small>{item.label}</small></div>)}</div>}
      </section>
    </div>

    <section className="admin-quick-actions"><h2>Quick actions</h2><div className="admin-quick-row">
      <Link to="/admin/rooms?new=1"><span><Plus/></span><div><b>Add a room</b><small>Expand your inventory</small></div><ArrowUpRight/></Link>
      <Link to="/admin/bookings"><span><CalendarDays/></span><div><b>View bookings</b><small>Manage guest stays</small></div><ArrowUpRight/></Link>
      {isSuperAdmin && <Link to="/admin/access"><span><Users/></span><div><b>Give admin access</b><small>Invite a teammate</small></div><ArrowUpRight/></Link>}
      <Link to="/admin/messages"><span><Mail/></span><div><b>Read messages</b><small>Reply to your guests</small></div><ArrowUpRight/></Link>
    </div></section>
  </div>;
}
