BEGIN;

CREATE OR REPLACE FUNCTION public.create_public_booking(
  p_room_id uuid,
  p_check_in date,
  p_check_out date,
  p_adults integer,
  p_children integer,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_special_requests text,
  p_firebase_uid text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  booking_ref text,
  total_amount numeric,
  nights integer,
  booking_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_property_id uuid;
  v_capacity integer;
  v_nightly_price numeric(10,2);
  v_nights integer;
  v_room_price numeric(10,2);
  v_taxes_amount numeric(10,2);
  v_total_amount numeric(10,2);
  v_booking_id uuid;
  v_booking_ref text;
BEGIN
  IF nullif(trim(p_guest_name), '') IS NULL OR length(trim(p_guest_name)) > 100 THEN
    RAISE EXCEPTION 'INVALID_NAME' USING ERRCODE = '22023';
  END IF;
  IF nullif(trim(p_guest_email), '') IS NULL
     OR length(trim(p_guest_email)) > 254
     OR trim(p_guest_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'INVALID_EMAIL' USING ERRCODE = '22023';
  END IF;
  IF p_guest_phone IS NULL OR p_guest_phone !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'INVALID_PHONE' USING ERRCODE = '22023';
  END IF;
  IF p_check_in IS NULL OR p_check_out IS NULL
     OR p_check_in < v_today OR p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'INVALID_DATES' USING ERRCODE = '22007';
  END IF;
  IF p_adults IS NULL OR p_adults < 1 OR p_children IS NULL OR p_children < 0 THEN
    RAISE EXCEPTION 'INVALID_GUEST_COUNT' USING ERRCODE = '22023';
  END IF;
  IF p_user_id IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'INVALID_USER' USING ERRCODE = '42501';
  END IF;

  SELECT r.property_id, r.capacity::integer, r.price_per_night::numeric(10,2)
    INTO v_property_id, v_capacity, v_nightly_price
  FROM public.rooms AS r
  WHERE r.id = p_room_id
    AND r.is_published = true
    AND lower(coalesce(r.status, 'available')) = 'available'
  FOR UPDATE;

  IF NOT FOUND OR v_nightly_price IS NULL OR v_nightly_price <= 0 THEN
    RAISE EXCEPTION 'ROOM_NOT_AVAILABLE' USING ERRCODE = 'P0001';
  END IF;
  IF v_capacity IS NOT NULL AND p_adults + p_children > v_capacity THEN
    RAISE EXCEPTION 'TOO_MANY_GUESTS' USING ERRCODE = '22023';
  END IF;

  -- A booking occupies [check_in, check_out); pending requests also hold the dates
  -- so guest requests cannot race or duplicate one another before admin review.
  IF EXISTS (
    SELECT 1
    FROM public.bookings AS b
    WHERE b.room_id = p_room_id
      AND b.booking_status IN ('pending', 'confirmed', 'checked_in')
      AND daterange(b.check_in, b.check_out, '[)')
          && daterange(p_check_in, p_check_out, '[)')
  ) THEN
    RAISE EXCEPTION 'ROOM_NOT_AVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  v_nights := p_check_out - p_check_in;
  v_room_price := round(v_nightly_price * v_nights, 2);
  v_taxes_amount := round(v_room_price * 0.12, 2);
  v_total_amount := v_room_price + v_taxes_amount;

  INSERT INTO public.bookings (
    property_id, room_id, firebase_uid, user_id,
    guest_name, guest_email, guest_phone, special_requests,
    check_in, check_out, adults, children, nights,
    room_price, taxes_amount, total_amount, booking_status, payment_status, source
  ) VALUES (
    v_property_id, p_room_id, nullif(trim(p_firebase_uid), ''), p_user_id,
    trim(p_guest_name), lower(trim(p_guest_email)), p_guest_phone,
    nullif(trim(p_special_requests), ''),
    p_check_in, p_check_out, p_adults, p_children, v_nights,
    v_room_price, v_taxes_amount, v_total_amount, 'pending', 'pending', 'website'
  )
  RETURNING bookings.id, bookings.booking_ref
    INTO v_booking_id, v_booking_ref;

  RETURN QUERY
  SELECT v_booking_id, v_booking_ref, v_total_amount, v_nights, 'pending'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_booking(
  uuid, date, date, integer, integer, text, text, text, text, text, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_booking(
  uuid, date, date, integer, integer, text, text, text, text, text, uuid
) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
