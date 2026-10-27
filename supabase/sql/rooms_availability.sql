-- Room availability search and booking-time inventory protection.
-- Run after guest_booking_ownership.sql and guest_browser_bookings.sql.
BEGIN;

-- Data review before normalization. Inspect these result sets in SQL Editor.
SELECT DISTINCT booking_status FROM public.bookings ORDER BY booking_status;
SELECT DISTINCT status FROM public.rooms ORDER BY status;
SELECT id, room_name, units_left
FROM public.rooms
WHERE units_left IS NULL OR units_left = 0
ORDER BY room_name;

-- Inventory is managed as total units. Legacy units_left is retained for display compatibility only.
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS total_units integer NOT NULL DEFAULT 1;
ALTER TABLE public.rooms ALTER COLUMN total_units SET DEFAULT 1;
SELECT id, room_name, units_left, total_units
FROM public.rooms
WHERE total_units IS NULL OR total_units = 0
ORDER BY room_name;
UPDATE public.rooms SET total_units = 1 WHERE total_units IS NULL OR total_units <= 0;
ALTER TABLE public.rooms ALTER COLUMN total_units SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.rooms'::regclass AND conname='rooms_total_units_positive_check') THEN
    ALTER TABLE public.rooms ADD CONSTRAINT rooms_total_units_positive_check CHECK (total_units > 0);
  END IF;
END $$;

-- Fill historical property references where possible. Availability itself uses room_id only.
UPDATE public.bookings b
SET property_id = r.property_id
FROM public.rooms r
WHERE b.room_id = r.id AND b.property_id IS NULL AND r.property_id IS NOT NULL;

-- Canonicalize the booking status field used by this application.
UPDATE public.bookings SET booking_status = lower(trim(booking_status))
WHERE booking_status IS NOT NULL AND booking_status IS DISTINCT FROM lower(trim(booking_status));

CREATE INDEX IF NOT EXISTS bookings_room_dates_idx ON public.bookings(room_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(booking_status);

-- Public catalog read access. Authenticated admins retain access to unpublished inventory.
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.rooms TO anon, authenticated;
DROP POLICY IF EXISTS rooms_public_published_read ON public.rooms;
DROP POLICY IF EXISTS rooms_public_published_read_guard ON public.rooms;
DROP POLICY IF EXISTS rooms_authenticated_published_or_admin ON public.rooms;
DROP POLICY IF EXISTS rooms_authenticated_published_read_guard ON public.rooms;
CREATE POLICY rooms_public_published_read ON public.rooms
  FOR SELECT TO anon USING (is_published = true);
CREATE POLICY rooms_public_published_read_guard ON public.rooms
  AS RESTRICTIVE FOR SELECT TO anon USING (is_published = true);
CREATE POLICY rooms_authenticated_published_or_admin ON public.rooms
  FOR SELECT TO authenticated USING (is_published = true OR public.is_admin());
CREATE POLICY rooms_authenticated_published_read_guard ON public.rooms
  AS RESTRICTIVE FOR SELECT TO authenticated USING (is_published = true OR public.is_admin());

-- Public room-type reads: active types for visitors; admins can also inspect inactive types.
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.room_types TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.room_types TO authenticated;
DROP POLICY IF EXISTS room_types_anon_active_read ON public.room_types;
DROP POLICY IF EXISTS room_types_authenticated_read ON public.room_types;
DROP POLICY IF EXISTS room_types_admin_insert ON public.room_types;
DROP POLICY IF EXISTS room_types_admin_update ON public.room_types;
DROP POLICY IF EXISTS room_types_admin_delete ON public.room_types;
DROP POLICY IF EXISTS room_types_anon_active_read_guard ON public.room_types;
DROP POLICY IF EXISTS room_types_authenticated_active_read_guard ON public.room_types;
CREATE POLICY room_types_anon_active_read ON public.room_types
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY room_types_anon_active_read_guard ON public.room_types
  AS RESTRICTIVE FOR SELECT TO anon USING (is_active = true);
CREATE POLICY room_types_authenticated_read ON public.room_types
  FOR SELECT TO authenticated USING (is_active = true OR public.is_admin());
CREATE POLICY room_types_authenticated_active_read_guard ON public.room_types
  AS RESTRICTIVE FOR SELECT TO authenticated USING (is_active = true OR public.is_admin());
CREATE POLICY room_types_admin_insert ON public.room_types
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY room_types_admin_update ON public.room_types
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY room_types_admin_delete ON public.room_types
  FOR DELETE TO authenticated USING (public.is_admin());

-- The function returns a curated room payload and step counts only. It never selects bookings' personal fields.
DROP FUNCTION IF EXISTS public.get_available_room_ids(date,date);
CREATE OR REPLACE FUNCTION public.get_available_rooms(
  p_check_in date DEFAULT NULL,
  p_check_out date DEFAULT NULL,
  p_adults integer DEFAULT 1,
  p_children integer DEFAULT 0,
  p_room_type_id uuid DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_sort text DEFAULT 'price_asc'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_type_name text;
  v_rooms jsonb;
  v_counts jsonb;
BEGIN
  IF (p_check_in IS NULL) <> (p_check_out IS NULL) THEN
    RAISE EXCEPTION 'Provide both check-in and check-out dates.' USING ERRCODE='22007';
  END IF;
  IF p_check_in IS NOT NULL AND p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'Check-out must be after check-in.' USING ERRCODE='22007';
  END IF;
  IF coalesce(p_adults, 0) < 0 OR coalesce(p_children, 0) < 0 THEN
    RAISE EXCEPTION 'Guest count is invalid.' USING ERRCODE='22023';
  END IF;
  IF p_room_type_id IS NOT NULL THEN
    SELECT name INTO v_type_name FROM public.room_types WHERE id=p_room_type_id AND is_active=true;
  END IF;

  WITH published AS (
    SELECT r.* FROM public.rooms r WHERE r.is_published=true
  ), type_filtered AS (
    SELECT r.* FROM published r
    WHERE p_room_type_id IS NULL
       OR (v_type_name IS NOT NULL AND (r.room_type_id=p_room_type_id
          OR (r.room_type_id IS NULL AND lower(trim(r.room_type))=lower(v_type_name))))
  ), operational_filtered AS (
    SELECT r.* FROM type_filtered r
    WHERE p_check_in IS NULL OR lower(coalesce(r.status,'available'))='available'
  ), capacity_filtered AS (
    SELECT r.* FROM operational_filtered r
    WHERE r.capacity IS NULL OR r.capacity >= coalesce(p_adults,0)+coalesce(p_children,0)
  ), price_filtered AS (
    SELECT r.* FROM capacity_filtered r
    WHERE (p_min_price IS NULL OR r.price_per_night::numeric >= p_min_price)
      AND (p_max_price IS NULL OR r.price_per_night::numeric <= p_max_price)
  ), availability AS (
    SELECT r.*,
      (coalesce(r.status,'available') ILIKE 'available'
       AND (p_check_in IS NULL OR
          (coalesce(r.total_units,1) - (
            SELECT count(*)::integer FROM public.bookings b
            WHERE b.room_id=r.id
              AND lower(trim(coalesce(b.booking_status,''))) IN ('pending','confirmed')
              AND b.check_in < p_check_out AND b.check_out > p_check_in
          )) > 0)) AS is_available,
      CASE WHEN p_check_in IS NULL THEN coalesce(r.total_units,1)
        ELSE greatest(0, coalesce(r.total_units,1) - (
          SELECT count(*)::integer FROM public.bookings b
          WHERE b.room_id=r.id
            AND lower(trim(coalesce(b.booking_status,''))) IN ('pending','confirmed')
            AND b.check_in < p_check_out AND b.check_out > p_check_in
        )) END AS available_units
    FROM price_filtered r
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'room_name', room_name, 'room_type', room_type, 'room_type_id', room_type_id,
      'description', description, 'price_per_night', price_per_night, 'capacity', capacity,
      'amenities', amenities, 'image_urls', image_urls, 'badge', badge, 'bed_info', bed_info,
      'size_sqft', size_sqft, 'rating', rating, 'units_left', units_left, 'total_units', total_units,
      'status', status, 'created_at', created_at, 'is_available', is_available, 'available_units', available_units
    ) ORDER BY
      CASE WHEN lower(coalesce(p_sort,'')) IN ('price_asc','price-asc') THEN price_per_night END ASC NULLS LAST,
      CASE WHEN lower(coalesce(p_sort,'')) IN ('price_desc','price-desc') THEN price_per_night END DESC NULLS LAST,
      CASE WHEN lower(coalesce(p_sort,''))='rating' THEN rating END DESC NULLS LAST,
      CASE WHEN lower(coalesce(p_sort,''))='newest' THEN created_at END DESC NULLS LAST,
      sort_order ASC NULLS LAST, room_name ASC
    ), '[]'::jsonb),
    jsonb_build_object(
      'published', (SELECT count(*) FROM published),
      'type', (SELECT count(*) FROM type_filtered),
      'operational_status', (SELECT count(*) FROM operational_filtered),
      'capacity', (SELECT count(*) FROM capacity_filtered),
      'price', (SELECT count(*) FROM price_filtered),
      'available', (SELECT count(*) FROM availability WHERE is_available),
      'returned', (SELECT count(*) FROM availability WHERE is_available OR p_check_in IS NULL)
    )
  INTO v_rooms, v_counts
  FROM availability
  WHERE is_available OR p_check_in IS NULL;

  RETURN jsonb_build_object('rooms', coalesce(v_rooms,'[]'::jsonb), 'diagnostics', coalesce(v_counts,'{}'::jsonb),
    'parameters', jsonb_build_object('check_in',p_check_in,'check_out',p_check_out,'adults',p_adults,'children',p_children,
      'room_type_id',p_room_type_id,'min_price',p_min_price,'max_price',p_max_price,'sort',p_sort));
END $$;
REVOKE ALL ON FUNCTION public.get_available_rooms(date,date,integer,integer,uuid,numeric,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_rooms(date,date,integer,integer,uuid,numeric,numeric,text) TO anon, authenticated;

-- Update the existing service-role booking RPC. Locking the room row serializes booking
-- attempts for this inventory item; the overlap check and insert occur in this transaction.
CREATE OR REPLACE FUNCTION public.create_booking(
  p_room_id uuid,p_check_in date,p_check_out date,p_adults integer,p_children integer,
  p_name text,p_email text,p_phone text,p_notes text,p_guest_token_hash text,p_user_id uuid
) RETURNS TABLE(id uuid,booking_ref text,total_amount numeric,nights integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,extensions AS $$
DECLARE
  v_price numeric; v_capacity integer; v_total_units integer; v_nights integer;
  v_tax numeric; v_total numeric; v_id uuid; v_ref text; v_today date; v_overlaps integer;
BEGIN
  v_today := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  IF p_check_in IS NULL OR p_check_out IS NULL OR p_check_in<v_today OR p_check_out<=p_check_in THEN
    RAISE EXCEPTION 'Choose valid check-in and check-out dates.' USING ERRCODE='22007';
  END IF;
  IF p_adults IS NULL OR p_adults<1 OR p_children IS NULL OR p_children<0 THEN
    RAISE EXCEPTION 'Guest count is invalid.' USING ERRCODE='22023';
  END IF;
  IF nullif(trim(p_name),'') IS NULL OR length(trim(p_name))>100 OR nullif(trim(p_email),'') IS NULL OR nullif(trim(p_phone),'') IS NULL
     OR p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR p_phone !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Enter a name, valid email, and 10 digit phone number.' USING ERRCODE='22023';
  END IF;
  IF p_user_id IS NULL AND (p_guest_token_hash IS NULL OR p_guest_token_hash !~ '^[a-f0-9]{64}$') THEN
    RAISE EXCEPTION 'Guest browser identity is missing. Please retry.' USING ERRCODE='22023';
  END IF;
  IF p_user_id IS NOT NULL AND p_guest_token_hash IS NOT NULL THEN
    RAISE EXCEPTION 'Invalid booking ownership.' USING ERRCODE='22023';
  END IF;

  SELECT r.price_per_night::numeric,r.capacity::integer,coalesce(r.total_units,1)
    INTO v_price,v_capacity,v_total_units
  FROM public.rooms r
  WHERE r.id=p_room_id AND r.is_published=true AND lower(coalesce(r.status,'available'))='available'
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This room is not currently available.' USING ERRCODE='P0001'; END IF;
  IF v_price IS NULL OR v_price<=0 OR v_total_units<1 THEN
    RAISE EXCEPTION 'Room booking details are unavailable.' USING ERRCODE='P0001';
  END IF;
  IF v_capacity IS NOT NULL AND p_adults+p_children>v_capacity THEN
    RAISE EXCEPTION 'Guest count exceeds room capacity.' USING ERRCODE='22023';
  END IF;

  SELECT count(*)::integer INTO v_overlaps FROM public.bookings b
  WHERE b.room_id=p_room_id
    AND lower(trim(coalesce(b.booking_status,''))) IN ('pending','confirmed')
    AND b.check_in<p_check_out AND b.check_out>p_check_in;
  IF v_overlaps>=v_total_units THEN
    RAISE EXCEPTION 'Room is no longer available for these dates.' USING ERRCODE='P0001';
  END IF;

  v_nights:=p_check_out-p_check_in; v_tax:=round(v_price*v_nights*0.12,2); v_total:=v_price*v_nights+v_tax;
  INSERT INTO public.bookings(room_id,user_id,guest_token_hash,guest_name,guest_email,guest_phone,special_requests,
    check_in,check_out,adults,children,nights,room_price,taxes_amount,total_amount,booking_status,payment_status,created_at)
  VALUES(p_room_id,p_user_id,p_guest_token_hash,trim(p_name),lower(trim(p_email)),trim(p_phone),nullif(trim(p_notes),''),
    p_check_in,p_check_out,p_adults,p_children,v_nights,v_price,v_tax,v_total,'pending','pending',now())
  RETURNING bookings.id,bookings.booking_ref INTO v_id,v_ref;
  RETURN QUERY SELECT v_id,v_ref,v_total,v_nights;
END $$;
REVOKE ALL ON FUNCTION public.create_booking(uuid,date,date,integer,integer,text,text,text,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid,date,date,integer,integer,text,text,text,text,text,uuid) TO service_role;

-- Keep the detail date picker aligned with pending/confirmed availability semantics.
CREATE OR REPLACE FUNCTION public.get_booked_ranges(p_room_id uuid)
RETURNS TABLE(check_in date,check_out date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT b.check_in,b.check_out FROM public.bookings b
  WHERE b.room_id=p_room_id AND lower(trim(coalesce(b.booking_status,''))) IN ('pending','confirmed')
  ORDER BY b.check_in
$$;
REVOKE ALL ON FUNCTION public.get_booked_ranges(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_ranges(uuid) TO anon,authenticated;

NOTIFY pgrst,'reload schema';
COMMIT;

