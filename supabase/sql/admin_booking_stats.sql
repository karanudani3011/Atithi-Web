-- Admin-only date-scoped booking metrics and one-call comparison counts.
-- All date boundaries use Asia/Kolkata and only aggregate values are returned.
BEGIN;

CREATE INDEX IF NOT EXISTS bookings_created_at_idx
  ON public.bookings (created_at);

CREATE OR REPLACE FUNCTION public.admin_booking_stats(
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := statement_timestamp();
  v_today_start timestamptz;
  v_three_day_start timestamptz;
  v_seven_day_start timestamptz;
  v_today date;
  v_all_time bigint;
  v_result jsonb;
BEGIN
  IF NOT coalesce(public.is_active_admin(), false) THEN
    RAISE EXCEPTION 'Only admins can view stats.' USING ERRCODE = '42501';
  END IF;

  v_today := (v_now AT TIME ZONE 'Asia/Kolkata')::date;
  v_today_start := v_today::timestamp AT TIME ZONE 'Asia/Kolkata';
  v_three_day_start := (v_today - 2)::timestamp AT TIME ZONE 'Asia/Kolkata';
  v_seven_day_start := (v_today - 6)::timestamp AT TIME ZONE 'Asia/Kolkata';
  SELECT count(*) INTO v_all_time FROM public.bookings;

  SELECT jsonb_build_object(
    'total', count(*) FILTER (
      WHERE (p_from IS NULL OR b.created_at >= p_from)
        AND (p_to IS NULL OR b.created_at <= p_to)
    ),
    'pending', count(*) FILTER (
      WHERE b.booking_status = 'pending'
        AND (p_from IS NULL OR b.created_at >= p_from)
        AND (p_to IS NULL OR b.created_at <= p_to)
    ),
    'confirmed', count(*) FILTER (
      WHERE b.booking_status = 'confirmed'
        AND (p_from IS NULL OR b.created_at >= p_from)
        AND (p_to IS NULL OR b.created_at <= p_to)
    ),
    'cancelled', count(*) FILTER (
      WHERE b.booking_status IN ('cancelled', 'rejected')
        AND (p_from IS NULL OR b.created_at >= p_from)
        AND (p_to IS NULL OR b.created_at <= p_to)
    ),
    'revenue', coalesce(sum(b.total_amount) FILTER (
      WHERE b.booking_status IN ('confirmed', 'checked_in', 'checked_out')
        AND (p_from IS NULL OR b.created_at >= p_from)
        AND (p_to IS NULL OR b.created_at <= p_to)
    ), 0),
    'comparison', jsonb_build_object(
      'today', count(*) FILTER (WHERE b.created_at >= v_today_start AND b.created_at <= v_now),
      'last_3_days', count(*) FILTER (WHERE b.created_at >= v_three_day_start AND b.created_at <= v_now),
      'last_7_days', count(*) FILTER (WHERE b.created_at >= v_seven_day_start AND b.created_at <= v_now),
      'all_time', v_all_time
    )
  )
  INTO v_result
  FROM public.bookings AS b
  WHERE (p_from IS NULL AND p_to IS NULL)
     OR (
       b.created_at >= least(v_seven_day_start, coalesce(p_from, v_seven_day_start))
       AND b.created_at <= greatest(coalesce(p_to, v_now), v_now)
     );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_booking_stats(timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_booking_stats(timestamptz, timestamptz) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
