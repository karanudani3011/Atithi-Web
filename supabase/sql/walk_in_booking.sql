-- Block 1: walk-in source and guest identity; safe to rerun.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS guest_email text;

-- Block 2: walk-in ID proof fields; safe to rerun.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS id_type text,
  ADD COLUMN IF NOT EXISTS id_number text;

-- Block 3: stay fields already used by online bookings; safe to rerun.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS adults integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS children integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS special_requests text;

-- Block 4: walk-in payment fields; safe to rerun.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS advance_paid numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';

-- Block 5: a walk-in has no registered account and email is optional.
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN guest_email DROP NOT NULL;

-- Block 6: confirm the existing admin INSERT policy is in place.
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'bookings'
  AND cmd IN ('ALL', 'INSERT')
  AND with_check ILIKE '%is_admin%';

