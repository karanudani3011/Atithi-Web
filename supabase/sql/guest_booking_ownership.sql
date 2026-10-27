-- Guest booking approval flow. Run this whole file once in Supabase SQL Editor.
-- Assumptions from the supplied schema: bookings.id and rooms.id are UUID; check_in/check_out are DATE.
BEGIN;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1) Drop the old exclusion rule before changing its status-column dependency.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_room_dates_no_overlap;
-- Temporarily remove the old status check so backfilling rejected/legacy values is possible.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_allowed;

-- Remove legacy triggers and RPCs that refer to duplicate columns before dropping those columns.
DROP TRIGGER IF EXISTS bookings_sync_status_and_reference ON public.bookings;
DROP TRIGGER IF EXISTS bookings_attach_owner_and_total ON public.bookings;
DROP TRIGGER IF EXISTS bookings_ensure_reference ON public.bookings;
DROP FUNCTION IF EXISTS public.sync_booking_status_and_reference();
DROP FUNCTION IF EXISTS public.ensure_booking_reference();
DROP FUNCTION IF EXISTS public.get_booked_ranges(uuid);
DROP FUNCTION IF EXISTS public.get_available_room_ids(date,date);
DROP FUNCTION IF EXISTS public.admin_set_booking_status(uuid,text,boolean);
DO $$ DECLARE f record; BEGIN
  FOR f IN SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='create_booking'
  LOOP EXECUTE 'DROP FUNCTION ' || f.signature; END LOOP;
END $$;

-- Drop policies first so none can retain a dependency on the legacy columns.
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='bookings'
  LOOP EXECUTE format('DROP POLICY %I ON public.bookings', p.policyname); END LOOP;
END $$;

-- Stop instead of silently cascading a view/materialized view that uses a legacy column.
DO $$ DECLARE dependent_views text; dependent_functions text; BEGIN
  SELECT string_agg(DISTINCT format('%I.%I', ns.nspname, view_rel.relname), ', ')
    INTO dependent_views
  FROM pg_depend dep
  JOIN pg_rewrite rw ON dep.classid='pg_rewrite'::regclass AND dep.objid=rw.oid
  JOIN pg_class view_rel ON view_rel.oid=rw.ev_class AND view_rel.relkind IN ('v','m')
  JOIN pg_namespace ns ON ns.oid=view_rel.relnamespace
  JOIN pg_attribute a ON a.attrelid=dep.refobjid AND a.attnum=dep.refobjsubid
  WHERE dep.refobjid='public.bookings'::regclass AND a.attname IN ('status','total_price','booking_code');
  IF dependent_views IS NOT NULL THEN
    RAISE EXCEPTION 'Update or drop these views before running canonical booking migration: %', dependent_views;
  END IF;
  SELECT string_agg(DISTINCT format('%I.%I', ns.nspname, proc.proname), ', ')
    INTO dependent_functions
  FROM pg_depend dep
  JOIN pg_proc proc ON dep.classid='pg_proc'::regclass AND dep.objid=proc.oid
  JOIN pg_namespace ns ON ns.oid=proc.pronamespace
  JOIN pg_attribute a ON a.attrelid=dep.refobjid AND a.attnum=dep.refobjsubid
  WHERE dep.refobjid='public.bookings'::regclass AND a.attname IN ('status','total_price','booking_code');
  IF dependent_functions IS NOT NULL THEN
    RAISE EXCEPTION 'Update or drop these functions before running canonical booking migration: %', dependent_functions;
  END IF;
END $$;

-- 2) Backfill canonical values before removing their legacy counterparts.
UPDATE public.bookings
SET booking_status = coalesce(nullif(lower(trim(booking_status)), ''), nullif(lower(trim(status)), ''), 'pending'),
    total_amount = coalesce(total_amount, total_price),
    booking_ref = coalesce(nullif(booking_ref, ''), nullif(booking_code, ''));

-- Normalize legacy status spellings and add the new rejected lifecycle value.
UPDATE public.bookings
SET booking_status = CASE replace(replace(lower(trim(booking_status)), '-', '_'), ' ', '_')
  WHEN 'booked' THEN 'confirmed'
  WHEN 'complete' THEN 'checked_out'
  WHEN 'completed' THEN 'checked_out'
  WHEN 'checkedin' THEN 'checked_in'
  WHEN 'checkedout' THEN 'checked_out'
  WHEN 'rejected' THEN 'rejected'
  WHEN 'pending' THEN 'pending'
  WHEN 'confirmed' THEN 'confirmed'
  WHEN 'checked_in' THEN 'checked_in'
  WHEN 'checked_out' THEN 'checked_out'
  WHEN 'cancelled' THEN 'cancelled'
  ELSE 'pending'
END;

-- 3) Canonical columns are booking_status, total_amount, and booking_ref only.
ALTER TABLE public.bookings ALTER COLUMN booking_status SET DEFAULT 'pending';
ALTER TABLE public.bookings ALTER COLUMN booking_status SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN payment_status SET DEFAULT 'pending';
ALTER TABLE public.bookings ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_allowed;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_allowed;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS status;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS total_price;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS booking_code;

-- 4) Canonical allowed statuses, including admin rejection.
ALTER TABLE public.bookings ADD CONSTRAINT bookings_booking_status_allowed
  CHECK (booking_status IN ('pending','confirmed','checked_in','checked_out','cancelled','rejected'));

-- Backfill booking references for old records and repair duplicate legacy references.
WITH duplicate_refs AS (
  SELECT id, row_number() OVER (PARTITION BY booking_ref ORDER BY created_at, id) AS position
  FROM public.bookings WHERE booking_ref IS NOT NULL
)
UPDATE public.bookings b SET booking_ref=NULL
FROM duplicate_refs d WHERE b.id=d.id AND d.position>1;

DO $$ DECLARE r record; v_ref text; BEGIN
  FOR r IN SELECT id, created_at FROM public.bookings WHERE booking_ref IS NULL LOOP
    LOOP
      v_ref := 'ATH-' || to_char(coalesce(r.created_at, now()) AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD') || '-' || upper(substr(encode(extensions.gen_random_bytes(2), 'hex'), 1, 4));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings b WHERE b.booking_ref=v_ref);
    END LOOP;
    UPDATE public.bookings SET booking_ref=v_ref WHERE id=r.id;
  END LOOP;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS bookings_booking_ref_unique ON public.bookings(booking_ref);

-- Make generated references available to admin-created rows too.
CREATE OR REPLACE FUNCTION public.ensure_booking_reference()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,extensions AS $$
DECLARE candidate text;
BEGIN
  NEW.created_at := coalesce(NEW.created_at, now());
  IF NEW.booking_ref IS NULL OR trim(NEW.booking_ref)='' THEN
    LOOP
      candidate := 'ATH-' || to_char(NEW.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD') || '-' || upper(substr(encode(extensions.gen_random_bytes(2), 'hex'), 1, 4));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings b WHERE b.booking_ref=candidate);
    END LOOP;
    NEW.booking_ref := candidate;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bookings_ensure_reference BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.ensure_booking_reference();

-- 5) Abort with conflicting booking IDs so they can be resolved before installing the final guard.
DO $$ DECLARE conflicts text; BEGIN
  SELECT string_agg(format('%s ↔ %s', a.id, b.id), ', ' ORDER BY a.id)
    INTO conflicts
  FROM public.bookings a JOIN public.bookings b
    ON a.room_id=b.room_id AND a.id<b.id
   AND a.check_in<b.check_out AND a.check_out>b.check_in
  WHERE a.booking_status IN ('confirmed','checked_in')
    AND b.booking_status IN ('confirmed','checked_in');
  IF conflicts IS NOT NULL THEN
    RAISE EXCEPTION 'Resolve overlapping confirmed/checked_in bookings before migration: %', conflicts;
  END IF;
END $$;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_room_dates_no_overlap
  EXCLUDE USING gist (room_id WITH =, daterange(check_in, check_out, '[)') WITH &&)
  WHERE (booking_status IN ('confirmed','checked_in'));

-- Guest request: never accepts a client price or a client status. Pending requests do not reserve inventory.
CREATE FUNCTION public.create_booking(
  p_room_id uuid, p_check_in date, p_check_out date, p_adults integer, p_children integer,
  p_name text, p_email text, p_phone text, p_notes text DEFAULT NULL
) RETURNS TABLE(id uuid, booking_ref text, total_amount numeric, nights integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,extensions,auth AS $$
DECLARE v_price numeric; v_capacity integer; v_nights integer; v_tax numeric; v_total numeric; v_id uuid; v_ref text; v_today date;
BEGIN
  v_today := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  IF p_check_in IS NULL OR p_check_out IS NULL OR p_check_in<v_today OR p_check_out<=p_check_in THEN
    RAISE EXCEPTION 'Check-in ane check-out date barabar select karo.' USING ERRCODE='22007';
  END IF;
  IF p_adults IS NULL OR p_adults<1 OR p_children IS NULL OR p_children<0 THEN
    RAISE EXCEPTION 'Guest count barabar nathi.' USING ERRCODE='22023';
  END IF;
  IF nullif(trim(p_name),'') IS NULL OR nullif(trim(p_email),'') IS NULL OR nullif(trim(p_phone),'') IS NULL
     OR p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR p_phone !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Name, valid email ane India no 10 digit phone number aapo.' USING ERRCODE='22023';
  END IF;
  SELECT r.price_per_night::numeric, r.capacity::integer INTO v_price, v_capacity
  FROM public.rooms r WHERE r.id=p_room_id AND r.is_published=true AND r.status='available'
    AND coalesce(r.units_left,1)>0 FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aa room atyare booking mate available nathi.' USING ERRCODE='P0001'; END IF;
  IF v_price IS NULL OR v_price<=0 OR v_capacity IS NULL OR v_capacity<1 THEN
    RAISE EXCEPTION 'Aa room ni booking details atyare valid nathi.' USING ERRCODE='P0001';
  END IF;
  IF p_adults+p_children>v_capacity THEN RAISE EXCEPTION 'Guest count room capacity karta vadhu chhe.' USING ERRCODE='22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.bookings b WHERE b.room_id=p_room_id
    AND b.booking_status IN ('confirmed','checked_in')
    AND b.check_in<p_check_out AND b.check_out>p_check_in) THEN
    RAISE EXCEPTION 'Aa dates par room pehla thi booked che.' USING ERRCODE='P0001';
  END IF;
  v_nights:=p_check_out-p_check_in;
  v_tax:=round(v_price*v_nights*0.12,2);
  v_total:=v_price*v_nights+v_tax;
  INSERT INTO public.bookings(room_id,user_id,guest_name,guest_email,guest_phone,special_requests,
    check_in,check_out,adults,children,nights,room_price,taxes_amount,total_amount,
    booking_status,payment_status,created_at)
  VALUES(p_room_id,auth.uid(),trim(p_name),lower(trim(p_email)),trim(p_phone),nullif(trim(p_notes),''),
    p_check_in,p_check_out,p_adults,p_children,v_nights,v_price,v_tax,v_total,
    'pending','pending',now())
  RETURNING bookings.id,bookings.booking_ref INTO v_id,v_ref;
  RETURN QUERY SELECT v_id,v_ref,v_total,v_nights;
EXCEPTION WHEN exclusion_violation THEN
  RAISE EXCEPTION 'Aa dates par room pehla thi booked che.' USING ERRCODE='P0001';
END $$;

-- Admin/staff status transition. The exclusion constraint remains the atomic final check.
CREATE FUNCTION public.admin_set_booking_status(p_booking_id uuid,p_status text,p_reject_conflicting_pending boolean DEFAULT false)
RETURNS TABLE(updated_id uuid,new_status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,auth AS $$
DECLARE v_room uuid; v_start date; v_end date;
BEGIN
  IF NOT public.is_team_member() THEN RAISE EXCEPTION 'Admin access required.' USING ERRCODE='42501'; END IF;
  IF p_status IS NULL OR p_status NOT IN ('pending','confirmed','checked_in','checked_out','cancelled','rejected') THEN
    RAISE EXCEPTION 'Invalid booking status.' USING ERRCODE='22023';
  END IF;
  SELECT b.room_id,b.check_in,b.check_out INTO v_room,v_start,v_end
  FROM public.bookings b WHERE b.id=p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.' USING ERRCODE='P0002'; END IF;
  IF p_status IN ('confirmed','checked_in') AND v_room IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.room_id=v_room AND b.id<>p_booking_id
      AND b.booking_status IN ('confirmed','checked_in') AND b.check_in<v_end AND b.check_out>v_start
  ) THEN RAISE EXCEPTION 'Aa dates par room pehla thi booked che.' USING ERRCODE='P0001'; END IF;
  IF p_status IN ('confirmed','checked_in') AND p_reject_conflicting_pending AND v_room IS NOT NULL THEN
    UPDATE public.bookings b SET booking_status='rejected'
    WHERE b.room_id=v_room AND b.id<>p_booking_id AND b.booking_status='pending'
      AND b.check_in<v_end AND b.check_out>v_start;
  END IF;
  UPDATE public.bookings SET booking_status=p_status WHERE id=p_booking_id;
  RETURN QUERY SELECT p_booking_id,p_status;
EXCEPTION WHEN exclusion_violation THEN
  RAISE EXCEPTION 'Aa dates par room pehla thi booked che.' USING ERRCODE='P0001';
END $$;

-- Safe public availability functions: dates only, never guest information.
CREATE FUNCTION public.get_booked_ranges(p_room_id uuid)
RETURNS TABLE(check_in date,check_out date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,auth AS $$
  SELECT b.check_in,b.check_out FROM public.bookings b
  WHERE b.room_id=p_room_id AND b.booking_status IN ('confirmed','checked_in') ORDER BY b.check_in
$$;

CREATE FUNCTION public.get_available_room_ids(p_check_in date,p_check_out date)
RETURNS TABLE(room_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,auth AS $$
  SELECT r.id FROM public.rooms r
  WHERE r.is_published=true AND r.status='available' AND coalesce(r.units_left,1)>0
    AND p_check_in>=(now() AT TIME ZONE 'Asia/Kolkata')::date AND p_check_out>p_check_in
    AND NOT EXISTS (SELECT 1 FROM public.bookings b WHERE b.room_id=r.id
      AND b.booking_status IN ('confirmed','checked_in')
      AND b.check_in<p_check_out AND b.check_out>p_check_in)
  ORDER BY r.sort_order
$$;


REVOKE ALL ON FUNCTION public.create_booking(uuid,date,date,integer,integer,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid,date,date,integer,integer,text,text,text,text) TO anon,authenticated;
REVOKE ALL ON FUNCTION public.admin_set_booking_status(uuid,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_set_booking_status(uuid,text,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.get_booked_ranges(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_ranges(uuid) TO anon,authenticated;
REVOKE ALL ON FUNCTION public.get_available_room_ids(date,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_room_ids(date,date) TO anon,authenticated;

-- RLS is applied after canonical RPCs/functions are in place.
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.bookings FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bookings TO authenticated;
CREATE POLICY bookings_owner_or_team_read ON public.bookings FOR SELECT TO authenticated
  USING (user_id=auth.uid() OR public.is_team_member());
CREATE POLICY bookings_team_manage ON public.bookings FOR ALL TO authenticated
  USING (public.is_team_member()) WITH CHECK (public.is_team_member());

NOTIFY pgrst, 'reload schema';
COMMIT;

