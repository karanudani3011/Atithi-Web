-- Public date-only room availability and transactional booking protection.
-- Run after guest_booking_ownership.sql and the existing bookings schema migrations.
BEGIN;

CREATE INDEX IF NOT EXISTS bookings_room_dates_idx ON public.bookings(room_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(booking_status);

CREATE OR REPLACE FUNCTION public.get_room_booked_ranges(
  p_room_id uuid, p_from date, p_to date
) RETURNS TABLE(check_in date, check_out date)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT b.check_in, b.check_out
  FROM public.bookings AS b
  WHERE b.room_id = p_room_id
    AND lower(trim(coalesce(b.booking_status, ''))) IN ('pending', 'confirmed')
    AND b.check_in < p_to
    AND b.check_out > p_from
  ORDER BY b.check_in;
$$;
REVOKE ALL ON FUNCTION public.get_room_booked_ranges(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_room_booked_ranges(uuid, date, date) TO anon, authenticated;
-- Keep the legacy date-range endpoint aligned for any older calendar clients.
CREATE OR REPLACE FUNCTION public.get_booked_ranges(p_room_id uuid)
RETURNS TABLE(check_in date, check_out date)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT b.check_in, b.check_out
  FROM public.bookings AS b
  WHERE b.room_id = p_room_id
    AND lower(trim(coalesce(b.booking_status, ''))) IN ('pending', 'confirmed')
  ORDER BY b.check_in;
$$;
REVOKE ALL ON FUNCTION public.get_booked_ranges(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_ranges(uuid) TO anon, authenticated;

-- Locking the room row serializes competing reservations for that inventory item.
-- Strict overlap implements [check_in, check_out) night occupancy.
CREATE OR REPLACE FUNCTION public.create_booking(
  p_room_id uuid, p_check_in date, p_check_out date, p_adults integer, p_children integer,
  p_name text, p_email text, p_phone text, p_notes text, p_guest_token_hash text, p_user_id uuid
) RETURNS TABLE(id uuid, booking_ref text, total_amount numeric, nights integer)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
  v_price numeric; v_capacity integer; v_total_units integer; v_nights integer;
  v_tax numeric; v_total numeric; v_id uuid; v_ref text; v_today date; v_overlaps integer;
BEGIN
  v_today := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  IF p_check_in IS NULL OR p_check_out IS NULL OR p_check_in < v_today OR p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'Choose valid check-in and check-out dates.' USING ERRCODE='22007';
  END IF;
  IF p_adults IS NULL OR p_adults < 1 OR p_children IS NULL OR p_children < 0 THEN
    RAISE EXCEPTION 'Guest count is invalid.' USING ERRCODE='22023';
  END IF;
  IF nullif(trim(p_name), '') IS NULL OR length(trim(p_name)) > 100 OR nullif(trim(p_email), '') IS NULL OR nullif(trim(p_phone), '') IS NULL
     OR p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR p_phone !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Enter a name, valid email, and 10 digit phone number.' USING ERRCODE='22023';
  END IF;
  IF p_user_id IS NULL AND (p_guest_token_hash IS NULL OR p_guest_token_hash !~ '^[a-f0-9]{64}$') THEN
    RAISE EXCEPTION 'Guest browser identity is missing. Please retry.' USING ERRCODE='22023';
  END IF;
  IF p_user_id IS NOT NULL AND p_guest_token_hash IS NOT NULL THEN
    RAISE EXCEPTION 'Invalid booking ownership.' USING ERRCODE='22023';
  END IF;

  SELECT r.price_per_night::numeric, r.capacity::integer, coalesce(r.total_units, 1)
    INTO v_price, v_capacity, v_total_units
  FROM public.rooms AS r
  WHERE r.id = p_room_id AND r.is_published = true AND lower(coalesce(r.status, 'available')) = 'available'
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This room is not currently available.' USING ERRCODE='P0001'; END IF;
  IF v_price IS NULL OR v_price <= 0 OR v_total_units < 1 THEN
    RAISE EXCEPTION 'Room booking details are unavailable.' USING ERRCODE='P0001';
  END IF;
  IF v_capacity IS NOT NULL AND p_adults + p_children > v_capacity THEN
    RAISE EXCEPTION 'Guest count exceeds room capacity.' USING ERRCODE='22023';
  END IF;

  SELECT count(*)::integer INTO v_overlaps
  FROM public.bookings AS b
  WHERE b.room_id = p_room_id
    AND lower(trim(coalesce(b.booking_status, ''))) IN ('pending', 'confirmed')
    AND b.check_in < p_check_out AND b.check_out > p_check_in;
  IF v_overlaps >= v_total_units THEN
    RAISE EXCEPTION 'Room is no longer available for these dates' USING ERRCODE='P0001';
  END IF;

  v_nights := p_check_out - p_check_in;
  v_tax := round(v_price * v_nights * 0.12, 2);
  v_total := v_price * v_nights + v_tax;
  INSERT INTO public.bookings(room_id, user_id, guest_token_hash, guest_name, guest_email, guest_phone, special_requests,
    check_in, check_out, adults, children, nights, room_price, taxes_amount, total_amount, booking_status, payment_status, created_at)
  VALUES(p_room_id, p_user_id, p_guest_token_hash, trim(p_name), lower(trim(p_email)), trim(p_phone), nullif(trim(p_notes), ''),
    p_check_in, p_check_out, p_adults, p_children, v_nights, v_price, v_tax, v_total, 'pending', 'pending', now())
  RETURNING bookings.id, bookings.booking_ref INTO v_id, v_ref;
  RETURN QUERY SELECT v_id, v_ref, v_total, v_nights;
END;
$$;
REVOKE ALL ON FUNCTION public.create_booking(uuid,date,date,integer,integer,text,text,text,text,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid,date,date,integer,integer,text,text,text,text,text,uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

