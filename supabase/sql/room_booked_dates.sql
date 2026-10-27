-- Reuse the existing date-only booked-ranges RPC consumed by the Booking page.
-- It returns no guest data and represents occupied nights as [check_in, check_out).
BEGIN;

CREATE OR REPLACE FUNCTION public.get_room_booked_ranges(
  p_room_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE(check_in date, check_out date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT greatest(b.check_in, p_from) AS check_in,
         least(b.check_out, p_to) AS check_out
  FROM public.bookings AS b
  WHERE b.room_id = p_room_id
    AND b.booking_status IN ('pending', 'confirmed', 'checked_in')
    AND b.check_in < p_to
    AND b.check_out > p_from
  ORDER BY b.check_in;
$$;

REVOKE ALL ON FUNCTION public.get_room_booked_ranges(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_room_booked_ranges(uuid, date, date) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
