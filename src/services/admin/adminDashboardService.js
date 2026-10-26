import { adminSupabase as db, ensureAdminSupabase } from '../../lib/adminSupabase.js';

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export async function loadDashboard() {
  ensureAdminSupabase();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const queries = [
    () => db.from('rooms').select('id', { count: 'exact', head: true }),
    () => db.from('rooms').select('id', { count: 'exact', head: true }).eq('is_published', true),
    () => db.from('bookings').select('id', { count: 'exact', head: true }),
    () => db.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'pending'),
    () => db.from('bookings').select('total_amount').in('booking_status', ['confirmed', 'checked_in', 'checked_out']),
    () => db.from('bookings').select('id', { count: 'exact', head: true }).eq('check_in', today()),
    () => db.from('contact_messages').select('id', { count: 'exact', head: true }),
    () => db.from('users').select('id', { count: 'exact', head: true }),
    () => db.from('bookings').select('*, rooms(room_name)').order('created_at', { ascending: false }).limit(5),
    () => db.from('bookings').select('total_amount,created_at,booking_status').in('booking_status', ['confirmed', 'checked_in', 'checked_out']).gte('created_at', sixMonthsAgo.toISOString()).order('created_at', { ascending: true }),
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
  const revenueResult = responseAt(4, 'Revenue');
  const recentResult = responseAt(8, 'Recent bookings');
  const monthsResult = responseAt(9, 'Revenue chart');
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

  return {
    stats: {
      rooms: countAt(0, 'Total rooms'),
      published: countAt(1, 'Published rooms'),
      bookings: countAt(2, 'Total bookings'),
      pending: countAt(3, 'Pending bookings'),
      revenue: revenueResult ? (revenueResult.data || []).reduce((sum, row) => sum + Number(row.total_amount || 0), 0) : null,
      checkins: countAt(5, "Today's check-ins"),
      messages: countAt(6, 'Total messages'),
      users: countAt(7, 'Total users'),
    },
    recent: recentResult?.data || [],
    chart,
    errors,
  };
}
