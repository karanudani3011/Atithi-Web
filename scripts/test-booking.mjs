import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function readEnvFile() {
  const values = {};
  for (const line of readFileSync(resolve(process.cwd(), '.env'), 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)\s*=\s*(.*)\s*$/);
    if (match) values[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return values;
}

function indiaToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const fields = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

function shiftDate(date, amount) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function fail(message, error) {
  console.error(message);
  if (error) console.error({ code: error.code, message: error.message, details: error.details, hint: error.hint });
  process.exitCode = 1;
}

async function main() {
  let env;
  try { env = readEnvFile(); }
  catch { return fail('Could not read .env. This script only needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'); }
  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return fail('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.');

  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const today = indiaToday();
  const checkIn = shiftDate(today, 30);
  const checkOut = shiftDate(checkIn, 1);
  const probe = await supabase.rpc('create_public_booking', {
    p_room_id: '00000000-0000-0000-0000-000000000000',
    p_check_in: checkIn, p_check_out: checkOut,
    p_adults: 1, p_children: 0,
    p_guest_name: '', p_guest_email: 'test@example.com', p_guest_phone: '9999999999',
    p_special_requests: null, p_firebase_uid: null, p_user_id: null,
  });
  const probeError = [probe.error?.message, probe.error?.details].filter(Boolean).join(" ");
  if (/fetch failed|ENOTFOUND|ECONN|network request failed/i.test(probeError)) {
    console.error('This environment cannot reach the Supabase host, so no booking or database test was performed. Run this script on a machine with network access to the Supabase project.');
    process.exitCode = 3;
    return;
  }
  if (probe.error?.code === 'PGRST202' || /could not find the function|function .* does not exist/i.test(probe.error?.message || '')) {
    console.error('create_public_booking RPC is not installed. Run supabase/sql/public_booking.sql in Supabase SQL Editor, then rerun node scripts/test-booking.mjs.');
    process.exitCode = 2;
    return;
  }
  if (!probe.error || !/INVALID_NAME/.test(probe.error.message || '')) {
    return fail('RPC probe did not return the expected INVALID_NAME validation. Check the SQL migration and RPC logs.', probe.error);
  }

  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('id, property_id, capacity, price_per_night, status, is_published')
    .eq('is_published', true)
    .eq('status', 'available')
    .not('capacity', 'is', null)
    .gte('capacity', 1)
    .lte('capacity', 19)
    .gt('price_per_night', 0);
  if (roomsError) return fail('Could not find a public room for the anon booking test.', roomsError);

  const availability = await supabase.rpc('get_available_rooms', {
    p_check_in: checkIn, p_check_out: checkOut, p_adults: 1, p_children: 0,
    p_room_type_id: null, p_min_price: null, p_max_price: null, p_sort: 'price_asc',
  });
  if (availability.error) return fail('Could not check candidate room availability.', availability.error);
  const availableIds = new Set((availability.data?.rooms || []).filter(room => room.is_available).map(room => String(room.id)));
  const room = (rooms || []).find(candidate => availableIds.has(String(candidate.id)));
  if (!room) return fail('No published, available room with a known capacity was found for the test dates. No booking was created.');

  const base = {
    p_room_id: room.id, p_check_in: checkIn, p_check_out: checkOut,
    p_adults: 1, p_children: 0,
    p_guest_name: 'TEST - delete me',
    p_guest_email: `test-booking-${Date.now()}@example.com`,
    p_guest_phone: '9999999999', p_special_requests: 'Automated anon RPC test',
    p_firebase_uid: null, p_user_id: null,
  };
  const created = await supabase.rpc('create_public_booking', base);
  if (created.error) return fail('Valid guest booking was rejected.', created.error);
  const booking = Array.isArray(created.data) ? created.data[0] : created.data;
  if (!booking?.booking_ref || !booking?.id) return fail('RPC did not return the new booking ID and booking reference.');
  console.log(`PASS guest booking created: ${booking.booking_ref}`);
  console.log(`Room property_id: ${room.property_id}; status: ${booking.booking_status}; nights: ${booking.nights}; total: ${booking.total_amount}`);
  console.log('The test row guest_name is "TEST - delete me". Remove it later from Admin → Bookings.');

  const expectError = async (label, args, pattern) => {
    const result = await supabase.rpc('create_public_booking', args);
    if (!result.error || !pattern.test(result.error.message || '')) {
      fail(`FAIL ${label}: expected ${pattern}, got ${result.error?.message || 'booking unexpectedly succeeded'}.`, result.error);
      return false;
    }
    console.log(`PASS ${label}: ${result.error.message}`);
    return true;
  };

  await expectError('invalid dates', { ...base, p_check_in: shiftDate(today, -1), p_check_out: today }, /INVALID_DATES/);
  await expectError('too many guests', { ...base, p_adults: Number(room.capacity) + 1 }, /TOO_MANY_GUESTS/);
  await expectError('overlapping active booking', { ...base }, /ROOM_NOT_AVAILABLE/);
  await expectError('empty guest name', { ...base, p_guest_name: '' }, /INVALID_NAME/);
}

main().catch(error => fail('Booking RPC test failed before completion.', error));


