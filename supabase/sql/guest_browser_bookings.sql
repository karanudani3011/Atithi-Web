-- Browser-owned guest booking history. Run after guest_booking_ownership.sql.
BEGIN;

-- Remove the former email/reference lookup functions and its rate-limit table.
DROP FUNCTION IF EXISTS public.track_booking(text,text);
DROP FUNCTION IF EXISTS public.cancel_guest_booking(text,text);
DROP FUNCTION IF EXISTS public.consume_booking_lookup(text);
DROP TABLE IF EXISTS public.booking_lookup_rate_limits;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_token_hash text;
CREATE INDEX IF NOT EXISTS bookings_guest_token_hash_idx ON public.bookings(guest_token_hash) WHERE guest_token_hash IS NOT NULL;

DROP FUNCTION IF EXISTS public.create_booking(uuid,date,date,integer,integer,text,text,text,text);
CREATE FUNCTION public.create_booking(
  p_room_id uuid,p_check_in date,p_check_out date,p_adults integer,p_children integer,
  p_name text,p_email text,p_phone text,p_notes text,p_guest_token_hash text,p_user_id uuid
) RETURNS TABLE(id uuid,booking_ref text,total_amount numeric,nights integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,extensions AS $$
DECLARE v_price numeric; v_capacity integer; v_nights integer; v_tax numeric; v_total numeric; v_id uuid; v_ref text; v_today date;
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
  SELECT r.price_per_night::numeric,r.capacity::integer INTO v_price,v_capacity
  FROM public.rooms r WHERE r.id=p_room_id AND r.is_published=true AND r.status='available' AND coalesce(r.units_left,1)>0 FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This room is not currently available.' USING ERRCODE='P0001'; END IF;
  IF v_price IS NULL OR v_price<=0 OR v_capacity IS NULL OR v_capacity<1 THEN RAISE EXCEPTION 'Room booking details are unavailable.' USING ERRCODE='P0001'; END IF;
  IF p_adults+p_children>v_capacity THEN RAISE EXCEPTION 'Guest count exceeds room capacity.' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM public.bookings b WHERE b.room_id=p_room_id AND b.booking_status IN ('confirmed','checked_in') AND b.check_in<p_check_out AND b.check_out>p_check_in) THEN
    RAISE EXCEPTION 'This room is already booked for those dates.' USING ERRCODE='P0001';
  END IF;
  v_nights:=p_check_out-p_check_in; v_tax:=round(v_price*v_nights*0.12,2); v_total:=v_price*v_nights+v_tax;
  INSERT INTO public.bookings(room_id,user_id,guest_token_hash,guest_name,guest_email,guest_phone,special_requests,
    check_in,check_out,adults,children,nights,room_price,taxes_amount,total_amount,booking_status,payment_status,created_at)
  VALUES(p_room_id,p_user_id,p_guest_token_hash,trim(p_name),lower(trim(p_email)),trim(p_phone),nullif(trim(p_notes),''),
    p_check_in,p_check_out,p_adults,p_children,v_nights,v_price,v_tax,v_total,'pending','pending',now())
  RETURNING bookings.id,bookings.booking_ref INTO v_id,v_ref;
  RETURN QUERY SELECT v_id,v_ref,v_total,v_nights;
EXCEPTION WHEN exclusion_violation THEN RAISE EXCEPTION 'This room is already booked for those dates.' USING ERRCODE='P0001';
END $$;
REVOKE ALL ON FUNCTION public.create_booking(uuid,date,date,integer,integer,text,text,text,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid,date,date,integer,integer,text,text,text,text,text,uuid) TO service_role;

CREATE TABLE IF NOT EXISTS public.api_rate_limits(
  rate_key text PRIMARY KEY,window_started_at timestamptz NOT NULL,request_count integer NOT NULL
);
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.api_rate_limits FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(p_key text,p_max integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE current_window timestamptz := date_trunc('minute',now()) - ((extract(minute from now())::integer % 15) * interval '1 minute');
DECLARE allowed boolean;
BEGIN
  DELETE FROM public.api_rate_limits WHERE window_started_at<now()-interval '1 day';
  INSERT INTO public.api_rate_limits(rate_key,window_started_at,request_count) VALUES(p_key,current_window,1)
  ON CONFLICT(rate_key) DO UPDATE SET
    window_started_at=CASE WHEN public.api_rate_limits.window_started_at<current_window THEN current_window ELSE public.api_rate_limits.window_started_at END,
    request_count=CASE WHEN public.api_rate_limits.window_started_at<current_window THEN 1 ELSE public.api_rate_limits.request_count+1 END;
  SELECT request_count<=p_max INTO allowed FROM public.api_rate_limits WHERE rate_key=p_key;
  RETURN allowed;
END $$;
REVOKE ALL ON FUNCTION public.consume_api_rate_limit(text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(text,integer) TO service_role;

NOTIFY pgrst,'reload schema';
COMMIT;
