import { adminSupabase as db, ensureAdminSupabase } from '../../lib/adminSupabase.js';
import { dashboardDateRange, indiaTodayDate } from './adminDashboardDates.js';

export async function loadDashboard(range = 'today', now = new Date()) {
  ensureAdminSupabase();
  const { from, to } = dashboardDateRange(range, now);
  const today = indiaTodayDate(now);
  const indiaParts = today.split('-').map(Number);
  const sixMonthsStart = new Date(Date.UTC(indiaParts[0], indiaParts[1] - 6, 1));
  const sixMonthsAgo = new Date(`${sixMonthsStart.toISOString().slice(0, 10)}T00:00:00+05:30`).toISOString();
  const queries = [
    () => db.from('rooms').select('id', { count: 'exact', head: true }),
    () => db.from('rooms').select('id', { count: 'exact', head: true }).eq('is_published', true),
    () => db.from('bookings').select('id', { count: 'exact', head: true }).eq('check_in', today),
    () => db.from('contact_messages').select('id', { count: 'exact', head: true }),
    () => db.from('users').select('id', { count: 'exact', head: true }),
    () => {
      let query = db.from('bookings').select('*, rooms(room_name)').order('created_at', { ascending: false }).limit(5);
      if (from) query = query.gte('created_at', from);
      if (to) query = query.lte('created_at', to);
      return query;
    },
    () => db.from('bookings').select('total_amount,created_at,booking_status').in('booking_status', ['confirmed', 'checked_in', 'checked_out']).gte('created_at', sixMonthsAgo).order('created_at', { ascending: true }),
    () => db.rpc('admin_booking_stats', { p_from: from, p_to: to }),
  ];
  const settled = await Promise.allSettled(queries.map((query) => Promise.resolve().then(query)));
  const errors = [];
  const responseAt = (index, label) => {
    const item = settled[index];
    if (item?.status === 'rejected') { errors.push(label); return null; }
    const response = item?.value;
    if (response?.error) { errors.push(label); return null; }
    return response;
  };
  const countAt = (index, label) => responseAt(index, label)?.count ?? (errors.includes(label) ? null : 0);
  const checkins = responseAt(2, "Today's check-ins");
  const messages = responseAt(3, 'Total messages');
  const users = responseAt(4, 'Total users');
  const recentResult = responseAt(5, 'Recent bookings');
  const monthsResult = responseAt(6, 'Revenue chart');
  const statsResult = responseAt(7, 'Booking stats');
  const rangeError = errors.includes('Recent bookings') || errors.includes('Booking stats');
  const monthlyRows = monthsResult?.data || [];
  const chart = Array.from({ length: 6 }, (_, index) => {
    const month = new Date();
    month.setDate(1);
    month.setMonth(month.getMonth() - (5 - index));
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    return {
      label: month.toLocaleDateString('en-IN', { month: 'short' }),
      value: monthlyRows.filter((row) => row.created_at?.slice(0, 7) === key)
        .reduce((sum, row) => sum + Number(row.total_amount || 0), 0),
    };
  });

  if (rangeError) throw new Error('Could not load booking statistics. Please try again.');

  return {
    stats: {
      rooms: countAt(0, 'Total rooms'),
      published: countAt(1, 'Published rooms'),
      bookings: Number(statsResult.data.total || 0),
      pending: Number(statsResult.data.pending || 0),
      revenue: Number(statsResult.data.revenue || 0),
      checkins: checkins?.count ?? (errors.includes("Today's check-ins") ? null : 0),
      messages: messages?.count ?? (errors.includes('Total messages') ? null : 0),
      users: users?.count ?? (errors.includes('Total users') ? null : 0),
    },
    recent: recentResult?.data || [],
    comparison: statsResult.data.comparison || { today: 0, last_3_days: 0, last_7_days: 0, all_time: 0 },
    chart,
    errors,
  };
}
